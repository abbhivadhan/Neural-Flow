import { pipeline, Pipeline } from '@xenova/transformers';
import { CommandIntent, VoiceCommand, InteractionContext } from '../../types/interaction';

// Removed unused NLPCommand interface

interface NLPEntity {
  type: string;
  value: string;
  confidence: number;
  start: number;
  end: number;
}

interface IntentPattern {
  pattern: RegExp;
  intent: string;
  entityExtractors?: EntityExtractor[];
  confidence: number;
}

interface EntityExtractor {
  type: string;
  pattern: RegExp;
  transform?: (value: string) => any;
}

export class NaturalLanguageProcessor {
  private classifier: Pipeline | null = null;
  private isInitialized = false;
  private intentPatterns: IntentPattern[] = [];
  private contextHistory: string[] = [];
  private maxContextHistory = 10;

  constructor() {
    this.setupIntentPatterns();
    // Initialize NLP asynchronously to avoid blocking
    this.initializeNLP().catch(error => {
      console.warn('NLP initialization failed, using pattern matching only:', error);
    });
  }

  private async initializeNLP(): Promise<void> {
    try {
      // Check if transformers library is available
      if (typeof pipeline === 'undefined') {
        throw new Error('Transformers library not available');
      }
      
      // Initialize a lightweight classification model for intent recognition
      this.classifier = await pipeline(
        'text-classification',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        { revision: 'main' }
      ) as any;
      this.isInitialized = true;
      console.log('NLP pipeline initialized successfully');
    } catch (error) {
      console.warn('Failed to initialize NLP pipeline, falling back to pattern matching:', error);
      this.isInitialized = false;
    }
  }

