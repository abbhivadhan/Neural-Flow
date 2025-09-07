/**
 * React hooks for rate limiting and request throttling
 * Provides easy integration with components and API calls
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { RateLimitingService, RateLimitResult } from '../services/security/RateLimitingService';
import { RequestThrottlingService } from '../services/security/RequestThrottling';

export interface UseRateLimitOptions {
  key?: string;
  maxRequests?: number;
  windowMs?: number;
  onRateLimitExceeded?: (result: RateLimitResult) => void;
}

export interface UseRateLimitReturn {
  isAllowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  checkRateLimit: () => RateLimitResult;
  recordRequest: (success: boolean) => void;
}

/**
 * Hook for rate limiting functionality
 */
export function useRateLimit(options: UseRateLimitOptions = {}): UseRateLimitReturn {
  const {
    key = 'default',
    maxRequests = 100,
    windowMs = 60000,
    onRateLimitExceeded
  } = options;

  const [rateLimitState, setRateLimitState] = useState<RateLimitResult>({
    allowed: true,
    remaining: maxRequests,
    resetTime: Date.now() + windowMs
  });

  const rateLimitService = useRef(RateLimitingService.getInstance());

  const checkRateLimit = useCallback(() => {
    const result = rateLimitService.current.checkRateLimit(
      key,
      { maxRequests, windowMs }
    );

    setRateLimitState(result);

    if (!result.allowed && onRateLimitExceeded) {
      onRateLimitExceeded(result);
    }

    return result;
  }, [key, maxRequests, windowMs, onRateLimitExceeded]);

  const recordRequest = useCallback((success: boolean) => {
    rateLimitService.current.recordRequest(key, success);
    // Update state after recording
    setTimeout(checkRateLimit, 0);
  }, [key, checkRateLimit]);

  return {
    isAllowed: rateLimitState.allowed,
    remaining: rateLimitState.remaining,
    resetTime: rateLimitState.resetTime,
    retryAfter: rateLimitState.retryAfter,
    checkRateLimit,
    recordRequest
  };
}

/**
 * Hook for API rate limiting
 */
export function useApiRateLimit(key: string = 'api'): UseRateLimitReturn {
  return useRateLimit({
    key,
    maxRequests: 100,
    windowMs: 60000
  });
}

/**
 * Hook for AI inference rate limiting
 */
export function useAiRateLimit(key: string = 'ai'): UseRateLimitReturn {
  return useRateLimit({
    key,
    maxRequests: 20,
    windowMs: 60000
  });
}

/**
 * Hook for request throttling
 */
export interface UseThrottleOptions {
  maxConcurrent?: number;
  maxQueueSize?: number;
  timeoutMs?: number;
  onQueueFull?: () => void;
  onTimeout?: () => void;
}

export interface UseThrottleReturn {
  throttledRequest: <T>(requestFn: () => Promise<T>) => Promise<T>;
  stats: any;
  isUnderHeavyLoad: boolean;
  queueStatus: any[];
}

