/**
 * Web Worker Manager
 * Manages communication with background workers for performance optimization
 */

interface WorkerTask {
  id: string;
  type: string;
  payload: any;
  resolve: (result: any) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

export class WorkerManager {
  private worker: Worker | null = null;
  private pendingTasks = new Map<string, WorkerTask>();
  private taskQueue: WorkerTask[] = [];
  private isProcessing = false;
  private maxConcurrentTasks = 3;
  private activeTasks = 0;

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker(): void {
    try {
      // Create worker from TypeScript file (Vite will handle compilation)
      this.worker = new Worker(
        new URL('../../workers/aiWorker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      this.worker.onerror = this.handleWorkerError.bind(this);
      
      console.log('AI Worker initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI Worker:', error);
    }
  }

  private handleWorkerMessage(event: MessageEvent): void {
    const { id, type, result, error } = event.data;
    const task = this.pendingTasks.get(id);
    
    if (!task) {
      console.warn(`Received response for unknown task: ${id}`);
      return;
    }

    this.pendingTasks.delete(id);
    this.activeTasks--;

    if (type === 'SUCCESS') {
      task.resolve(result);
    } else {
      task.reject(new Error(error || 'Worker task failed'));
    }

    // Process next task in queue
    this.processQueue();
  }

  private handleWorkerError(error: ErrorEvent): void {
    console.error('Worker error:', error);
    
    // Reject all pending tasks
    this.pendingTasks.forEach(task => {
      task.reject(new Error('Worker error occurred'));
    });
    
    this.pendingTasks.clear();
    this.activeTasks = 0;
    
    // Reinitialize worker
    this.initializeWorker();
  }

  private processQueue(): void {
    if (this.isProcessing || this.activeTasks >= this.maxConcurrentTasks) {
      return;
    }

    const task = this.taskQueue.shift();
    if (!task) {
      return;
    }

    this.isProcessing = true;
    this.activeTasks++;
    
    if (this.worker) {
      this.pendingTasks.set(task.id, task);
      this.worker.postMessage({
        id: task.id,
        type: task.type,
        payload: task.payload
      });
    } else {
      task.reject(new Error('Worker not available'));
      this.activeTasks--;
    }

    this.isProcessing = false;
    
    // Continue processing queue
    setTimeout(() => this.processQueue(), 0);
  }

  public async executeTask<T>(type: string, payload: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        payload,
        resolve,
        reject,
        timestamp: Date.now()
      };

      // Add to queue or process immediately
      if (this.activeTasks < this.maxConcurrentTasks && !this.isProcessing) {
        this.taskQueue.push(task);
        this.processQueue();
      } else {
        this.taskQueue.push(task);
      }
    });
  }

  public async predictTask(features: number[]): Promise<any> {
    return this.executeTask('PREDICT_TASK', { features });
  }

  public async analyzeBehavior(interactions: any[]): Promise<any> {
    return this.executeTask('ANALYZE_BEHAVIOR', { interactions });
  }

  public async generateContent(prompt: string, style?: string): Promise<any> {
    return this.executeTask('GENERATE_CONTENT', { prompt, style });
  }

  public async processEmbeddings(texts: string[]): Promise<any> {
    return this.executeTask('PROCESS_EMBEDDINGS', { texts });
  }

  public getQueueStatus(): { pending: number; active: number; queue: number } {
    return {
      pending: this.pendingTasks.size,
      active: this.activeTasks,
      queue: this.taskQueue.length
    };
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    // Reject all pending tasks
    this.pendingTasks.forEach(task => {
      task.reject(new Error('Worker terminated'));
    });
    
    this.pendingTasks.clear();
    this.taskQueue.length = 0;
    this.activeTasks = 0;
  }
}

// Singleton instance
export const workerManager = new WorkerManager();