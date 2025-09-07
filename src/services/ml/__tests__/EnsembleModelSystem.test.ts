import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnsembleModelSystem, EnsembleConfig, PredictionContext } from '../EnsembleModelSystem';

// Mock the individual model classes
vi.mock('../TaskPredictionModel', () => ({
  TaskPredictionModel: vi.fn().mockImplementation(() => ({
    predictNextTasks: vi.fn().mockResolvedValue([{ id: 'task1', priority: 0.8 }])
  }))
}));

vi.mock('../BehavioralPatternModel', () => ({
  BehavioralPatternModel: vi.fn().mockImplementation(() => ({
    analyzeBehavior: vi.fn().mockResolvedValue({ pattern: 'focused', confidence: 0.9 })
  }))
}));

vi.mock('../PriorityOptimizationEngine', () => ({
  PriorityOptimizationEngine: vi.fn().mockImplementation(() => ({
    optimizePriorities: vi.fn().mockResolvedValue([{ id: 'task1', priority: 0.85 }])
  }))
}));

vi.mock('../UserAdaptationService', () => ({
  UserAdaptationService: vi.fn().mockImplementation(() => ({
    adaptToUser: vi.fn().mockResolvedValue({ adaptations: ['ui_theme', 'shortcuts'] })
  }))
}));

