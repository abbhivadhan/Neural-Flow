import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UserAdaptationService, AdaptationConfig } from '../UserAdaptationService';
import { UserInteraction } from '../ModelFineTuningPipeline';

// Mock dependencies
vi.mock('../ModelFineTuningPipeline', () => ({
  ModelFineTuningPipeline: vi.fn().mockImplementation(() => ({
    initializeUserModel: vi.fn().mockResolvedValue({}),
    performIncrementalLearning: vi.fn().mockResolvedValue(undefined),
    participateInFederatedLearning: vi.fn().mockResolvedValue({}),
    getModelVersions: vi.fn().mockReturnValue([]),
    getActiveModelVersion: vi.fn().mockReturnValue(null),
    rollbackModel: vi.fn().mockResolvedValue({}),
    dispose: vi.fn()
  }))
}));

vi.mock('../BehavioralPatternModel', () => ({
  BehavioralPatternModel: vi.fn().mockImplementation(() => ({
    initializeUserModel: vi.fn().mockResolvedValue(undefined),
    analyzeInteraction: vi.fn().mockResolvedValue([]),
    updatePatterns: vi.fn().mockResolvedValue(undefined)
  }))
}));

vi.mock('../TaskPredictionModel', () => ({
  TaskPredictionModel: vi.fn().mockImplementation(() => ({
    initializeUserModel: vi.fn().mockResolvedValue(undefined),
    adaptToUser: vi.fn().mockResolvedValue(undefined)
  }))
}));

vi.mock('../../privacy/EncryptionService', () => ({
  EncryptionService: vi.fn().mockImplementation(() => ({
    encryptData: vi.fn().mockResolvedValue('encrypted_data')
  }))
}));

