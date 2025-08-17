/**
 * Content enhancement and optimization service
 */

import {
  ContentEnhancementRequest,
  ContentEnhancementResponse,
  ContentImprovement,
  EnhancementType,
  ImprovementType,
  WritingTone
} from './types';

export class ContentEnhancementService {
  private grammarRules: GrammarRule[] = [];
  private styleRules: StyleRule[] = [];
  private clarityRules: ClarityRule[] = [];

  constructor() {
    this.initializeRules();
  }

  /**
   * Enhance content based on specified enhancement types
   */
  async enhanceContent(request: ContentEnhancementRequest): Promise<ContentEnhancementResponse> {
    let enhancedContent = request.originalContent;
    const improvements: ContentImprovement[] = [];

    for (const enhancementType of request.enhancementType) {
      const result = await this.applyEnhancement(
        enhancedContent,
        enhancementType,
        request.targetAudience,
        request.tone
      );
      
      enhancedContent = result.content;
      improvements.push(...result.improvements);
    }

    const qualityScore = this.calculateQualityScore(enhancedContent, request.originalContent);

    return {
      enhancedContent,
      improvements,
      qualityScore
    };
  }

  private async applyEnhancement(
    content: string,
    type: EnhancementType,
    targetAudience?: string,
    tone?: WritingTone
  ): Promise<{ content: string; improvements: ContentImprovement[] }> {
    switch (type) {
      case EnhancementType.GRAMMAR:
        return this.enhanceGrammar(content);
      case EnhancementType.STYLE:
        return this.enhanceStyle(content, tone);
      case EnhancementType.CLARITY:
        return this.enhanceClarity(content);
      case EnhancementType.CONCISENESS:
        return this.enhanceConciseness(content);
      case EnhancementType.ENGAGEMENT:
        return this.enhanceEngagement(content, targetAudience);
      case EnhancementType.SEO:
        return this.enhanceSEO(content);
      case EnhancementType.ACCESSIBILITY:
        return this.enhanceAccessibility(content);
      default:
        return { content, improvements: [] };
    }
  }

  private enhanceGrammar(content: string): { content: string; improvements: ContentImprovement[] } {
    let enhancedContent = content;
    const improvements: ContentImprovement[] = [];

    for (const rule of this.grammarRules) {
      const matches = content.match(rule.pattern);
      if (matches) {
        matches.forEach(match => {
          const improved = rule.fix(match);
          if (improved !== match) {
            enhancedContent = enhancedContent.replace(match, improved);
            improvements.push({
              type: ImprovementType.GRAMMAR_FIX,
              description: rule.description,
              originalText: match,
              improvedText: improved,
              confidence: rule.confidence
            });
          }
        });
      }
    }

    return { content: enhancedContent, improvements };
  }

  private enhanceStyle(content: string, tone?: WritingTone): { content: string; improvements: ContentImprovement[] } {
    let enhancedContent = content;
    const improvements: ContentImprovement[] = [];

    // Apply tone-specific style improvements
    if (tone) {
      const toneRules = this.styleRules.filter(rule => rule.applicableTones.includes(tone));
      
      for (const rule of toneRules) {
        const matches = content.match(rule.pattern);
        if (matches) {
          matches.forEach(match => {
            const improved = rule.improve(match, tone);
            if (improved !== match) {
              enhancedContent = enhancedContent.replace(match, improved);
              improvements.push({
                type: ImprovementType.STYLE_IMPROVEMENT,
                description: rule.description,
                originalText: match,
                improvedText: improved,
                confidence: rule.confidence
              });
            }
          });
        }
      }
    }

    // Apply general style improvements
    const generalRules = this.styleRules.filter(rule => rule.applicableTones.length === 0);
    for (const rule of generalRules) {
      const matches = content.match(rule.pattern);
      if (matches) {
        matches.forEach(match => {
          const improved = rule.improve(match);
          if (improved !== match) {
            enhancedContent = enhancedContent.replace(match, improved);
            improvements.push({
              type: ImprovementType.STYLE_IMPROVEMENT,
              description: rule.description,
              originalText: match,
              improvedText: improved,
              confidence: rule.confidence
            });
          }
        });
      }
    }

    return { content: enhancedContent, improvements };
  }

  private enhanceClarity(content: string): { content: string; improvements: ContentImprovement[] } {
    let enhancedContent = content;
    const improvements: ContentImprovement[] = [];

    for (const rule of this.clarityRules) {
      const matches = content.match(rule.pattern);
      if (matches) {
        matches.forEach(match => {
          const improved = rule.clarify(match);
          if (improved !== match) {
            enhancedContent = enhancedContent.replace(match, improved);
            improvements.push({
              type: ImprovementType.CLARITY_ENHANCEMENT,
              description: rule.description,
              originalText: match,
              improvedText: improved,
              confidence: rule.confidence
            });
          }
        });
      }
    }

    return { content: enhancedContent, improvements };
  }