export function useThrottle(options: UseThrottleOptions = {}): UseThrottleReturn {
  const {
    maxConcurrent = 5,
    maxQueueSize = 20,
    timeoutMs = 10000,
    onQueueFull,
    onTimeout
  } = options;

  const [stats, setStats] = useState<any>({});
  const [queueStatus, setQueueStatus] = useState<any[]>([]);
  const throttleService = useRef(RequestThrottlingService.getInstance());

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(throttleService.current.getStats());
      setQueueStatus(throttleService.current.getQueueStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const throttledRequest = useCallback(async <T>(
    requestFn: () => Promise<T>
  ): Promise<T> => {
    try {
      return await throttleService.current.throttle(requestFn, {
        maxConcurrent,
        maxQueueSize,
        timeoutMs
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('queue is full') && onQueueFull) {
          onQueueFull();
        } else if (error.message.includes('timeout') && onTimeout) {
          onTimeout();
        }
      }
      throw error;
    }
  }, [maxConcurrent, maxQueueSize, timeoutMs, onQueueFull, onTimeout]);

  const isUnderHeavyLoad = throttleService.current.isUnderHeavyLoad();

  return {
    throttledRequest,
    stats,
    isUnderHeavyLoad,
    queueStatus
  };
}

/**
 * Hook for AI inference throttling
 */
export function useAiThrottle(): UseThrottleReturn {
  return useThrottle({
    maxConcurrent: 3,
    maxQueueSize: 10,
    timeoutMs: 30000
  });
}

/**
 * Hook for file upload throttling
 */
export function useFileUploadThrottle(): UseThrottleReturn {
  return useThrottle({
    maxConcurrent: 2,
    maxQueueSize: 5,
    timeoutMs: 60000
  });
}

/**
 * Combined hook for rate limiting and throttling
 */
export interface UseSecureRequestOptions extends UseRateLimitOptions, UseThrottleOptions {
  enableRateLimit?: boolean;
  enableThrottle?: boolean;
}

export interface UseSecureRequestReturn {
  secureRequest: <T>(requestFn: () => Promise<T>) => Promise<T>;
  rateLimitInfo: UseRateLimitReturn;
  throttleInfo: UseThrottleReturn;
  canMakeRequest: boolean;
}

export function useSecureRequest(options: UseSecureRequestOptions = {}): UseSecureRequestReturn {
  const {
    enableRateLimit = true,
    enableThrottle = true,
    ...restOptions
  } = options;

  const rateLimitInfo = useRateLimit(enableRateLimit ? restOptions : { key: 'disabled' });
  const throttleInfo = useThrottle(enableThrottle ? restOptions : {});

  const secureRequest = useCallback(async <T>(
    requestFn: () => Promise<T>
  ): Promise<T> => {
    // Check rate limit first
    if (enableRateLimit) {
      const rateLimitResult = rateLimitInfo.checkRateLimit();
      if (!rateLimitResult.allowed) {
        throw new Error(`Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`);
      }
    }

    // Execute with throttling
    try {
      let result: T;
      
      if (enableThrottle) {
        result = await throttleInfo.throttledRequest(requestFn);
      } else {
        result = await requestFn();
      }

      // Record successful request
      if (enableRateLimit) {
        rateLimitInfo.recordRequest(true);
      }

      return result;
    } catch (error) {
      // Record failed request
      if (enableRateLimit) {
        rateLimitInfo.recordRequest(false);
      }
      throw error;
    }
  }, [enableRateLimit, enableThrottle, rateLimitInfo, throttleInfo]);

  const canMakeRequest = enableRateLimit ? rateLimitInfo.isAllowed : true;

  return {
    secureRequest,
    rateLimitInfo,
    throttleInfo,
    canMakeRequest
  };
}

/**
 * Hook for progressive backoff with retry logic
 */
export interface UseProgressiveBackoffOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: any) => void;
  onMaxRetriesReached?: (error: any) => void;
}

export interface UseProgressiveBackoffReturn {
  executeWithBackoff: <T>(requestFn: () => Promise<T>) => Promise<T>;
  isRetrying: boolean;
  currentAttempt: number;
  reset: () => void;
}

export function useProgressiveBackoff(
  options: UseProgressiveBackoffOptions = {}
): UseProgressiveBackoffReturn {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    onRetry,
    onMaxRetriesReached
  } = options;

  const [isRetrying, setIsRetrying] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(0);

  const calculateDelay = useCallback((attempt: number): number => {
    const exponentialDelay = baseDelayMs * Math.pow(backoffMultiplier, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return Math.min(exponentialDelay + jitter, maxDelayMs);
  }, [baseDelayMs, backoffMultiplier, maxDelayMs]);

  const executeWithBackoff = useCallback(async <T>(
    requestFn: () => Promise<T>
  ): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      setCurrentAttempt(attempt);
      
      try {
        const result = await requestFn();
        setIsRetrying(false);
        setCurrentAttempt(0);
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt <= maxRetries) {
          setIsRetrying(true);
          
          if (onRetry) {
            onRetry(attempt, error);
          }
          
          const delay = calculateDelay(attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    setIsRetrying(false);
    setCurrentAttempt(0);
    
    if (onMaxRetriesReached) {
      onMaxRetriesReached(lastError);
    }
    
    throw lastError;
  }, [maxRetries, calculateDelay, onRetry, onMaxRetriesReached]);

  const reset = useCallback(() => {
    setIsRetrying(false);
    setCurrentAttempt(0);
  }, []);

  return {
    executeWithBackoff,
    isRetrying,
    currentAttempt,
    reset
  };
}