  private setupIntentPatterns(): void {
    this.intentPatterns = [
      // Task Management
      {
        pattern: /(?:create|add|new)\s+(?:a\s+)?task\s*(?:called\s+)?(.+)?/i,
        intent: 'create_task',
        entityExtractors: [
          { type: 'task_name', pattern: /(?:called\s+|named\s+)?(.+)$/i }
        ],
        confidence: 0.9
      },
      {
        pattern: /(?:complete|finish|done\s+with)\s+(?:task\s+)?(.+)/i,
        intent: 'complete_task',
        entityExtractors: [
          { type: 'task_name', pattern: /(?:task\s+)?(.+)$/i }
        ],
        confidence: 0.85
      },
      {
        pattern: /(?:delete|remove)\s+(?:task\s+)?(.+)/i,
        intent: 'delete_task',
        entityExtractors: [
          { type: 'task_name', pattern: /(?:task\s+)?(.+)$/i }
        ],
        confidence: 0.85
      },
      {
        pattern: /(?:set\s+priority|prioritize)\s+(.+?)\s+(?:to\s+)?(high|medium|low|urgent)/i,
        intent: 'set_priority',
        entityExtractors: [
          { type: 'task_name', pattern: /^(.+?)\s+(?:to\s+)?(?:high|medium|low|urgent)/i },
          { type: 'priority', pattern: /(high|medium|low|urgent)$/i }
        ],
        confidence: 0.8
      },

      // Navigation
      {
        pattern: /(?:open|show|go\s+to|navigate\s+to)\s+(project|file|document|folder)\s*(.+)?/i,
        intent: 'open_item',
        entityExtractors: [
          { type: 'item_type', pattern: /(project|file|document|folder)/i },
          { type: 'item_name', pattern: /(?:project|file|document|folder)\s+(.+)$/i }
        ],
        confidence: 0.85
      },
      {
        pattern: /(?:switch\s+to|change\s+to)\s+(.+?)\s+(?:mode|view)/i,
        intent: 'switch_mode',
        entityExtractors: [
          { type: 'mode', pattern: /^(.+?)\s+(?:mode|view)/i }
        ],
        confidence: 0.8
      },
      {
        pattern: /(?:show|display)\s+(calendar|tasks|projects|dashboard|analytics)/i,
        intent: 'show_view',
        entityExtractors: [
          { type: 'view_type', pattern: /(calendar|tasks|projects|dashboard|analytics)/i }
        ],
        confidence: 0.9
      },

      // Search
      {
        pattern: /(?:search|find|look\s+for)\s+(.+)/i,
        intent: 'search',
        entityExtractors: [
          { type: 'query', pattern: /(?:search|find|look\s+for)\s+(.+)$/i }
        ],
        confidence: 0.85
      },
      {
        pattern: /(?:filter|show\s+only)\s+(.+)/i,
        intent: 'filter',
        entityExtractors: [
          { type: 'filter_criteria', pattern: /(?:filter|show\s+only)\s+(.+)$/i }
        ],
        confidence: 0.8
      },

      // File Operations
      {
        pattern: /(?:save|export)\s+(?:this\s+)?(?:file|document|project)?(?:\s+as\s+(.+))?/i,
        intent: 'save_file',
        entityExtractors: [
          { type: 'filename', pattern: /\s+as\s+(.+)$/i }
        ],
        confidence: 0.85
      },
      {
        pattern: /(?:import|load)\s+(.+)/i,
        intent: 'import_file',
        entityExtractors: [
          { type: 'filename', pattern: /(?:import|load)\s+(.+)$/i }
        ],
        confidence: 0.8
      },

      // AI Features
      {
        pattern: /(?:generate|create)\s+(?:content|text|document)\s+(?:about\s+)?(.+)/i,
        intent: 'generate_content',
        entityExtractors: [
          { type: 'topic', pattern: /(?:about\s+)?(.+)$/i }
        ],
        confidence: 0.8
      },
      {
        pattern: /(?:enhance|improve|optimize)\s+(?:this\s+)?(.+)/i,
        intent: 'enhance_content',
        entityExtractors: [
          { type: 'target', pattern: /(?:this\s+)?(.+)$/i }
        ],
        confidence: 0.75
      },
      {
        pattern: /(?:analyze|review)\s+(.+)/i,
        intent: 'analyze_content',
        entityExtractors: [
          { type: 'target', pattern: /(?:analyze|review)\s+(.+)$/i }
        ],
        confidence: 0.8
      },

      // Time and Scheduling
      {
        pattern: /(?:schedule|plan)\s+(.+?)\s+(?:for\s+)?(.+)/i,
        intent: 'schedule_task',
        entityExtractors: [
          { type: 'task_name', pattern: /^(.+?)\s+(?:for\s+)/i },
          { type: 'time', pattern: /(?:for\s+)(.+)$/i }
        ],
        confidence: 0.8
      },
      {
        pattern: /(?:remind\s+me|set\s+reminder)\s+(?:to\s+)?(.+?)\s+(?:at|in|on)\s+(.+)/i,
        intent: 'set_reminder',
        entityExtractors: [
          { type: 'task', pattern: /(?:to\s+)?(.+?)\s+(?:at|in|on)/i },
          { type: 'time', pattern: /(?:at|in|on)\s+(.+)$/i }
        ],
        confidence: 0.85
      },

      // System Control
      {
        pattern: /(?:help|assistance|what\s+can\s+you\s+do)/i,
        intent: 'help',
        confidence: 0.9
      },
      {
        pattern: /(?:cancel|stop|nevermind|abort)/i,
        intent: 'cancel',
        confidence: 0.95
      },
      {
        pattern: /(?:undo|revert)\s+(?:last\s+)?(?:action|change)?/i,
        intent: 'undo',
        confidence: 0.9
      },
      {
        pattern: /(?:redo|repeat)\s+(?:last\s+)?(?:action|change)?/i,
        intent: 'redo',
        confidence: 0.9
      }
    ];
  }

  public async processCommand(
    text: string, 
    context?: InteractionContext
  ): Promise<CommandIntent | null> {
    const normalizedText = text.trim().toLowerCase();
    
    if (!normalizedText) {
      return null;
    }

    // Add to context history
    this.addToContextHistory(normalizedText);

    // Try pattern matching first (faster and more reliable for specific commands)
    const patternResult = this.matchIntentPatterns(normalizedText);
    if (patternResult) {
      return this.enhanceWithContext(patternResult, context);
    }

    // Fallback to ML-based classification if available
    if (this.isInitialized && this.classifier) {
      try {
        const mlResult = await this.classifyWithML(normalizedText);
        if (mlResult) {
          return this.enhanceWithContext(mlResult, context);
        }
      } catch (error) {
        console.warn('ML classification failed, using pattern matching only:', error);
      }
    }

    // If no specific intent found, try to extract general information
    return this.extractGeneralIntent(normalizedText, context);
  }

  private matchIntentPatterns(text: string): CommandIntent | null {
    for (const pattern of this.intentPatterns) {
      const match = text.match(pattern.pattern);
      if (match) {
        const entities: Record<string, any> = {};
        
        // Extract entities using defined extractors
        if (pattern.entityExtractors) {
          for (const extractor of pattern.entityExtractors) {
            const entityMatch = text.match(extractor.pattern);
            if (entityMatch && entityMatch[1]) {
              let value = entityMatch[1].trim();
              if (extractor.transform) {
                value = extractor.transform(value);
              }
              entities[extractor.type] = value;
            }
          }
        }

        return {
          action: pattern.intent,
          entity: entities['task_name'] || entities['item_name'] || entities['query'] || entities['topic'],
          parameters: {
            ...entities,
            originalText: text,
            matchedPattern: pattern.pattern.source
          },
          confidence: pattern.confidence
        };
      }
    }

    return null;
  }

