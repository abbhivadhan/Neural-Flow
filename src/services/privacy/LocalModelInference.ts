/**
 * Local Model Inference Service
 * Provides privacy-first AI model inference using WebAssembly for optimal performance
 */

export interface ModelConfig {
  name: string;
  version: string;
  wasmPath: string;
  modelPath: string;
  inputShape: number[];
  outputShape: number[];
  quantized: boolean;
}

export interface InferenceResult {
  predictions: number[];
  confidence: number;
  processingTime: number;
  modelUsed: string;
  timestamp: Date;
}

export interface LocalInferenceOptions {
  useWebAssembly: boolean;
  maxConcurrentInferences: number;
  cacheResults: boolean;
  enableBatching: boolean;
}

export class LocalModelInference {
  private wasmModule: any = null;
  private loadedModels: Map<string, any> = new Map();
  private inferenceQueue: Array<{
    input: Float32Array;
    modelName: string;
    resolve: (result: InferenceResult) => void;
    reject: (error: Error) => void;
  }> = [];
  private isProcessing = false;
  private options: LocalInferenceOptions;

  constructor(options: Partial<LocalInferenceOptions> = {}) {
    this.options = {
      useWebAssembly: true,
      maxConcurrentInferences: 4,
      cacheResults: true,
      enableBatching: true,
      ...options
    };
  }

  /**
   * Initialize WebAssembly runtime for model inference
   */
  async initializeWasm(): Promise<void> {
    try {
      if (this.wasmModule) return;

      // Load ONNX Runtime WebAssembly
      const ort = await import('onnxruntime-web/wasm');
      
      // Configure WASM backend
      ort.env.wasm.wasmPaths = '/wasm/';
      ort.env.wasm.numThreads = Math.min(navigator.hardwareConcurrency || 4, 8);
      
      this.wasmModule = ort;
      console.log('WebAssembly runtime initialized for local AI inference');
    } catch (error) {
      console.error('Failed to initialize WebAssembly runtime:', error);
      throw new Error('WebAssembly initialization failed');
    }
  }

  /**
   * Load a model for local inference
   */
  async loadModel(config: ModelConfig): Promise<void> {
    try {
      if (!this.wasmModule) {
        await this.initializeWasm();
      }

      if (this.loadedModels.has(config.name)) {
        return;
      }

      // Load model from local storage or fetch
      const modelBuffer = await this.loadModelBuffer(config.modelPath);
      
      // Create inference session
      const session = await this.wasmModule.InferenceSession.create(modelBuffer, {
        executionProviders: ['wasm'],
        enableCpuMemArena: true,
        enableMemPattern: true,
        executionMode: 'sequential',
        logSeverityLevel: 3
      });

      this.loadedModels.set(config.name, {
        session,
        config,
        lastUsed: Date.now()
      });

      console.log(`Model ${config.name} loaded successfully for local inference`);
    } catch (error) {
      console.error(`Failed to load model ${config.name}:`, error);
      throw error;
    }
  }

  /**
   * Run inference on input data using specified model
   */
  async runInference(
    modelName: string,
    input: Float32Array,
    options: { priority?: 'high' | 'normal' | 'low' } = {}
  ): Promise<InferenceResult> {
    return new Promise((resolve, reject) => {
      const inferenceRequest = {
        input,
        modelName,
        resolve,
        reject,
        priority: options.priority || 'normal',
        timestamp: Date.now()
      };

      // Add to queue based on priority
      if (options.priority === 'high') {
        this.inferenceQueue.unshift(inferenceRequest);
      } else {
        this.inferenceQueue.push(inferenceRequest);
      }

      this.processInferenceQueue();
    });
  }

