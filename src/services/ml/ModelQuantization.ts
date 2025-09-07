export type QuantizationLevel = 'q4_0' | 'q4_1' | 'q5_0' | 'q5_1' | 'q8_0' | 'f16' | 'f32';

export interface QuantizationConfig {
  level: QuantizationLevel;
  preserveAccuracy: boolean;
  targetSize?: number; // Target model size in MB
  optimizeForSpeed?: boolean;
}

export interface QuantizationResult {
  originalSize: number;
  quantizedSize: number;
  compressionRatio: number;
  accuracyLoss: number;
  speedImprovement: number;
}

export class ModelQuantization {
  private static readonly QUANTIZATION_SPECS = {
    q4_0: { bits: 4, blockSize: 32, accuracy: 0.95, speed: 2.5 },
    q4_1: { bits: 4, blockSize: 32, accuracy: 0.96, speed: 2.3 },
    q5_0: { bits: 5, blockSize: 32, accuracy: 0.97, speed: 2.0 },
    q5_1: { bits: 5, blockSize: 32, accuracy: 0.98, speed: 1.8 },
    q8_0: { bits: 8, blockSize: 32, accuracy: 0.99, speed: 1.5 },
    f16: { bits: 16, blockSize: 1, accuracy: 0.999, speed: 1.2 },
    f32: { bits: 32, blockSize: 1, accuracy: 1.0, speed: 1.0 }
  };

  /**
   * Quantize model weights using specified quantization level
   */
  static async quantizeWeights(
    weights: Float32Array, 
    config: QuantizationConfig
  ): Promise<{ quantizedWeights: Uint8Array; metadata: any }> {
    const spec = this.QUANTIZATION_SPECS[config.level];
    
    if (!spec) {
      throw new Error(`Unsupported quantization level: ${config.level}`);
    }

    const startTime = Date.now();
    
    try {
      let quantizedWeights: Uint8Array;
      let metadata: any;

      switch (config.level) {
        case 'q4_0':
        case 'q4_1':
          ({ quantizedWeights, metadata } = await this.quantize4Bit(weights, config.level));
          break;
        case 'q5_0':
        case 'q5_1':
          ({ quantizedWeights, metadata } = await this.quantize5Bit(weights, config.level));
          break;
        case 'q8_0':
          ({ quantizedWeights, metadata } = await this.quantize8Bit(weights));
          break;
        case 'f16':
          ({ quantizedWeights, metadata } = await this.quantizeFloat16(weights));
          break;
        default:
          throw new Error(`Quantization level ${config.level} not implemented`);
      }

      const quantizationTime = Date.now() - startTime;
      
      metadata.quantizationTime = quantizationTime;
      metadata.originalSize = weights.byteLength;
      metadata.quantizedSize = quantizedWeights.byteLength;
      metadata.compressionRatio = weights.byteLength / quantizedWeights.byteLength;

      return { quantizedWeights, metadata };
    } catch (error) {
      throw new Error(`Quantization failed: ${error}`);
    }
  }

  /**
   * 4-bit quantization with different schemes
   */
  private static async quantize4Bit(
    weights: Float32Array, 
    scheme: 'q4_0' | 'q4_1'
  ): Promise<{ quantizedWeights: Uint8Array; metadata: any }> {
    const blockSize = 32;
    const numBlocks = Math.ceil(weights.length / blockSize);
    const quantizedSize = numBlocks * (blockSize / 2 + 4); // 4 bits per weight + scale/offset
    const quantizedWeights = new Uint8Array(quantizedSize);
    
    const scales: number[] = [];
    const offsets: number[] = [];
    
    let outputIndex = 0;
    
    for (let blockIndex = 0; blockIndex < numBlocks; blockIndex++) {
      const blockStart = blockIndex * blockSize;
      const blockEnd = Math.min(blockStart + blockSize, weights.length);
      const blockWeights = weights.slice(blockStart, blockEnd);
      
      // Calculate scale and offset for this block
      const min = Math.min(...blockWeights);
      const max = Math.max(...blockWeights);
      const scale = (max - min) / 15; // 4-bit range: 0-15
      const offset = scheme === 'q4_1' ? min : 0;
      
      scales.push(scale);
      offsets.push(offset);
      
      // Store scale and offset
      const scaleBytes = new Float32Array([scale]);
      const offsetBytes = new Float32Array([offset]);
      quantizedWeights.set(new Uint8Array(scaleBytes.buffer), outputIndex);
      outputIndex += 4;
      quantizedWeights.set(new Uint8Array(offsetBytes.buffer), outputIndex);
      outputIndex += 4;
      
      // Quantize weights in this block
      for (let i = 0; i < blockWeights.length; i += 2) {
        const w1 = Math.round((blockWeights[i] - offset) / scale);
        const w2 = i + 1 < blockWeights.length ? 
          Math.round((blockWeights[i + 1] - offset) / scale) : 0;
        
        // Pack two 4-bit values into one byte
        const quantized1 = Math.max(0, Math.min(15, w1));
        const quantized2 = Math.max(0, Math.min(15, w2));
        quantizedWeights[outputIndex++] = (quantized1 << 4) | quantized2;
      }
    }

    return {
      quantizedWeights: quantizedWeights.slice(0, outputIndex),
      metadata: {
        scheme,
        blockSize,
        numBlocks,
        scales,
        offsets,
        bitsPerWeight: 4
      }
    };
  }

