/**
 * Style analysis service for learning and mimicking user writing patterns
 */

import {
  WritingStyle,
  WritingTone,
  FormalityLevel,
  VocabularyLevel,
  StructurePreference,
  VoiceType
} from './types';

export interface StyleAnalysisResult {
  detectedStyle: WritingStyle;
  confidence: number;
  characteristics: StyleCharacteristic[];
  recommendations: string[];
}

export interface StyleCharacteristic {
  feature: string;
  value: number;
  description: string;
}

export interface TextSample {
  content: string;
  metadata?: {
    author?: string;
    date?: Date;
    type?: string;
  };
}

export class StyleAnalysisService {
  private userStyleProfiles: Map<string, WritingStyle> = new Map();

  /**
   * Analyze writing style from text samples
   */
  analyzeStyle(samples: TextSample[]): StyleAnalysisResult {
    if (samples.length === 0) {
      throw new Error('No text samples provided for style analysis');
    }

    const combinedText = samples.map(sample => sample.content).join(' ');
    
    const tone = this.analyzeTone(combinedText);
    const formality = this.analyzeFormalityLevel(combinedText);
    const vocabulary = this.analyzeVocabularyLevel(combinedText);
    const structure = this.analyzeStructurePreference(samples);
    const voice = this.analyzeVoiceType(combinedText);

    const detectedStyle: WritingStyle = {
      tone,
      formality,
      vocabulary,
      structure,
      voice
    };

    const characteristics = this.extractCharacteristics(combinedText);
    const confidence = this.calculateStyleConfidence(characteristics);
    const recommendations = this.generateStyleRecommendations(detectedStyle, characteristics);

    return {
      detectedStyle,
      confidence,
      characteristics,
      recommendations
    };
  }

  /**
   * Learn and store user's writing style
   */
  learnUserStyle(userId: string, samples: TextSample[]): WritingStyle {
    const analysisResult = this.analyzeStyle(samples);
    this.userStyleProfiles.set(userId, analysisResult.detectedStyle);
    return analysisResult.detectedStyle;
  }

  /**
   * Get stored user style profile
   */
  getUserStyle(userId: string): WritingStyle | null {
    return this.userStyleProfiles.get(userId) || null;
  }

  /**
   * Update user style profile with new samples
   */
  updateUserStyle(userId: string, newSamples: TextSample[]): WritingStyle {
    const existingStyle = this.getUserStyle(userId);
    const newStyleAnalysis = this.analyzeStyle(newSamples);
    
    if (existingStyle) {
      // Blend existing style with new analysis
      const blendedStyle = this.blendStyles(existingStyle, newStyleAnalysis.detectedStyle);
      this.userStyleProfiles.set(userId, blendedStyle);
      return blendedStyle;
    } else {
      return this.learnUserStyle(userId, newSamples);
    }
  }

  private analyzeTone(text: string): WritingTone {
    const toneIndicators = {
      [WritingTone.PROFESSIONAL]: [
        'furthermore', 'therefore', 'consequently', 'accordingly', 'regarding',
        'pursuant', 'respective', 'aforementioned', 'implementation', 'optimization'
      ],
      [WritingTone.CASUAL]: [
        'hey', 'yeah', 'cool', 'awesome', 'stuff', 'things', 'kinda', 'sorta',
        'gonna', 'wanna', 'pretty much', 'no big deal'
      ],
      [WritingTone.FRIENDLY]: [
        'thanks', 'please', 'appreciate', 'wonderful', 'great', 'fantastic',
        'hope', 'glad', 'happy', 'excited', 'looking forward'
      ],
      [WritingTone.AUTHORITATIVE]: [
        'must', 'should', 'required', 'essential', 'critical', 'important',
        'necessary', 'recommend', 'advise', 'suggest', 'proven', 'established'
      ],
      [WritingTone.PERSUASIVE]: [
        'imagine', 'consider', 'believe', 'convince', 'opportunity', 'benefit',
        'advantage', 'solution', 'results', 'success', 'achieve', 'transform'
      ],
      [WritingTone.TECHNICAL]: [
        'algorithm', 'implementation', 'configuration', 'parameter', 'function',
        'variable', 'method', 'class', 'interface', 'protocol', 'specification'
      ]
    };

    const lowerText = text.toLowerCase();
    const toneScores: Record<WritingTone, number> = {} as Record<WritingTone, number>;

    // Initialize scores
    Object.values(WritingTone).forEach(tone => {
      toneScores[tone] = 0;
    });

    // Count tone indicators
    Object.entries(toneIndicators).forEach(([tone, indicators]) => {
      indicators.forEach(indicator => {
        const matches = (lowerText.match(new RegExp(`\\b${indicator}\\b`, 'g')) || []).length;
        toneScores[tone as WritingTone] += matches;
      });
    });

    // Find dominant tone
    const dominantTone = Object.entries(toneScores).reduce((a, b) => 
      toneScores[a[0] as WritingTone] > toneScores[b[0] as WritingTone] ? a : b
    )[0] as WritingTone;

    return dominantTone || WritingTone.INFORMATIVE;
  }

