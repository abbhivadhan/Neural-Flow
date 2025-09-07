import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { ModelFineTuningPipeline, UserAdaptationData, UserInteraction } from '../ModelFineTuningPipeline';

// Mock dependencies
vi.mock('@tensorflow/tfjs', () => ({
  loadLayersModel: vi.fn(),
  model: vi.fn(),
  input: vi.fn(),
  layers: {
    dense: vi.fn(),
    dropout: vi.fn()
  },
  train: {
    adam: vi.fn()
  },
  tensor2d: vi.fn(),
  randomNormal: vi.fn(),
  metrics: {
    meanSquaredError: vi.fn()
  }
}));

vi.mock('../ModelCache', () => ({
  ModelCache: vi.fn().mockImplementation(() => ({
    cacheModel: vi.fn().mockResolvedValue(undefined),
    getModel: vi.fn().mockResolvedValue(null)
  }))
}));

vi.mock('../../privacy/EncryptionService', () => ({
  EncryptionService: vi.fn().mockImplementation(() => ({
    encryptData: vi.fn().mockResolvedValue('encrypted_data')
  }))
}));

describe('ModelFineTuningPipeline', () => {
  let pipeline: ModelFineTuningPipeline;
  let mockModel: any;
  let mockTensor: any;

  beforeEach(() => {
    pipeline = new ModelFineTuningPipeline();
    
    mockTensor = {
      shape: [1, 10],
      arraySync: vi.fn().mockReturnValue([[1, 2, 3]]),
      add: vi.fn().mockReturnThis(),
      mul: vi.fn().mockReturnThis(),
      data: vi.fn().mockResolvedValue([0.1])
    };

    mockModel = {
      inputs: [{ shape: [null, 10] }],
      layers: [
        { trainable: true },
        { trainable: true }
      ],
      apply: vi.fn().mockReturnValue(mockTensor),
      compile: vi.fn(),
      fit: vi.fn().mockResolvedValue({ history: { accuracy: [0.8] } }),
      predict: vi.fn().mockReturnValue(mockTensor),
      getWeights: vi.fn().mockReturnValue([mockTensor, mockTensor]),
      setWeights: vi.fn(),
      dispose: vi.fn()
    };

    (tf.loadLayersModel as any).mockResolvedValue(mockModel);
    (tf.model as any).mockReturnValue(mockModel);
    (tf.input as any).mockReturnValue(mockTensor);
    (tf.layers.dense as any).mockReturnValue({ apply: vi.fn().mockReturnValue(mockTensor) });
    (tf.layers.dropout as any).mockReturnValue({ apply: vi.fn().mockReturnValue(mockTensor) });
    (tf.train.adam as any).mockReturnValue({ minimize: vi.fn() });
    (tf.tensor2d as any).mockReturnValue(mockTensor);
    (tf.randomNormal as any).mockReturnValue(mockTensor);
    (tf.metrics.meanSquaredError as any).mockReturnValue(mockTensor);
  });

  afterEach(() => {
    pipeline.dispose();
    vi.clearAllMocks();
  });

  describe('User Model Initialization', () => {
    it('should initialize user model with transfer learning', async () => {
      const userId = 'user123';
      const baseModelPath = '/models/base_model.json';
      
      const userModel = await pipeline.initializeUserModel(userId, baseModelPath);
      
      expect(tf.loadLayersModel).toHaveBeenCalledWith(baseModelPath);
      expect(userModel).toBeDefined();
      expect(mockModel.layers[0].trainable).toBe(false); // Base layers should be frozen
    });

    it('should perform initial fine-tuning with provided data', async () => {
      const userId = 'user123';
      const baseModelPath = '/models/base_model.json';
      const initialData: UserAdaptationData = {
        userId,
        interactions: [{
          type: 'task_completion',
          data: { taskId: 'task1' },
          context: {
            timeOfDay: 'morning',
            workType: 'focused',
            deviceType: 'desktop',
            environmentFactors: {}
          },
          timestamp: new Date(),
          feedback: 0.8
        }],
        preferences: {
          workingHours: { start: '09:00', end: '17:00' },
          preferredTools: ['editor'],
          communicationStyle: 'direct',
          taskPriorities: { urgent: 1.0 }
        },
        behaviorPatterns: [],
        timestamp: new Date()
      };
      
      const userModel = await pipeline.initializeUserModel(userId, baseModelPath, initialData);
      
      expect(userModel).toBeDefined();
      expect(mockModel.fit).toHaveBeenCalled();
    });

    it('should handle model initialization errors gracefully', async () => {
      const userId = 'user123';
      const baseModelPath = '/invalid/path.json';
      
      (tf.loadLayersModel as any).mockRejectedValue(new Error('Model not found'));
      
      await expect(pipeline.initializeUserModel(userId, baseModelPath))
        .rejects.toThrow('Model initialization failed for user user123');
    });
  });

  describe('Incremental Learning', () => {
    beforeEach(async () => {
      await pipeline.initializeUserModel('user123', '/models/base_model.json');
    });

    it('should perform incremental learning with new data', async () => {
      const userId = 'user123';
      const newData: UserAdaptationData = {
        userId,
        interactions: [{
          type: 'preference_change',
          data: { setting: 'theme', value: 'dark' },
          context: {
            timeOfDay: 'evening',
            workType: 'casual',
            deviceType: 'mobile',
            environmentFactors: {}
          },
          timestamp: new Date(),
          feedback: 0.9
        }],
        preferences: {
          workingHours: { start: '10:00', end: '18:00' },
          preferredTools: ['editor', 'terminal'],
          communicationStyle: 'friendly',
          taskPriorities: { normal: 0.5 }
        },
        behaviorPatterns: [],
        timestamp: new Date()
      };
      
      await expect(pipeline.performIncrementalLearning(userId, newData))
        .resolves.not.toThrow();
      
      expect(mockModel.fit).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        expect.objectContaining({
          epochs: 5,
          batchSize: 1,
          verbose: 0,
          validationSplit: 0.2
        })
      );
    });

    it('should handle incremental learning for non-existent user', async () => {
      const userId = 'nonexistent';
      const newData: UserAdaptationData = {
        userId,
        interactions: [],
        preferences: {
          workingHours: { start: '09:00', end: '17:00' },
          preferredTools: [],
          communicationStyle: 'neutral',
          taskPriorities: {}
        },
        behaviorPatterns: [],
        timestamp: new Date()
      };
      
      await expect(pipeline.performIncrementalLearning(userId, newData))
        .rejects.toThrow('No model found for user nonexistent');
    });
  });

  describe('Federated Learning', () => {
    beforeEach(async () => {
      await pipeline.initializeUserModel('user123', '/models/base_model.json');
    });

    it('should participate in federated learning with privacy preservation', async () => {
      const userId = 'user123';
      const globalUpdate = {
        modelWeights: [mockTensor],
        userId: 'global',
        updateId: 'update1',
        privacy: {
          isEncrypted: true,
          noiseLevel: 0.1
        }
      };
      
      const federatedUpdate = await pipeline.participateInFederatedLearning(userId, globalUpdate);
      
      expect(federatedUpdate).toBeDefined();
      expect(federatedUpdate.userId).toBe(userId);
      expect(federatedUpdate.privacy.isEncrypted).toBe(true);
      expect(federatedUpdate.privacy.noiseLevel).toBe(0.1);
    });

    it('should apply differential privacy to model weights', async () => {
      const userId = 'user123';
      const globalUpdate = {
        modelWeights: [],
        userId: 'global',
        updateId: 'update1',
        privacy: {
          isEncrypted: true,
          noiseLevel: 0.1
        }
      };
      
      const federatedUpdate = await pipeline.participateInFederatedLearning(userId, globalUpdate);
      
      expect(tf.randomNormal).toHaveBeenCalled(); // Noise should be added
      expect(federatedUpdate.modelWeights).toBeDefined();
    });
  });

  describe('Model Versioning', () => {
    beforeEach(async () => {
      await pipeline.initializeUserModel('user123', '/models/base_model.json');
    });

    it('should create model versions with metadata', async () => {
      const userId = 'user123';
      const trainingData: UserAdaptationData[] = [{
        userId,
        interactions: [],
        preferences: {
          workingHours: { start: '09:00', end: '17:00' },
          preferredTools: [],
          communicationStyle: 'neutral',
          taskPriorities: {}
        },
        behaviorPatterns: [],
        timestamp: new Date()
      }];
      
      const version = await pipeline.createModelVersion(userId, mockModel, trainingData);
      
      expect(version).toBeDefined();
      expect(version.userId).toBe(userId);
      expect(version.version).toBe(2); // Should be second version (first created during init)
      expect(version.isActive).toBe(true);
      expect(version.metadata.dataPoints).toBe(1);
    });

    it('should deactivate previous versions when creating new one', async () => {
      const userId = 'user123';
      const trainingData: UserAdaptationData[] = [];
      
      // Create first additional version
      await pipeline.createModelVersion(userId, mockModel, trainingData);
      
      // Create second additional version
      const secondVersion = await pipeline.createModelVersion(userId, mockModel, trainingData);
      
      const versions = pipeline.getModelVersions(userId);
      expect(versions.length).toBe(3); // Initial + 2 additional
      expect(versions.filter(v => v.isActive).length).toBe(1); // Only one active
      expect(secondVersion.isActive).toBe(true);
    });

    it('should rollback to previous model version', async () => {
      const userId = 'user123';
      const trainingData: UserAdaptationData[] = [];
      
      // Create additional version
      await pipeline.createModelVersion(userId, mockModel, trainingData);
      
      // Mock the model cache to return a model for rollback
      const mockCache = (pipeline as any).modelCache;
      mockCache.getModel.mockResolvedValueOnce(mockModel);
      
      // Rollback to version 1
      const rolledBackModel = await pipeline.rollbackModel(userId, 1);
      
      expect(rolledBackModel).toBeDefined();
      
      const activeVersion = pipeline.getActiveModelVersion(userId);
      expect(activeVersion?.version).toBe(1);
      expect(activeVersion?.metadata.rollbackReason).toBe('Manual rollback requested');
    });

    it('should handle rollback to non-existent version', async () => {
      const userId = 'user123';
      
      await expect(pipeline.rollbackModel(userId, 999))
        .rejects.toThrow('Version 999 not found for user user123');
    });
  });

  describe('Feature Engineering', () => {
    it('should extract numerical features from interactions', () => {
      const interaction: UserInteraction = {
        type: 'task_completion',
        data: { taskId: 'task1' },
        context: {
          timeOfDay: 'morning',
          workType: 'focused',
          deviceType: 'desktop',
          environmentFactors: {}
        },
        timestamp: new Date('2023-01-01T09:00:00Z'),
        feedback: 0.8
      };
      
      const preferences = {
        workingHours: { start: '09:00', end: '17:00' },
        preferredTools: ['editor'],
        communicationStyle: 'direct',
        taskPriorities: { urgent: 1.0 }
      };
      
      // Access private method through any cast for testing
      const features = (pipeline as any).extractFeatures(interaction, preferences);
      
      expect(features).toBeInstanceOf(Array);
      expect(features.length).toBeGreaterThan(0);
      // Time feature should be between 0 and 1
      expect(features[0]).toBeGreaterThanOrEqual(0);
      expect(features[0]).toBeLessThanOrEqual(1);
    });

    it('should encode interaction types correctly', () => {
      const typeMap = {
        'task_completion': 0.25,
        'preference_change': 0.5,
        'workflow_pattern': 0.75,
        'content_generation': 1.0
      };
      
      Object.entries(typeMap).forEach(([type, expectedValue]) => {
        const encoded = (pipeline as any).encodeInteractionType(type);
        expect(encoded).toBe(expectedValue);
      });
    });

    it('should handle unknown interaction types', () => {
      const encoded = (pipeline as any).encodeInteractionType('unknown_type');
      expect(encoded).toBe(0);
    });
  });

  describe('Privacy and Security', () => {
    it('should add differential privacy noise to weights', () => {
      const weights = [mockTensor, mockTensor];
      const privacyBudget = 0.1;
      
      const noisyWeights = (pipeline as any).addDifferentialPrivacy(weights, privacyBudget);
      
      expect(noisyWeights).toHaveLength(weights.length);
      expect(tf.randomNormal).toHaveBeenCalledWith(mockTensor.shape, 0, privacyBudget);
    });

    it('should handle model accuracy evaluation', async () => {
      const testData: UserAdaptationData[] = [{
        userId: 'user123',
        interactions: [{
          type: 'task_completion',
          data: {},
          context: {
            timeOfDay: 'morning',
            workType: 'focused',
            deviceType: 'desktop',
            environmentFactors: {}
          },
          timestamp: new Date(),
          feedback: 0.8
        }],
        preferences: {
          workingHours: { start: '09:00', end: '17:00' },
          preferredTools: [],
          communicationStyle: 'neutral',
          taskPriorities: {}
        },
        behaviorPatterns: [],
        timestamp: new Date()
      }];
      
      const accuracy = await (pipeline as any).evaluateModelAccuracy(mockModel, testData);
      
      expect(accuracy).toBeGreaterThanOrEqual(0);
      expect(accuracy).toBeLessThanOrEqual(1);
    });
  });

  describe('Resource Management', () => {
    it('should dispose of resources properly', () => {
      pipeline.dispose();
      
      // Verify cleanup
      expect(pipeline.getModelVersions('user123')).toEqual([]);
    });

    it('should handle concurrent model operations', async () => {
      const userId = 'user123';
      const baseModelPath = '/models/base_model.json';
      
      // Simulate concurrent initialization
      const promises = Array(3).fill(0).map(() => 
        pipeline.initializeUserModel(`${userId}_${Math.random()}`, baseModelPath)
      );
      
      const results = await Promise.allSettled(promises);
      
      // All should succeed or fail gracefully
      results.forEach(result => {
        if (result.status === 'rejected') {
          expect(result.reason).toBeInstanceOf(Error);
        }
      });
    });
  });
});