  /**
   * Process queued inference requests
   */
  private async processInferenceQueue(): Promise<void> {
    if (this.isProcessing || this.inferenceQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.inferenceQueue.length > 0) {
        const request = this.inferenceQueue.shift()!;
        
        try {
          const result = await this.executeInference(
            request.modelName,
            request.input
          );
          request.resolve(result);
        } catch (error) {
          request.reject(error as Error);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute actual inference
   */
  private async executeInference(
    modelName: string,
    input: Float32Array
  ): Promise<InferenceResult> {
    const startTime = performance.now();
    
    const modelData = this.loadedModels.get(modelName);
    if (!modelData) {
      throw new Error(`Model ${modelName} not loaded`);
    }

    try {
      // Prepare input tensor
      const inputTensor = new this.wasmModule.Tensor(
        'float32',
        input,
        modelData.config.inputShape
      );

      // Run inference
      const feeds = { input: inputTensor };
      const results = await modelData.session.run(feeds);
      
      // Extract predictions
      const outputKey = Object.keys(results)[0];
      if (!outputKey) throw new Error('No output tensor found');
      const outputTensor = results[outputKey];
      const predictions = Array.from(outputTensor.data as Float32Array);
      
      const processingTime = performance.now() - startTime;
      
      // Calculate confidence (simplified)
      const confidence = Math.max(...predictions);

      // Update last used timestamp
      modelData.lastUsed = Date.now();

      return {
        predictions,
        confidence,
        processingTime,
        modelUsed: modelName,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Inference failed for model ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Load model buffer from storage
   */
  private async loadModelBuffer(modelPath: string): Promise<ArrayBuffer> {
    try {
      // Try to load from IndexedDB first (cached models)
      const cachedModel = await this.getCachedModel(modelPath);
      if (cachedModel) {
        return cachedModel;
      }

      // Fetch from network if not cached
      const response = await fetch(modelPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch model: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      
      // Cache for future use
      await this.cacheModel(modelPath, buffer);
      
      return buffer;
    } catch (error) {
      console.error('Failed to load model buffer:', error);
      throw error;
    }
  }

  /**
   * Get cached model from IndexedDB
   */
  private async getCachedModel(modelPath: string): Promise<ArrayBuffer | null> {
    try {
      return new Promise((resolve) => {
        const request = indexedDB.open('NeuralFlowModels', 1);
        
        request.onerror = () => resolve(null);
        
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['models'], 'readonly');
          const store = transaction.objectStore('models');
          const getRequest = store.get(modelPath);
          
          getRequest.onsuccess = () => {
            resolve(getRequest.result?.buffer || null);
          };
          
          getRequest.onerror = () => resolve(null);
        };
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('models')) {
            db.createObjectStore('models', { keyPath: 'path' });
          }
        };
      });
    } catch (error) {
      console.error('Error accessing cached model:', error);
      return null;
    }
  }

  /**
   * Cache model in IndexedDB
   */
  private async cacheModel(modelPath: string, buffer: ArrayBuffer): Promise<void> {
    try {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('NeuralFlowModels', 1);
        
        request.onerror = () => reject(new Error('Failed to open IndexedDB'));
        
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['models'], 'readwrite');
          const store = transaction.objectStore('models');
          
          store.put({
            path: modelPath,
            buffer,
            timestamp: Date.now()
          });
          
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(new Error('Failed to cache model'));
        };
      });
    } catch (error) {
      console.error('Error caching model:', error);
    }
  }

  /**
   * Unload unused models to free memory
   */
  async cleanupModels(maxAge: number = 30 * 60 * 1000): Promise<void> {
    const now = Date.now();
    const modelsToRemove: string[] = [];

    for (const [name, modelData] of this.loadedModels.entries()) {
      if (now - modelData.lastUsed > maxAge) {
        modelsToRemove.push(name);
      }
    }

    for (const name of modelsToRemove) {
      const modelData = this.loadedModels.get(name);
      if (modelData?.session) {
        await modelData.session.release();
      }
      this.loadedModels.delete(name);
      console.log(`Unloaded unused model: ${name}`);
    }
  }

  /**
   * Get inference statistics
   */
  getStats(): {
    loadedModels: number;
    queueLength: number;
    isProcessing: boolean;
    memoryUsage: number;
  } {
    return {
      loadedModels: this.loadedModels.size,
      queueLength: this.inferenceQueue.length,
      isProcessing: this.isProcessing,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estimate memory usage of loaded models
   */
  private estimateMemoryUsage(): number {
    // Simplified estimation - in real implementation would be more accurate
    return this.loadedModels.size * 50 * 1024 * 1024; // ~50MB per model
  }

  /**
   * Dispose of all resources
   */
  async dispose(): Promise<void> {
    // Clear inference queue
    this.inferenceQueue.length = 0;
    
    // Release all loaded models
    for (const [_name, modelData] of this.loadedModels.entries()) {
      if (modelData.session) {
        await modelData.session.release();
      }
    }
    
    this.loadedModels.clear();
    this.wasmModule = null;
    
    console.log('Local model inference service disposed');
  }
}

// Singleton instance for global use
export const localModelInference = new LocalModelInference();