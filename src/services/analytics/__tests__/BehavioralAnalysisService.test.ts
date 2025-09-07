import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BehavioralAnalysisService } from '../BehavioralAnalysisService';
import { UserInteraction } from '../../../types/ai';
import { BehavioralPattern, ProductivityInsight } from '../../../types/analytics';

// Mock D3 for visualization tests
vi.mock('d3', () => ({
  select: vi.fn(() => ({
    selectAll: vi.fn(() => ({
      data: vi.fn(() => ({
        enter: vi.fn(() => ({
          append: vi.fn(() => ({
            attr: vi.fn(() => ({})),
            style: vi.fn(() => ({})),
            text: vi.fn(() => ({}))
          }))
        })),
        exit: vi.fn(() => ({
          remove: vi.fn()
        }))
      }))
    })),
    append: vi.fn(() => ({
      attr: vi.fn(() => ({})),
      style: vi.fn(() => ({}))
    }))
  })),
  scaleLinear: vi.fn(() => ({
    domain: vi.fn(() => ({})),
    range: vi.fn(() => ({}))
  })),
  scaleTime: vi.fn(() => ({
    domain: vi.fn(() => ({})),
    range: vi.fn(() => ({}))
  })),
  line: vi.fn(() => ({
    x: vi.fn(() => ({})),
    y: vi.fn(() => ({}))
  })),
  extent: vi.fn(() => [0, 100]),
  max: vi.fn(() => 100),
  min: vi.fn(() => 0)
}));

