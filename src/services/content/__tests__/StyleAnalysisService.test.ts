/**
 * Tests for StyleAnalysisService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StyleAnalysisService } from '../StyleAnalysisService';
import { WritingTone, FormalityLevel, VocabularyLevel } from '../types';

describe('StyleAnalysisService', () => {
  let styleAnalyzer: StyleAnalysisService;

  beforeEach(() => {
    styleAnalyzer = new StyleAnalysisService();
  });

  describe('style analysis', () => {
    it('should analyze professional tone', () => {
      const samples = [
        { content: 'Furthermore, the implementation requires careful consideration of various factors. Therefore, we must proceed accordingly with the established protocols.' }
      ];

      const analysis = styleAnalyzer.analyzeStyle(samples);

      expect(analysis.detectedStyle.tone).toBe(WritingTone.PROFESSIONAL);
      expect([FormalityLevel.FORMAL, FormalityLevel.NEUTRAL]).toContain(analysis.detectedStyle.formality);
      expect(analysis.confidence).toBeGreaterThanOrEqual(0.5);
    });

    it('should analyze casual tone', () => {
      const samples = [
        { content: 'Hey there! This is gonna be awesome. I\'m pretty excited about this cool stuff we\'re working on.' }
      ];

      const analysis = styleAnalyzer.analyzeStyle(samples);

      expect(analysis.detectedStyle.tone).toBe(WritingTone.CASUAL);
      expect(analysis.detectedStyle.formality).toBe(FormalityLevel.INFORMAL);
    });

    it('should analyze technical tone', () => {
      const samples = [
        { content: 'The algorithm implementation utilizes advanced optimization techniques with parameter configuration and interface specifications.' }
      ];

      const analysis = styleAnalyzer.analyzeStyle(samples);

      expect(analysis.detectedStyle.tone).toBe(WritingTone.TECHNICAL);
      expect([VocabularyLevel.ADVANCED, VocabularyLevel.EXPERT]).toContain(analysis.detectedStyle.vocabulary);
    });

    it('should detect vocabulary level', () => {
      const simpleSamples = [
        { content: 'This is a simple text with easy words and short sentences.' }
      ];

      const complexSamples = [
        { content: 'The implementation necessitates comprehensive optimization utilizing sophisticated algorithmic methodologies and architectural considerations.' }
      ];

      const simpleAnalysis = styleAnalyzer.analyzeStyle(simpleSamples);
      const complexAnalysis = styleAnalyzer.analyzeStyle(complexSamples);

      expect([VocabularyLevel.SIMPLE, VocabularyLevel.INTERMEDIATE]).toContain(simpleAnalysis.detectedStyle.vocabulary);
      expect(complexAnalysis.detectedStyle.vocabulary).toBe(VocabularyLevel.EXPERT);
    });

    it('should provide style characteristics', () => {
      const samples = [
        { content: 'This is a test document with multiple sentences. Each sentence has different lengths and complexity levels.' }
      ];

      const analysis = styleAnalyzer.analyzeStyle(samples);

      expect(analysis.characteristics).toBeDefined();
      expect(analysis.characteristics.length).toBeGreaterThan(0);
      
      const avgSentenceLength = analysis.characteristics.find(c => c.feature === 'Average Sentence Length');
      expect(avgSentenceLength).toBeDefined();
      expect(avgSentenceLength!.value).toBeGreaterThan(0);
    });

    it('should provide recommendations', () => {
      const samples = [
        { content: 'This is a very long sentence that goes on and on without any breaks and could potentially be difficult for readers to follow because it contains too many ideas in a single sentence structure.' }
      ];

      const analysis = styleAnalyzer.analyzeStyle(samples);

      expect(analysis.recommendations).toBeDefined();
      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(analysis.recommendations[0]).toContain('shorter sentences');
    });

    it('should handle empty samples gracefully', () => {
      expect(() => styleAnalyzer.analyzeStyle([])).toThrow('No text samples provided');
    });
  });

  describe('user style management', () => {
    it('should learn and store user style', () => {
      const userId = 'test-user';
      const samples = [
        { content: 'This is a professional document with formal language.' },
        { content: 'Furthermore, the analysis demonstrates significant improvements.' }
      ];

      const learnedStyle = styleAnalyzer.learnUserStyle(userId, samples);
      
      expect(learnedStyle).toBeDefined();
      expect(learnedStyle.tone).toBe(WritingTone.PROFESSIONAL);
      
      const retrievedStyle = styleAnalyzer.getUserStyle(userId);
      expect(retrievedStyle).toEqual(learnedStyle);
    });

    it('should return null for unknown user', () => {
      const style = styleAnalyzer.getUserStyle('unknown-user');
      expect(style).toBeNull();
    });

    it('should update existing user style', () => {
      const userId = 'test-user';
      const initialSamples = [
        { content: 'This is a formal business communication with professional tone.' }
      ];
      const newSamples = [
        { content: 'Hey! This is more casual and friendly now.' }
      ];

      const initialStyle = styleAnalyzer.learnUserStyle(userId, initialSamples);
      const updatedStyle = styleAnalyzer.updateUserStyle(userId, newSamples);

      expect(updatedStyle).toBeDefined();
      expect(updatedStyle).not.toEqual(initialStyle);
    });

    it('should create new style for user without existing style', () => {
      const userId = 'new-user';
      const samples = [
        { content: 'This is a new user\'s writing sample.' }
      ];

      const style = styleAnalyzer.updateUserStyle(userId, samples);
      
      expect(style).toBeDefined();
      expect(styleAnalyzer.getUserStyle(userId)).toEqual(style);
    });
  });

  describe('tone detection', () => {
    it('should detect authoritative tone', () => {
      const samples = [
        { content: 'You must follow these essential guidelines. It is critical that you implement these required changes immediately.' }
      ];

      const analysis = styleAnalyzer.analyzeStyle(samples);
      expect(analysis.detectedStyle.tone).toBe(WritingTone.AUTHORITATIVE);
    });

    it('should detect friendly tone', () => {
      const samples = [
        { content: 'Thanks for your wonderful contribution! I really appreciate your great work and I\'m excited to see the fantastic results.' }
      ];

      const analysis = styleAnalyzer.analyzeStyle(samples);
      expect(analysis.detectedStyle.tone).toBe(WritingTone.FRIENDLY);
    });

    it('should detect persuasive tone', () => {
      const samples = [
        { content: 'Imagine the incredible opportunities this solution provides. Consider the amazing benefits and transformative results you can achieve.' }
      ];

      const analysis = styleAnalyzer.analyzeStyle(samples);
      expect(analysis.detectedStyle.tone).toBe(WritingTone.PERSUASIVE);
    });
  });

  describe('formality detection', () => {
    it('should detect very formal language', () => {
      const samples = [
        { content: 'Notwithstanding the aforementioned considerations, we must nevertheless proceed accordingly with the established protocols and procedures.' }
      ];

      const analysis = styleAnalyzer.analyzeStyle(samples);
      expect(analysis.detectedStyle.formality).toBe(FormalityLevel.VERY_FORMAL);
    });

    it('should detect informal language', () => {
      const samples = [
        { content: 'I\'m gonna check this out. It\'s pretty cool stuff and I think you\'ll like it too.' }
      ];

      const analysis = styleAnalyzer.analyzeStyle(samples);
      expect(analysis.detectedStyle.formality).toBe(FormalityLevel.INFORMAL);
    });
  });

  describe('structure preference detection', () => {
    it('should detect hierarchical structure', () => {
      const samples = [
        { content: '# Main Topic\n## Subtopic 1\n* Point A\n* Point B\n## Subtopic 2\n1. First item\n2. Second item' }
      ];

      const analysis = styleAnalyzer.analyzeStyle(samples);
      expect(analysis.detectedStyle.structure).toBe('hierarchical');
    });

    it('should detect narrative structure', () => {
      const samples = [
        { content: 'First, we started with the basic concept. Then, we developed the initial prototype. Next, we tested various scenarios. Finally, we implemented the complete solution.' }
      ];

      const analysis = styleAnalyzer.analyzeStyle(samples);
      expect(analysis.detectedStyle.structure).toBe('narrative');
    });

    it('should detect analytical structure', () => {
      const samples = [
        { content: 'Because of the initial requirements, we analyzed the problem. Therefore, we concluded that a systematic approach was necessary. However, we also considered alternative solutions. Furthermore, we evaluated the potential consequences.' }
      ];

      const analysis = styleAnalyzer.analyzeStyle(samples);
      expect(analysis.detectedStyle.structure).toBe('analytical');
    });
  });

  describe('voice type detection', () => {
    it('should detect first person voice', () => {
      const samples = [
        { content: 'I believe that we should proceed with our plan. My analysis shows that our approach is correct.' }
      ];

      const analysis = styleAnalyzer.analyzeStyle(samples);
      expect(analysis.detectedStyle.voice).toBe('first_person');
    });

    it('should detect second person voice', () => {
      const samples = [
        { content: 'You should consider your options carefully. Your decision will impact your future success.' }
      ];

      const analysis = styleAnalyzer.analyzeStyle(samples);
      expect(analysis.detectedStyle.voice).toBe('second_person');
    });

    it('should detect passive voice', () => {
      const samples = [
        { content: 'The analysis was conducted by the team. The results were reviewed and the conclusions were drawn.' }
      ];

      const analysis = styleAnalyzer.analyzeStyle(samples);
      expect(analysis.detectedStyle.voice).toBe('passive');
    });
  });
});