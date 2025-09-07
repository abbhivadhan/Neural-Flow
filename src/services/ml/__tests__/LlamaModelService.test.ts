import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LlamaModelService, LlamaModelConfig, InferenceRequest } from '../LlamaModelService';
import { ModelLoadingError, ModelInferenceError } from '../types';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = vi.fn();

describe('LlamaModelService', () => {
  let service: LlamaModelService;
  let config: LlamaModelConfig;

  beforeEach(() => {
    config = {
      modelPath: '/models/llama-2-7b-chat.bin',
      quantizationLevel: 'q4_0',
      maxTokens: 512,
      temperature: 0.7,
      topP: 0.9,
      contextLength: 2048
    };
    
    service = new LlamaModelService(config);
    
    // Reset mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(async () => {
    await service.unload();
  });

  describe('Model Loading', () => {
    it('should initialize and load model successfully', async () => {
      // Mock successful fetch
      const mockResponse = new Response(new ArrayBuffer(1024), { 
        status: 200,
        headers: { 'content-length': '1024' }
      });
      (global.fetch as any).mockResolvedValue(mockResponse);

      const progressCallback = vi.fn();
      service.onProgress(progressCallback);

      await service.loadModel();

      const status = service.getStatus();
      expect(status.isReady).toBe(true);
      expect(status.isLoading).toBe(false);
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({ stage: 'ready', progress: 100 })
      );
    });

    it('should handle model loading failure', async () => {
      // Mock failed fetch
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(service.loadModel()).rejects.toThrow(ModelLoadingError);
    });

    it('should use cached model when available', async () => {
      // Mock cached model
      const cachedModel = {
        config,
        quantizationLevel: 'q4_0',
        timestamp: Date.now()
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedModel));

      const progressCallback = vi.fn();
      service.onProgress(progressCallback);

      await service.loadModel();

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({ stage: 'loading', message: 'Loading cached model...' })
      );
    });

    it('should handle concurrent loading requests', async () => {
      const mockResponse = new Response(new ArrayBuffer(1024), { 
        status: 200,
        headers: { 'content-length': '1024' }
      });
      (global.fetch as any).mockResolvedValue(mockResponse);

      // Start multiple loading requests
      const promises = [
        service.loadModel(),
        service.loadModel(),
        service.loadModel()
      ];

      await Promise.all(promises);

      // Should only fetch once
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Model Inference', () => {
    beforeEach(async () => {
      // Mock successful model loading
      const mockResponse = new Response(new ArrayBuffer(1024), { 
        status: 200,
        headers: { 'content-length': '1024' }
      });
      (global.fetch as any).mockResolvedValue(mockResponse);
      await service.loadModel();
    });

    it('should perform inference successfully', async () => {
      const request: InferenceRequest = {
        prompt: 'Hello, how are you?',
        maxTokens: 50,
        temperature: 0.7
      };

      const response = await service.inference(request);

      expect(response).toMatchObject({
        text: expect.any(String),
        tokens: expect.any(Number),
        inferenceTime: expect.any(Number),
        confidence: expect.any(Number)
      });
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.confidence).toBeLessThanOrEqual(1);
    });

    it('should cache inference results', async () => {
      const request: InferenceRequest = {
        prompt: 'Test prompt',
        maxTokens: 50,
        temperature: 0.7
      };

      // First inference
      const response1 = await service.inference(request);
      
      // Second inference with same parameters
      const response2 = await service.inference(request);

      // Should return cached result (same response)
      expect(response2.text).toBe(response1.text);
      expect(response2.inferenceTime).toBeLessThan(response1.inferenceTime);
    });

    it('should handle inference with different parameters', async () => {
      const baseRequest: InferenceRequest = {
        prompt: 'Test prompt',
        maxTokens: 50,
        temperature: 0.7
      };

      const responses = await Promise.all([
        service.inference(baseRequest),
        service.inference({ ...baseRequest, temperature: 0.9 }),
        service.inference({ ...baseRequest, maxTokens: 100 })
      ]);

      // All responses should be valid
      responses.forEach(response => {
        expect(response.text).toBeTruthy();
        expect(response.confidence).toBeGreaterThan(0);
      });
    });

    it('should use fallback when model not ready', async () => {
      const unloadedService = new LlamaModelService(config);
      
      const request: InferenceRequest = {
        prompt: 'Test prompt',
        maxTokens: 50
      };

      const response = await unloadedService.inference(request);

      expect(response.text).toContain('loading the AI model');
      expect(response.confidence).toBe(0.5);
    });
  });

  describe('Progress Tracking', () => {
    it('should track loading progress', async () => {
      const mockResponse = new Response(new ArrayBuffer(1024), { 
        status: 200,
        headers: { 'content-length': '1024' }
      });
      (global.fetch as any).mockResolvedValue(mockResponse);

      const progressUpdates: any[] = [];
      const unsubscribe = service.onProgress((progress) => {
        progressUpdates.push(progress);
      });

      await service.loadModel();

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0]).toMatchObject({
        stage: 'downloading',
        progress: expect.any(Number),
        message: expect.any(String)
      });

      const finalUpdate = progressUpdates[progressUpdates.length - 1];
      expect(finalUpdate.stage).toBe('ready');
      expect(finalUpdate.progress).toBe(100);

      unsubscribe();
    });

    it('should handle progress callback unsubscription', async () => {
      const progressCallback = vi.fn();
      const unsubscribe = service.onProgress(progressCallback);
      
      unsubscribe();

      const mockResponse = new Response(new ArrayBuffer(1024), { 
        status: 200,
        headers: { 'content-length': '1024' }
      });
      (global.fetch as any).mockResolvedValue(mockResponse);

      await service.loadModel();

      expect(progressCallback).not.toHaveBeenCalled();
    });
  });

  describe('Model Management', () => {
    it('should provide accurate status information', () => {
      const status = service.getStatus();
      
      expect(status).toMatchObject({
        isReady: false,
        isLoading: false,
        config: expect.objectContaining({
          quantizationLevel: 'q4_0',
          maxTokens: 512
        })
      });
    });

    it('should unload model and free resources', async () => {
      const mockResponse = new Response(new ArrayBuffer(1024), { 
        status: 200,
        headers: { 'content-length': '1024' }
      });
      (global.fetch as any).mockResolvedValue(mockResponse);

      await service.loadModel();
      expect(service.getStatus().isReady).toBe(true);

      await service.unload();
      expect(service.getStatus().isReady).toBe(false);
    });

    it('should handle multiple unload calls safely', async () => {
      await service.unload();
      await service.unload(); // Should not throw
      
      expect(service.getStatus().isReady).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during model download', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(service.loadModel()).rejects.toThrow(ModelLoadingError);
      
      const status = service.getStatus();
      expect(status.isReady).toBe(false);
      expect(status.isLoading).toBe(false);
    });

    it('should handle invalid model data', async () => {
      const mockResponse = new Response('invalid data', { status: 200 });
      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(service.loadModel()).rejects.toThrow(ModelLoadingError);
    });

    it('should handle inference errors gracefully', async () => {
      // Load model first
      const mockResponse = new Response(new ArrayBuffer(1024), { 
        status: 200,
        headers: { 'content-length': '1024' }
      });
      (global.fetch as any).mockResolvedValue(mockResponse);
      await service.loadModel();

      // Mock inference failure by creating an invalid request
      const request: InferenceRequest = {
        prompt: '', // Empty prompt might cause issues
        maxTokens: -1 // Invalid token count
      };

      // Should handle gracefully and not throw
      const response = await service.inference(request);
      expect(response).toBeDefined();
      expect(response.confidence).toBeGreaterThan(0);
    });
  });

  describe('Configuration', () => {
    it('should respect different quantization levels', () => {
      const configs = [
        { ...config, quantizationLevel: 'q4_0' as const },
        { ...config, quantizationLevel: 'q5_0' as const },
        { ...config, quantizationLevel: 'q8_0' as const }
      ];

      configs.forEach(cfg => {
        const testService = new LlamaModelService(cfg);
        expect(testService.getStatus().config.quantizationLevel).toBe(cfg.quantizationLevel);
      });
    });

    it('should handle different context lengths', () => {
      const longContextConfig = { ...config, contextLength: 4096 };
      const longContextService = new LlamaModelService(longContextConfig);
      
      expect(longContextService.getStatus().config.contextLength).toBe(4096);
    });
  });
});