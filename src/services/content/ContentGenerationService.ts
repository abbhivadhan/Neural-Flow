/**
 * AI-powered content generation service using Transformers.js
 */

import { pipeline } from '@xenova/transformers';
import {
  ContentGenerationRequest,
  ContentGenerationResponse,
  ContentType,
  WritingStyle,
  ContentMetadata,
  WritingTone,
  FormalityLevel
} from './types';

export class ContentGenerationService {
  private textGenerationPipeline: any | null = null;
  private summarizationPipeline: any | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize text generation pipeline with GPT-2 model
      this.textGenerationPipeline = await pipeline(
        'text-generation',
        'Xenova/gpt2',
        { 
          revision: 'main',
          quantized: true // Use quantized model for better performance
        }
      );

      // Initialize summarization pipeline
      this.summarizationPipeline = await pipeline(
        'summarization',
        'Xenova/distilbart-cnn-12-6',
        { 
          revision: 'main',
          quantized: true
        }
      );

      this.isInitialized = true;
      console.log('Content generation service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize content generation service:', error);
      throw new Error('Content generation service initialization failed');
    }
  }

  async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    
    try {
      let generatedText: string;
      
      if (request.type === ContentType.SUMMARY && this.summarizationPipeline) {
        // Use summarization for summary content
        const result = await this.summarizationPipeline(request.prompt, {
          max_length: request.maxLength || 150,
          min_length: 30,
          do_sample: false
        });
        generatedText = Array.isArray(result) ? result[0].summary_text : result.summary_text;
      } else if (this.textGenerationPipeline) {
        // Use text generation for other content types
        const enhancedPrompt = this.enhancePromptWithStyle(request.prompt, request.style, request.type);
        
        const result = await this.textGenerationPipeline(enhancedPrompt, {
          max_new_tokens: request.maxLength || 200,
          temperature: request.temperature || 0.7,
          do_sample: true,
          top_p: 0.9,
          repetition_penalty: 1.1
        });
        
        generatedText = Array.isArray(result) ? result[0].generated_text : result.generated_text;
        
        // Remove the original prompt from the generated text if it's included
        if (generatedText.startsWith(enhancedPrompt)) {
          generatedText = generatedText.replace(enhancedPrompt, '').trim();
        }
        
        // Ensure we have some content
        if (!generatedText) {
          generatedText = 'Generated content based on your prompt.';
        }
      } else {
        throw new Error('Text generation pipeline not available');
      }

      const processingTime = Date.now() - startTime;
      const wordCount = this.countWords(generatedText);
      const readabilityScore = this.calculateReadabilityScore(generatedText);

      const metadata: ContentMetadata = {
        generatedAt: new Date(),
        modelUsed: request.type === ContentType.SUMMARY ? 'distilbart-cnn-12-6' : 'gpt2',
        processingTime,
        wordCount,
        readabilityScore
      };

      // Generate suggestions for improvement
      const suggestions = this.generateSuggestions(generatedText, request.type);

      return {
        content: generatedText,
        confidence: this.calculateConfidence(generatedText, request),
        metadata,
        suggestions
      };
    } catch (error) {
      console.error('Content generation failed:', error);
      throw new Error(`Content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private enhancePromptWithStyle(
    prompt: string, 
    style?: WritingStyle, 
    contentType?: ContentType
  ): string {
    let enhancedPrompt = prompt;

    if (style) {
      // Add style instructions to the prompt
      const styleInstructions = this.buildStyleInstructions(style);
      enhancedPrompt = `${styleInstructions}\n\n${prompt}`;
    }

    if (contentType) {
      // Add content type specific instructions
      const typeInstructions = this.getContentTypeInstructions(contentType);
      enhancedPrompt = `${typeInstructions}\n\n${enhancedPrompt}`;
    }

    return enhancedPrompt;
  }

  private buildStyleInstructions(style: WritingStyle): string {
    const instructions: string[] = [];

    // Tone instructions
    switch (style.tone) {
      case WritingTone.PROFESSIONAL:
        instructions.push('Write in a professional, business-appropriate tone.');
        break;
      case WritingTone.CASUAL:
        instructions.push('Write in a casual, conversational tone.');
        break;
      case WritingTone.FRIENDLY:
        instructions.push('Write in a warm, friendly tone.');
        break;
      case WritingTone.AUTHORITATIVE:
        instructions.push('Write with authority and expertise.');
        break;
      case WritingTone.PERSUASIVE:
        instructions.push('Write persuasively to convince the reader.');
        break;
    }

    // Formality instructions
    switch (style.formality) {
      case FormalityLevel.VERY_FORMAL:
        instructions.push('Use very formal language and structure.');
        break;
      case FormalityLevel.FORMAL:
        instructions.push('Use formal language.');
        break;
      case FormalityLevel.INFORMAL:
        instructions.push('Use informal, relaxed language.');
        break;
    }

    return instructions.join(' ');
  }

  private getContentTypeInstructions(contentType: ContentType): string {
    switch (contentType) {
      case ContentType.ARTICLE:
        return 'Write a well-structured article with clear introduction, body, and conclusion.';
      case ContentType.EMAIL:
        return 'Write a professional email with appropriate greeting and closing.';
      case ContentType.SUMMARY:
        return 'Provide a concise summary of the key points.';
      case ContentType.PRESENTATION:
        return 'Write content suitable for a presentation with clear bullet points.';
      case ContentType.DOCUMENTATION:
        return 'Write clear, technical documentation with step-by-step instructions.';
      case ContentType.MARKETING:
        return 'Write engaging marketing content that captures attention.';
      default:
        return '';
    }
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private calculateReadabilityScore(text: string): number {
    // Simple readability score based on sentence and word length
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = words.reduce((sum, word) => sum + this.countSyllables(word), 0) / words.length;
    
    // Simplified Flesch Reading Ease formula
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    return Math.max(0, Math.min(100, score));
  }

  private countSyllables(word: string): number {
    // Simple syllable counting heuristic
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
    
    // Handle silent 'e'
    if (word.endsWith('e') && count > 1) {
      count--;
    }
    
    return Math.max(1, count);
  }

  private calculateConfidence(text: string, request: ContentGenerationRequest): number {
    // Calculate confidence based on various factors
    let confidence = 0.8; // Base confidence
    
    // Adjust based on text length
    const wordCount = this.countWords(text);
    if (wordCount < 10) confidence -= 0.2;
    if (wordCount > 100) confidence += 0.1;
    
    // Adjust based on readability
    const readability = this.calculateReadabilityScore(text);
    if (readability > 60) confidence += 0.1;
    if (readability < 30) confidence -= 0.1;
    
    // Adjust based on content type match
    if (this.matchesContentType(text, request.type)) {
      confidence += 0.1;
    }
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private matchesContentType(text: string, contentType?: ContentType): boolean {
    if (!contentType) return true;
    
    // Simple heuristics to check if content matches expected type
    switch (contentType) {
      case ContentType.EMAIL:
        return /^(dear|hi|hello|greetings)/i.test(text.trim()) || 
               /(sincerely|regards|best|thanks)/i.test(text.trim());
      case ContentType.SUMMARY:
        return text.length < 500; // Summaries should be concise
      case ContentType.ARTICLE:
        return text.length > 100; // Articles should be substantial
      default:
        return true;
    }
  }

  private generateSuggestions(text: string, contentType?: ContentType): string[] {
    const suggestions: string[] = [];
    
    // Length-based suggestions
    const wordCount = this.countWords(text);
    if (wordCount < 20) {
      suggestions.push('Consider expanding the content with more details or examples.');
    }
    if (wordCount > 300) {
      suggestions.push('Consider breaking this into smaller sections for better readability.');
    }
    
    // Readability suggestions
    const readability = this.calculateReadabilityScore(text);
    if (readability < 50) {
      suggestions.push('Consider using shorter sentences and simpler words to improve readability.');
    }
    
    // Content type specific suggestions
    if (contentType === ContentType.EMAIL && !text.includes('@')) {
      suggestions.push('Consider adding contact information or email addresses if relevant.');
    }
    
    if (contentType === ContentType.ARTICLE && !text.includes('\n')) {
      suggestions.push('Consider adding paragraph breaks to improve structure.');
    }
    
    return suggestions;
  }

  async dispose(): Promise<void> {
    // Clean up resources
    this.textGenerationPipeline = null;
    this.summarizationPipeline = null;
    this.isInitialized = false;
  }
}