  /**
   * 5-bit quantization
   */
  private static async quantize5Bit(
    weights: Float32Array, 
    scheme: 'q5_0' | 'q5_1'
  ): Promise<{ quantizedWeights: Uint8Array; metadata: any }> {
    const blockSize = 32;
    const numBlocks = Math.ceil(weights.length / blockSize);
    const quantizedSize = numBlocks * (Math.ceil(blockSize * 5 / 8) + 8); // 5 bits per weight + metadata
    const quantizedWeights = new Uint8Array(quantizedSize);
    
    const scales: number[] = [];
    const offsets: number[] = [];
    
    let outputIndex = 0;
    
    for (let blockIndex = 0; blockIndex < numBlocks; blockIndex++) {
      const blockStart = blockIndex * blockSize;
      const blockEnd = Math.min(blockStart + blockSize, weights.length);
      const blockWeights = weights.slice(blockStart, blockEnd);
      
      // Calculate scale and offset
      const min = Math.min(...blockWeights);
      const max = Math.max(...blockWeights);
      const scale = (max - min) / 31; // 5-bit range: 0-31
      const offset = scheme === 'q5_1' ? min : 0;
      
      scales.push(scale);
      offsets.push(offset);
      
      // Store metadata
      const scaleBytes = new Float32Array([scale]);
      const offsetBytes = new Float32Array([offset]);
      quantizedWeights.set(new Uint8Array(scaleBytes.buffer), outputIndex);
      outputIndex += 4;
      quantizedWeights.set(new Uint8Array(offsetBytes.buffer), outputIndex);
      outputIndex += 4;
      
      // Pack 5-bit values efficiently
      const quantizedValues: number[] = [];
      for (const weight of blockWeights) {
        const quantized = Math.max(0, Math.min(31, Math.round((weight - offset) / scale)));
        quantizedValues.push(quantized);
      }
      
      // Pack 5-bit values into bytes
      let bitBuffer = 0;
      let bitsInBuffer = 0;
      
      for (const value of quantizedValues) {
        bitBuffer |= (value << bitsInBuffer);
        bitsInBuffer += 5;
        
        while (bitsInBuffer >= 8) {
          quantizedWeights[outputIndex++] = bitBuffer & 0xFF;
          bitBuffer >>= 8;
          bitsInBuffer -= 8;
        }
      }
      
      // Handle remaining bits
      if (bitsInBuffer > 0) {
        quantizedWeights[outputIndex++] = bitBuffer & 0xFF;
      }
    }

    return {
      quantizedWeights: quantizedWeights.slice(0, outputIndex),
      metadata: {
        scheme,
        blockSize,
        numBlocks,
        scales,
        offsets,
        bitsPerWeight: 5
      }
    };
  }

  /**
   * 8-bit quantization
   */
  private static async quantize8Bit(
    weights: Float32Array
  ): Promise<{ quantizedWeights: Uint8Array; metadata: any }> {
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const scale = (max - min) / 255;
    const offset = min;
    
    const quantizedWeights = new Uint8Array(weights.length + 8); // +8 for scale and offset
    
    // Store scale and offset at the beginning
    const scaleBytes = new Float32Array([scale]);
    const offsetBytes = new Float32Array([offset]);
    quantizedWeights.set(new Uint8Array(scaleBytes.buffer), 0);
    quantizedWeights.set(new Uint8Array(offsetBytes.buffer), 4);
    
    // Quantize weights
    for (let i = 0; i < weights.length; i++) {
      const quantized = Math.round((weights[i] - offset) / scale);
      quantizedWeights[i + 8] = Math.max(0, Math.min(255, quantized));
    }

    return {
      quantizedWeights,
      metadata: {
        scheme: 'q8_0',
        scale,
        offset,
        bitsPerWeight: 8,
        originalLength: weights.length
      }
    };
  }

  /**
   * 16-bit float quantization
   */
  private static async quantizeFloat16(
    weights: Float32Array
  ): Promise<{ quantizedWeights: Uint8Array; metadata: any }> {
    const quantizedWeights = new Uint8Array(weights.length * 2);
    
    for (let i = 0; i < weights.length; i++) {
      const float16 = this.float32ToFloat16(weights[i]);
      const bytes = new Uint8Array(new Uint16Array([float16]).buffer);
      quantizedWeights.set(bytes, i * 2);
    }

    return {
      quantizedWeights,
      metadata: {
        scheme: 'f16',
        bitsPerWeight: 16,
        originalLength: weights.length
      }
    };
  }

