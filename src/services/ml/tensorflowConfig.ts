import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-webgpu';
import '@tensorflow/tfjs-backend-wasm';

/**
 * TensorFlow.js configuration and initialization
 * Sets up the optimal backend for client-side machine learning
 */
export class TensorFlowConfig {
  private static instance: TensorFlowConfig;
  private isInitialized = false;
  private backend: string = 'webgl';

  private constructor() {}

  static getInstance(): TensorFlowConfig {
    if (!TensorFlowConfig.instance) {
      TensorFlowConfig.instance = new TensorFlowConfig();
    }
    return TensorFlowConfig.instance;
  }

  /**
   * Initialize TensorFlow.js with the best available backend
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Try to use WebGPU first (fastest), then WebGL, then WebAssembly
      const backends = ['webgpu', 'webgl', 'wasm'];
      
      for (const backend of backends) {
        try {
          await tf.setBackend(backend);
          await tf.ready();
          this.backend = backend;
          console.log(`TensorFlow.js initialized with ${backend} backend`);
          break;
        } catch (error) {
          console.warn(`Failed to initialize ${backend} backend:`, error);
          continue;
        }
      }

      // Configure memory management
      tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
      tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize TensorFlow.js:', error);
      throw new Error('TensorFlow.js initialization failed');
    }
  }

  /**
   * Get the current backend being used
   */
  getBackend(): string {
    return this.backend;
  }

  /**
   * Get TensorFlow.js environment info
   */
  private safeGetBool(flag: string): boolean {
    try {
      return tf.env().getBool(flag);
    } catch (error) {
      console.warn(`Flag ${flag} not available:`, error);
      return false;
    }
  }

  getEnvironmentInfo(): any {
    return {
      backend: tf.getBackend(),
      version: tf.version.tfjs,
      memory: tf.memory(),
      features: {
        webgl: this.safeGetBool('WEBGL_RENDER_FLOAT32_CAPABLE'),
        webgpu: this.safeGetBool('WEBGPU_ENABLED'),
        wasm: this.safeGetBool('WASM_HAS_SIMD_SUPPORT')
      }
    };
  }

  /**
   * Clean up TensorFlow.js resources
   */
  dispose(): void {
    tf.disposeVariables();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const tensorflowConfig = TensorFlowConfig.getInstance();