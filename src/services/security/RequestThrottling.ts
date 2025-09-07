/**
 * Request throttling service for managing concurrent requests and preventing resource exhaustion
 * Implements queue management, priority handling, and progressive backoff
 */

export interface ThrottleConfig {
  maxConcurrent: number;
  maxQueueSize: number;
  timeoutMs: number;
  priority?: number;
  retryAttempts?: number;
  backoffMultiplier?: number;
}

export interface QueuedRequest {
  id: string;
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  priority: number;
  createdAt: number;
  attempts: number;
  config: ThrottleConfig;
}

export interface ThrottleStats {
  activeRequests: number;
  queuedRequests: number;
  completedRequests: number;
  failedRequests: number;
  averageWaitTime: number;
  averageExecutionTime: number;
}

export class RequestThrottlingService {
  private static instance: RequestThrottlingService;
  private activeRequests: Set<string> = new Set();
  private requestQueue: QueuedRequest[] = [];
  private completedRequests: number = 0;
  private failedRequests: number = 0;
  private totalWaitTime: number = 0;
  private totalExecutionTime: number = 0;
  private isProcessing: boolean = false;

  // Default configurations for different request types
  private readonly defaultConfigs: Record<string, ThrottleConfig> = {
    aiInference: {
      maxConcurrent: 3,
      maxQueueSize: 10,
      timeoutMs: 30000,
      priority: 1,
      retryAttempts: 2,
      backoffMultiplier: 2
    },
    fileUpload: {
      maxConcurrent: 2,
      maxQueueSize: 5,
      timeoutMs: 60000,
      priority: 2,
      retryAttempts: 3,
      backoffMultiplier: 1.5
    },
    apiCall: {
      maxConcurrent: 10,
      maxQueueSize: 50,
      timeoutMs: 10000,
      priority: 3,
      retryAttempts: 2,
      backoffMultiplier: 2
    },
    search: {
      maxConcurrent: 5,
      maxQueueSize: 20,
      timeoutMs: 5000,
      priority: 4,
      retryAttempts: 1,
      backoffMultiplier: 1
    }
  };

  public static getInstance(): RequestThrottlingService {
    if (!RequestThrottlingService.instance) {
      RequestThrottlingService.instance = new RequestThrottlingService();
    }
    return RequestThrottlingService.instance;
  }

