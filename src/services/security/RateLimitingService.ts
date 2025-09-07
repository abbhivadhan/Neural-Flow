/**
 * Rate limiting and DDoS protection service
 * Implements client-side rate limiting, request throttling, and abuse detection
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: any) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RequestRecord {
  timestamp: number;
  success: boolean;
  endpoint: string;
  userAgent?: string;
  ip?: string;
}

export interface AbusePattern {
  type: 'rapid_requests' | 'failed_requests' | 'suspicious_pattern' | 'resource_exhaustion';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: number;
  evidence: any;
}

export class RateLimitingService {
  private static instance: RateLimitingService;
  private requestHistory: Map<string, RequestRecord[]> = new Map();
  private blockedKeys: Map<string, number> = new Map();
  private abusePatterns: AbusePattern[] = [];
  private cleanupInterval: NodeJS.Timeout;

  // Default configurations for different types of requests
  private readonly defaultConfigs = {
    api: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
    aiInference: { maxRequests: 20, windowMs: 60000 }, // 20 AI requests per minute
    fileUpload: { maxRequests: 10, windowMs: 300000 }, // 10 uploads per 5 minutes
    search: { maxRequests: 50, windowMs: 60000 }, // 50 searches per minute
    auth: { maxRequests: 5, windowMs: 300000, blockDurationMs: 900000 } // 5 auth attempts per 5 min, block for 15 min
  };

  public static getInstance(): RateLimitingService {
    if (!RateLimitingService.instance) {
      RateLimitingService.instance = new RateLimitingService();
    }
    return RateLimitingService.instance;
  }

  constructor() {
    // Clean up old records every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if request is allowed under rate limit
   */
  public checkRateLimit(
    key: string, 
    config: RateLimitConfig, 
    endpoint: string = 'unknown'
  ): RateLimitResult {
    const now = Date.now();
    
    // Check if key is currently blocked
    const blockUntil = this.blockedKeys.get(key);
    if (blockUntil && now < blockUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: blockUntil,
        retryAfter: Math.ceil((blockUntil - now) / 1000)
      };
    }

    // Get request history for this key
    const history = this.requestHistory.get(key) || [];
    const windowStart = now - config.windowMs;
    
    // Filter requests within the current window
    const recentRequests = history.filter(record => {
      const inWindow = record.timestamp > windowStart;
      const shouldCount = !config.skipSuccessfulRequests || !record.success;
      const shouldCountFailed = !config.skipFailedRequests || record.success;
      return inWindow && shouldCount && shouldCountFailed;
    });

    const requestCount = recentRequests.length;
    const remaining = Math.max(0, config.maxRequests - requestCount);
    const resetTime = windowStart + config.windowMs;

    // Check for abuse patterns
    this.detectAbusePatterns(key, history, endpoint);

    if (requestCount >= config.maxRequests) {
      // Block the key if configured
      if (config.blockDurationMs) {
        this.blockedKeys.set(key, now + config.blockDurationMs);
      }

      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil(config.windowMs / 1000)
      };
    }

    return {
      allowed: true,
      remaining,
      resetTime
    };
  }

  /**
   * Record a request for rate limiting tracking
   */
  public recordRequest(
    key: string, 
    success: boolean, 
    endpoint: string = 'unknown',
    metadata?: any
  ): void {
    const now = Date.now();
    const record: RequestRecord = {
      timestamp: now,
      success,
      endpoint,
      userAgent: metadata?.userAgent,
      ip: metadata?.ip
    };

    const history = this.requestHistory.get(key) || [];
    history.push(record);
    
    // Keep only recent history (last hour)
    const oneHourAgo = now - 3600000;
    const recentHistory = history.filter(r => r.timestamp > oneHourAgo);
    
    this.requestHistory.set(key, recentHistory);
  }

  /**
   * Get rate limit status for a key
   */
  public getRateLimitStatus(key: string, config: RateLimitConfig): RateLimitResult {
    return this.checkRateLimit(key, config);
  }

  /**
   * Check API rate limit with default config
   */
  public checkApiRateLimit(key: string): RateLimitResult {
    return this.checkRateLimit(key, this.defaultConfigs.api, 'api');
  }

  /**
   * Check AI inference rate limit
   */
  public checkAiInferenceRateLimit(key: string): RateLimitResult {
    return this.checkRateLimit(key, this.defaultConfigs.aiInference, 'ai-inference');
  }

  /**
   * Check file upload rate limit
   */
  public checkFileUploadRateLimit(key: string): RateLimitResult {
    return this.checkRateLimit(key, this.defaultConfigs.fileUpload, 'file-upload');
  }

  /**
   * Check search rate limit
   */
  public checkSearchRateLimit(key: string): RateLimitResult {
    return this.checkRateLimit(key, this.defaultConfigs.search, 'search');
  }

  /**
   * Check authentication rate limit
   */
  public checkAuthRateLimit(key: string): RateLimitResult {
    return this.checkRateLimit(key, this.defaultConfigs.auth, 'auth');
  }

  /**
   * Detect abuse patterns in request history
   */
  private detectAbusePatterns(key: string, history: RequestRecord[], endpoint: string): void {
    const now = Date.now();
    const recentHistory = history.filter(r => r.timestamp > now - 300000); // Last 5 minutes

    // Pattern 1: Rapid successive requests
    if (recentHistory.length >= 50) {
      const rapidRequests = recentHistory.filter(r => r.timestamp > now - 10000); // Last 10 seconds
      if (rapidRequests.length >= 20) {
        this.recordAbusePattern({
          type: 'rapid_requests',
          severity: 'high',
          description: `${rapidRequests.length} requests in 10 seconds from ${key}`,
          detectedAt: now,
          evidence: { requestCount: rapidRequests.length, timeWindow: 10000, endpoint }
        });
      }
    }

    // Pattern 2: High failure rate
    const failedRequests = recentHistory.filter(r => !r.success);
    const failureRate = recentHistory.length > 0 ? failedRequests.length / recentHistory.length : 0;
    
    if (recentHistory.length >= 10 && failureRate > 0.8) {
      this.recordAbusePattern({
        type: 'failed_requests',
        severity: 'medium',
        description: `High failure rate (${Math.round(failureRate * 100)}%) from ${key}`,
        detectedAt: now,
        evidence: { failureRate, totalRequests: recentHistory.length, failedRequests: failedRequests.length }
      });
    }

    // Pattern 3: Suspicious user agent patterns
    const userAgents = recentHistory
      .map(r => r.userAgent)
      .filter(ua => ua)
      .filter((ua, index, arr) => arr.indexOf(ua) === index);

    if (userAgents.length > 5) {
      this.recordAbusePattern({
        type: 'suspicious_pattern',
        severity: 'medium',
        description: `Multiple user agents from same key: ${key}`,
        detectedAt: now,
        evidence: { userAgents, requestCount: recentHistory.length }
      });
    }

    // Pattern 4: Resource exhaustion attempts
    const resourceIntensiveEndpoints = ['ai-inference', 'file-upload', 'search'];
    if (resourceIntensiveEndpoints.includes(endpoint)) {
      const resourceRequests = recentHistory.filter(r => 
        resourceIntensiveEndpoints.includes(r.endpoint)
      );
      
      if (resourceRequests.length >= 15) {
        this.recordAbusePattern({
          type: 'resource_exhaustion',
          severity: 'high',
          description: `Excessive resource-intensive requests from ${key}`,
          detectedAt: now,
          evidence: { resourceRequests: resourceRequests.length, endpoints: resourceIntensiveEndpoints }
        });
      }
    }
  }

  /**
   * Record an abuse pattern
   */
  private recordAbusePattern(pattern: AbusePattern): void {
    this.abusePatterns.push(pattern);
    
    // Keep only recent patterns (last 24 hours)
    const oneDayAgo = Date.now() - 86400000;
    this.abusePatterns = this.abusePatterns.filter(p => p.detectedAt > oneDayAgo);

    // Log critical patterns
    if (pattern.severity === 'critical' || pattern.severity === 'high') {
      console.warn('Security Alert - Abuse Pattern Detected:', pattern);
    }

    // Auto-block for critical patterns
    if (pattern.severity === 'critical') {
      const key = this.extractKeyFromPattern(pattern);
      if (key) {
        this.blockedKeys.set(key, Date.now() + 3600000); // Block for 1 hour
      }
    }
  }

  /**
   * Extract key from abuse pattern evidence
   */
  private extractKeyFromPattern(pattern: AbusePattern): string | null {
    // This is a simplified extraction - in a real implementation,
    // you'd need to store the key with the pattern
    return null;
  }

  /**
   * Get detected abuse patterns
   */
  public getAbusePatterns(severity?: AbusePattern['severity']): AbusePattern[] {
    if (severity) {
      return this.abusePatterns.filter(p => p.severity === severity);
    }
    return [...this.abusePatterns];
  }

  /**
   * Block a key manually
   */
  public blockKey(key: string, durationMs: number = 3600000): void {
    this.blockedKeys.set(key, Date.now() + durationMs);
  }

  /**
   * Unblock a key manually
   */
  public unblockKey(key: string): void {
    this.blockedKeys.delete(key);
  }

  /**
   * Check if a key is currently blocked
   */
  public isBlocked(key: string): boolean {
    const blockUntil = this.blockedKeys.get(key);
    return blockUntil ? Date.now() < blockUntil : false;
  }

  /**
   * Get all currently blocked keys
   */
  public getBlockedKeys(): Array<{ key: string; blockedUntil: number }> {
    const now = Date.now();
    const blocked: Array<{ key: string; blockedUntil: number }> = [];
    
    for (const [key, blockUntil] of this.blockedKeys.entries()) {
      if (blockUntil > now) {
        blocked.push({ key, blockedUntil });
      }
    }
    
    return blocked;
  }

  /**
   * Progressive backoff calculation
   */
  public calculateBackoff(attemptCount: number, baseDelayMs: number = 1000): number {
    // Exponential backoff with jitter
    const exponentialDelay = baseDelayMs * Math.pow(2, attemptCount - 1);
    const maxDelay = 30000; // 30 seconds max
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    
    return Math.min(exponentialDelay + jitter, maxDelay);
  }

  /**
   * Create a rate-limited function wrapper
   */
  public createRateLimitedFunction<T extends (...args: any[]) => any>(
    fn: T,
    key: string,
    config: RateLimitConfig
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      const rateLimitResult = this.checkRateLimit(key, config);
      
      if (!rateLimitResult.allowed) {
        throw new Error(`Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`);
      }

      try {
        const result = await fn(...args);
        this.recordRequest(key, true);
        return result;
      } catch (error) {
        this.recordRequest(key, false);
        throw error;
      }
    };
  }

  /**
   * Clean up old records and expired blocks
   */
  private cleanup(): void {
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    // Clean up old request history
    for (const [key, history] of this.requestHistory.entries()) {
      const recentHistory = history.filter(r => r.timestamp > oneHourAgo);
      if (recentHistory.length === 0) {
        this.requestHistory.delete(key);
      } else {
        this.requestHistory.set(key, recentHistory);
      }
    }

    // Clean up expired blocks
    for (const [key, blockUntil] of this.blockedKeys.entries()) {
      if (blockUntil <= now) {
        this.blockedKeys.delete(key);
      }
    }

    // Clean up old abuse patterns
    const oneDayAgo = now - 86400000;
    this.abusePatterns = this.abusePatterns.filter(p => p.detectedAt > oneDayAgo);
  }

  /**
   * Get rate limiting statistics
   */
  public getStatistics(): {
    totalKeys: number;
    blockedKeys: number;
    abusePatterns: number;
    requestsLastHour: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    let totalRequests = 0;
    for (const history of this.requestHistory.values()) {
      totalRequests += history.filter(r => r.timestamp > oneHourAgo).length;
    }

    return {
      totalKeys: this.requestHistory.size,
      blockedKeys: this.getBlockedKeys().length,
      abusePatterns: this.abusePatterns.length,
      requestsLastHour: totalRequests
    };
  }

  /**
   * Reset all rate limiting data (for testing)
   */
  public reset(): void {
    this.requestHistory.clear();
    this.blockedKeys.clear();
    this.abusePatterns = [];
  }

  /**
   * Destroy the service and clean up resources
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.reset();
  }
}

export default RateLimitingService;