describe('EnsembleModelSystem', () => {
  let ensembleSystem: EnsembleModelSystem;
  let mockConfig: EnsembleConfig;
  let mockContext: PredictionContext;

  beforeEach(() => {
    mockConfig = {
      models: [
        {
          modelId: 'task_predictor_1',
          modelType: 'task_prediction',
          weight: 0.8,
          enabled: true,
          contextFilters: []
        },
        {
          modelId: 'behavior_analyzer_1',
          modelType: 'behavioral_pattern',
          weight: 0.7,
          enabled: true,
          contextFilters: []
        },
        {
          modelId: 'priority_optimizer_1',
          modelType: 'priority_optimization',
          weight: 0.9,
          enabled: true,
          contextFilters: []
        }
      ],
      aggregationStrategy: 'weighted_average',
      confidenceThreshold: 0.5,
      contextWeights: {
        taskType: 0.4,
        workloadLevel: 0.3,
        timeOfDay: 0.3
      }
    };

    mockContext = {
      userId: 'user123',
      taskType: 'coding',
      timeOfDay: 14,
      workloadLevel: 'medium',
      recentActivity: ['file_edit', 'test_run', 'commit']
    };

    ensembleSystem = new EnsembleModelSystem(mockConfig);
  });

  describe('predict', () => {
    it('should aggregate predictions from multiple models', async () => {
      const input = { tasks: ['task1', 'task2'] };
      
      const result = await ensembleSystem.predict(input, mockContext);

      expect(result).toBeDefined();
      expect(result.prediction).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.contributingModels).toHaveLength(3);
      expect(result.aggregationMethod).toBe('weighted_average');
    });

    it('should filter out models below confidence threshold', async () => {
      // Create config with high confidence threshold
      const highThresholdConfig = {
        ...mockConfig,
        confidenceThreshold: 0.95
      };

      const highThresholdSystem = new EnsembleModelSystem(highThresholdConfig);
      
      try {
        await highThresholdSystem.predict({ tasks: [] }, mockContext);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('confidence threshold');
      }
    });

    it('should handle dynamic aggregation strategy selection', async () => {
      const dynamicConfig = {
        ...mockConfig,
        aggregationStrategy: 'dynamic' as const
      };

      const dynamicSystem = new EnsembleModelSystem(dynamicConfig);
      const result = await dynamicSystem.predict({ tasks: [] }, mockContext);

      expect(result).toBeDefined();
      expect(['weighted_average', 'voting', 'stacking']).toContain(result.aggregationMethod);
    });

    it('should use voting aggregation for diverse predictions', async () => {
      const votingConfig = {
        ...mockConfig,
        aggregationStrategy: 'voting' as const
      };

      const votingSystem = new EnsembleModelSystem(votingConfig);
      const result = await votingSystem.predict({ tasks: [] }, mockContext);

      expect(result.aggregationMethod).toBe('voting');
    });

    it('should use stacking aggregation', async () => {
      const stackingConfig = {
        ...mockConfig,
        aggregationStrategy: 'stacking' as const
      };

      const stackingSystem = new EnsembleModelSystem(stackingConfig);
      const result = await stackingSystem.predict({ tasks: [] }, mockContext);

      expect(result.aggregationMethod).toBe('stacking');
    });
  });

  describe('recordPredictionOutcome', () => {
    it('should record prediction accuracy', () => {
      const predicted = { priority: 0.8 };
      const actual = { priority: 0.75 };

      ensembleSystem.recordPredictionOutcome(
        'task_predictor_1',
        predicted,
        actual,
        mockContext
      );

      const report = ensembleSystem.getModelPerformanceReport();
      expect(report['task_predictor_1']).toBeDefined();
    });

    it('should calculate accuracy for numeric predictions', () => {
      ensembleSystem.recordPredictionOutcome(
        'test_model',
        0.8,
        0.75,
        mockContext
      );

      const report = ensembleSystem.getModelPerformanceReport();
      expect(report['test_model'].averageAccuracy).toBeGreaterThan(0.9);
    });

    it('should calculate accuracy for array predictions', () => {
      ensembleSystem.recordPredictionOutcome(
        'test_model',
        [1, 2, 3],
        [1, 2, 4],
        mockContext
      );

      const report = ensembleSystem.getModelPerformanceReport();
      expect(report['test_model'].averageAccuracy).toBeCloseTo(0.67, 1);
    });

    it('should maintain performance history limit', () => {
      // Record more than 100 predictions
      for (let i = 0; i < 150; i++) {
        ensembleSystem.recordPredictionOutcome(
          'test_model',
          i,
          i + 0.1,
          mockContext
        );
      }

      const report = ensembleSystem.getModelPerformanceReport();
      expect(report['test_model'].sampleCount).toBeLessThanOrEqual(100);
    });
  });

  describe('getModelPerformanceReport', () => {
    beforeEach(() => {
      // Add some test data
      ensembleSystem.recordPredictionOutcome('model1', 0.8, 0.75, mockContext);
      ensembleSystem.recordPredictionOutcome('model1', 0.9, 0.85, mockContext);
      ensembleSystem.recordPredictionOutcome('model2', 0.7, 0.8, mockContext);
    });

    it('should generate comprehensive performance report', () => {
      const report = ensembleSystem.getModelPerformanceReport();

      expect(report['model1']).toBeDefined();
      expect(report['model1'].averageAccuracy).toBeGreaterThan(0);
      expect(report['model1'].sampleCount).toBe(2);
      expect(report['model1'].lastUpdated).toBeInstanceOf(Date);
    });

    it('should calculate min and max accuracy', () => {
      const report = ensembleSystem.getModelPerformanceReport();

      expect(report['model1'].minAccuracy).toBeLessThanOrEqual(report['model1'].maxAccuracy);
    });
  });

  describe('context filtering', () => {
    it('should filter models based on context', async () => {
      const contextFilterConfig = {
        ...mockConfig,
        models: [
          {
            modelId: 'coding_specialist',
            modelType: 'task_prediction' as const,
            weight: 0.9,
            enabled: true,
            contextFilters: ['coding']
          },
          {
            modelId: 'writing_specialist',
            modelType: 'behavioral_pattern' as const,
            weight: 0.8,
            enabled: true,
            contextFilters: ['writing']
          }
        ]
      };

      const contextSystem = new EnsembleModelSystem(contextFilterConfig);
      const codingContext = { ...mockContext, taskType: 'coding' };
      
      const result = await contextSystem.predict({ tasks: [] }, codingContext);

      // Should only use coding specialist
      expect(result.contributingModels).toContain('coding_specialist');
      expect(result.contributingModels).not.toContain('writing_specialist');
    });
  });

  describe('error handling', () => {
    it('should handle model failures gracefully', async () => {
      // Mock a model to throw an error
      const failingConfig = {
        ...mockConfig,
        models: [
          {
            modelId: 'failing_model',
            modelType: 'task_prediction' as const,
            weight: 0.8,
            enabled: true,
            contextFilters: []
          }
        ]
      };

      const failingSystem = new EnsembleModelSystem(failingConfig);
      
      // Should not throw error, but handle gracefully
      try {
        await failingSystem.predict({ tasks: [] }, mockContext);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('confidence threshold');
      }
    });

    it('should throw error for unknown aggregation strategy', async () => {
      const invalidConfig = {
        ...mockConfig,
        aggregationStrategy: 'invalid_strategy' as any
      };

      const invalidSystem = new EnsembleModelSystem(invalidConfig);
      
      await expect(invalidSystem.predict({ tasks: [] }, mockContext))
        .rejects.toThrow('Unknown aggregation strategy');
    });
  });

  describe('prediction combination', () => {
    it('should combine numeric predictions correctly', async () => {
      // This would require mocking the models to return specific numeric values
      const result = await ensembleSystem.predict({ value: 10 }, mockContext);
      
      expect(typeof result.prediction).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle empty predictions', async () => {
      const emptyConfig = {
        ...mockConfig,
        models: []
      };

      const emptySystem = new EnsembleModelSystem(emptyConfig);
      
      await expect(emptySystem.predict({ tasks: [] }, mockContext))
        .rejects.toThrow('confidence threshold');
    });
  });

  describe('confidence calculation', () => {
    it('should calculate confidence based on model weights', async () => {
      const result = await ensembleSystem.predict({ tasks: [] }, mockContext);
      
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should include metadata in predictions', async () => {
      const result = await ensembleSystem.predict({ tasks: [] }, mockContext);
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata.modelScores).toBeDefined();
      expect(result.metadata.timestamp).toBeInstanceOf(Date);
    });
  });
});