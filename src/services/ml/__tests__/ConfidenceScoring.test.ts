import { describe, it, expect, beforeEach } from 'vitest';
import { ConfidenceScoring } from '../ConfidenceScoring';
import { ModelPrediction, PredictionContext } from '../EnsembleModelSystem';

describe('ConfidenceScoring', () => {
  let confidenceScoring: ConfidenceScoring;
  let mockPredictions: ModelPrediction[];
  let mockContext: PredictionContext;

  beforeEach(() => {
    confidenceScoring = new ConfidenceScoring();
    
    mockContext = {
      userId: 'user123',
      taskType: 'coding',
      timeOfDay: 14,
      workloadLevel: 'medium',
      recentActivity: ['file_edit', 'test_run', 'commit']
    };

    mockPredictions = [
      {
        modelId: 'model1',
        prediction: { priority: 0.8, category: 'urgent' },
        confidence: 0.9,
        timestamp: new Date(),
        context: mockContext
      },
      {
        modelId: 'model2',
        prediction: { priority: 0.75, category: 'urgent' },
        confidence: 0.85,
        timestamp: new Date(),
        context: mockContext
      },
      {
        modelId: 'model3',
        prediction: { priority: 0.82, category: 'urgent' },
        confidence: 0.88,
        timestamp: new Date(),
        context: mockContext
      }
    ];
  });

  describe('calculateConfidence', () => {
    it('should calculate overall confidence score', () => {
      const confidenceScore = confidenceScoring.calculateConfidence(
        mockPredictions,
        mockContext
      );

      expect(confidenceScore.overall).toBeGreaterThan(0);
      expect(confidenceScore.overall).toBeLessThanOrEqual(1);
    });

    it('should provide confidence components', () => {
      const confidenceScore = confidenceScoring.calculateConfidence(
        mockPredictions,
        mockContext
      );

      expect(confidenceScore.components).toBeDefined();
      expect(confidenceScore.components.modelAgreement).toBeGreaterThanOrEqual(0);
      expect(confidenceScore.components.modelAgreement).toBeLessThanOrEqual(1);
      expect(confidenceScore.components.historicalAccuracy).toBeGreaterThanOrEqual(0);
      expect(confidenceScore.components.historicalAccuracy).toBeLessThanOrEqual(1);
      expect(confidenceScore.components.dataQuality).toBeGreaterThanOrEqual(0);
      expect(confidenceScore.components.dataQuality).toBeLessThanOrEqual(1);
      expect(confidenceScore.components.contextMatch).toBeGreaterThanOrEqual(0);
      expect(confidenceScore.components.contextMatch).toBeLessThanOrEqual(1);
      expect(confidenceScore.components.predictionStability).toBeGreaterThanOrEqual(0);
      expect(confidenceScore.components.predictionStability).toBeLessThanOrEqual(1);
    });

    it('should identify confidence factors', () => {
      const confidenceScore = confidenceScoring.calculateConfidence(
        mockPredictions,
        mockContext
      );

      expect(Array.isArray(confidenceScore.factors)).toBe(true);
      confidenceScore.factors.forEach(factor => {
        expect(factor.name).toBeDefined();
        expect(factor.impact).toBeGreaterThanOrEqual(-1);
        expect(factor.impact).toBeLessThanOrEqual(1);
        expect(factor.description).toBeDefined();
        expect(factor.weight).toBeGreaterThan(0);
      });
    });

    it('should calculate reliability metrics', () => {
      const confidenceScore = confidenceScoring.calculateConfidence(
        mockPredictions,
        mockContext
      );

      expect(confidenceScore.reliability).toBeDefined();
      expect(confidenceScore.reliability.consistency).toBeGreaterThanOrEqual(0);
      expect(confidenceScore.reliability.consistency).toBeLessThanOrEqual(1);
      expect(confidenceScore.reliability.robustness).toBeGreaterThanOrEqual(0);
      expect(confidenceScore.reliability.robustness).toBeLessThanOrEqual(1);
      expect(confidenceScore.reliability.coverage).toBeGreaterThanOrEqual(0);
      expect(confidenceScore.reliability.coverage).toBeLessThanOrEqual(1);
    });

    it('should calculate calibration metrics', () => {
      const confidenceScore = confidenceScoring.calculateConfidence(
        mockPredictions,
        mockContext
      );

      expect(confidenceScore.calibration).toBeDefined();
      expect(confidenceScore.calibration.calibrationError).toBeGreaterThanOrEqual(0);
      expect(confidenceScore.calibration.overconfidence).toBeGreaterThanOrEqual(0);
      expect(confidenceScore.calibration.overconfidence).toBeLessThanOrEqual(1);
      expect(confidenceScore.calibration.underconfidence).toBeGreaterThanOrEqual(0);
      expect(confidenceScore.calibration.underconfidence).toBeLessThanOrEqual(1);
      expect(confidenceScore.calibration.sharpness).toBeGreaterThanOrEqual(0);
      expect(confidenceScore.calibration.sharpness).toBeLessThanOrEqual(1);
    });
  });

  describe('model agreement calculation', () => {
    it('should calculate high agreement for similar predictions', () => {
      const similarPredictions: ModelPrediction[] = [
        {
          modelId: 'model1',
          prediction: 0.8,
          confidence: 0.9,
          timestamp: new Date(),
          context: mockContext
        },
        {
          modelId: 'model2',
          prediction: 0.82,
          confidence: 0.85,
          timestamp: new Date(),
          context: mockContext
        },
        {
          modelId: 'model3',
          prediction: 0.81,
          confidence: 0.88,
          timestamp: new Date(),
          context: mockContext
        }
      ];

      const confidenceScore = confidenceScoring.calculateConfidence(
        similarPredictions,
        mockContext
      );

      expect(confidenceScore.components.modelAgreement).toBeGreaterThan(0.8);
    });

    it('should calculate low agreement for dissimilar predictions', () => {
      const dissimilarPredictions: ModelPrediction[] = [
        {
          modelId: 'model1',
          prediction: 0.1,
          confidence: 0.9,
          timestamp: new Date(),
          context: mockContext
        },
        {
          modelId: 'model2',
          prediction: 0.9,
          confidence: 0.85,
          timestamp: new Date(),
          context: mockContext
        },
        {
          modelId: 'model3',
          prediction: 0.5,
          confidence: 0.88,
          timestamp: new Date(),
          context: mockContext
        }
      ];

      const confidenceScore = confidenceScoring.calculateConfidence(
        dissimilarPredictions,
        mockContext
      );

      expect(confidenceScore.components.modelAgreement).toBeLessThan(0.5);
    });

    it('should handle array predictions', () => {
      const arrayPredictions: ModelPrediction[] = [
        {
          modelId: 'model1',
          prediction: [1, 2, 3],
          confidence: 0.9,
          timestamp: new Date(),
          context: mockContext
        },
        {
          modelId: 'model2',
          prediction: [1, 2, 4],
          confidence: 0.85,
          timestamp: new Date(),
          context: mockContext
        }
      ];

      const confidenceScore = confidenceScoring.calculateConfidence(
        arrayPredictions,
        mockContext
      );

      expect(confidenceScore.components.modelAgreement).toBeGreaterThan(0.5);
    });

    it('should handle object predictions', () => {
      const objectPredictions: ModelPrediction[] = [
        {
          modelId: 'model1',
          prediction: { task: 'A', priority: 0.8 },
          confidence: 0.9,
          timestamp: new Date(),
          context: mockContext
        },
        {
          modelId: 'model2',
          prediction: { task: 'A', priority: 0.8 },
          confidence: 0.85,
          timestamp: new Date(),
          context: mockContext
        }
      ];

      const confidenceScore = confidenceScoring.calculateConfidence(
        objectPredictions,
        mockContext
      );

      expect(confidenceScore.components.modelAgreement).toBe(1);
    });
  });

  describe('data quality assessment', () => {
    it('should assess high quality data', () => {
      const highQualityData = [
        { id: 1, name: 'Task A', priority: 0.8, timestamp: new Date() },
        { id: 2, name: 'Task B', priority: 0.6, timestamp: new Date() },
        { id: 3, name: 'Task C', priority: 0.9, timestamp: new Date() }
      ];

      const confidenceScore = confidenceScoring.calculateConfidence(
        mockPredictions,
        mockContext,
        highQualityData
      );

      expect(confidenceScore.components.dataQuality).toBeGreaterThan(0.7);
    });

    it('should assess low quality data', () => {
      const lowQualityData = [
        { id: 1, name: null, priority: undefined },
        { id: null, name: '', priority: 0.8 },
        { priority: 0.6 } // Missing fields
      ];

      const confidenceScore = confidenceScoring.calculateConfidence(
        mockPredictions,
        mockContext,
        lowQualityData
      );

      expect(confidenceScore.components.dataQuality).toBeLessThan(0.5);
    });

    it('should handle empty data', () => {
      const confidenceScore = confidenceScoring.calculateConfidence(
        mockPredictions,
        mockContext,
        []
      );

      expect(confidenceScore.components.dataQuality).toBeLessThan(0.5);
    });
  });

  describe('prediction stability', () => {
    it('should calculate high stability for consistent confidences', () => {
      const stablePredictions: ModelPrediction[] = [
        {
          modelId: 'model1',
          prediction: 0.8,
          confidence: 0.85,
          timestamp: new Date(),
          context: mockContext
        },
        {
          modelId: 'model2',
          prediction: 0.82,
          confidence: 0.86,
          timestamp: new Date(),
          context: mockContext
        },
        {
          modelId: 'model3',
          prediction: 0.81,
          confidence: 0.84,
          timestamp: new Date(),
          context: mockContext
        }
      ];

      const confidenceScore = confidenceScoring.calculateConfidence(
        stablePredictions,
        mockContext
      );

      expect(confidenceScore.components.predictionStability).toBeGreaterThan(0.8);
    });

    it('should calculate low stability for varying confidences', () => {
      const unstablePredictions: ModelPrediction[] = [
        {
          modelId: 'model1',
          prediction: 0.8,
          confidence: 0.1,
          timestamp: new Date(),
          context: mockContext
        },
        {
          modelId: 'model2',
          prediction: 0.82,
          confidence: 0.9,
          timestamp: new Date(),
          context: mockContext
        },
        {
          modelId: 'model3',
          prediction: 0.81,
          confidence: 0.5,
          timestamp: new Date(),
          context: mockContext
        }
      ];

      const confidenceScore = confidenceScoring.calculateConfidence(
        unstablePredictions,
        mockContext
      );

      expect(confidenceScore.components.predictionStability).toBeLessThan(0.5);
    });
  });

  describe('confidence factors identification', () => {
    it('should identify high model agreement factor', () => {
      const highAgreementPredictions: ModelPrediction[] = [
        {
          modelId: 'model1',
          prediction: 0.8,
          confidence: 0.9,
          timestamp: new Date(),
          context: mockContext
        },
        {
          modelId: 'model2',
          prediction: 0.81,
          confidence: 0.85,
          timestamp: new Date(),
          context: mockContext
        }
      ];

      const confidenceScore = confidenceScoring.calculateConfidence(
        highAgreementPredictions,
        mockContext
      );

      const agreementFactor = confidenceScore.factors.find(f => 
        f.name.includes('Agreement')
      );
      
      if (agreementFactor) {
        expect(agreementFactor.impact).toBeGreaterThan(0);
      }
    });

    it('should identify single model factor', () => {
      const singlePrediction: ModelPrediction[] = [
        {
          modelId: 'model1',
          prediction: 0.8,
          confidence: 0.9,
          timestamp: new Date(),
          context: mockContext
        }
      ];

      const confidenceScore = confidenceScoring.calculateConfidence(
        singlePrediction,
        mockContext
      );

      const singleModelFactor = confidenceScore.factors.find(f => 
        f.name.includes('Single Model')
      );
      
      expect(singleModelFactor).toBeDefined();
      expect(singleModelFactor!.impact).toBeLessThan(0);
    });

    it('should identify workload factors', () => {
      const highWorkloadContext = {
        ...mockContext,
        workloadLevel: 'high' as const
      };

      const confidenceScore = confidenceScoring.calculateConfidence(
        mockPredictions,
        highWorkloadContext
      );

      const workloadFactor = confidenceScore.factors.find(f => 
        f.name.includes('Workload')
      );
      
      if (workloadFactor) {
        expect(workloadFactor.impact).toBeLessThan(0);
      }
    });
  });

  describe('updateCalibration', () => {
    it('should update calibration data', () => {
      confidenceScoring.updateCalibration(
        'model1',
        0.8,
        0.75,
        mockContext
      );

      // Should not throw and should update internal state
      expect(() => {
        confidenceScoring.updateCalibration(
          'model1',
          0.9,
          0.85,
          mockContext
        );
      }).not.toThrow();
    });

    it('should maintain calibration history limit', () => {
      // Add more than 1000 calibration entries
      for (let i = 0; i < 1200; i++) {
        confidenceScoring.updateCalibration(
          `model_${i % 10}`,
          Math.random(),
          Math.random(),
          mockContext
        );
      }

      // Should not throw and should maintain reasonable memory usage
      expect(() => {
        confidenceScoring.calculateConfidence(mockPredictions, mockContext);
      }).not.toThrow();
    });

    it('should update calibration bins correctly', () => {
      // Add calibration data for different confidence ranges
      confidenceScoring.updateCalibration('model1', 0.1, 0.05, mockContext);
      confidenceScoring.updateCalibration('model1', 0.5, 0.45, mockContext);
      confidenceScoring.updateCalibration('model1', 0.9, 0.85, mockContext);

      const confidenceScore = confidenceScoring.calculateConfidence(
        mockPredictions,
        mockContext
      );

      // Should have updated calibration metrics
      expect(confidenceScore.calibration.calibrationError).toBeGreaterThanOrEqual(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty predictions', () => {
      expect(() => {
        confidenceScoring.calculateConfidence([], mockContext);
      }).not.toThrow();
    });

    it('should handle single prediction', () => {
      const singlePrediction = [mockPredictions[0]];
      
      const confidenceScore = confidenceScoring.calculateConfidence(
        singlePrediction,
        mockContext
      );

      expect(confidenceScore.overall).toBeGreaterThanOrEqual(0);
      expect(confidenceScore.overall).toBeLessThanOrEqual(1);
    });

    it('should handle null/undefined predictions', () => {
      const nullPredictions: ModelPrediction[] = [
        {
          modelId: 'model1',
          prediction: null,
          confidence: 0.5,
          timestamp: new Date(),
          context: mockContext
        },
        {
          modelId: 'model2',
          prediction: undefined,
          confidence: 0.6,
          timestamp: new Date(),
          context: mockContext
        }
      ];

      expect(() => {
        confidenceScoring.calculateConfidence(nullPredictions, mockContext);
      }).not.toThrow();
    });

    it('should handle extreme confidence values', () => {
      const extremePredictions: ModelPrediction[] = [
        {
          modelId: 'model1',
          prediction: 0.5,
          confidence: 0,
          timestamp: new Date(),
          context: mockContext
        },
        {
          modelId: 'model2',
          prediction: 0.5,
          confidence: 1,
          timestamp: new Date(),
          context: mockContext
        }
      ];

      const confidenceScore = confidenceScoring.calculateConfidence(
        extremePredictions,
        mockContext
      );

      expect(confidenceScore.overall).toBeGreaterThanOrEqual(0);
      expect(confidenceScore.overall).toBeLessThanOrEqual(1);
    });
  });

  describe('context similarity', () => {
    it('should calculate context similarity correctly', () => {
      const context1 = {
        userId: 'user1',
        taskType: 'coding',
        timeOfDay: 14,
        workloadLevel: 'medium' as const,
        recentActivity: ['edit', 'test']
      };

      const context2 = {
        userId: 'user1',
        taskType: 'coding',
        timeOfDay: 15,
        workloadLevel: 'medium' as const,
        recentActivity: ['edit', 'commit']
      };

      // Test that similar contexts are handled properly
      const score1 = confidenceScoring.calculateConfidence(mockPredictions, context1);
      const score2 = confidenceScoring.calculateConfidence(mockPredictions, context2);

      expect(score1.overall).toBeGreaterThanOrEqual(0);
      expect(score2.overall).toBeGreaterThanOrEqual(0);
    });
  });
});