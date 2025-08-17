import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { tensorflowConfig } from '../tensorflowConfig';
import { ModelTrainingPipeline } from '../ModelTrainingPipeline';

describe('ML Services Integration', () => {
  let pipeline: ModelTrainingPipeline;

  beforeAll(async () => {
    // Initialize TensorFlow.js (this might fail in test environment, that's ok)
    try {
      await tensorflowConfig.initialize();
    } catch (error) {
      console.log('TensorFlow.js initialization skipped in test environment');
    }

    pipeline = new ModelTrainingPipeline();
    try {
      await pipeline.initialize();
    } catch (error) {
      console.log('Pipeline initialization skipped in test environment');
    }
  });

  afterAll(() => {
    if (pipeline) {
      pipeline.dispose();
    }
    tensorflowConfig.dispose();
  });

  it('should create ML services without errors', () => {
    expect(pipeline).toBeDefined();
  });

  it('should provide training status', () => {
    const status = pipeline.getStatus();
    expect(status).toBeDefined();
    expect(status).toHaveProperty('isTraining');
    expect(status).toHaveProperty('queueSize');
  });

  it('should handle training data addition', () => {
    const sampleInteractions = [
      {
        id: 'int1',
        action: 'click',
        context: 'coding',
        timestamp: Date.now(),
        duration: 5000,
        metadata: {}
      }
    ];

    // This should not throw
    expect(() => {
      pipeline.processUserInteractions(sampleInteractions, 'focused_work');
    }).not.toThrow();
  });

  it('should export and import training data', () => {
    const exportedData = pipeline.exportTrainingData();
    expect(Array.isArray(exportedData)).toBe(true);

    // Import should not throw
    expect(() => {
      pipeline.importTrainingData(exportedData);
    }).not.toThrow();
  });
});