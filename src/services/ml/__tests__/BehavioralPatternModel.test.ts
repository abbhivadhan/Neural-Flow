import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BehavioralPatternModel } from '../BehavioralPatternModel';
import { UserInteraction } from '../../../types/ai';

// Mock TensorFlow.js for testing
vi.mock('@tensorflow/tfjs', () => ({
  sequential: vi.fn(() => ({
    compile: vi.fn(),
    predict: vi.fn(() => ({
      data: vi.fn(() => Promise.resolve(new Float32Array([0.8, 0.1, 0.05, 0.03, 0.01, 0.005, 0.003, 0.002])))
    })),
    fit: vi.fn(() => Promise.resolve({ history: {} })),
    save: vi.fn(() => Promise.resolve()),
    dispose: vi.fn()
  })),
  layers: {
    dense: vi.fn(() => ({})),
    dropout: vi.fn(() => ({}))
  },
  train: {
    adam: vi.fn(() => ({}))
  },
  tensor2d: vi.fn(() => ({
    dispose: vi.fn()
  })),
  loadLayersModel: vi.fn(() => Promise.reject(new Error('No model found')))
}));

describe('BehavioralPatternModel', () => {
  let model: BehavioralPatternModel;

  beforeEach(async () => {
    model = new BehavioralPatternModel();
    await model.initialize();
  });

  afterEach(() => {
    model.dispose();
  });

  it('should initialize successfully', async () => {
    expect(model).toBeDefined();
  });

  it('should predict behavior patterns', async () => {
    const sampleInteractions: UserInteraction[] = [
      {
        id: 'int1',
        action: 'click',
        context: 'coding',
        timestamp: Date.now(),
        duration: 5000,
        metadata: {}
      },
      {
        id: 'int2',
        action: 'type',
        context: 'coding',
        timestamp: Date.now() - 60000,
        duration: 15000,
        metadata: {}
      }
    ];

    const prediction = await model.predictPattern(sampleInteractions);
    
    expect(prediction).toBeDefined();
    expect(prediction.type).toBeDefined();
    expect(prediction.confidence).toBeGreaterThan(0);
    expect(prediction.confidence).toBeLessThanOrEqual(1);
    expect(prediction.features).toBeDefined();
  });

  it('should handle empty interactions', async () => {
    const prediction = await model.predictPattern([]);
    
    expect(prediction).toBeDefined();
    expect(prediction.confidence).toBeGreaterThan(0);
  });

  it('should extract features correctly', async () => {
    const interactions: UserInteraction[] = Array.from({ length: 10 }, (_, i) => ({
      id: `int${i}`,
      action: i % 2 === 0 ? 'click' : 'type',
      context: 'coding',
      timestamp: Date.now() - (i * 60000),
      duration: 5000 + (i * 1000),
      metadata: {}
    }));

    const prediction = await model.predictPattern(interactions);
    
    expect(prediction.features.interactionFrequency).toBeGreaterThanOrEqual(0);
    expect(prediction.features.focusDuration).toBeGreaterThanOrEqual(0);
    expect(prediction.features.productivityScore).toBeGreaterThanOrEqual(0);
    expect(prediction.features.contextSwitches).toBeGreaterThanOrEqual(0);
  });

  it('should provide model summary', () => {
    const summary = model.getModelSummary();
    expect(typeof summary).toBe('string');
  });
});