  /**
   * Throttle a request with the specified configuration
   */
  public async throttle<T>(
    requestFn: () => Promise<T>,
    config: Partial<ThrottleConfig> = {}
  ): Promise<T> {
    const finalConfig: ThrottleConfig = {
      maxConcurrent: 5,
      maxQueueSize: 20,
      timeoutMs: 10000,
      priority: 5,
      retryAttempts: 1,
      backoffMultiplier: 2,
      ...config
    };

    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId();
      const queuedRequest: QueuedRequest = {
        id: requestId,
        fn: requestFn,
        resolve,
        reject,
        priority: finalConfig.priority!,
        createdAt: Date.now(),
        attempts: 0,
        config: finalConfig
      };

      this.enqueueRequest(queuedRequest);
    });
  }

  /**
   * Throttle AI inference requests
   */
  public async throttleAiInference<T>(requestFn: () => Promise<T>): Promise<T> {
    return this.throttle(requestFn, this.defaultConfigs.aiInference);
  }

  /**
   * Throttle file upload requests
   */
  public async throttleFileUpload<T>(requestFn: () => Promise<T>): Promise<T> {
    return this.throttle(requestFn, this.defaultConfigs.fileUpload);
  }

  /**
   * Throttle API calls
   */
  public async throttleApiCall<T>(requestFn: () => Promise<T>): Promise<T> {
    return this.throttle(requestFn, this.defaultConfigs.apiCall);
  }

  /**
   * Throttle search requests
   */
  public async throttleSearch<T>(requestFn: () => Promise<T>): Promise<T> {
    return this.throttle(requestFn, this.defaultConfigs.search);
  }

  /**
   * Add request to queue
   */
  private enqueueRequest(request: QueuedRequest): void {
    // Check if queue is full
    if (this.requestQueue.length >= request.config.maxQueueSize) {
      request.reject(new Error('Request queue is full. Please try again later.'));
      return;
    }

    // Add to queue and sort by priority (lower number = higher priority)
    this.requestQueue.push(request);
    this.requestQueue.sort((a, b) => a.priority - b.priority);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process the request queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;

    while (this.requestQueue.length > 0 && this.activeRequests.size < this.getMaxConcurrent()) {
      const request = this.requestQueue.shift();
      if (request) {
        this.executeRequest(request);
      }
    }

    this.isProcessing = false;

    // Continue processing if there are more requests and available slots
    if (this.requestQueue.length > 0 && this.activeRequests.size < this.getMaxConcurrent()) {
      setTimeout(() => this.processQueue(), 10);
    }
  }

  /**
   * Execute a single request
   */
  private async executeRequest(request: QueuedRequest): Promise<void> {
    const { id, fn, resolve, reject, config, createdAt } = request;
    
    this.activeRequests.add(id);
    request.attempts++;

    const waitTime = Date.now() - createdAt;
    this.totalWaitTime += waitTime;

    const executionStart = Date.now();

    try {
      // Set up timeout
      const timeoutPromise = new Promise((_, timeoutReject) => {
        setTimeout(() => {
          timeoutReject(new Error(`Request timeout after ${config.timeoutMs}ms`));
        }, config.timeoutMs);
      });

      // Race between the actual request and timeout
      const result = await Promise.race([fn(), timeoutPromise]);
      
      const executionTime = Date.now() - executionStart;
      this.totalExecutionTime += executionTime;
      this.completedRequests++;

      resolve(result);
    } catch (error) {
      const shouldRetry = request.attempts < (config.retryAttempts || 0);
      
      if (shouldRetry) {
        // Calculate backoff delay
        const backoffDelay = this.calculateBackoff(
          request.attempts, 
          config.backoffMultiplier || 2
        );

        // Re-queue the request after backoff delay
        setTimeout(() => {
          this.enqueueRequest(request);
        }, backoffDelay);
      } else {
        this.failedRequests++;
        reject(error);
      }
    } finally {
      this.activeRequests.delete(id);
      
      // Continue processing queue
      setTimeout(() => this.processQueue(), 0);
    }
  }

  /**
   * Calculate backoff delay for retries
   */
  private calculateBackoff(attempt: number, multiplier: number): number {
    const baseDelay = 1000; // 1 second
    const delay = baseDelay * Math.pow(multiplier, attempt - 1);
    const jitter = Math.random() * 0.1 * delay; // 10% jitter
    return Math.min(delay + jitter, 30000); // Max 30 seconds
  }

  /**
   * Get maximum concurrent requests based on current queue
   */
  private getMaxConcurrent(): number {
    if (this.requestQueue.length === 0) return 10;
    
    // Use the most restrictive concurrent limit from queued requests
    const minConcurrent = Math.min(
      ...this.requestQueue.map(req => req.config.maxConcurrent)
    );
    
    return Math.max(minConcurrent, 1);
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current throttling statistics
   */
  public getStats(): ThrottleStats {
    const totalRequests = this.completedRequests + this.failedRequests;
    
    return {
      activeRequests: this.activeRequests.size,
      queuedRequests: this.requestQueue.length,
      completedRequests: this.completedRequests,
      failedRequests: this.failedRequests,
      averageWaitTime: totalRequests > 0 ? this.totalWaitTime / totalRequests : 0,
      averageExecutionTime: this.completedRequests > 0 ? this.totalExecutionTime / this.completedRequests : 0
    };
  }

  /**
   * Clear all queued requests
   */
  public clearQueue(): void {
    this.requestQueue.forEach(request => {
      request.reject(new Error('Request queue cleared'));
    });
    this.requestQueue = [];
  }

  /**
   * Cancel a specific request by ID
   */
  public cancelRequest(requestId: string): boolean {
    const index = this.requestQueue.findIndex(req => req.id === requestId);
    if (index !== -1) {
      const request = this.requestQueue[index];
      request.reject(new Error('Request cancelled'));
      this.requestQueue.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get queue status
   */
  public getQueueStatus(): {
    position: number;
    estimatedWaitTime: number;
  }[] {
    return this.requestQueue.map((request, index) => ({
      position: index + 1,
      estimatedWaitTime: this.estimateWaitTime(index)
    }));
  }

  /**
   * Estimate wait time for a request at given queue position
   */
  private estimateWaitTime(queuePosition: number): number {
    const stats = this.getStats();
    const avgExecutionTime = stats.averageExecutionTime || 2000; // Default 2 seconds
    const maxConcurrent = this.getMaxConcurrent();
    
    // Estimate based on queue position and concurrent capacity
    const batchesAhead = Math.floor(queuePosition / maxConcurrent);
    return batchesAhead * avgExecutionTime;
  }

  /**
   * Update configuration for a request type
   */
  public updateConfig(type: string, config: Partial<ThrottleConfig>): void {
    if (this.defaultConfigs[type]) {
      this.defaultConfigs[type] = { ...this.defaultConfigs[type], ...config };
    } else {
      this.defaultConfigs[type] = {
        maxConcurrent: 5,
        maxQueueSize: 20,
        timeoutMs: 10000,
        priority: 5,
        retryAttempts: 1,
        backoffMultiplier: 2,
        ...config
      };
    }
  }

  /**
   * Get configuration for a request type
   */
  public getConfig(type: string): ThrottleConfig | undefined {
    return this.defaultConfigs[type];
  }

  /**
   * Reset all statistics
   */
  public resetStats(): void {
    this.completedRequests = 0;
    this.failedRequests = 0;
    this.totalWaitTime = 0;
    this.totalExecutionTime = 0;
  }

  /**
   * Check if the service is currently under heavy load
   */
  public isUnderHeavyLoad(): boolean {
    const stats = this.getStats();
    const queueUtilization = stats.queuedRequests / 50; // Assuming max queue of 50
    const concurrentUtilization = stats.activeRequests / 10; // Assuming max concurrent of 10
    
    return queueUtilization > 0.8 || concurrentUtilization > 0.9;
  }

  /**
   * Get health status of the throttling service
   */
  public getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: any;
  } {
    const stats = this.getStats();
    const isHeavyLoad = this.isUnderHeavyLoad();
    const failureRate = stats.completedRequests + stats.failedRequests > 0 
      ? stats.failedRequests / (stats.completedRequests + stats.failedRequests) 
      : 0;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (failureRate > 0.5 || stats.queuedRequests > 40) {
      status = 'unhealthy';
    } else if (isHeavyLoad || failureRate > 0.2) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        ...stats,
        failureRate,
        isUnderHeavyLoad: isHeavyLoad
      }
    };
  }
}

export default RequestThrottlingService;