import { InferenceRequest, InferenceResponse } from './LlamaModelService';

export interface FallbackStrategy {
  name: string;
  priority: number;
  canHandle(request: InferenceRequest): boolean;
  execute(request: InferenceRequest): Promise<InferenceResponse>;
}

export interface FallbackConfig {
  enableCaching: boolean;
  enableHeuristics: boolean;
  enableSimpleNLP: boolean;
  enableTemplateResponses: boolean;
  maxCacheAge: number;
}

export class ModelFallbackStrategies {
  private strategies: FallbackStrategy[] = [];
  private config: FallbackConfig;
  private responseCache = new Map<string, { response: InferenceResponse; timestamp: number }>();

  constructor(config: FallbackConfig) {
    this.config = config;
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    if (this.config.enableCaching) {
      this.strategies.push(new CachedResponseStrategy(this.responseCache, this.config.maxCacheAge));
    }

    if (this.config.enableTemplateResponses) {
      this.strategies.push(new TemplateResponseStrategy());
    }

    if (this.config.enableSimpleNLP) {
      this.strategies.push(new SimpleNLPStrategy());
    }

    if (this.config.enableHeuristics) {
      this.strategies.push(new HeuristicResponseStrategy());
    }

    // Sort strategies by priority (higher priority first)
    this.strategies.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Execute fallback strategies in priority order
   */
  async executeFallback(request: InferenceRequest): Promise<InferenceResponse> {
    for (const strategy of this.strategies) {
      if (strategy.canHandle(request)) {
        try {
          const response = await strategy.execute(request);
          
          // Cache successful responses
          if (this.config.enableCaching && response.confidence > 0.6) {
            this.cacheResponse(request, response);
          }
          
          return response;
        } catch (error) {
          console.warn(`Fallback strategy ${strategy.name} failed:`, error);
          continue;
        }
      }
    }

    // Last resort: generic response
    return this.generateGenericResponse(request);
  }

  private cacheResponse(request: InferenceRequest, response: InferenceResponse): void {
    const cacheKey = this.getCacheKey(request);
    this.responseCache.set(cacheKey, {
      response,
      timestamp: Date.now()
    });
  }

  private getCacheKey(request: InferenceRequest): string {
    return `${request.prompt}_${request.maxTokens}_${request.temperature}`;
  }

  private generateGenericResponse(request: InferenceRequest): InferenceResponse {
    const genericResponses = [
      "I'm currently processing your request. Please try again in a moment.",
      "I understand your request and I'm working on a response.",
      "Let me help you with that. I'm analyzing your request now.",
      "I'm here to assist you. Give me a moment to process your request."
    ];

    const response = genericResponses[Math.floor(Math.random() * genericResponses.length)];
    
    return {
      text: response,
      tokens: response.split(' ').length,
      inferenceTime: 50,
      confidence: 0.3
    };
  }

  /**
   * Add custom fallback strategy
   */
  addStrategy(strategy: FallbackStrategy): void {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get strategy statistics
   */
  getStats(): any {
    return {
      strategiesCount: this.strategies.length,
      cacheSize: this.responseCache.size,
      strategies: this.strategies.map(s => ({
        name: s.name,
        priority: s.priority
      }))
    };
  }
}

/**
 * Cached response strategy - highest priority
 */
class CachedResponseStrategy implements FallbackStrategy {
  name = 'CachedResponse';
  priority = 100;

  constructor(
    private cache: Map<string, { response: InferenceResponse; timestamp: number }>,
    private maxAge: number
  ) {}

  canHandle(request: InferenceRequest): boolean {
    const cacheKey = this.getCacheKey(request);
    const cached = this.cache.get(cacheKey);
    
    if (!cached) return false;
    
    const age = Date.now() - cached.timestamp;
    return age < this.maxAge;
  }

  async execute(request: InferenceRequest): Promise<InferenceResponse> {
    const cacheKey = this.getCacheKey(request);
    const cached = this.cache.get(cacheKey);
    
    if (!cached) {
      throw new Error('No cached response available');
    }
    
    // Return cached response with slightly reduced confidence
    return {
      ...cached.response,
      confidence: cached.response.confidence * 0.9,
      inferenceTime: 10 // Very fast cache retrieval
    };
  }

  private getCacheKey(request: InferenceRequest): string {
    return `${request.prompt}_${request.maxTokens}_${request.temperature}`;
  }
}

/**
 * Template-based response strategy
 */
class TemplateResponseStrategy implements FallbackStrategy {
  name = 'TemplateResponse';
  priority = 80;

  private templates = new Map<RegExp, string[]>([
    [/what is|what are|define/i, [
      "Based on my knowledge, {topic} refers to...",
      "Let me explain {topic} for you...",
      "{topic} is commonly understood as..."
    ]],
    [/how to|how do|how can/i, [
      "Here's how you can approach {task}:",
      "To accomplish {task}, you should:",
      "The best way to {task} is to:"
    ]],
    [/why|explain|reason/i, [
      "The reason for this is...",
      "This happens because...",
      "The explanation is..."
    ]],
    [/create|generate|make/i, [
      "I can help you create that. Here's what I suggest:",
      "Let me generate something for you:",
      "Here's what I can create:"
    ]]
  ]);

  canHandle(request: InferenceRequest): boolean {
    return Array.from(this.templates.keys()).some(pattern => 
      pattern.test(request.prompt)
    );
  }

  async execute(request: InferenceRequest): Promise<InferenceResponse> {
    const prompt = request.prompt.toLowerCase();
    
    for (const [pattern, templates] of this.templates) {
      if (pattern.test(prompt)) {
        const template = templates[Math.floor(Math.random() * templates.length)];
        const response = this.fillTemplate(template, request.prompt);
        
        return {
          text: response,
          tokens: response.split(' ').length,
          inferenceTime: 100,
          confidence: 0.7
        };
      }
    }
    
    throw new Error('No matching template found');
  }

  private fillTemplate(template: string, prompt: string): string {
    // Simple template filling - extract key terms from prompt
    const words = prompt.split(' ').filter(word => word.length > 3);
    const keyTerm = words[Math.floor(Math.random() * words.length)] || 'that';
    
    return template.replace(/{topic}|{task}/g, keyTerm);
  }
}

/**
 * Simple NLP-based strategy
 */
class SimpleNLPStrategy implements FallbackStrategy {
  name = 'SimpleNLP';
  priority = 60;

  private intentPatterns = new Map<string, RegExp[]>([
    ['question', [/\?$/, /what|who|when|where|why|how/i]],
    ['request', [/please|can you|could you|would you/i]],
    ['statement', [/\.$/, /i think|i believe|in my opinion/i]],
    ['greeting', [/hello|hi|hey|good morning|good afternoon/i]]
  ]);

  canHandle(request: InferenceRequest): boolean {
    return request.prompt.length > 5; // Can handle any reasonable prompt
  }

  async execute(request: InferenceRequest): Promise<InferenceResponse> {
    const intent = this.detectIntent(request.prompt);
    const sentiment = this.analyzeSentiment(request.prompt);
    const response = this.generateContextualResponse(request.prompt, intent, sentiment);
    
    return {
      text: response,
      tokens: response.split(' ').length,
      inferenceTime: 200,
      confidence: 0.6
    };
  }

  private detectIntent(text: string): string {
    for (const [intent, patterns] of this.intentPatterns) {
      if (patterns.some(pattern => pattern.test(text))) {
        return intent;
      }
    }
    return 'unknown';
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing', 'frustrating'];
    
    const words = text.toLowerCase().split(' ');
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private generateContextualResponse(text: string, intent: string, sentiment: string): string {
    const responses = {
      question: [
        "That's an interesting question. Based on the context, I would say...",
        "Let me think about that. From what I understand...",
        "Good question! Here's what I can tell you..."
      ],
      request: [
        "I'd be happy to help you with that. Here's what I suggest...",
        "Certainly! Let me assist you with that...",
        "Of course! Here's how I can help..."
      ],
      statement: [
        "I understand your perspective. That's a valid point...",
        "Thank you for sharing that. I can see why you might think...",
        "That's an interesting observation..."
      ],
      greeting: [
        "Hello! How can I assist you today?",
        "Hi there! What can I help you with?",
        "Good to see you! How may I help?"
      ]
    };

    const intentResponses = responses[intent as keyof typeof responses] || responses.statement;
    return intentResponses[Math.floor(Math.random() * intentResponses.length)];
  }
}

/**
 * Heuristic-based strategy - lowest priority
 */
class HeuristicResponseStrategy implements FallbackStrategy {
  name = 'HeuristicResponse';
  priority = 40;

  canHandle(request: InferenceRequest): boolean {
    return true; // Can always provide a heuristic response
  }

  async execute(request: InferenceRequest): Promise<InferenceResponse> {
    const response = this.generateHeuristicResponse(request.prompt);
    
    return {
      text: response,
      tokens: response.split(' ').length,
      inferenceTime: 50,
      confidence: 0.4
    };
  }

  private generateHeuristicResponse(prompt: string): string {
    const promptLength = prompt.length;
    const wordCount = prompt.split(' ').length;
    
    if (promptLength < 20) {
      return "I'd be happy to help! Could you provide a bit more detail about what you're looking for?";
    }
    
    if (wordCount > 50) {
      return "I see you have a detailed request. Let me break this down and provide a comprehensive response...";
    }
    
    if (prompt.includes('?')) {
      return "That's a great question. Based on the information provided, here's what I can tell you...";
    }
    
    return "I understand what you're asking about. Let me provide some insights on this topic...";
  }
}