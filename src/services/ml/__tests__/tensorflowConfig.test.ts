import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TensorFlowConfig } from '../tensorflowConfig';

describe('TensorFlowConfig', () => {
  let config: TensorFlowConfig;

  beforeEach(() => {
    config = TensorFlowConfig.getInstance();
  });

  afterEach(() => {
    config.dispose();
  });

  it('should be a singleton', () => {
    const config1 = TensorFlowConfig.getInstance();
    const config2 = TensorFlowConfig.getInstance();
    expect(config1).toBe(config2);
  });

  it('should initialize TensorFlow.js', async () => {
    await config.initialize();
    const backend = config.getBackend();
    expect(backend).toBeDefined();
    expect(['webgl', 'webgpu', 'wasm'].includes(backend)).toBe(true);
  });

  it('should provide environment info', async () => {
    await config.initialize();
    const info = config.getEnvironmentInfo();
    
    expect(info).toHaveProperty('backend');
    expect(info).toHaveProperty('version');
    expect(info).toHaveProperty('memory');
    expect(info).toHaveProperty('features');
  });

  it('should handle initialization errors gracefully', async () => {
    // Mock a failure scenario
    const originalSetBackend = (global as any).tf?.setBackend;
    if ((global as any).tf) {
      (global as any).tf.setBackend = () => {
        throw new Error('Backend initialization failed');
      };
    }

    try {
      await expect(config.initialize()).rejects.toThrow();
    } finally {
      // Restore original function
      if ((global as any).tf && originalSetBackend) {
        (global as any).tf.setBackend = originalSetBackend;
      }
    }
  });
});