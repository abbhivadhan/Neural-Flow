import { describe, it, expect, beforeEach } from 'vitest';
import { DynamicModelSelector, ModelSelectionCriteria } from '../DynamicModelSelector';
import { ModelConfig, PredictionContext } from '../EnsembleModelSystem';

describe('DynamicModelSelector', () => {
  let selector: DynamicModelSelector;
  let mockModels: ModelConfig[];
  let mockContext: PredictionContext;
  let mockCriteria: ModelSelectionCriteria;

  beforeEach(() => {
    selector = new DynamicModelSelector();
    
    mockModels = [
      {
        modelId: 'fast_model',
        modelType: 'task_prediction',
        weight: 0.7,
        enabled: true,
        contextFilters: []
      },
      {
        modelId: 'accurate_model',
        modelType: 'behavioral_pattern',
        weight: 0.9,
        enabled: true,
        contextFilters: []
      },
      {
        modelId: 'efficient_model',
        modelType: 'priority_optimization',
        weight: 0.8,
        enabled: true,
        contextFilters: ['coding']
      },
      {
        modelId: 'disabled_model',
        modelType: 'user_adaptation',
        weight: 0.6,
        enabled: false,
        contextFilters: []
      }
    ];

    mockContext = {
      userId: 'user123',
      taskType: 'coding',
      timeOfDay: 14,
      workloadLevel: 'medium',
      recentActivity: ['file_edit', 'test_run']
    };

    mockCriteria = {
      accuracy: 0.4,
      latency: 0.3,
      resourceUsage: 0.2,
      contextRelevance: 0.1
    };

    // Add some performance data
    selector.updateModelPerformance('fast_model', mockContext, {
      accuracy: 0.75,
      latency: 50,
      memoryUsage: 30,
      cpuUsage: 25,
      success: true
    });

    selector.updateModelPerformance('accurate_model', mockContext, {
      accuracy: 0.95,
      latency: 200,
      memoryUsage: 60,
      cpuUsage: 70,
      success: true
    });

    selector.updateModelPerformance('efficient_model', mockContext, {
      accuracy: 0.85,
      latency: 100,
      memoryUsage: 20,
      cpuUsage: 15,
      success: true
    });
  });

  describe('selectOptimalModels', () => {
    it('should select models based on criteria', () => {
      const selectedModels = selector.selectOptimalModels(
        mockModels.filter(m => m.enabled),
        mockContext,
        mockCriteria,
        2
      );

      expect(selectedModels).toHaveLength(2);
      expect(selectedModels.every(m => m.enabled)).toBe(true);
    });

    it('should respect maxModels parameter', () => {
      const selectedModels = selector.selectOptimalModels(
        mockModels.filter(m => m.enabled),
        mockContext,
        mockCriteria,
        1
      );

      expect(selectedModels).toHaveLength(1);
    });

    it('should filter out disabled models', () => {
      const selectedModels = selector.selectOptimalModels(
        mockModels, // Include disabled model
        mockContext,
        mockCriteria,
        5
      );

      const disabledModel = selectedModels.find(m => m.modelId === 'disabled_model');
      expect(disabledModel).toBeUndefined();
    });

    it('should prioritize accuracy when accuracy weight is high', () => {
      const accuracyCriteria: ModelSelectionCriteria = {
        accuracy: 0.8,
        latency: 0.1,
        resourceUsage: 0.05,
        contextRelevance: 0.05
      };

      const selectedModels = selector.selectOptimalModels(
        mockModels.filter(m => m.enabled),
        mockContext,
        accuracyCriteria,
        1
      );

      // Should select the most accurate model
      expect(selectedModels[0].modelId).toBe('accurate_model');
    });

    it('should prioritize speed when latency weight is high', () => {
      const speedCriteria: ModelSelectionCriteria = {
        accuracy: 0.1,
        latency: 0.8,
        resourceUsage: 0.05,
        contextRelevance: 0.05
      };

      const selectedModels = selector.selectOptimalModels(
        mockModels.filter(m => m.enabled),
        mockContext,
        speedCriteria,
        1
      );

      // Should select the fastest model
      expect(selectedModels[0].modelId).toBe('fast_model');
    });
  });

  describe('updateModelPerformance', () => {
    it('should update model performance metrics', () => {
      const initialReport = selector.getModelPerformanceReport();
      const initialAccuracy = initialReport.modelRankings.find(
        r => r.modelId === 'fast_model'
      )?.accuracy || 0;

      selector.updateModelPerformance('fast_model', mockContext, {
        accuracy: 0.9,
        latency: 40,
        memoryUsage: 25,
        cpuUsage: 20,
        success: true
      });

      const updatedReport = selector.getModelPerformanceReport();
      const updatedAccuracy = updatedReport.modelRankings.find(
        r => r.modelId === 'fast_model'
      )?.accuracy || 0;

      expect(updatedAccuracy).toBeGreaterThan(initialAccuracy);
    });

    it('should use exponential moving average for updates', () => {
      // Record initial performance
      selector.updateModelPerformance('test_model', mockContext, {
        accuracy: 0.5,
        latency: 100,
        memoryUsage: 50,
        cpuUsage: 50,
        success: true
      });

      // Record much better performance
      selector.updateModelPerformance('test_model', mockContext, {
        accuracy: 1.0,
        latency: 50,
        memoryUsage: 25,
        cpuUsage: 25,
        success: true
      });

      const report = selector.getModelPerformanceReport();
      const modelRanking = report.modelRankings.find(r => r.modelId === 'test_model');

      // Should be between initial and new values due to EMA
      expect(modelRanking?.accuracy).toBeGreaterThan(0.5);
      expect(modelRanking?.accuracy).toBeLessThan(1.0);
    });

    it('should track context-specific performance', () => {
      const codingContext = { ...mockContext, taskType: 'coding' };
      const writingContext = { ...mockContext, taskType: 'writing' };

      selector.updateModelPerformance('context_model', codingContext, {
        accuracy: 0.9,
        latency: 50,
        memoryUsage: 30,
        cpuUsage: 25,
        success: true
      });

      selector.updateModelPerformance('context_model', writingContext, {
        accuracy: 0.6,
        latency: 80,
        memoryUsage: 40,
        cpuUsage: 35,
        success: true
      });

      // Performance should be tracked separately for different contexts
      const recommendations = selector.getModelRecommendations(codingContext, mockCriteria);
      const contextModel = recommendations.find(r => r.modelId === 'context_model');
      
      expect(contextModel?.expectedPerformance.accuracy).toBeCloseTo(0.9, 1);
    });
  });

  describe('getModelRecommendations', () => {
    it('should provide model recommendations with scores', () => {
      const recommendations = selector.getModelRecommendations(mockContext, mockCriteria);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      
      recommendations.forEach(rec => {
        expect(rec.modelId).toBeDefined();
        expect(rec.score).toBeGreaterThanOrEqual(0);
        expect(rec.score).toBeLessThanOrEqual(1);
        expect(rec.reasoning).toBeDefined();
        expect(rec.confidence).toBeGreaterThanOrEqual(0);
        expect(rec.confidence).toBeLessThanOrEqual(1);
        expect(rec.expectedPerformance).toBeDefined();
      });
    });

    it('should sort recommendations by score', () => {
      const recommendations = selector.getModelRecommendations(mockContext, mockCriteria);

      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i - 1].score).toBeGreaterThanOrEqual(recommendations[i].score);
      }
    });

    it('should provide reasoning for recommendations', () => {
      const recommendations = selector.getModelRecommendations(mockContext, mockCriteria);

      recommendations.forEach(rec => {
        expect(rec.reasoning).toBeTruthy();
        expect(typeof rec.reasoning).toBe('string');
      });
    });
  });

  describe('getPerformanceReport', () => {
    it('should generate comprehensive performance report', () => {
      const report = selector.getPerformanceReport();

      expect(report.totalModels).toBeGreaterThan(0);
      expect(report.averageAccuracy).toBeGreaterThanOrEqual(0);
      expect(report.averageLatency).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(report.modelRankings)).toBe(true);
      expect(report.contextInsights).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should rank models by accuracy', () => {
      const report = selector.getPerformanceReport();

      for (let i = 1; i < report.modelRankings.length; i++) {
        expect(report.modelRankings[i - 1].accuracy)
          .toBeGreaterThanOrEqual(report.modelRankings[i].accuracy);
      }
    });

    it('should provide context insights', () => {
      const report = selector.getPerformanceReport();

      report.contextInsights.forEach((insight, contextKey) => {
        expect(insight.averageAccuracy).toBeGreaterThanOrEqual(0);
        expect(insight.sampleCount).toBeGreaterThan(0);
        expect(insight.bestModel).toBeDefined();
        expect(['above_average', 'below_average']).toContain(insight.performance);
      });
    });

    it('should generate system recommendations', () => {
      // Add some poor performing models to trigger recommendations
      selector.updateModelPerformance('poor_model', mockContext, {
        accuracy: 0.3,
        latency: 500,
        memoryUsage: 90,
        cpuUsage: 95,
        success: false
      });

      const report = selector.getPerformanceReport();

      expect(report.recommendations.length).toBeGreaterThan(0);
      report.recommendations.forEach(rec => {
        expect(typeof rec).toBe('string');
        expect(rec.length).toBeGreaterThan(0);
      });
    });
  });

  describe('context classification', () => {
    it('should handle different context types', () => {
      const highAccuracyContext = {
        ...mockContext,
        workloadLevel: 'high' as const,
        recentActivity: Array(15).fill('activity') // More than 10 activities
      };

      const realTimeContext = {
        ...mockContext,
        taskType: 'real_time_processing'
      };

      const resourceConstrainedContext = {
        ...mockContext,
        workloadLevel: 'low' as const
      };

      // Test that different contexts work without throwing
      expect(() => {
        selector.selectOptimalModels(mockModels.filter(m => m.enabled), highAccuracyContext, mockCriteria);
        selector.selectOptimalModels(mockModels.filter(m => m.enabled), realTimeContext, mockCriteria);
        selector.selectOptimalModels(mockModels.filter(m => m.enabled), resourceConstrainedContext, mockCriteria);
      }).not.toThrow();
    });
  });

  describe('model scoring', () => {
    it('should calculate model scores correctly', () => {
      const recommendations = selector.getModelRecommendations(mockContext, mockCriteria);

      // Verify that models with better performance get higher scores
      const accurateModel = recommendations.find(r => r.modelId === 'accurate_model');
      const fastModel = recommendations.find(r => r.modelId === 'fast_model');

      expect(accurateModel).toBeDefined();
      expect(fastModel).toBeDefined();

      // With accuracy-weighted criteria, accurate model should score higher
      if (mockCriteria.accuracy > mockCriteria.latency) {
        expect(accurateModel!.score).toBeGreaterThan(fastModel!.score);
      }
    });

    it('should handle models without performance history', () => {
      const newModel: ModelConfig = {
        modelId: 'new_model',
        modelType: 'task_prediction',
        weight: 0.5,
        enabled: true,
        contextFilters: []
      };

      const modelsWithNew = [...mockModels.filter(m => m.enabled), newModel];
      
      expect(() => {
        selector.selectOptimalModels(modelsWithNew, mockContext, mockCriteria);
      }).not.toThrow();
    });
  });

  describe('performance tracking', () => {
    it('should track success rates', () => {
      // Record some failures
      selector.updateModelPerformance('unreliable_model', mockContext, {
        accuracy: 0.8,
        latency: 100,
        memoryUsage: 50,
        cpuUsage: 50,
        success: false
      });

      selector.updateModelPerformance('unreliable_model', mockContext, {
        accuracy: 0.8,
        latency: 100,
        memoryUsage: 50,
        cpuUsage: 50,
        success: false
      });

      const report = selector.getPerformanceReport();
      const unreliableModel = report.modelRankings.find(r => r.modelId === 'unreliable_model');

      expect(unreliableModel?.successRate).toBeLessThan(1.0);
    });

    it('should handle resource usage metrics', () => {
      selector.updateModelPerformance('resource_heavy_model', mockContext, {
        accuracy: 0.9,
        latency: 100,
        memoryUsage: 95,
        cpuUsage: 90,
        success: true
      });

      const report = selector.getPerformanceReport();
      const resourceHeavyModel = report.modelRankings.find(r => r.modelId === 'resource_heavy_model');

      expect(resourceHeavyModel?.resourceUsage).toBeGreaterThan(80);
    });
  });
});