  private async classifyWithML(text: string): Promise<CommandIntent | null> {
    if (!this.classifier) return null;

    try {
      const result = await this.classifier(text);
      
      // This is a simple example - in a real implementation, you'd use a model
      // specifically trained for intent classification
      if (Array.isArray(result) && result.length > 0) {
        const topResult = result[0];
        
        // Map sentiment to basic intents (this is a simplified example)
        const intentMapping = {
          'POSITIVE': 'positive_action',
          'NEGATIVE': 'negative_action'
        };

        const mappedIntent = intentMapping[topResult.label as keyof typeof intentMapping];
        
        if (mappedIntent && topResult.score > 0.7) {
          return {
            action: mappedIntent,
            parameters: {
              originalText: text,
              mlScore: topResult.score,
              mlLabel: topResult.label
            },
            confidence: topResult.score
          };
        }
      }
    } catch (error) {
      console.warn('ML classification error:', error);
    }

    return null;
  }

  private extractGeneralIntent(text: string, context?: InteractionContext): CommandIntent | null {
    // Extract general intent based on keywords and context
    const keywords = text.split(/\s+/);
    
    // Action keywords
    const actionKeywords = {
      create: ['create', 'add', 'new', 'make'],
      delete: ['delete', 'remove', 'clear'],
      update: ['update', 'change', 'modify', 'edit'],
      show: ['show', 'display', 'view', 'see'],
      search: ['search', 'find', 'look'],
      help: ['help', 'assist', 'support']
    };

    for (const [action, synonyms] of Object.entries(actionKeywords)) {
      if (synonyms.some(synonym => keywords.includes(synonym))) {
        return {
          action: `general_${action}`,
          parameters: {
            originalText: text,
            keywords: keywords,
            context: context?.workContext
          },
          confidence: 0.6
        };
      }
    }

    return null;
  }

  private enhanceWithContext(
    intent: CommandIntent, 
    context?: InteractionContext
  ): CommandIntent {
    if (!context) return intent;

    // Enhance intent with contextual information
    const enhancedParameters = {
      ...intent.parameters,
      workContext: context.workContext,
      currentMode: context.currentMode,
      environmentalFactors: context.environmentalFactors
    };

    // Adjust confidence based on context relevance
    let adjustedConfidence = intent.confidence;
    
    if (context.workContext?.currentTask && intent.action.includes('task')) {
      adjustedConfidence = Math.min(adjustedConfidence + 0.1, 1.0);
    }
    
    if (context.workContext?.currentProject && intent.action.includes('project')) {
      adjustedConfidence = Math.min(adjustedConfidence + 0.1, 1.0);
    }

    return {
      ...intent,
      parameters: enhancedParameters,
      confidence: adjustedConfidence
    };
  }

  private addToContextHistory(text: string): void {
    this.contextHistory.push(text);
    if (this.contextHistory.length > this.maxContextHistory) {
      this.contextHistory.shift();
    }
  }

  public getContextHistory(): string[] {
    return [...this.contextHistory];
  }

  public clearContextHistory(): void {
    this.contextHistory = [];
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  public addCustomPattern(pattern: IntentPattern): void {
    this.intentPatterns.unshift(pattern); // Add to beginning for higher priority
  }

  public removeCustomPattern(intentName: string): void {
    this.intentPatterns = this.intentPatterns.filter(p => p.intent !== intentName);
  }

  public getAvailableIntents(): string[] {
    return [...new Set(this.intentPatterns.map(p => p.intent))];
  }

  public async processVoiceCommand(voiceCommand: VoiceCommand, context?: InteractionContext): Promise<CommandIntent | null> {
    // Combine voice command confidence with NLP processing
    const nlpResult = await this.processCommand(voiceCommand.transcript, context);
    
    if (nlpResult) {
      // Adjust confidence based on voice recognition confidence
      const combinedConfidence = (nlpResult.confidence + voiceCommand.confidence) / 2;
      
      return {
        ...nlpResult,
        confidence: combinedConfidence,
        parameters: {
          ...nlpResult.parameters,
          voiceCommandId: voiceCommand.id,
          voiceConfidence: voiceCommand.confidence,
          language: voiceCommand.language
        }
      };
    }

    return null;
  }
}