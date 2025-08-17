import * as tf from '@tensorflow/tfjs';
import { BehaviorPattern, UserInteraction } from '../../types/ai';

/**
 * Behavioral Pattern Recognition Model
 * Uses neural networks to identify and predict user behavior patterns
 */
export class BehavioralPatternModel {
  private model: tf.LayersModel | null = null;
  private isTraining = false;
  private trainingHistory: tf.History | null = null;

  /**
   * Create and compile the behavioral pattern recognition model
   */
  private createModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        // Input layer - features from user interactions
        tf.layers.dense({
          inputShape: [20], // 20 behavioral features
          units: 64,
          activation: 'relu',
          name: 'input_layer'
        }),
        
        // Hidden layers for pattern recognition
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 128,
          activation: 'relu',
          name: 'hidden_1'
        }),
        
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 64,
          activation: 'relu',
          name: 'hidden_2'
        }),
        
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu',
          name: 'hidden_3'
        }),
        
        // Output layer - behavior pattern classification
        tf.layers.dense({
          units: 8, // 8 different behavior patterns
          activation: 'softmax',
          name: 'output_layer'
        })
      ]
    });

    // Compile with Adam optimizer
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  /**
   * Initialize the model
   */
  async initialize(): Promise<void> {
    try {
      // Try to load existing model first
      this.model = await this.loadModel();
    } catch (error) {
      console.log('No existing model found, creating new one');
      this.model = this.createModel();
    }
  }

  /**
   * Extract features from user interactions for model input
   */
  private extractFeatures(interactions: UserInteraction[]): number[] {
    if (interactions.length === 0) {
      return new Array(20).fill(0);
    }

    const features = [];
    
    // Time-based features
    const now = Date.now();
    const recentInteractions = interactions.filter(i => now - i.timestamp < 3600000); // Last hour
    features.push(recentInteractions.length / 100); // Interaction frequency
    
    // Action type distribution
    const actionTypes = ['click', 'type', 'scroll', 'navigate', 'create', 'edit', 'delete', 'search'];
    actionTypes.forEach(type => {
      const count = interactions.filter(i => i.action === type).length;
      features.push(count / interactions.length);
    });
    
    // Timing patterns
    const intervals = interactions.slice(1).map((interaction, i) => 
      interaction.timestamp - (interactions[i]?.timestamp || 0)
    );
    const avgInterval = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0;
    features.push(Math.min(avgInterval / 10000, 1)); // Normalized average interval
    
    // Context switches
    const contextSwitches = interactions.slice(1).filter((interaction, i) => 
      interaction.context !== (interactions[i]?.context || '')
    ).length;
    features.push(contextSwitches / Math.max(interactions.length - 1, 1));
    
    // Task completion patterns
    const completedTasks = interactions.filter(i => i.action === 'complete').length;
    features.push(completedTasks / Math.max(interactions.length, 1));
    
    // Focus duration (simulated)
    const focusDuration = Math.random() * 0.8 + 0.1; // Placeholder for actual focus tracking
    features.push(focusDuration);
    
    // Productivity score (derived)
    const productivityScore = Math.min(completedTasks / Math.max(recentInteractions.length, 1), 1);
    features.push(productivityScore);
    
    // Pad or truncate to exactly 20 features
    while (features.length < 20) {
      features.push(0);
    }
    
    return features.slice(0, 20);
  }

  /**
   * Predict behavior pattern from user interactions
   */
  async predictPattern(interactions: UserInteraction[]): Promise<BehaviorPattern> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    const features = this.extractFeatures(interactions);
    const inputTensor = tf.tensor2d([features]);
    
    try {
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      const probabilities = await prediction.data();
      
      // Map predictions to behavior patterns
      const patterns = [
        'focused_work',
        'exploratory',
        'collaborative',
        'creative',
        'analytical',
        'administrative',
        'learning',
        'distracted'
      ];
      
      const maxIndex = probabilities.indexOf(Math.max(...probabilities));
      const confidence = probabilities[maxIndex] || 0;
      
      return {
        type: patterns[maxIndex] || 'unknown',
        confidence,
        timestamp: Date.now(),
        features: {
          interactionFrequency: features[0] || 0,
          focusDuration: features[18] || 0,
          productivityScore: features[19] || 0,
          contextSwitches: features[10] || 0
        }
      };
    } finally {
      inputTensor.dispose();
    }
  }

  /**
   * Train the model with new behavioral data
   */
  async trainModel(
    interactions: UserInteraction[][],
    labels: string[]
  ): Promise<void> {
    if (!this.model || this.isTraining) {
      return;
    }

    this.isTraining = true;

    try {
      // Prepare training data
      const features = interactions.map(batch => this.extractFeatures(batch));
      const encodedLabels = this.encodeLabels(labels);
      
      const xs = tf.tensor2d(features);
      const ys = tf.tensor2d(encodedLabels);

      // Train the model
      this.trainingHistory = await this.model.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Epoch ${epoch + 1}: loss = ${logs?.['loss']?.toFixed(4)}, accuracy = ${logs?.['acc']?.toFixed(4)}`);
          }
        }
      });

      // Save the trained model
      await this.saveModel();
      
      xs.dispose();
      ys.dispose();
    } finally {
      this.isTraining = false;
    }
  }

  /**
   * Encode string labels to one-hot vectors
   */
  private encodeLabels(labels: string[]): number[][] {
    const patterns = [
      'focused_work',
      'exploratory', 
      'collaborative',
      'creative',
      'analytical',
      'administrative',
      'learning',
      'distracted'
    ];
    
    return labels.map(label => {
      const oneHot = new Array(patterns.length).fill(0);
      const index = patterns.indexOf(label);
      if (index !== -1) {
        oneHot[index] = 1;
      }
      return oneHot;
    });
  }

  /**
   * Save the trained model to browser storage
   */
  private async saveModel(): Promise<void> {
    if (!this.model) return;
    
    try {
      await this.model.save('localstorage://behavioral-pattern-model');
      console.log('Behavioral pattern model saved successfully');
    } catch (error) {
      console.error('Failed to save model:', error);
    }
  }

  /**
   * Load existing model from browser storage
   */
  private async loadModel(): Promise<tf.LayersModel> {
    return await tf.loadLayersModel('localstorage://behavioral-pattern-model');
  }

  /**
   * Get model training history
   */
  getTrainingHistory(): tf.History | null {
    return this.trainingHistory;
  }

  /**
   * Get model summary
   */
  getModelSummary(): string {
    if (!this.model) {
      return 'Model not initialized';
    }
    
    let summary = '';
    try {
      if (this.model && typeof this.model.summary === 'function') {
        this.model.summary(undefined, undefined, (line: string) => {
          summary += line + '\n';
        });
      } else {
        summary = 'Model summary not available';
      }
    } catch (error) {
      summary = `Model summary error: ${error}`;
    }
    return summary;
  }

  /**
   * Dispose of the model and free memory
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}