  private enhanceConciseness(content: string): { content: string; improvements: ContentImprovement[] } {
    let enhancedContent = content;
    const improvements: ContentImprovement[] = [];

    // Remove redundant phrases
    const redundantPhrases = [
      { pattern: /\bin order to\b/gi, replacement: 'to' },
      { pattern: /\bdue to the fact that\b/gi, replacement: 'because' },
      { pattern: /\bat this point in time\b/gi, replacement: 'now' },
      { pattern: /\bfor the purpose of\b/gi, replacement: 'to' },
      { pattern: /\bin the event that\b/gi, replacement: 'if' },
      { pattern: /\bwith regard to\b/gi, replacement: 'about' },
      { pattern: /\bin spite of the fact that\b/gi, replacement: 'although' }
    ];

    redundantPhrases.forEach(({ pattern, replacement }) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          enhancedContent = enhancedContent.replace(pattern, replacement);
          improvements.push({
            type: ImprovementType.WORD_CHOICE,
            description: 'Replaced wordy phrase with concise alternative',
            originalText: match,
            improvedText: replacement,
            confidence: 0.9
          });
        });
      }
    });

    // Remove filler words
    const fillerWords = /\b(really|very|quite|rather|somewhat|fairly|pretty much|kind of|sort of)\s+/gi;
    const fillerMatches = content.match(fillerWords);
    if (fillerMatches) {
      fillerMatches.forEach(match => {
        enhancedContent = enhancedContent.replace(match, '');
        improvements.push({
          type: ImprovementType.WORD_CHOICE,
          description: 'Removed unnecessary filler word',
          originalText: match,
          improvedText: '',
          confidence: 0.8
        });
      });
    }

    return { content: enhancedContent, improvements };
  }

  private enhanceEngagement(content: string, _targetAudience?: string): { content: string; improvements: ContentImprovement[] } {
    let enhancedContent = content;
    const improvements: ContentImprovement[] = [];

    // Add engaging transitions
    const sentences = enhancedContent.split(/(?<=[.!?])\s+/);
    const engagingTransitions = [
      'Here\'s the thing:',
      'But wait, there\'s more:',
      'Now, here\'s where it gets interesting:',
      'The bottom line?',
      'What does this mean for you?'
    ];

    // Add transitions to longer paragraphs
    if (sentences.length > 5) {
      const midPoint = Math.floor(sentences.length / 2);
      const transition = engagingTransitions[Math.floor(Math.random() * engagingTransitions.length)];
      if (transition) {
        sentences.splice(midPoint, 0, transition);
      }
      
      const newContent = sentences.join(' ');
      if (newContent !== enhancedContent) {
        improvements.push({
          type: ImprovementType.STRUCTURE_OPTIMIZATION,
          description: 'Added engaging transition to improve flow',
          originalText: enhancedContent,
          improvedText: newContent,
          confidence: 0.7
        });
        enhancedContent = newContent;
      }
    }

    // Convert passive voice to active voice for engagement
    const passivePattern = /(\w+)\s+(was|were)\s+(\w+ed)\s+by\s+(\w+)/gi;
    const matches = [...content.matchAll(passivePattern)];
    
    matches.forEach(match => {
      const fullMatch = match[0];
      const subject = match[1];
      const pastParticiple = match[3];
      const agent = match[4];
      
      // Simple conversion: "The report was written by the team" -> "The team wrote the report"
      const improved = `${agent} ${pastParticiple?.replace(/ed$/, '') || pastParticiple} ${subject}`;
      
      enhancedContent = enhancedContent.replace(fullMatch, improved);
      improvements.push({
        type: ImprovementType.TONE_ADJUSTMENT,
        description: 'Converted passive voice to active voice for better engagement',
        originalText: fullMatch,
        improvedText: improved,
        confidence: 0.8
      });
    });

    return { content: enhancedContent, improvements };
  }

  private enhanceSEO(content: string): { content: string; improvements: ContentImprovement[] } {
    let enhancedContent = content;
    const improvements: ContentImprovement[] = [];

    // Add semantic HTML structure suggestions
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length > 3 && !content.includes('<h')) {
      // Suggest adding headings
      const firstSentence = sentences[0]?.trim();
      if (firstSentence.length < 100) {
        const withHeading = `<h2>${firstSentence}</h2>\n\n${sentences.slice(1).join('. ')}.`;
        improvements.push({
          type: ImprovementType.STRUCTURE_OPTIMIZATION,
          description: 'Added heading structure for better SEO',
          originalText: content,
          improvedText: withHeading,
          confidence: 0.6
        });
      }
    }

    return { content: enhancedContent, improvements };
  }

  private enhanceAccessibility(content: string): { content: string; improvements: ContentImprovement[] } {
    let enhancedContent = content;
    const improvements: ContentImprovement[] = [];

    // Improve readability by breaking up long sentences
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let modified = false;

    const improvedSentences = sentences.map(sentence => {
      const words = sentence.trim().split(/\s+/);
      if (words.length > 25) {
        // Try to split long sentences
        const midPoint = Math.floor(words.length / 2);
        const firstHalf = words.slice(0, midPoint).join(' ');
        const secondHalf = words.slice(midPoint).join(' ');
        modified = true;
        return `${firstHalf}. ${secondHalf}`;
      }
      return sentence;
    });

    if (modified) {
      enhancedContent = improvedSentences.join('. ') + '.';
      improvements.push({
        type: ImprovementType.CLARITY_ENHANCEMENT,
        description: 'Split long sentences for better accessibility',
        originalText: content,
        improvedText: enhancedContent,
        confidence: 0.7
      });
    }

    return { content: enhancedContent, improvements };
  }

  private calculateQualityScore(enhancedContent: string, originalContent: string): number {
    let score = 0.5; // Base score

    // Readability improvement
    const originalReadability = this.calculateReadability(originalContent);
    const enhancedReadability = this.calculateReadability(enhancedContent);
    if (enhancedReadability > originalReadability) score += 0.2;

    // Length optimization (not too short, not too long)
    const wordCount = enhancedContent.split(/\s+/).length;
    if (wordCount >= 50 && wordCount <= 500) score += 0.1;

    // Sentence variety
    const sentences = enhancedContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
    const avgLength = sentenceLengths.reduce((sum, len) => sum + len, 0) / sentenceLengths.length;
    const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
    
    if (variance > 10) score += 0.1; // Good sentence variety

    // Grammar and style
    const grammarErrors = this.countGrammarErrors(enhancedContent);
    if (grammarErrors === 0) score += 0.1;

    return Math.min(1.0, score);
  }

  private calculateReadability(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.match(/\b\w+\b/g) || [];
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = words.reduce((sum, word) => sum + this.countSyllables(word), 0) / words.length;
    
    // Flesch Reading Ease
    return 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
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

  private countGrammarErrors(text: string): number {
    let errors = 0;
    
    // Simple grammar checks
    const commonErrors = [
      /\bthere\s+is\s+\w+\s+that\s+are\b/gi, // Subject-verb disagreement
      /\bits\s+\w+ing\b/gi, // Incorrect "its" usage
      /\byour\s+welcome\b/gi, // Should be "you're welcome"
      /\bshould\s+of\b/gi, // Should be "should have"
    ];

    commonErrors.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) errors += matches.length;
    });

    return errors;
  }

  private initializeRules(): void {
    // Initialize grammar rules
    this.grammarRules = [
      {
        pattern: /\bshould\s+of\b/gi,
        fix: (match: string) => match.replace(/of/gi, 'have'),
        description: 'Corrected "should of" to "should have"',
        confidence: 0.95
      },
      {
        pattern: /\byour\s+welcome\b/gi,
        fix: (match: string) => match.replace(/your/gi, 'you\'re'),
        description: 'Corrected "your welcome" to "you\'re welcome"',
        confidence: 0.95
      },
      {
        pattern: /\bits\s+(\w+ing)\b/gi,
        fix: (match: string) => match.replace(/its/gi, 'it\'s'),
        description: 'Corrected "its" to "it\'s" before gerund',
        confidence: 0.8
      }
    ];

    // Initialize style rules
    this.styleRules = [
      {
        pattern: /\bvery\s+(\w+)\b/gi,
        improve: (match: string, _tone?: WritingTone) => {
          const word = match.replace(/very\s+/gi, '');
          const intensifiers: Record<string, string> = {
            'good': 'excellent',
            'bad': 'terrible',
            'big': 'enormous',
            'small': 'tiny',
            'fast': 'rapid',
            'slow': 'sluggish'
          };
          return intensifiers[word.toLowerCase()] || match;
        },
        description: 'Replaced "very + adjective" with stronger adjective',
        confidence: 0.7,
        applicableTones: []
      }
    ];

    // Initialize clarity rules
    this.clarityRules = [
      {
        pattern: /\bdue\s+to\s+the\s+fact\s+that\b/gi,
        clarify: () => 'because',
        description: 'Simplified wordy phrase',
        confidence: 0.9
      },
      {
        pattern: /\bin\s+order\s+to\b/gi,
        clarify: () => 'to',
        description: 'Simplified wordy phrase',
        confidence: 0.9
      }
    ];
  }
}

// Supporting interfaces
interface GrammarRule {
  pattern: RegExp;
  fix: (match: string) => string;
  description: string;
  confidence: number;
}

interface StyleRule {
  pattern: RegExp;
  improve: (match: string, tone?: WritingTone) => string;
  description: string;
  confidence: number;
  applicableTones: WritingTone[];
}

interface ClarityRule {
  pattern: RegExp;
  clarify: (match: string) => string;
  description: string;
  confidence: number;
}