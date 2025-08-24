import {
  APIGatewayRequest,
  APIGatewayResponse,
  IntegrationProvider,

} from '../../types/integration';
import { oauth2Service } from './OAuth2Service';

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  maxSize: number;
}

export interface RetryConfig {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelay: number;
}

export class APIGateway {
  private providers: Map<string, IntegrationProvider> = new Map();
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private rateLimiters: Map<string, { requests: number; resetTime: number }> = new Map();
  private requestQueue: Map<string, Promise<any>> = new Map();
  
  private defaultCacheConfig: CacheConfig = {
    enabled: true,
    ttl: 300, // 5 minutes
    maxSize: 1000,
  };
  
  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    backoffMultiplier: 2,
    initialDelay: 1000,
  };

  /**
   * Register an integration provider
   */
  registerProvider(provider: IntegrationProvider): void {
    this.providers.set(provider.id, provider);
    console.log(`Registered provider: ${provider.name}`);
  }

  /**
   * Make an API request through the gateway
   */
  async makeRequest(
    request: APIGatewayRequest,
    cacheConfig?: Partial<CacheConfig>,
    retryConfig?: Partial<RetryConfig>
  ): Promise<APIGatewayResponse> {
    const provider = this.providers.get(request.providerId);
    if (!provider) {
      throw new Error(`Provider not found: ${request.providerId}`);
    }

    const finalCacheConfig = { ...this.defaultCacheConfig, ...cacheConfig };
    const finalRetryConfig = { ...this.defaultRetryConfig, ...retryConfig };

    // Generate cache key
    const cacheKey = this.generateCacheKey(request);

    // Check cache first (for GET requests)
    if (request.method === 'GET' && finalCacheConfig.enabled) {
      const cachedResponse = this.getCachedResponse(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Check rate limits
    await this.checkRateLimit(provider);

    // Deduplicate identical requests
    const requestKey = `${request.providerId}-${request.method}-${request.endpoint}`;
    if (this.requestQueue.has(requestKey)) {
      return await this.requestQueue.get(requestKey)!;
    }

    // Create the request promise
    const requestPromise = this.executeRequest(request, provider, finalRetryConfig);
    this.requestQueue.set(requestKey, requestPromise);

    try {
      const response = await requestPromise;

      // Cache successful GET responses
      if (request.method === 'GET' && finalCacheConfig.enabled && response.status < 400) {
        this.cacheResponse(cacheKey, response, finalCacheConfig.ttl);
      }

      return response;
    } finally {
      this.requestQueue.delete(requestKey);
    }
  }

  /**
   * Execute the actual HTTP request
   */
  private async executeRequest(
    request: APIGatewayRequest,
    provider: IntegrationProvider,
    retryConfig: RetryConfig
  ): Promise<APIGatewayResponse> {
    const endpoint = provider.endpoints.find(ep => ep.name === request.endpoint);
    if (!endpoint) {
      throw new Error(`Endpoint not found: ${request.endpoint} for provider ${provider.id}`);
    }

    let lastError: Error | null = null;
    let delay = retryConfig.initialDelay;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        const response = await this.performHttpRequest(request, provider, endpoint);
        return response;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on client errors (4xx)
        if (error instanceof Error && error.message.includes('4')) {
          throw error;
        }

        // Wait before retrying (except on last attempt)
        if (attempt < retryConfig.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= retryConfig.backoffMultiplier;
        }
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  /**
   * Perform the actual HTTP request
   */
  private async performHttpRequest(
    request: APIGatewayRequest,
    provider: IntegrationProvider,
    endpoint: any
  ): Promise<APIGatewayResponse> {
    const url = this.buildUrl(endpoint.url, request.params);
    const headers = await this.buildHeaders(request, provider, endpoint);

    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
      signal: request.timeout ? AbortSignal.timeout(request.timeout) : null,
    };

    if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      fetchOptions.body = JSON.stringify(request.body);
    }

    // const startTime = Date.now();
    const response = await fetch(url, fetchOptions);
    // const endTime = Date.now();

    // Update rate limit info
    this.updateRateLimit(provider.id, response.headers);

    let data: any;
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.message || data.error || response.statusText}`);
    }

    return {
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries()),
      timestamp: new Date(),
      cached: false,
      rateLimitRemaining: this.getRateLimitRemaining(provider.id) || 0,
    };
  }

  /**
   * Build request URL with parameters
   */
  private buildUrl(baseUrl: string, params?: Record<string, string>): string {
    if (!params) return baseUrl;

    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    return url.toString();
  }

  /**
   * Build request headers
   */
  private async buildHeaders(
    request: APIGatewayRequest,
    provider: IntegrationProvider,
    endpoint: any
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Neural-Flow/1.0',
      ...endpoint.headers,
      ...request.headers,
    };

    // Add authentication headers
    if (provider.authType === 'oauth2') {
      try {
        const token = await oauth2Service.getValidToken(provider.id);
        headers['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error(`Failed to get OAuth2 token for ${provider.id}:`, error);
        throw new Error(`Authentication failed for provider: ${provider.id}`);
      }
    } else if (provider.authType === 'api-key') {
      // API key authentication would be handled here
      // Implementation depends on where the API key is stored in the config
    }

    return headers;
  }

  /**
   * Check rate limits before making request
   */
  private async checkRateLimit(provider: IntegrationProvider): Promise<void> {
    const rateLimiter = this.rateLimiters.get(provider.id);
    if (!rateLimiter) return;

    const now = Date.now();
    
    // Reset counter if window has passed
    if (now > rateLimiter.resetTime) {
      rateLimiter.requests = 0;
      rateLimiter.resetTime = now + (60 * 1000); // 1 minute window
    }

    // Check if we've exceeded the limit
    const endpoint = provider.endpoints[0]; // Use first endpoint's rate limit as default
    if (endpoint?.rateLimit && rateLimiter.requests >= endpoint.rateLimit.requests) {
      const waitTime = rateLimiter.resetTime - now;
      throw new Error(`Rate limit exceeded for ${provider.id}. Try again in ${Math.ceil(waitTime / 1000)} seconds.`);
    }
  }

  /**
   * Update rate limit counters
   */
  private updateRateLimit(providerId: string, headers: Headers): void {
    const remaining = headers.get('x-ratelimit-remaining') || headers.get('x-rate-limit-remaining');
    const reset = headers.get('x-ratelimit-reset') || headers.get('x-rate-limit-reset');

    if (remaining && reset) {
      const resetTime = parseInt(reset) * 1000; // Convert to milliseconds
      this.rateLimiters.set(providerId, {
        requests: 0, // Will be calculated from remaining
        resetTime,
      });
    } else {
      // Increment our own counter
      const rateLimiter = this.rateLimiters.get(providerId);
      if (rateLimiter) {
        rateLimiter.requests++;
      } else {
        this.rateLimiters.set(providerId, {
          requests: 1,
          resetTime: Date.now() + (60 * 1000),
        });
      }
    }
  }

  /**
   * Get remaining rate limit for a provider
   */
  private getRateLimitRemaining(providerId: string): number | undefined {
    const rateLimiter = this.rateLimiters.get(providerId);
    if (!rateLimiter) return undefined;

    const provider = this.providers.get(providerId);
    const endpoint = provider?.endpoints[0];
    if (!endpoint?.rateLimit) return undefined;

    return Math.max(0, endpoint.rateLimit.requests - rateLimiter.requests);
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: APIGatewayRequest): string {
    const keyParts = [
      request.providerId,
      request.method,
      request.endpoint,
      JSON.stringify(request.params || {}),
      JSON.stringify(request.body || {}),
    ];
    
    return btoa(keyParts.join('|'));
  }

  /**
   * Get cached response if available and not expired
   */
  private getCachedResponse(cacheKey: string): APIGatewayResponse | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.timestamp + (cached.ttl * 1000)) {
      this.cache.delete(cacheKey);
      return null;
    }

    return {
      ...cached.data,
      cached: true,
    };
  }

  /**
   * Cache a response
   */
  private cacheResponse(cacheKey: string, response: APIGatewayResponse, ttl: number): void {
    // Clean up old cache entries if we're at max size
    if (this.cache.size >= this.defaultCacheConfig.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(cacheKey, {
      data: response,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clear cache for a specific provider or all cache
   */
  clearCache(providerId?: string): void {
    if (providerId) {
      // Clear cache entries for specific provider
      for (const [key, _value] of this.cache.entries()) {
        if (key.includes(btoa(providerId))) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number; maxSize: number } {
    // This would track hit/miss rates in a real implementation
    return {
      size: this.cache.size,
      hitRate: 0, // Would be calculated from actual hit/miss tracking
      maxSize: this.defaultCacheConfig.maxSize,
    };
  }

  /**
   * Get provider status
   */
  getProviderStatus(providerId: string): {
    connected: boolean;
    rateLimitRemaining?: number;
    lastRequest?: Date;
  } {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return { connected: false };
    }

    return {
      connected: provider.status === 'connected',
      rateLimitRemaining: this.getRateLimitRemaining(providerId) || 0,
      lastRequest: undefined as Date | undefined, // Would track this in a real implementation
    };
  }

  /**
   * Initialize popular productivity app providers
   */
  initializePopularProviders(): void {
    // Google Workspace
    this.registerProvider({
      id: 'google',
      name: 'Google Workspace',
      type: 'productivity',
      icon: '🔍',
      description: 'Google Drive, Calendar, Gmail integration',
      authType: 'oauth2',
      scopes: ['drive', 'calendar', 'gmail'],
      endpoints: [
        {
          name: 'drive-files',
          url: 'https://www.googleapis.com/drive/v3/files',
          method: 'GET',
          rateLimit: { requests: 1000, window: 100 },
        },
        {
          name: 'calendar-events',
          url: 'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          method: 'GET',
          rateLimit: { requests: 1000, window: 100 },
        },
      ],
      capabilities: [
        {
          type: 'read',
          description: 'Read files and calendar events',
          dataTypes: ['files', 'events'],
          syncDirection: 'inbound',
        },
      ],
      status: 'disconnected',
    });

    // Microsoft 365
    this.registerProvider({
      id: 'microsoft',
      name: 'Microsoft 365',
      type: 'productivity',
      icon: '📊',
      description: 'OneDrive, Outlook, Teams integration',
      authType: 'oauth2',
      scopes: ['files', 'calendar', 'mail'],
      endpoints: [
        {
          name: 'drive-items',
          url: 'https://graph.microsoft.com/v1.0/me/drive/root/children',
          method: 'GET',
          rateLimit: { requests: 10000, window: 600 },
        },
        {
          name: 'calendar-events',
          url: 'https://graph.microsoft.com/v1.0/me/events',
          method: 'GET',
          rateLimit: { requests: 10000, window: 600 },
        },
      ],
      capabilities: [
        {
          type: 'sync',
          description: 'Bidirectional sync with Microsoft services',
          dataTypes: ['files', 'events', 'contacts'],
          syncDirection: 'bidirectional',
        },
      ],
      status: 'disconnected',
    });

    // Slack
    this.registerProvider({
      id: 'slack',
      name: 'Slack',
      type: 'communication',
      icon: '💬',
      description: 'Team communication and file sharing',
      authType: 'oauth2',
      scopes: ['channels:read', 'chat:write', 'files:read'],
      endpoints: [
        {
          name: 'channels-list',
          url: 'https://slack.com/api/conversations.list',
          method: 'GET',
          rateLimit: { requests: 100, window: 60 },
        },
        {
          name: 'messages-history',
          url: 'https://slack.com/api/conversations.history',
          method: 'GET',
          rateLimit: { requests: 100, window: 60 },
        },
      ],
      capabilities: [
        {
          type: 'realtime',
          description: 'Real-time messaging and notifications',
          dataTypes: ['messages', 'files'],
          syncDirection: 'bidirectional',
        },
      ],
      status: 'disconnected',
    });

    // Notion
    this.registerProvider({
      id: 'notion',
      name: 'Notion',
      type: 'productivity',
      icon: '📝',
      description: 'Knowledge management and documentation',
      authType: 'oauth2',
      scopes: ['read', 'update', 'insert'],
      endpoints: [
        {
          name: 'databases',
          url: 'https://api.notion.com/v1/databases',
          method: 'GET',
          headers: { 'Notion-Version': '2022-06-28' },
          rateLimit: { requests: 3, window: 1 },
        },
        {
          name: 'pages',
          url: 'https://api.notion.com/v1/pages',
          method: 'GET',
          headers: { 'Notion-Version': '2022-06-28' },
          rateLimit: { requests: 3, window: 1 },
        },
      ],
      capabilities: [
        {
          type: 'sync',
          description: 'Sync databases and pages',
          dataTypes: ['databases', 'pages', 'blocks'],
          syncDirection: 'bidirectional',
        },
      ],
      status: 'disconnected',
    });

    console.log('Initialized popular productivity app providers');
  }
}

export const apiGateway = new APIGateway();