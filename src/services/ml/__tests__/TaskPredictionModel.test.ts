import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TaskPredictionModel } from '../TaskPredictionModel';
import { TaskHistory, WorkContext, TaskPrediction } from '../../../types/ai';

// Mock TensorFlow.js
vi.mock('@tensorflow/tfjs', () => ({
  sequential: vi.fn(() => ({
    compile: vi.fn(),
    predict: vi.fn(() => ({
      data: vi.fn(() => Promise.resolve(new Float32Array([0.9, 0.7, 0.5, 0.3, 0.1])))
    })),
    fit: vi.fn(() => Promise.resolve({ history: { loss: [0.5, 0.3, 0.1] } })),
    save: vi.fn(() => Promise.resolve()),
    dispose: vi.fn()
  })),
  layers: {
    dense: vi.fn(() => ({})),
    dropout: vi.fn(() => ({})),
    lstm: vi.fn(() => ({}))
  },
  train: {
    adam: vi.fn(() => ({}))
  },
  tensor2d: vi.fn(() => ({
    dispose: vi.fn()
  })),
  tensor3d: vi.fn(() => ({
    dispose: vi.fn()
  })),
  loadLayersModel: vi.fn(() => Promise.reject(new Error('No model found')))
}));

describe('TaskPredictionModel', () => {
  let model: TaskPredictionModel;
  let mockTaskHistory: TaskHistory;
  let mockWorkContext: WorkContext;

  beforeEach(async () => {
    model = new TaskPredictionModel();
    
    mockTaskHistory = {
      completedTasks: [
        {
          id: 'task-1',
          title: 'Code Review',
          description: 'Review pull request #123',
          priority: 4,
          estimatedDuration: 30,
          dependencies: [],
          context: { type: 'work', data: { project: 'frontend' } },
          aiGenerated: false
        },
        {
          id: 'task-2',
          title: 'Write Tests',
          description: 'Add unit tests for new feature',
          priority: 3,
          estimatedDuration: 60,
          dependencies: ['task-1'],
          context: { type: 'work', data: { project: 'frontend' } },
          aiGenerated: false
        }
      ],
      patterns: [
        {
          sequence: ['code-review', 'write-tests', 'deploy'],
          frequency: 0.8,
          context: 'development'
        }
      ],
      preferences: {
        preferredTaskTypes: ['coding', 'review'],
        workingHours: { start: 9, end: 17 },
        breakPatterns: { frequency: 2, duration: 15 }
      }
    };

    mockWorkContext = {
      type: 'work',
      timeOfDay: 'morning',
      urgency: 'medium',
      data: { project: 'frontend', environment: 'development' }
    };

    await model.initialize();
  });

  afterEach(() => {
    model.dispose();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const newModel = new TaskPredictionModel();
      await expect(newModel.initialize()).resolves.not.toThrow();
      newModel.dispose();
    });

    it('should create model architecture correctly', async () => {
      expect(model).toBeDefined();
      // Model should be ready for predictions
      const summary = model.getModelSummary();
      expect(typeof summary).toBe('string');
    });
  });

  describe('predictNextTasks', () => {
    it('should predict next tasks with high confidence', async () => {
      const predictions = await model.predictNextTasks(mockTaskHistory, mockWorkContext, 3);
      
      expect(predictions).toBeDefined();
      expect(Array.isArray(predictions)).toBe(true);
      expect(predictions.length).toBeLessThanOrEqual(3);
      
      if (predictions.length > 0) {
        const prediction = predictions[0];
        expect(prediction).toHaveProperty('taskId');
        expect(prediction).toHaveProperty('confidence');
        expect(prediction).toHaveProperty('reasoning');
        expect(prediction.confidence).toBeGreaterThan(0);
        expect(prediction.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should handle empty task history', async () => {
      const emptyHistory: TaskHistory = {
        completedTasks: [],
        patterns: [],
        preferences: {}
      };

      const predictions = await model.predictNextTasks(emptyHistory, mockWorkContext);
      expect(predictions).toBeDefined();
      expect(Array.isArray(predictions)).toBe(true);
    });

    it('should consider work context in predictions', async () => {
      const urgentContext: WorkContext = {
        ...mockWorkContext,
        urgency: 'high'
      };

      const predictions = await model.predictNextTasks(mockTaskHistory, urgentContext);
      expect(predictions).toBeDefined();
      
      // Should prioritize urgent tasks
      if (predictions.length > 0) {
        expect(predictions[0].confidence).toBeGreaterThan(0.5);
      }
    });

    it('should respect task dependencies', async () => {
      const historyWithDeps: TaskHistory = {
        ...mockTaskHistory,
        completedTasks: [
          {
            id: 'task-1',
            title: 'Setup Environment',
            description: 'Configure development environment',
            priority: 5,
            estimatedDuration: 45,
            dependencies: [],
            context: { type: 'work', data: {} },
            aiGenerated: false
          }
        ]
      };

      const predictions = await model.predictNextTasks(historyWithDeps, mockWorkContext);
      expect(predictions).toBeDefined();
      
      // Should suggest tasks that depend on completed ones
      if (predictions.length > 0) {
        expect(predictions[0].reasoning).toBeDefined();
      }
    });
  });

  describe('updateWithFeedback', () => {
    it('should update model with user feedback', async () => {
      const prediction: TaskPrediction = {
        taskId: 'predicted-task',
        confidence: 0.8,
        reasoning: 'Based on recent patterns',
        suggestedTime: new Date(),
        estimatedDuration: 45,
        priority: 4
      };

      const feedback = {
        accuracy: 0.9,
        usefulness: 0.8,
        actualOutcome: 'completed',
        comments: 'Good prediction'
      };

      await expect(
        model.updateWithFeedback(prediction, feedback, mockWorkContext)
      ).resolves.not.toThrow();
    });

    it('should handle negative feedback', async () => {
      const prediction: TaskPrediction = {
        taskId: 'bad-prediction',
        confidence: 0.6,
        reasoning: 'Uncertain pattern match',
        suggestedTime: new Date(),
        estimatedDuration: 30,
        priority: 2
      };

      const negativeFeedback = {
        accuracy: 0.2,
        usefulness: 0.1,
        actualOutcome: 'rejected',
        comments: 'Not relevant'
      };

      await expect(
        model.updateWithFeedback(prediction, negativeFeedback, mockWorkContext)
      ).resolves.not.toThrow();
    });
  });

  describe('feature extraction', () => {
    it('should extract temporal features correctly', () => {
      const features = (model as any).extractTemporalFeatures(mockTaskHistory);
      
      expect(features).toBeDefined();
      expect(Array.isArray(features)).toBe(true);
      expect(features.length).toBeGreaterThan(0);
      
      // Should include time-based patterns
      features.forEach(feature => {
        expect(typeof feature).toBe('number');
        expect(feature).toBeGreaterThanOrEqual(0);
      });
    });

    it('should extract context features', () => {
      const features = (model as any).extractContextFeatures(mockWorkContext);
      
      expect(features).toBeDefined();
      expect(Array.isArray(features)).toBe(true);
      expect(features.length).toBeGreaterThan(0);
    });

    it('should extract task sequence features', () => {
      const features = (model as any).extractSequenceFeatures(mockTaskHistory.completedTasks);
      
      expect(features).toBeDefined();
      expect(Array.isArray(features)).toBe(true);
    });
  });

  describe('model training', () => {
    it('should train model with new data', async () => {
      const trainingData = {
        inputs: [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]],
        outputs: [[1, 0, 0], [0, 1, 0]]
      };

      await expect(
        (model as any).trainModel(trainingData)
      ).resolves.not.toThrow();
    });

    it('should handle training errors gracefully', async () => {
      const invalidData = {
        inputs: [],
        outputs: []
      };

      // Should not throw but handle gracefully
      await expect(
        (model as any).trainModel(invalidData)
      ).resolves.not.toThrow();
    });
  });

  describe('model persistence', () => {
    it('should save model state', async () => {
      await expect(model.saveModel()).resolves.not.toThrow();
    });

    it('should load model state', async () => {
      // First save the model
      await model.saveModel();
      
      // Create new model and try to load
      const newModel = new TaskPredictionModel();
      await newModel.initialize();
      
      // Should not throw even if no saved model exists
      await expect(newModel.loadModel()).resolves.not.toThrow();
      
      newModel.dispose();
    });
  });

  describe('performance optimization', () => {
    it('should handle large task histories efficiently', async () => {
      const largeHistory: TaskHistory = {
        completedTasks: Array.from({ length: 1000 }, (_, i) => ({
          id: `task-${i}`,
          title: `Task ${i}`,
          description: `Description for task ${i}`,
          priority: Math.floor(Math.random() * 5) + 1,
          estimatedDuration: Math.floor(Math.random() * 120) + 15,
          dependencies: [],
          context: { type: 'work', data: {} },
          aiGenerated: false
        })),
        patterns: [],
        preferences: {}
      };

      const startTime = Date.now();
      const predictions = await model.predictNextTasks(largeHistory, mockWorkContext, 5);
      const endTime = Date.now();
      
      expect(predictions).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should limit prediction count appropriately', async () => {
      const predictions = await model.predictNextTasks(mockTaskHistory, mockWorkContext, 10);
      expect(predictions.length).toBeLessThanOrEqual(10);
    });
  });

  describe('error handling', () => {
    it('should handle model prediction errors', async () => {
      // Mock prediction to throw error
      const mockModel = (model as any).model;
      mockModel.predict = vi.fn(() => {
        throw new Error('Prediction failed');
      });

      const predictions = await model.predictNextTasks(mockTaskHistory, mockWorkContext);
      expect(predictions).toBeDefined();
      expect(Array.isArray(predictions)).toBe(true);
    });

    it('should handle invalid input gracefully', async () => {
      const invalidHistory = null as any;
      const invalidContext = undefined as any;

      const predictions = await model.predictNextTasks(invalidHistory, invalidContext);
      expect(predictions).toBeDefined();
      expect(Array.isArray(predictions)).toBe(true);
    });
  });

  describe('model summary and diagnostics', () => {
    it('should provide model summary', () => {
      const summary = model.getModelSummary();
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
    });

    it('should provide prediction confidence metrics', async () => {
      const predictions = await model.predictNextTasks(mockTaskHistory, mockWorkContext);
      
      if (predictions.length > 0) {
        predictions.forEach(prediction => {
          expect(prediction.confidence).toBeGreaterThanOrEqual(0);
          expect(prediction.confidence).toBeLessThanOrEqual(1);
        });
      }
    });
  });

  describe('resource management', () => {
    it('should dispose resources properly', () => {
      expect(() => model.dispose()).not.toThrow();
    });

    it('should handle multiple dispose calls', () => {
      model.dispose();
      expect(() => model.dispose()).not.toThrow();
    });
  });
});