  /**
   * Convert float32 to float16
   */
  private static float32ToFloat16(value: number): number {
    const floatView = new Float32Array(1);
    const int32View = new Int32Array(floatView.buffer);
    floatView[0] = value;
    const x = int32View[0];

    let bits = (x >> 16) & 0x8000; // Sign bit
    let m = (x >> 12) & 0x07ff; // Mantissa
    const e = (x >> 23) & 0xff; // Exponent

    if (e < 103) return bits;
    if (e > 142) {
      bits |= 0x7c00;
      bits |= ((e == 255) ? 0 : 1) && (x & 0x007fffff);
      return bits;
    }

    if (e < 113) {
      m |= 0x0800;
      bits |= (m >> (114 - e)) + ((m >> (113 - e)) & 1);
      return bits;
    }

    bits |= ((e - 112) << 10) | (m >> 1);
    bits += m & 1;
    return bits;
  }

  /**
   * Dequantize weights back to float32
   */
  static async dequantizeWeights(
    quantizedWeights: Uint8Array, 
    metadata: any
  ): Promise<Float32Array> {
    switch (metadata.scheme) {
      case 'q4_0':
      case 'q4_1':
        return this.dequantize4Bit(quantizedWeights, metadata);
      case 'q5_0':
      case 'q5_1':
        return this.dequantize5Bit(quantizedWeights, metadata);
      case 'q8_0':
        return this.dequantize8Bit(quantizedWeights, metadata);
      case 'f16':
        return this.dequantizeFloat16(quantizedWeights, metadata);
      default:
        throw new Error(`Unsupported dequantization scheme: ${metadata.scheme}`);
    }
  }

  private static dequantize4Bit(quantizedWeights: Uint8Array, metadata: any): Float32Array {
    const { blockSize, numBlocks, scales, offsets } = metadata;
    const totalWeights = numBlocks * blockSize;
    const result = new Float32Array(totalWeights);
    
    let inputIndex = 0;
    let outputIndex = 0;
    
    for (let blockIndex = 0; blockIndex < numBlocks; blockIndex++) {
      // Skip scale and offset (8 bytes)
      inputIndex += 8;
      
      const scale = scales[blockIndex];
      const offset = offsets[blockIndex];
      
      // Dequantize weights in this block
      for (let i = 0; i < blockSize / 2; i++) {
        const packed = quantizedWeights[inputIndex++];
        const w1 = (packed >> 4) & 0x0F;
        const w2 = packed & 0x0F;
        
        result[outputIndex++] = w1 * scale + offset;
        if (outputIndex < totalWeights) {
          result[outputIndex++] = w2 * scale + offset;
        }
      }
    }
    
    return result;
  }

  private static dequantize5Bit(quantizedWeights: Uint8Array, metadata: any): Float32Array {
    // Implementation for 5-bit dequantization
    // This is a simplified version - full implementation would handle bit packing
    const { originalLength } = metadata;
    return new Float32Array(originalLength); // Placeholder
  }

  private static dequantize8Bit(quantizedWeights: Uint8Array, metadata: any): Float32Array {
    const { scale, offset, originalLength } = metadata;
    const result = new Float32Array(originalLength);
    
    for (let i = 0; i < originalLength; i++) {
      result[i] = quantizedWeights[i + 8] * scale + offset;
    }
    
    return result;
  }

  private static dequantizeFloat16(quantizedWeights: Uint8Array, metadata: any): Float32Array {
    const { originalLength } = metadata;
    const result = new Float32Array(originalLength);
    
    for (let i = 0; i < originalLength; i++) {
      const bytes = quantizedWeights.slice(i * 2, i * 2 + 2);
      const uint16 = new Uint16Array(bytes.buffer)[0];
      result[i] = this.float16ToFloat32(uint16);
    }
    
    return result;
  }

  private static float16ToFloat32(h: number): number {
    const s = (h & 0x8000) >> 15;
    const e = (h & 0x7c00) >> 10;
    const f = h & 0x03ff;

    if (e === 0) {
      return (s ? -1 : 1) * Math.pow(2, -14) * (f / Math.pow(2, 10));
    } else if (e === 0x1f) {
      return f ? NaN : ((s ? -1 : 1) * Infinity);
    }

    return (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + f / Math.pow(2, 10));
  }

  /**
   * Get optimal quantization level based on requirements
   */
  static getOptimalQuantization(requirements: {
    maxSizeMB?: number;
    minAccuracy?: number;
    prioritizeSpeed?: boolean;
  }): QuantizationLevel {
    const { maxSizeMB, minAccuracy = 0.95, prioritizeSpeed = false } = requirements;
    
    const candidates = Object.entries(this.QUANTIZATION_SPECS)
      .filter(([_, spec]) => spec.accuracy >= minAccuracy)
      .sort((a, b) => {
        if (prioritizeSpeed) {
          return b[1].speed - a[1].speed; // Higher speed first
        }
        return a[1].bits - b[1].bits; // Lower bits (smaller size) first
      });
    
    return (candidates[0]?.[0] as QuantizationLevel) || 'q8_0';
  }
}