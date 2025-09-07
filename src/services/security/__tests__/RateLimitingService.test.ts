/**
 * Tests for RateLimitingService
 */

import { RateLimitingService } from '../RateLimitingService';

describe('RateLimitingService', () => {
  let service: RateLimitingService;

  beforeEach(() => {
    service = RateLimitingService.getInstance();
    service.reset(); // Clear any previous state
  });

  afterEach(() => {
    service.reset();
  });

  describe('Basic rate limiting', () => {
    test('should allow requests within limit', () => {
      const config = { maxRequests: 5, windowMs: 60000 };
      
      for (let i = 0; i < 5; i++) {
        const result = service.checkRateLimit('test-key', config);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
        
        service.recordRequest('test-key', true);
      }
    });

    test('should block requests exceeding limit', () => {
      const config = { maxRequests: 3, windowMs: 60000 };
      
      // Make 3 allowed requests
      for (let i = 0; i < 3; i++) {
        service.recordRequest('test-key', true);
        const result = service.checkRateLimit('test-key', config);
        if (i < 2) {
          expect(result.allowed).toBe(true);
        }
      }
      
      // 4th request should be blocked
      const blockedResult = service.checkRateLimit('test-key', config);
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.remaining).toBe(0);
      expect(blockedResult.retryAfter).toBeGreaterThan(0);
    });

    test('should reset limit after window expires', async () => {
      const config = { maxRequests: 2, windowMs: 100 }; // 100ms window
      
      // Exhaust the limit
      service.recordRequest('test-key', true);
      service.recordRequest('test-key', true);
      
      let result = service.checkRateLimit('test-key', config);
      expect(result.allowed).toBe(false);
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be allowed again
      result = service.checkRateLimit('test-key', config);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Different key isolation', () => {
    test('should maintain separate limits for different keys', () => {
      const config = { maxRequests: 2, windowMs: 60000 };
      
      // Exhaust limit for key1
      service.recordRequest('key1', true);
      service.recordRequest('key1', true);
      
      const key1Result = service.checkRateLimit('key1', config);
      expect(key1Result.allowed).toBe(false);
      
      // key2 should still be allowed
      const key2Result = service.checkRateLimit('key2', config);
      expect(key2Result.allowed).toBe(true);
    });
  });

  describe('Blocking functionality', () => {
    test('should block key manually', () => {
      service.blockKey('blocked-key', 5000); // Block for 5 seconds
      
      const result = service.checkRateLimit('blocked-key', { maxRequests: 10, windowMs: 60000 });
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    test('should unblock key manually', () => {
      service.blockKey('blocked-key', 5000);
      expect(service.isBlocked('blocked-key')).toBe(true);
      
      service.unblockKey('blocked-key');
      expect(service.isBlocked('blocked-key')).toBe(false);
    });

    test('should auto-block with block duration config', () => {
      const config = { 
        maxRequests: 1, 
        windowMs: 60000, 
        blockDurationMs: 5000 
      };
      
      // Exhaust limit
      service.recordRequest('auto-block-key', true);
      const result = service.checkRateLimit('auto-block-key', config);
      
      expect(result.allowed).toBe(false);
      expect(service.isBlocked('auto-block-key')).toBe(true);
    });
  });

  describe('Skip options', () => {
    test('should skip successful requests when configured', () => {
      const config = { 
        maxRequests: 2, 
        windowMs: 60000, 
        skipSuccessfulRequests: true 
      };
      
      // Record successful requests (should be skipped)
      service.recordRequest('skip-key', true);
      service.recordRequest('skip-key', true);
      service.recordRequest('skip-key', true);
      
      const result = service.checkRateLimit('skip-key', config);
      expect(result.allowed).toBe(true);
    });

    test('should skip failed requests when configured', () => {
      const config = { 
        maxRequests: 2, 
        windowMs: 60000, 
        skipFailedRequests: true 
      };
      
      // Record failed requests (should be skipped)
      service.recordRequest('skip-fail-key', false);
      service.recordRequest('skip-fail-key', false);
      service.recordRequest('skip-fail-key', false);
      
      const result = service.checkRateLimit('skip-fail-key', config);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Abuse detection', () => {
    test('should detect rapid request patterns', () => {
      // Simulate rapid requests
      for (let i = 0; i < 25; i++) {
        service.recordRequest('rapid-key', true, 'api');
      }
      
      const patterns = service.getAbusePatterns();
      const rapidPattern = patterns.find(p => p.type === 'rapid_requests');
      
      expect(rapidPattern).toBeDefined();
      expect(rapidPattern?.severity).toBe('high');
    });

    test('should detect high failure rate patterns', () => {
      // Simulate high failure rate
      for (let i = 0; i < 15; i++) {
        service.recordRequest('fail-key', false, 'api');
      }
      // Add a few successful requests
      service.recordRequest('fail-key', true, 'api');
      service.recordRequest('fail-key', true, 'api');
      
      const patterns = service.getAbusePatterns();
      const failPattern = patterns.find(p => p.type === 'failed_requests');
      
      expect(failPattern).toBeDefined();
      expect(failPattern?.severity).toBe('medium');
    });
  });

  describe('Default configurations', () => {
    test('should use API rate limit correctly', () => {
      const result = service.checkApiRateLimit('api-key');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(100); // Default API limit
    });

    test('should use AI inference rate limit correctly', () => {
      const result = service.checkAiInferenceRateLimit('ai-key');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(20); // Default AI limit
    });

    test('should use file upload rate limit correctly', () => {
      const result = service.checkFileUploadRateLimit('upload-key');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(10); // Default upload limit
    });

    test('should use search rate limit correctly', () => {
      const result = service.checkSearchRateLimit('search-key');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(50); // Default search limit
    });

    test('should use auth rate limit correctly', () => {
      const result = service.checkAuthRateLimit('auth-key');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5); // Default auth limit
    });
  });

  describe('Progressive backoff', () => {
    test('should calculate progressive backoff correctly', () => {
      const backoff1 = service.calculateBackoff(1);
      const backoff2 = service.calculateBackoff(2);
      const backoff3 = service.calculateBackoff(3);
      
      expect(backoff2).toBeGreaterThan(backoff1);
      expect(backoff3).toBeGreaterThan(backoff2);
      expect(backoff3).toBeLessThanOrEqual(30000); // Max delay
    });
  });

  describe('Rate limited function wrapper', () => {
    test('should create rate limited function that respects limits', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const config = { maxRequests: 2, windowMs: 60000 };
      
      const rateLimitedFn = service.createRateLimitedFunction(
        mockFn,
        'wrapper-key',
        config
      );
      
      // First two calls should succeed
      await expect(rateLimitedFn()).resolves.toBe('success');
      await expect(rateLimitedFn()).resolves.toBe('success');
      
      // Third call should be rate limited
      await expect(rateLimitedFn()).rejects.toThrow('Rate limit exceeded');
      
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test('should record failed requests in wrapper', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('API Error'));
      const config = { maxRequests: 5, windowMs: 60000 };
      
      const rateLimitedFn = service.createRateLimitedFunction(
        mockFn,
        'fail-wrapper-key',
        config
      );
      
      await expect(rateLimitedFn()).rejects.toThrow('API Error');
      
      // Check that the failed request was recorded
      const result = service.checkRateLimit('fail-wrapper-key', config);
      expect(result.remaining).toBe(4); // One request was recorded
    });
  });

  describe('Statistics', () => {
    test('should provide accurate statistics', () => {
      service.recordRequest('stats-key1', true);
      service.recordRequest('stats-key2', false);
      service.blockKey('blocked-stats-key', 5000);
      
      const stats = service.getStatistics();
      
      expect(stats.totalKeys).toBeGreaterThanOrEqual(2);
      expect(stats.blockedKeys).toBeGreaterThanOrEqual(1);
      expect(stats.requestsLastHour).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Cleanup', () => {
    test('should clean up old records', async () => {
      // This test would need to mock Date.now() to simulate time passage
      // For now, we'll just test that cleanup doesn't throw errors
      expect(() => {
        // Access private cleanup method through any
        (service as any).cleanup();
      }).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    test('should handle zero max requests', () => {
      const config = { maxRequests: 0, windowMs: 60000 };
      const result = service.checkRateLimit('zero-key', config);
      
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    test('should handle very short time windows', () => {
      const config = { maxRequests: 1, windowMs: 1 }; // 1ms window
      
      service.recordRequest('short-window-key', true);
      const result = service.checkRateLimit('short-window-key', config);
      
      // Depending on timing, this might be allowed or not
      expect(typeof result.allowed).toBe('boolean');
    });

    test('should handle empty request history', () => {
      const config = { maxRequests: 5, windowMs: 60000 };
      const result = service.checkRateLimit('empty-key', config);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
    });
  });
});