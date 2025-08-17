/**
 * Main content service that orchestrates all AI-powered content generation capabilities
 */

import { ContentGenerationService } from './ContentGenerationService';
import { StyleAnalysisService, TextSample } from './StyleAnalysisService';
import { ContentEnhancementService } from './ContentEnhancementService';
import { VisualGenerationService } from './VisualGenerationService';
import {
  ContentGenerationRequest,
  ContentGenerationResponse,
  ContentEnhancementRequest,
  ContentEnhancementResponse,
  VisualGenerationRequest,
  VisualGenerationResponse,
  WritingStyle,
  ContentType,
  WritingTone,

} from './types';

export class ContentService {
  private contentGenerator: ContentGenerationService;
  private styleAnalyzer: StyleAnalysisService;
  private contentEnhancer: ContentEnhancementService;
  private visualGenerator: VisualGenerationService;
  private isInitialized = false;

  constructor() {
    this.contentGenerator = new ContentGenerationService();
    this.styleAnalyzer = new StyleAnalysisService();
    this.contentEnhancer = new ContentEnhancementService();
    this.visualGenerator = new VisualGenerationService();
  }

  /**
   * Initialize all content generation services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.contentGenerator.initialize();
      this.isInitialized = true;
      console.log('Content service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize content service:', error);
      throw error;
    }
  }

  /**
   * Generate content with AI
   */
  async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.contentGenerator.generateContent(request);
  }

  /**
   * Generate content with user's learned style
   */
  async generateContentWithUserStyle(
    userId: string,
    prompt: string,
    contentType: ContentType,
    options?: {
      maxLength?: number;
      temperature?: number;
    }
  ): Promise<ContentGenerationResponse> {
    const userStyle = this.styleAnalyzer.getUserStyle(userId);
    
    const request: ContentGenerationRequest = {
      prompt,
      type: contentType,
      ...(userStyle && { style: userStyle }),
      ...(options?.maxLength && { maxLength: options.maxLength }),
      ...(options?.temperature && { temperature: options.temperature })
    };

    return this.generateContent(request);
  }

  /**
   * Enhance existing content
   */
  async enhanceContent(request: ContentEnhancementRequest): Promise<ContentEnhancementResponse> {
    return this.contentEnhancer.enhanceContent(request);
  }

  /**
   * Analyze and learn user's writing style
   */
  analyzeWritingStyle(samples: TextSample[]) {
    return this.styleAnalyzer.analyzeStyle(samples);
  }

  /**
   * Learn user's writing style from samples
   */
  learnUserStyle(userId: string, samples: TextSample[]): WritingStyle {
    return this.styleAnalyzer.learnUserStyle(userId, samples);
  }

  /**
   * Update user's style profile with new samples
   */
  updateUserStyle(userId: string, newSamples: TextSample[]): WritingStyle {
    return this.styleAnalyzer.updateUserStyle(userId, newSamples);
  }

  /**
   * Get user's learned writing style
   */
  getUserStyle(userId: string): WritingStyle | null {
    return this.styleAnalyzer.getUserStyle(userId);
  }

  /**
   * Generate visual content (charts, diagrams)
   */
  async generateVisual(request: VisualGenerationRequest): Promise<VisualGenerationResponse> {
    return this.visualGenerator.generateVisual(request);
  }

  /**
   * Generate content suggestions based on context
   */
  async generateContentSuggestions(
    context: string,
    contentType: ContentType,
    userId?: string
  ): Promise<string[]> {
    const suggestions: string[] = [];

    try {
      // Generate multiple short content pieces as suggestions
      const basePrompts = this.getBasePrompts(contentType, context);
      
      for (const basePrompt of basePrompts) {
        const userStyle = userId ? this.getUserStyle(userId) : null;
        const request: ContentGenerationRequest = {
          prompt: basePrompt,
          type: contentType,
          maxLength: 50,
          temperature: 0.8,
          ...(userStyle && { style: userStyle })
        };

        const response = await this.generateContent(request);
        if (response.content && response.confidence > 0.6) {
          suggestions.push(response.content.trim());
        }
      }
    } catch (error) {
      console.error('Failed to generate content suggestions:', error);
    }

    return suggestions.slice(0, 5); // Return top 5 suggestions
  }

  /**
   * Generate content outline
   */
  async generateOutline(
    topic: string,
    contentType: ContentType,
    userId?: string
  ): Promise<string[]> {
    const outlinePrompt = this.buildOutlinePrompt(topic, contentType);
    
    const userStyle = userId ? this.getUserStyle(userId) : null;
    const request: ContentGenerationRequest = {
      prompt: outlinePrompt,
      type: contentType,
      maxLength: 200,
      temperature: 0.7,
      ...(userStyle && { style: userStyle })
    };

    try {
      const response = await this.generateContent(request);
      
      // Parse the outline into sections
      const outline = response.content
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim())
        .filter(line => line.length > 0);

      return outline;
    } catch (error) {
      console.error('Failed to generate outline:', error);
      return [];
    }
  }

  /**
   * Auto-complete text based on context
   */
  async autoComplete(
    currentText: string,
    userId?: string,
    maxSuggestions: number = 3
  ): Promise<string[]> {
    const completions: string[] = [];

    try {
      // Generate multiple completion options
      for (let i = 0; i < maxSuggestions; i++) {
        const userStyle = userId ? this.getUserStyle(userId) : null;
        const request: ContentGenerationRequest = {
          prompt: currentText,
          type: ContentType.ARTICLE, // Default type
          maxLength: 30,
          temperature: 0.6 + (i * 0.1), // Vary temperature for diversity
          ...(userStyle && { style: userStyle })
        };

        const response = await this.generateContent(request);
        if (response.content && response.confidence > 0.5) {
          // Extract only the completion part (remove the original prompt)
          const completion = response.content.replace(currentText, '').trim();
          if (completion.length > 0) {
            completions.push(completion);
          }
        }
      }
    } catch (error) {
      console.error('Failed to generate auto-completions:', error);
    }

    return completions;
  }

  /**
   * Generate content variations
   */
  async generateVariations(
    originalContent: string,
    variationType: 'tone' | 'length' | 'style',
    userId?: string
  ): Promise<string[]> {
    const variations: string[] = [];

    try {
      switch (variationType) {
        case 'tone':
          const tones = [WritingTone.PROFESSIONAL, WritingTone.CASUAL, WritingTone.FRIENDLY];
          for (const tone of tones) {
            const userStyle = userId ? this.getUserStyle(userId) : null;
            const request: ContentGenerationRequest = {
              prompt: `Rewrite this in a ${tone} tone: ${originalContent}`,
              type: ContentType.ARTICLE,
              maxLength: originalContent.split(' ').length + 20,
              temperature: 0.7,
              style: { 
                tone, 
                formality: userStyle?.formality || 'neutral' as any,
                vocabulary: userStyle?.vocabulary || 'intermediate' as any,
                structure: userStyle?.structure || 'linear' as any,
                voice: userStyle?.voice || 'third_person' as any
              }
            };
            
            const response = await this.generateContent(request);
            if (response.content) {
              variations.push(response.content);
            }
          }
          break;

        case 'length':
          const lengths = [
            { prompt: 'Make this more concise:', maxLength: Math.floor(originalContent.split(' ').length * 0.7) },
            { prompt: 'Expand on this:', maxLength: Math.floor(originalContent.split(' ').length * 1.5) }
          ];
          
          for (const { prompt, maxLength } of lengths) {
            const userStyle = userId ? this.getUserStyle(userId) : null;
            const request: ContentGenerationRequest = {
              prompt: `${prompt} ${originalContent}`,
              type: ContentType.ARTICLE,
              maxLength,
              temperature: 0.6,
              ...(userStyle && { style: userStyle })
            };
            
            const response = await this.generateContent(request);
            if (response.content) {
              variations.push(response.content);
            }
          }
          break;

        case 'style':
          const stylePrompts = [
            'Make this more formal:',
            'Make this more conversational:',
            'Make this more technical:'
          ];
          
          for (const stylePrompt of stylePrompts) {
            const request: ContentGenerationRequest = {
              prompt: `${stylePrompt} ${originalContent}`,
              type: ContentType.ARTICLE,
              maxLength: originalContent.split(' ').length + 10,
              temperature: 0.7
            };
            
            const response = await this.generateContent(request);
            if (response.content) {
              variations.push(response.content);
            }
          }
          break;
      }
    } catch (error) {
      console.error('Failed to generate variations:', error);
    }

    return variations;
  }

  /**
   * Analyze content quality and provide recommendations
   */
  async analyzeContentQuality(content: string): Promise<{
    score: number;
    recommendations: string[];
    metrics: {
      readability: number;
      engagement: number;
      clarity: number;
      structure: number;
    };
  }> {
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Calculate metrics
    const readability = this.calculateReadabilityScore(content);
    const engagement = this.calculateEngagementScore(content);
    const clarity = this.calculateClarityScore(content);
    const structure = this.calculateStructureScore(content);
    
    const score = (readability + engagement + clarity + structure) / 4;
    
    const recommendations: string[] = [];
    
    if (readability < 0.6) {
      recommendations.push('Consider using shorter sentences and simpler words to improve readability');
    }
    
    if (engagement < 0.6) {
      recommendations.push('Add more engaging elements like questions, examples, or storytelling');
    }
    
    if (clarity < 0.6) {
      recommendations.push('Improve clarity by removing jargon and explaining complex concepts');
    }
    
    if (structure < 0.6) {
      recommendations.push('Improve structure with better transitions and logical flow');
    }
    
    if (words.length < 50) {
      recommendations.push('Consider expanding the content with more details and examples');
    }
    
    if (sentences.length < 3) {
      recommendations.push('Add more sentences to develop your ideas fully');
    }

    return {
      score,
      recommendations,
      metrics: {
        readability,
        engagement,
        clarity,
        structure
      }
    };
  }

  private getBasePrompts(contentType: ContentType, context: string): string[] {
    const basePrompts: string[] = [];
    
    switch (contentType) {
      case ContentType.EMAIL:
        basePrompts.push(
          `Write a professional email about ${context}`,
          `Draft an email regarding ${context}`,
          `Compose an email to discuss ${context}`
        );
        break;
      case ContentType.ARTICLE:
        basePrompts.push(
          `Write an article about ${context}`,
          `Create content explaining ${context}`,
          `Discuss the topic of ${context}`
        );
        break;
      case ContentType.SUMMARY:
        basePrompts.push(
          `Summarize the key points about ${context}`,
          `Provide a brief overview of ${context}`,
          `Create a summary of ${context}`
        );
        break;
      default:
        basePrompts.push(
          `Write about ${context}`,
          `Create content about ${context}`,
          `Discuss ${context}`
        );
    }
    
    return basePrompts;
  }

  private buildOutlinePrompt(topic: string, contentType: ContentType): string {
    switch (contentType) {
      case ContentType.ARTICLE:
        return `Create an outline for an article about ${topic}. Include main sections and key points.`;
      case ContentType.PRESENTATION:
        return `Create an outline for a presentation about ${topic}. Include slide topics and key points.`;
      case ContentType.DOCUMENTATION:
        return `Create an outline for documentation about ${topic}. Include sections and subsections.`;
      default:
        return `Create an outline about ${topic}. Include main sections and key points.`;
    }
  }

  private calculateReadabilityScore(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.match(/\b\w+\b/g) || [];
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = words.reduce((sum, word) => sum + this.countSyllables(word), 0) / words.length;
    
    // Flesch Reading Ease (normalized to 0-1)
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    return Math.max(0, Math.min(1, score / 100));
  }

  private calculateEngagementScore(text: string): number {
    let score = 0.5; // Base score
    
    // Check for engaging elements
    if (text.includes('?')) score += 0.1; // Questions
    if (text.match(/\b(you|your)\b/gi)) score += 0.1; // Direct address
    if (text.match(/\b(example|for instance|imagine)\b/gi)) score += 0.1; // Examples
    if (text.match(/\b(amazing|incredible|fantastic|excellent)\b/gi)) score += 0.1; // Positive words
    
    return Math.min(1, score);
  }

  private calculateClarityScore(text: string): number {
    let score = 0.8; // Base score
    
    // Penalize for unclear elements
    const jargonWords = text.match(/\b\w{12,}\b/g) || []; // Very long words
    if (jargonWords.length > text.split(' ').length * 0.1) score -= 0.2;
    
    // Check for clear structure
    if (text.includes('\n\n') || text.includes('•') || text.includes('-')) score += 0.1;
    
    return Math.max(0, Math.min(1, score));
  }

  private calculateStructureScore(text: string): number {
    let score = 0.5; // Base score
    
    // Check for structural elements
    if (text.match(/^(First|Second|Third|Finally|In conclusion)/gm)) score += 0.2;
    if (text.match(/\b(however|therefore|furthermore|moreover)\b/gi)) score += 0.1;
    if (text.includes('\n')) score += 0.1; // Paragraphs
    
    return Math.min(1, score);
  }

  private countSyllables(word: string): number {
    const vowels = 'aeiouyAEIOUY';
    let count = 0;
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const isVowel = char && vowels.includes(char);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    if (word.endsWith('e') && count > 1) {
      count--;
    }
    
    return Math.max(1, count);
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    await this.contentGenerator.dispose();
    this.isInitialized = false;
  }
}