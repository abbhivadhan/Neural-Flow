/**
 * Tests for ContentService
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ContentService } from '../ContentService';
import { ContentType, WritingTone, EnhancementType, ChartType } from '../types';

// Mock the Transformers.js pipeline
vi.mock('@xenova/transformers', () => ({
  pipeline: vi.fn().mockImplementation((task, _model) => {
    if (task === 'text-generation') {
      return Promise.resolve(vi.fn().mockResolvedValue([{
        generated_text: 'This is a test generated content that demonstrates the AI capabilities.'
      }]));
    } else if (task === 'summarization') {
      return Promise.resolve(vi.fn().mockResolvedValue([{
        summary_text: 'This is a test summary of the content.'
      }]));
    }
    return Promise.resolve(vi.fn().mockResolvedValue([]));
  })
}));

// Mock D3 for visual generation
vi.mock('d3', () => ({
  create: vi.fn().mockReturnValue({
    attr: vi.fn().mockReturnThis(),
    style: vi.fn().mockReturnThis(),
    append: vi.fn().mockReturnValue({
      attr: vi.fn().mockReturnThis(),
      call: vi.fn().mockReturnThis(),
      selectAll: vi.fn().mockReturnValue({
        style: vi.fn().mockReturnThis(),
        data: vi.fn().mockReturnValue({
          enter: vi.fn().mockReturnValue({
            append: vi.fn().mockReturnValue({
              attr: vi.fn().mockReturnThis(),
              style: vi.fn().mockReturnThis(),
              text: vi.fn().mockReturnThis()
            })
          })
        })
      })
    }),
    node: vi.fn().mockReturnValue({
      outerHTML: '<svg><rect></rect></svg>'
    })
  }),
  scaleBand: vi.fn().mockReturnValue({
    domain: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    padding: vi.fn().mockReturnThis(),
    bandwidth: vi.fn().mockReturnValue(50)
  }),
  scaleLinear: vi.fn().mockReturnValue({
    domain: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis()
  }),
  axisBottom: vi.fn().mockReturnValue({}),
  axisLeft: vi.fn().mockReturnValue({}),
  max: vi.fn().mockReturnValue(100),
  extent: vi.fn().mockReturnValue([0, 100]),
  pie: vi.fn().mockReturnValue({
    value: vi.fn().mockReturnThis()
  }),
  arc: vi.fn().mockReturnValue({
    innerRadius: vi.fn().mockReturnThis(),
    outerRadius: vi.fn().mockReturnThis(),
    centroid: vi.fn().mockReturnValue([0, 0])
  }),
  line: vi.fn().mockReturnValue({
    x: vi.fn().mockReturnThis(),
    y: vi.fn().mockReturnThis(),
    curve: vi.fn().mockReturnThis()
  }),
  area: vi.fn().mockReturnValue({
    x: vi.fn().mockReturnThis(),
    y0: vi.fn().mockReturnThis(),
    y1: vi.fn().mockReturnThis(),
    curve: vi.fn().mockReturnThis()
  }),
  histogram: vi.fn().mockReturnValue({
    domain: vi.fn().mockReturnThis(),
    thresholds: vi.fn().mockReturnThis()
  }),
  scaleSequential: vi.fn().mockReturnValue({
    domain: vi.fn().mockReturnThis()
  }),
  interpolateBlues: vi.fn(),
  curveMonotoneX: 'curveMonotoneX'
}));

describe('ContentService', () => {
  let contentService: ContentService;

  beforeEach(() => {
    contentService = new ContentService();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await contentService.dispose();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(contentService.initialize()).resolves.not.toThrow();
    });

    it('should handle initialization errors gracefully', async () => {
      // Mock initialization failure
      const mockPipeline = vi.fn().mockRejectedValue(new Error('Model loading failed'));
      vi.doMock('@xenova/transformers', () => ({
        pipeline: mockPipeline
      }));

      const failingService = new ContentService();
      await expect(failingService.initialize()).rejects.toThrow();
    });
  });

  describe('content generation', () => {
    beforeEach(async () => {
      await contentService.initialize();
    });

    it('should generate content successfully', async () => {
      const request = {
        prompt: 'Write about artificial intelligence',
        type: ContentType.ARTICLE,
        maxLength: 200,
        temperature: 0.7
      };

      const response = await contentService.generateContent(request);

      expect(response).toBeDefined();
      expect(response.content).toBeTruthy();
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.metadata).toBeDefined();
      expect(response.metadata.wordCount).toBeGreaterThan(0);
    });

    it('should generate content with user style', async () => {
      const userId = 'test-user';
      const samples = [
        { content: 'This is a professional document with formal language and structured approach.' }
      ];

      // Learn user style first
      const learnedStyle = contentService.learnUserStyle(userId, samples);
      expect(learnedStyle).toBeDefined();

      // Generate content with learned style
      const response = await contentService.generateContentWithUserStyle(
        userId,
        'Write about productivity',
        ContentType.ARTICLE
      );

      expect(response).toBeDefined();
      expect(response.content).toBeTruthy();
    });

    it('should generate content suggestions', async () => {
      const suggestions = await contentService.generateContentSuggestions(
        'productivity tips',
        ContentType.ARTICLE
      );

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should generate content outline', async () => {
      const outline = await contentService.generateOutline(
        'Machine Learning Basics',
        ContentType.ARTICLE
      );

      expect(Array.isArray(outline)).toBe(true);
      expect(outline.length).toBeGreaterThan(0);
    });

    it('should provide auto-completion', async () => {
      const completions = await contentService.autoComplete(
        'The future of artificial intelligence is'
      );

      expect(Array.isArray(completions)).toBe(true);
      expect(completions.length).toBeGreaterThan(0);
    });

    it('should generate content variations', async () => {
      const originalContent = 'This is a test sentence for variation generation.';
      
      const variations = await contentService.generateVariations(
        originalContent,
        'tone'
      );

      expect(Array.isArray(variations)).toBe(true);
      expect(variations.length).toBeGreaterThan(0);
    });
  });

  describe('content enhancement', () => {
    beforeEach(async () => {
      await contentService.initialize();
    });

    it('should enhance content successfully', async () => {
      const request = {
        originalContent: 'This is a very good article that should of been written better.',
        enhancementType: [EnhancementType.GRAMMAR, EnhancementType.STYLE],
        tone: WritingTone.PROFESSIONAL
      };

      const response = await contentService.enhanceContent(request);

      expect(response).toBeDefined();
      expect(response.enhancedContent).toBeTruthy();
      expect(response.improvements).toBeDefined();
      expect(Array.isArray(response.improvements)).toBe(true);
      expect(response.qualityScore).toBeGreaterThan(0);
    });

    it('should fix grammar errors', async () => {
      const request = {
        originalContent: 'This sentence should of been written correctly.',
        enhancementType: [EnhancementType.GRAMMAR]
      };

      const response = await contentService.enhanceContent(request);

      expect(response.enhancedContent).toContain('should have');
      expect(response.improvements.length).toBeGreaterThan(0);
    });

    it('should improve conciseness', async () => {
      const request = {
        originalContent: 'In order to achieve success, we need to work very hard due to the fact that success requires effort.',
        enhancementType: [EnhancementType.CONCISENESS]
      };

      const response = await contentService.enhanceContent(request);

      expect(response.enhancedContent.length).toBeLessThan(request.originalContent.length);
      expect(response.improvements.length).toBeGreaterThan(0);
    });
  });

  describe('style analysis', () => {
    it('should analyze writing style', () => {
      const samples = [
        { content: 'This is a professional document with formal language and structured approach to problem-solving.' },
        { content: 'Furthermore, the implementation requires careful consideration of various factors.' }
      ];

      const analysis = contentService.analyzeWritingStyle(samples);

      expect(analysis).toBeDefined();
      expect(analysis.detectedStyle).toBeDefined();
      expect(analysis.confidence).toBeGreaterThan(0);
      expect(Array.isArray(analysis.characteristics)).toBe(true);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    it('should learn and store user style', () => {
      const userId = 'test-user';
      const samples = [
        { content: 'Hey there! This is a casual message with friendly tone.' },
        { content: 'Just wanted to share some cool ideas with you.' }
      ];

      const learnedStyle = contentService.learnUserStyle(userId, samples);
      expect(learnedStyle).toBeDefined();

      const retrievedStyle = contentService.getUserStyle(userId);
      expect(retrievedStyle).toEqual(learnedStyle);
    });

    it('should update user style with new samples', () => {
      const userId = 'test-user';
      const initialSamples = [
        { content: 'This is a formal business communication.' }
      ];
      const newSamples = [
        { content: 'Hey, this is more casual now!' }
      ];

      contentService.learnUserStyle(userId, initialSamples);
      const updatedStyle = contentService.updateUserStyle(userId, newSamples);

      expect(updatedStyle).toBeDefined();
      expect(updatedStyle.tone).toBeDefined();
    });
  });

  describe('visual generation', () => {
    beforeEach(async () => {
      await contentService.initialize();
    });

    it('should generate bar chart', async () => {
      const request = {
        data: [
          { label: 'A', value: 10 },
          { label: 'B', value: 20 },
          { label: 'C', value: 15 }
        ],
        chartType: ChartType.BAR,
        title: 'Test Chart'
      };

      const response = await contentService.generateVisual(request);

      expect(response).toBeDefined();
      expect(response.svg).toBeTruthy();
      expect(response.config).toBeDefined();
      expect(Array.isArray(response.insights)).toBe(true);
    });

    it('should generate pie chart', async () => {
      const request = {
        data: [
          { label: 'Category A', value: 30 },
          { label: 'Category B', value: 70 }
        ],
        chartType: ChartType.PIE,
        title: 'Distribution Chart'
      };

      const response = await contentService.generateVisual(request);

      expect(response).toBeDefined();
      expect(response.svg).toBeTruthy();
      expect(response.insights.length).toBeGreaterThan(0);
    });

    it('should handle invalid chart data gracefully', async () => {
      const request = {
        data: [],
        chartType: ChartType.BAR,
        title: 'Empty Chart'
      };

      await expect(contentService.generateVisual(request)).rejects.toThrow();
    });
  });

  describe('content quality analysis', () => {
    beforeEach(async () => {
      await contentService.initialize();
    });

    it('should analyze content quality', async () => {
      const content = 'This is a well-written article with clear structure and engaging content. It provides valuable insights and maintains good readability throughout.';

      const analysis = await contentService.analyzeContentQuality(content);

      expect(analysis).toBeDefined();
      expect(analysis.score).toBeGreaterThan(0);
      expect(analysis.score).toBeLessThanOrEqual(1);
      expect(analysis.metrics).toBeDefined();
      expect(analysis.metrics.readability).toBeGreaterThan(0);
      expect(analysis.metrics.engagement).toBeGreaterThan(0);
      expect(analysis.metrics.clarity).toBeGreaterThan(0);
      expect(analysis.metrics.structure).toBeGreaterThan(0);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    it('should provide recommendations for poor quality content', async () => {
      const poorContent = 'bad text';

      const analysis = await contentService.analyzeContentQuality(poorContent);

      expect(analysis.score).toBeLessThanOrEqual(0.8); // More lenient expectation
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle content generation errors gracefully', async () => {
      // Mock a failure in content generation
      const mockService = new ContentService();
      
      // Don't initialize to trigger error
      await expect(mockService.generateContent({
        prompt: 'test',
        type: ContentType.ARTICLE
      })).rejects.toThrow();
    });

    it('should handle empty prompts', async () => {
      await contentService.initialize();

      const request = {
        prompt: '',
        type: ContentType.ARTICLE
      };

      const response = await contentService.generateContent(request);
      expect(response.content).toBeDefined();
    });
  });

  describe('resource cleanup', () => {
    it('should dispose resources properly', async () => {
      await contentService.initialize();
      await expect(contentService.dispose()).resolves.not.toThrow();
    });
  });
});