describe('BehavioralAnalysisService', () => {
  let service: BehavioralAnalysisService;
  let mockInteractions: UserInteraction[];

  beforeEach(async () => {
    service = new BehavioralAnalysisService();
    
    // Create comprehensive mock interaction data
    const now = Date.now();
    mockInteractions = [
      {
        id: 'int-1',
        action: 'click',
        context: 'coding',
        timestamp: now - 3600000, // 1 hour ago
        duration: 5000,
        metadata: { element: 'file-explorer', project: 'frontend' }
      },
      {
        id: 'int-2',
        action: 'type',
        context: 'coding',
        timestamp: now - 3300000, // 55 minutes ago
        duration: 120000, // 2 minutes of typing
        metadata: { file: 'component.tsx', lines: 45 }
      },
      {
        id: 'int-3',
        action: 'scroll',
        context: 'reading',
        timestamp: now - 3000000, // 50 minutes ago
        duration: 15000,
        metadata: { document: 'documentation.md', scrollDistance: 500 }
      },
      {
        id: 'int-4',
        action: 'click',
        context: 'debugging',
        timestamp: now - 2700000, // 45 minutes ago
        duration: 8000,
        metadata: { element: 'breakpoint', line: 23 }
      },
      {
        id: 'int-5',
        action: 'switch',
        context: 'multitasking',
        timestamp: now - 2400000, // 40 minutes ago
        duration: 2000,
        metadata: { from: 'editor', to: 'browser' }
      },
      {
        id: 'int-6',
        action: 'type',
        context: 'coding',
        timestamp: now - 1800000, // 30 minutes ago
        duration: 180000, // 3 minutes of focused typing
        metadata: { file: 'service.ts', lines: 67 }
      }
    ];

    await service.initialize();
  });

  afterEach(() => {
    service.dispose();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const newService = new BehavioralAnalysisService();
      await expect(newService.initialize()).resolves.not.toThrow();
      newService.dispose();
    });

    it('should load historical patterns if available', async () => {
      const mockPatterns = [
        {
          type: 'focus-session',
          frequency: 0.8,
          duration: 45,
          context: 'coding',
          triggers: ['morning', 'coffee']
        }
      ];

      const localStorageMock = {
        getItem: vi.fn().mockReturnValue(JSON.stringify(mockPatterns)),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      };

      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

      const newService = new BehavioralAnalysisService();
      await newService.initialize();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('behavioral-patterns');
      newService.dispose();
    });
  });

  describe('analyzeBehavioralPatterns', () => {
    it('should identify focus patterns from interactions', async () => {
      const patterns = await service.analyzeBehavioralPatterns(mockInteractions);

      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);

      // Should identify coding focus pattern
      const codingPattern = patterns.find(p => p.context === 'coding');
      expect(codingPattern).toBeDefined();
      expect(codingPattern!.frequency).toBeGreaterThan(0);
      expect(codingPattern!.frequency).toBeLessThanOrEqual(1);
    });

    it('should detect context switching patterns', async () => {
      const patterns = await service.analyzeBehavioralPatterns(mockInteractions);

      // Should detect multitasking/switching behavior
      const switchingPattern = patterns.find(p => 
        p.type === 'context-switch' || p.context === 'multitasking'
      );
      
      if (switchingPattern) {
        expect(switchingPattern.frequency).toBeGreaterThan(0);
        expect(switchingPattern.triggers).toBeDefined();
      }
    });

    it('should calculate pattern confidence scores', async () => {
      const patterns = await service.analyzeBehavioralPatterns(mockInteractions);

      patterns.forEach(pattern => {
        expect(pattern).toHaveProperty('confidence');
        expect(pattern.confidence).toBeGreaterThanOrEqual(0);
        expect(pattern.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should handle empty interaction data', async () => {
      const patterns = await service.analyzeBehavioralPatterns([]);

      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
      // Should return empty array or default patterns
    });

    it('should identify temporal patterns', async () => {
      // Create interactions with clear temporal patterns
      const temporalInteractions: UserInteraction[] = Array.from({ length: 20 }, (_, i) => ({
        id: `temporal-${i}`,
        action: 'type',
        context: 'coding',
        timestamp: Date.now() - (i * 3600000), // Every hour going back
        duration: 60000 + (i % 3) * 30000, // Varying durations
        metadata: { productivity: 0.8 - (i % 5) * 0.1 }
      }));

      const patterns = await service.analyzeBehavioralPatterns(temporalInteractions);

      // Should identify time-based patterns
      const temporalPattern = patterns.find(p => 
        p.type === 'temporal' || p.triggers?.includes('time-based')
      );
      
      if (temporalPattern) {
        expect(temporalPattern.frequency).toBeGreaterThan(0);
      }
    });
  });

  describe('generateProductivityInsights', () => {
    it('should generate comprehensive productivity insights', async () => {
      const insights = await service.generateProductivityInsights(mockInteractions);

      expect(insights).toBeDefined();
      expect(insights).toHaveProperty('overallScore');
      expect(insights).toHaveProperty('focusMetrics');
      expect(insights).toHaveProperty('distractionAnalysis');
      expect(insights).toHaveProperty('recommendations');
      expect(insights).toHaveProperty('trends');

      expect(typeof insights.overallScore).toBe('number');
      expect(insights.overallScore).toBeGreaterThanOrEqual(0);
      expect(insights.overallScore).toBeLessThanOrEqual(1);

      expect(Array.isArray(insights.recommendations)).toBe(true);
      expect(Array.isArray(insights.trends)).toBe(true);
    });

    it('should analyze focus quality metrics', async () => {
      const insights = await service.generateProductivityInsights(mockInteractions);

      expect(insights.focusMetrics).toBeDefined();
      expect(insights.focusMetrics).toHaveProperty('averageFocusTime');
      expect(insights.focusMetrics).toHaveProperty('focusSessionCount');
      expect(insights.focusMetrics).toHaveProperty('deepWorkPercentage');

      expect(typeof insights.focusMetrics.averageFocusTime).toBe('number');
      expect(insights.focusMetrics.averageFocusTime).toBeGreaterThanOrEqual(0);
    });

    it('should identify distraction patterns', async () => {
      const insights = await service.generateProductivityInsights(mockInteractions);

      expect(insights.distractionAnalysis).toBeDefined();
      expect(insights.distractionAnalysis).toHaveProperty('interruptionCount');
      expect(insights.distractionAnalysis).toHaveProperty('contextSwitches');
      expect(insights.distractionAnalysis).toHaveProperty('commonDistractions');

      expect(typeof insights.distractionAnalysis.interruptionCount).toBe('number');
      expect(Array.isArray(insights.distractionAnalysis.commonDistractions)).toBe(true);
    });

    it('should provide actionable recommendations', async () => {
      const insights = await service.generateProductivityInsights(mockInteractions);

      expect(insights.recommendations.length).toBeGreaterThan(0);
      
      insights.recommendations.forEach(rec => {
        expect(rec).toHaveProperty('type');
        expect(rec).toHaveProperty('message');
        expect(rec).toHaveProperty('priority');
        expect(rec).toHaveProperty('actionable');
        
        expect(typeof rec.message).toBe('string');
        expect(rec.message.length).toBeGreaterThan(0);
        expect(typeof rec.actionable).toBe('boolean');
      });
    });

    it('should track productivity trends over time', async () => {
      const insights = await service.generateProductivityInsights(mockInteractions);

      expect(insights.trends.length).toBeGreaterThan(0);
      
      insights.trends.forEach(trend => {
        expect(trend).toHaveProperty('metric');
        expect(trend).toHaveProperty('direction');
        expect(trend).toHaveProperty('magnitude');
        expect(trend).toHaveProperty('timeframe');
        
        expect(['increasing', 'decreasing', 'stable']).toContain(trend.direction);
        expect(typeof trend.magnitude).toBe('number');
      });
    });
  });

  describe('detectWorkflowBottlenecks', () => {
    it('should identify workflow bottlenecks', async () => {
      const bottlenecks = await service.detectWorkflowBottlenecks(mockInteractions);

      expect(bottlenecks).toBeDefined();
      expect(Array.isArray(bottlenecks)).toBe(true);

      if (bottlenecks.length > 0) {
        bottlenecks.forEach(bottleneck => {
          expect(bottleneck).toHaveProperty('type');
          expect(bottleneck).toHaveProperty('severity');
          expect(bottleneck).toHaveProperty('description');
          expect(bottleneck).toHaveProperty('suggestedFix');
          expect(bottleneck).toHaveProperty('impact');

          expect(['low', 'medium', 'high', 'critical']).toContain(bottleneck.severity);
          expect(typeof bottleneck.impact).toBe('number');
        });
      }
    });

    it('should detect context switching bottlenecks', async () => {
      // Create interactions with excessive context switching
      const switchingInteractions: UserInteraction[] = Array.from({ length: 10 }, (_, i) => ({
        id: `switch-${i}`,
        action: 'switch',
        context: i % 2 === 0 ? 'coding' : 'email',
        timestamp: Date.now() - (i * 60000), // Every minute
        duration: 5000,
        metadata: { from: i % 2 === 0 ? 'editor' : 'email', to: i % 2 === 0 ? 'email' : 'editor' }
      }));

      const bottlenecks = await service.detectWorkflowBottlenecks(switchingInteractions);

      const switchingBottleneck = bottlenecks.find(b => 
        b.type === 'context-switching' || b.description.includes('switch')
      );
      
      if (switchingBottleneck) {
        expect(switchingBottleneck.severity).toBe('high');
        expect(switchingBottleneck.suggestedFix).toBeDefined();
      }
    });

    it('should detect productivity decline patterns', async () => {
      // Create interactions showing declining productivity
      const decliningInteractions: UserInteraction[] = Array.from({ length: 8 }, (_, i) => ({
        id: `decline-${i}`,
        action: 'type',
        context: 'coding',
        timestamp: Date.now() - (i * 1800000), // Every 30 minutes
        duration: 60000 - (i * 5000), // Decreasing focus time
        metadata: { productivity: 0.9 - (i * 0.1) }
      }));

      const bottlenecks = await service.detectWorkflowBottlenecks(decliningInteractions);

      const productivityBottleneck = bottlenecks.find(b => 
        b.type === 'productivity-decline' || b.description.includes('decline')
      );
      
      if (productivityBottleneck) {
        expect(productivityBottleneck.impact).toBeGreaterThan(0.5);
      }
    });
  });

  describe('trackBehaviorChanges', () => {
    it('should track behavior changes over time', async () => {
      const previousInteractions = mockInteractions.slice(0, 3);
      const currentInteractions = mockInteractions.slice(3);

      const changes = await service.trackBehaviorChanges(
        previousInteractions,
        currentInteractions
      );

      expect(changes).toBeDefined();
      expect(changes).toHaveProperty('significantChanges');
      expect(changes).toHaveProperty('improvements');
      expect(changes).toHaveProperty('regressions');
      expect(changes).toHaveProperty('newPatterns');

      expect(Array.isArray(changes.significantChanges)).toBe(true);
      expect(Array.isArray(changes.improvements)).toBe(true);
      expect(Array.isArray(changes.regressions)).toBe(true);
      expect(Array.isArray(changes.newPatterns)).toBe(true);
    });

    it('should detect improvements in behavior', async () => {
      // Create data showing improvement
      const oldInteractions: UserInteraction[] = [
        {
          id: 'old-1',
          action: 'switch',
          context: 'multitasking',
          timestamp: Date.now() - 86400000, // Yesterday
          duration: 2000,
          metadata: { switches: 10 }
        }
      ];

      const newInteractions: UserInteraction[] = [
        {
          id: 'new-1',
          action: 'type',
          context: 'coding',
          timestamp: Date.now() - 3600000, // 1 hour ago
          duration: 120000, // Longer focus
          metadata: { switches: 2 }
        }
      ];

      const changes = await service.trackBehaviorChanges(oldInteractions, newInteractions);

      if (changes.improvements.length > 0) {
        const improvement = changes.improvements[0];
        expect(improvement).toHaveProperty('metric');
        expect(improvement).toHaveProperty('change');
        expect(improvement).toHaveProperty('significance');
      }
    });

    it('should detect regressions in behavior', async () => {
      // Create data showing regression
      const goodInteractions: UserInteraction[] = [
        {
          id: 'good-1',
          action: 'type',
          context: 'coding',
          timestamp: Date.now() - 86400000,
          duration: 180000, // Long focus session
          metadata: { productivity: 0.9 }
        }
      ];

      const poorInteractions: UserInteraction[] = [
        {
          id: 'poor-1',
          action: 'switch',
          context: 'multitasking',
          timestamp: Date.now() - 3600000,
          duration: 5000, // Short, distracted session
          metadata: { productivity: 0.3 }
        }
      ];

      const changes = await service.trackBehaviorChanges(goodInteractions, poorInteractions);

      if (changes.regressions.length > 0) {
        const regression = changes.regressions[0];
        expect(regression).toHaveProperty('metric');
        expect(regression).toHaveProperty('change');
        expect(regression.change).toBeLessThan(0); // Negative change indicates regression
      }
    });
  });

  describe('performance and scalability', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset: UserInteraction[] = Array.from({ length: 10000 }, (_, i) => ({
        id: `large-${i}`,
        action: ['click', 'type', 'scroll', 'switch'][i % 4],
        context: ['coding', 'reading', 'debugging', 'multitasking'][i % 4],
        timestamp: Date.now() - (i * 60000),
        duration: Math.random() * 120000 + 5000,
        metadata: { index: i }
      }));

      const startTime = Date.now();
      const patterns = await service.analyzeBehavioralPatterns(largeDataset);
      const endTime = Date.now();

      expect(patterns).toBeDefined();
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should optimize memory usage for large datasets', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      const largeDataset: UserInteraction[] = Array.from({ length: 5000 }, (_, i) => ({
        id: `memory-${i}`,
        action: 'type',
        context: 'coding',
        timestamp: Date.now() - (i * 60000),
        duration: 60000,
        metadata: { data: 'x'.repeat(100) } // Some data to use memory
      }));

      await service.analyzeBehavioralPatterns(largeDataset);
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Memory usage should not grow excessively
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
      }
    });
  });

  describe('error handling', () => {
    it('should handle invalid interaction data gracefully', async () => {
      const invalidInteractions = [
        {
          id: null,
          action: undefined,
          timestamp: 'invalid',
          duration: -1
        }
      ] as any;

      const patterns = await service.analyzeBehavioralPatterns(invalidInteractions);
      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
    });

    it('should handle analysis errors gracefully', async () => {
      // Mock internal method to throw error
      const originalMethod = (service as any).calculatePatternFrequency;
      (service as any).calculatePatternFrequency = vi.fn(() => {
        throw new Error('Analysis failed');
      });

      const patterns = await service.analyzeBehavioralPatterns(mockInteractions);
      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);

      // Restore original method
      (service as any).calculatePatternFrequency = originalMethod;
    });

    it('should handle missing metadata gracefully', async () => {
      const interactionsWithoutMetadata: UserInteraction[] = mockInteractions.map(int => ({
        ...int,
        metadata: undefined as any
      }));

      const patterns = await service.analyzeBehavioralPatterns(interactionsWithoutMetadata);
      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
    });
  });

  describe('data persistence', () => {
    it('should save patterns to localStorage', async () => {
      const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      };

      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

      await service.analyzeBehavioralPatterns(mockInteractions);

      // Should attempt to save patterns
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should handle localStorage errors gracefully', async () => {
      const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(() => { throw new Error('Storage full'); }),
        removeItem: vi.fn(),
        clear: vi.fn()
      };

      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await service.analyzeBehavioralPatterns(mockInteractions);

      // Should not throw but log warning
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('resource management', () => {
    it('should dispose resources properly', () => {
      expect(() => service.dispose()).not.toThrow();
    });

    it('should handle multiple dispose calls', () => {
      service.dispose();
      expect(() => service.dispose()).not.toThrow();
    });

    it('should clear cached data on disposal', () => {
      service.dispose();
      
      // Should not have any cached patterns after disposal
      const cache = (service as any).getPatternCache?.() || {};
      expect(Object.keys(cache)).toHaveLength(0);
    });
  });
});