describe('UserAdaptationService', () => {
  let service: UserAdaptationService;
  let mockConfig: AdaptationConfig;
  let mockInteraction: UserInteraction;

  beforeEach(() => {
    service = new UserAdaptationService();
    
    mockConfig = {
      enableIncrementalLearning: true,
      enableFederatedLearning: true,
      privacyLevel: 'medium',
      adaptationFrequency: 'realtime',
      rollbackThreshold: 0.1
    };

    mockInteraction = {
      type: 'task_completion',
      data: { taskId: 'task1', success: true },
      context: {
        timeOfDay: 'morning',
        workType: 'focused',
        deviceType: 'desktop',
        environmentFactors: { lighting: 'bright', noise: 'quiet' }
      },
      timestamp: new Date(),
      feedback: 0.85
    };
  });

  afterEach(() => {
    service.dispose();
    vi.clearAllMocks();
  });

  describe('User Adaptation Initialization', () => {
    it('should initialize user adaptation with configuration', async () => {
      const userId = 'user123';
      
      await expect(service.initializeUserAdaptation(userId, mockConfig))
        .resolves.not.toThrow();
      
      const metrics = service.getUserMetrics(userId);
      expect(metrics).toBeDefined();
      expect(metrics?.userId).toBe(userId);
      expect(metrics?.privacyScore).toBeGreaterThan(0);
    });

    it('should initialize with initial data', async () => {
      const userId = 'user123';
      const initialData = {
        userId,
        interactions: [mockInteraction],
        preferences: {
          workingHours: { start: '09:00', end: '17:00' },
          preferredTools: ['editor', 'terminal'],
          communicationStyle: 'direct',
          taskPriorities: { urgent: 1.0, normal: 0.5 }
        },
        behaviorPatterns: [],
        timestamp: new Date()
      };
      
      await expect(service.initializeUserAdaptation(userId, mockConfig, initialData))
        .resolves.not.toThrow();
      
      const metrics = service.getUserMetrics(userId);
      expect(metrics?.adaptationCount).toBe(0); // Initial state
    });

    it('should handle initialization errors gracefully', async () => {
      const userId = 'user123';
      const invalidConfig = { ...mockConfig, privacyLevel: 'invalid' as any };
      
      // Should not throw but may log warnings
      await expect(service.initializeUserAdaptation(userId, invalidConfig))
        .resolves.not.toThrow();
    });
  });

  describe('User Interaction Processing', () => {
    beforeEach(async () => {
      await service.initializeUserAdaptation('user123', mockConfig);
    });

    it('should process user interaction in realtime mode', async () => {
      const userId = 'user123';
      
      await expect(service.processUserInteraction(userId, mockInteraction))
        .resolves.not.toThrow();
      
      const metrics = service.getUserMetrics(userId);
      expect(metrics?.adaptationCount).toBe(1);
      expect(metrics?.lastUpdated).toBeInstanceOf(Date);
    });

    it('should queue interactions for non-realtime processing', async () => {
      const userId = 'user123';
      const batchConfig = { ...mockConfig, adaptationFrequency: 'hourly' as const };
      
      service.updateAdaptationConfig(userId, batchConfig);
      
      await expect(service.processUserInteraction(userId, mockInteraction))
        .resolves.not.toThrow();
      
      // Interaction should be queued, not immediately processed
      const metrics = service.getUserMetrics(userId);
      expect(metrics?.adaptationCount).toBe(1); // Updated but not adapted yet
    });

    it('should handle interactions for non-configured users', async () => {
      const userId = 'unconfigured_user';
      
      // Should not throw but should log warning
      await expect(service.processUserInteraction(userId, mockInteraction))
        .resolves.not.toThrow();
    });

    it('should update performance metrics based on feedback', async () => {
      const userId = 'user123';
      const highFeedbackInteraction = { ...mockInteraction, feedback: 0.95 };
      
      await service.processUserInteraction(userId, highFeedbackInteraction);
      
      const metrics = service.getUserMetrics(userId);
      expect(metrics?.performanceScore).toBe(0.95);
    });
  });

  describe('Privacy Protection', () => {
    beforeEach(async () => {
      await service.initializeUserAdaptation('user123', mockConfig);
    });

    it('should apply high privacy protection', async () => {
      const userId = 'user123';
      const highPrivacyConfig = { ...mockConfig, privacyLevel: 'high' as const };
      
      service.updateAdaptationConfig(userId, highPrivacyConfig);
      
      await service.processUserInteraction(userId, mockInteraction);
      
      const metrics = service.getUserMetrics(userId);
      expect(metrics?.privacyScore).toBeGreaterThan(0.7); // High privacy should increase score
    });

    it('should apply medium privacy protection', async () => {
      const userId = 'user123';
      
      await service.processUserInteraction(userId, mockInteraction);
      
      const metrics = service.getUserMetrics(userId);
      expect(metrics?.privacyScore).toBeGreaterThan(0.5);
      expect(metrics?.privacyScore).toBeLessThan(0.8);
    });

    it('should apply low privacy protection', async () => {
      const userId = 'user123';
      const lowPrivacyConfig = { ...mockConfig, privacyLevel: 'low' as const };
      
      service.updateAdaptationConfig(userId, lowPrivacyConfig);
      
      await service.processUserInteraction(userId, mockInteraction);
      
      const metrics = service.getUserMetrics(userId);
      expect(metrics?.privacyScore).toBeLessThan(0.7);
    });

    it('should disable federated learning for higher privacy', async () => {
      const userId = 'user123';
      const noFederatedConfig = { ...mockConfig, enableFederatedLearning: false };
      
      service.updateAdaptationConfig(userId, noFederatedConfig);
      
      const metrics = service.getUserMetrics(userId);
      expect(metrics?.privacyScore).toBeGreaterThan(0.6); // Should increase privacy score
    });
  });

  describe('Model Versioning and Rollback', () => {
    beforeEach(async () => {
      await service.initializeUserAdaptation('user123', mockConfig);
    });

    it('should get model versions for user', () => {
      const userId = 'user123';
      
      const versions = service.getModelVersions(userId);
      expect(Array.isArray(versions)).toBe(true);
    });

    it('should rollback user model', async () => {
      const userId = 'user123';
      
      await expect(service.rollbackUserModel(userId, 1))
        .resolves.not.toThrow();
      
      const metrics = service.getUserMetrics(userId);
      expect(metrics?.lastUpdated).toBeInstanceOf(Date);
    });

    it('should rollback to previous version when no target specified', async () => {
      const userId = 'user123';
      
      await expect(service.rollbackUserModel(userId))
        .resolves.not.toThrow();
    });
  });

  describe('Configuration Management', () => {
    beforeEach(async () => {
      await service.initializeUserAdaptation('user123', mockConfig);
    });

    it('should update adaptation configuration', () => {
      const userId = 'user123';
      const updates = {
        privacyLevel: 'high' as const,
        adaptationFrequency: 'daily' as const
      };
      
      service.updateAdaptationConfig(userId, updates);
      
      const metrics = service.getUserMetrics(userId);
      expect(metrics?.privacyScore).toBeGreaterThan(0.7); // Should reflect high privacy
    });

    it('should handle partial configuration updates', () => {
      const userId = 'user123';
      const partialUpdate = { enableIncrementalLearning: false };
      
      expect(() => service.updateAdaptationConfig(userId, partialUpdate))
        .not.toThrow();
    });

    it('should ignore updates for non-existent users', () => {
      const userId = 'nonexistent';
      const updates = { privacyLevel: 'high' as const };
      
      expect(() => service.updateAdaptationConfig(userId, updates))
        .not.toThrow();
    });
  });

  describe('Data Export and Deletion', () => {
    beforeEach(async () => {
      await service.initializeUserAdaptation('user123', mockConfig);
    });

    it('should export user model data', async () => {
      const userId = 'user123';
      
      const exportedData = await service.exportUserModelData(userId);
      
      expect(exportedData).toBeDefined();
      expect(exportedData.userId).toBe(userId);
      expect(exportedData.exportedAt).toBeInstanceOf(Date);
      expect(exportedData.versions).toBeDefined();
      expect(exportedData.metrics).toBeDefined();
      expect(exportedData.config).toBeDefined();
    });

    it('should delete user model data', async () => {
      const userId = 'user123';
      
      await expect(service.deleteUserModelData(userId))
        .resolves.not.toThrow();
      
      const metrics = service.getUserMetrics(userId);
      expect(metrics).toBeNull();
    });

    it('should handle export for non-existent user', async () => {
      const userId = 'nonexistent';
      
      const exportedData = await service.exportUserModelData(userId);
      
      expect(exportedData.userId).toBe(userId);
      expect(exportedData.versions).toEqual([]);
      expect(exportedData.metrics).toBeNull();
    });
  });

  describe('Performance Monitoring', () => {
    beforeEach(async () => {
      await service.initializeUserAdaptation('user123', mockConfig);
    });

    it('should calculate privacy score correctly', () => {
      const highPrivacyConfig = {
        ...mockConfig,
        privacyLevel: 'high' as const,
        enableFederatedLearning: false,
        adaptationFrequency: 'daily' as const
      };
      
      const privacyScore = (service as any).calculatePrivacyScore(highPrivacyConfig);
      expect(privacyScore).toBeGreaterThan(0.8);
    });

    it('should calculate performance score from interaction', () => {
      const highPerformanceInteraction = { ...mockInteraction, feedback: 0.9 };
      
      const performanceScore = (service as any).calculatePerformanceScore(highPerformanceInteraction);
      expect(performanceScore).toBe(0.9);
    });

    it('should handle interactions without feedback', () => {
      const noFeedbackInteraction = { ...mockInteraction, feedback: undefined };
      
      const performanceScore = (service as any).calculatePerformanceScore(noFeedbackInteraction);
      expect(performanceScore).toBe(0.5); // Default value
    });
  });

  describe('Batch Processing', () => {
    beforeEach(async () => {
      const batchConfig = { ...mockConfig, adaptationFrequency: 'hourly' as const };
      await service.initializeUserAdaptation('user123', batchConfig);
    });

    it('should queue multiple interactions for batch processing', async () => {
      const userId = 'user123';
      const interactions = [
        mockInteraction,
        { ...mockInteraction, type: 'preference_change' as const },
        { ...mockInteraction, type: 'workflow_pattern' as const }
      ];
      
      for (const interaction of interactions) {
        await service.processUserInteraction(userId, interaction);
      }
      
      const metrics = service.getUserMetrics(userId);
      expect(metrics?.adaptationCount).toBe(3); // All interactions processed
    });
  });

  describe('Error Handling', () => {
    it('should handle service initialization errors', () => {
      expect(() => new UserAdaptationService()).not.toThrow();
    });

    it('should handle processing errors gracefully', async () => {
      const userId = 'user123';
      await service.initializeUserAdaptation(userId, mockConfig);
      
      const invalidInteraction = { ...mockInteraction, type: 'invalid_type' as any };
      
      await expect(service.processUserInteraction(userId, invalidInteraction))
        .resolves.not.toThrow();
    });

    it('should handle rollback errors gracefully', async () => {
      const userId = 'user123';
      await service.initializeUserAdaptation(userId, mockConfig);
      
      // Mock the fine-tuning pipeline to throw an error
      const mockPipeline = (service as any).fineTuningPipeline;
      mockPipeline.rollbackModel.mockRejectedValueOnce(new Error('Rollback failed'));
      
      // Try to rollback to non-existent version
      await expect(service.rollbackUserModel(userId, 999))
        .rejects.toThrow('Rollback failed');
    });
  });

  describe('Resource Management', () => {
    it('should dispose of resources properly', () => {
      expect(() => service.dispose()).not.toThrow();
    });

    it('should handle concurrent operations', async () => {
      const userId = 'user123';
      await service.initializeUserAdaptation(userId, mockConfig);
      
      // Simulate concurrent interactions
      const promises = Array(5).fill(0).map((_, i) => 
        service.processUserInteraction(userId, { 
          ...mockInteraction, 
          data: { taskId: `task${i}` } 
        })
      );
      
      await expect(Promise.all(promises)).resolves.not.toThrow();
      
      const metrics = service.getUserMetrics(userId);
      expect(metrics?.adaptationCount).toBe(5);
    });
  });
});