  private analyzeFormalityLevel(text: string): FormalityLevel {
    const formalityIndicators = {
      formal: [
        'therefore', 'furthermore', 'consequently', 'nevertheless', 'moreover',
        'however', 'accordingly', 'subsequently', 'notwithstanding'
      ],
      informal: [
        'gonna', 'wanna', 'kinda', 'sorta', 'yeah', 'nope', 'ok', 'cool',
        'awesome', 'stuff', 'things', 'pretty much'
      ]
    };

    const lowerText = text.toLowerCase();
    let formalScore = 0;
    let informalScore = 0;

    formalityIndicators.formal.forEach(indicator => {
      formalScore += (lowerText.match(new RegExp(`\\b${indicator}\\b`, 'g')) || []).length;
    });

    formalityIndicators.informal.forEach(indicator => {
      informalScore += (lowerText.match(new RegExp(`\\b${indicator}\\b`, 'g')) || []).length;
    });

    // Check for contractions (informal indicator)
    const contractions = text.match(/\b\w+'\w+\b/g) || [];
    informalScore += contractions.length;

    // Check sentence length (longer sentences tend to be more formal)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;

    if (avgSentenceLength > 20) formalScore += 2;
    if (avgSentenceLength < 10) informalScore += 2;

    const ratio = formalScore / (formalScore + informalScore + 1);

    if (ratio > 0.7) return FormalityLevel.VERY_FORMAL;
    if (ratio > 0.5) return FormalityLevel.FORMAL;
    if (ratio < 0.3) return FormalityLevel.INFORMAL;
    if (ratio < 0.1) return FormalityLevel.VERY_INFORMAL;
    return FormalityLevel.NEUTRAL;
  }

  private analyzeVocabularyLevel(text: string): VocabularyLevel {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const uniqueWords = new Set(words);
    const vocabularyDiversity = uniqueWords.size / words.length;

    // Complex words (3+ syllables)
    const complexWords = words.filter(word => this.countSyllables(word) >= 3);
    const complexWordRatio = complexWords.length / words.length;

    // Average word length
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;

    // Technical terms and jargon
    const technicalTerms = words.filter(word => 
      word.length > 8 || 
      /^(implementation|configuration|optimization|specification|architecture)/.test(word)
    );
    const technicalRatio = technicalTerms.length / words.length;

    let score = 0;
    if (vocabularyDiversity > 0.7) score += 2;
    if (complexWordRatio > 0.2) score += 2;
    if (avgWordLength > 6) score += 1;
    if (technicalRatio > 0.1) score += 2;

    if (score >= 6) return VocabularyLevel.EXPERT;
    if (score >= 4) return VocabularyLevel.ADVANCED;
    if (score >= 2) return VocabularyLevel.INTERMEDIATE;
    return VocabularyLevel.SIMPLE;
  }

  private analyzeStructurePreference(samples: TextSample[]): StructurePreference {
    const combinedText = samples.map(s => s.content).join(' ');
    
    // Check for hierarchical structure (headings, bullet points)
    const hierarchicalIndicators = /^(#|##|###|\*|\-|\d+\.)/gm;
    const hierarchicalMatches = (combinedText.match(hierarchicalIndicators) || []).length;

    // Check for narrative structure (story elements)
    const narrativeIndicators = ['first', 'then', 'next', 'finally', 'meanwhile', 'suddenly'];
    const narrativeScore = narrativeIndicators.reduce((score, indicator) => {
      return score + (combinedText.toLowerCase().match(new RegExp(`\\b${indicator}\\b`, 'g')) || []).length;
    }, 0);

    // Check for analytical structure (logical connectors)
    const analyticalIndicators = ['because', 'therefore', 'however', 'furthermore', 'consequently'];
    const analyticalScore = analyticalIndicators.reduce((score, indicator) => {
      return score + (combinedText.toLowerCase().match(new RegExp(`\\b${indicator}\\b`, 'g')) || []).length;
    }, 0);

    if (hierarchicalMatches > 3) return StructurePreference.HIERARCHICAL;
    if (narrativeScore > analyticalScore) return StructurePreference.NARRATIVE;
    if (analyticalScore > 2) return StructurePreference.ANALYTICAL;
    return StructurePreference.LINEAR;
  }

  private analyzeVoiceType(text: string): VoiceType {
    const firstPersonIndicators = ['i', 'me', 'my', 'mine', 'myself', 'we', 'us', 'our', 'ours'];
    const secondPersonIndicators = ['you', 'your', 'yours', 'yourself'];
    const passiveIndicators = ['was', 'were', 'been', 'being', 'is', 'are', 'am'];

    const lowerText = text.toLowerCase();
    const words = lowerText.match(/\b\w+\b/g) || [];

    const firstPersonCount = firstPersonIndicators.reduce((count, indicator) => {
      return count + (words.filter(word => word === indicator).length);
    }, 0);

    const secondPersonCount = secondPersonIndicators.reduce((count, indicator) => {
      return count + (words.filter(word => word === indicator).length);
    }, 0);

    const passiveCount = passiveIndicators.reduce((count, indicator) => {
      return count + (words.filter(word => word === indicator).length);
    }, 0);

    const total = words.length;
    const firstPersonRatio = firstPersonCount / total;
    const secondPersonRatio = secondPersonCount / total;
    const passiveRatio = passiveCount / total;

    if (firstPersonRatio > 0.02) return VoiceType.FIRST_PERSON;
    if (secondPersonRatio > 0.01) return VoiceType.SECOND_PERSON;
    if (passiveRatio > 0.05) return VoiceType.PASSIVE;
    return VoiceType.THIRD_PERSON;
  }

  private extractCharacteristics(text: string): StyleCharacteristic[] {
    const words = text.match(/\b\w+\b/g) || [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    return [
      {
        feature: 'Average Sentence Length',
        value: sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length,
        description: 'Average number of words per sentence'
      },
      {
        feature: 'Vocabulary Diversity',
        value: new Set(words.map(w => w.toLowerCase())).size / words.length,
        description: 'Ratio of unique words to total words'
      },
      {
        feature: 'Reading Level',
        value: this.calculateReadingLevel(text),
        description: 'Estimated reading grade level'
      },
      {
        feature: 'Emotional Intensity',
        value: this.calculateEmotionalIntensity(text),
        description: 'Level of emotional language used'
      }
    ];
  }

  private calculateStyleConfidence(characteristics: StyleCharacteristic[]): number {
    // Base confidence on the consistency of characteristics
    const values = characteristics.map(c => c.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    // Lower variance indicates more consistent style (higher confidence)
    return Math.max(0.5, 1 - variance);
  }

  private generateStyleRecommendations(style: WritingStyle, characteristics: StyleCharacteristic[]): string[] {
    const recommendations: string[] = [];

    const avgSentenceLength = characteristics.find(c => c.feature === 'Average Sentence Length')?.value || 0;
    if (avgSentenceLength > 25) {
      recommendations.push('Consider using shorter sentences for better readability');
    }
    if (avgSentenceLength < 8) {
      recommendations.push('Consider varying sentence length for better flow');
    }

    const vocabularyDiversity = characteristics.find(c => c.feature === 'Vocabulary Diversity')?.value || 0;
    if (vocabularyDiversity < 0.4) {
      recommendations.push('Try using more varied vocabulary to enhance engagement');
    }

    if (style.formality === FormalityLevel.VERY_FORMAL) {
      recommendations.push('Consider using more conversational language for broader appeal');
    }

    return recommendations;
  }

  private blendStyles(existing: WritingStyle, newStyle: WritingStyle): WritingStyle {
    // Simple blending strategy - could be made more sophisticated
    return {
      tone: newStyle.tone, // Use new tone
      formality: existing.formality, // Keep existing formality
      vocabulary: newStyle.vocabulary, // Use new vocabulary level
      structure: existing.structure, // Keep existing structure
      voice: existing.voice // Keep existing voice
    };
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

  private calculateReadingLevel(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.match(/\b\w+\b/g) || [];
    const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);

    if (sentences.length === 0 || words.length === 0) return 0;

    // Flesch-Kincaid Grade Level
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    return 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;
  }

  private calculateEmotionalIntensity(text: string): number {
    const emotionalWords = [
      'amazing', 'terrible', 'fantastic', 'awful', 'incredible', 'horrible',
      'wonderful', 'devastating', 'brilliant', 'shocking', 'outstanding', 'disgusting'
    ];
    
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const emotionalCount = emotionalWords.reduce((count, emotional) => {
      return count + words.filter(word => word.includes(emotional)).length;
    }, 0);
    
    return emotionalCount / words.length;
  }
}