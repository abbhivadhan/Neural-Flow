import * as tf from '@tensorflow/tfjs';
import { Task, TaskHistory, TaskPrediction, WorkContext } from '../../types/ai';

/**
 * Task Prediction Neural Network
 * Predicts the next most likely tasks based on user history and context
 */
export class TaskPredictionModel {
  private model: tf.LayersModel | null = null;
  private sequenceLength = 10; // Number of previous tasks to consider
  private isTraining = false;
  private taskEmbeddings: Map<string, number[]> = new Map();

  /**
   * Create the task prediction model using LSTM for sequence prediction
   */
  private createModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        // LSTM layer for sequence processing
        tf.layers.lstm({
          inputShape: [this.sequenceLength, 50], // 50-dimensional task embeddings
          units: 128,
          returnSequences: true,
          dropout: 0.2,
          recurrentDropout: 0.2,
          name: 'lstm_1'
        }),
        
        // Second LSTM layer
        tf.layers.lstm({
          units: 64,
          returnSequences: false,
          dropout: 0.2,
          recurrentDropout: 0.2,
          name: 'lstm_2'
        }),
        
        // Dense layers for prediction
        tf.layers.dense({
          units: 128,
          activation: 'relu',
          name: 'dense_1'
        }),
        
        tf.layers.dropout({ rate: 0.3 }),
        
        tf.layers.dense({
          units: 64,
          activation: 'relu',
          name: 'dense_2'
        }),
        
        tf.layers.dropout({ rate: 0.2 }),
        
        // Output layer - probability distribution over possible next tasks
        tf.layers.dense({
          units: 100, // Top 100 most common tasks
          activation: 'softmax',
          name: 'output_layer'
        })
      ]
    });

    // Compile with Adam optimizer
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy', 'topKCategoricalAccuracy']
    });

    return model;
  }

  /**
   * Initialize the task prediction model
   */
  async initialize(): Promise<void> {
    try {
      this.model = await this.loadModel();
      console.log('Loaded existing task prediction model');
    } catch (error) {
      console.log('Creating new task prediction model');
      this.model = this.createModel();
    }
    
    // Initialize task embeddings
    await this.initializeTaskEmbeddings();
  }

  /**
   * Initialize task embeddings for common tasks
   */
  private async initializeTaskEmbeddings(): Promise<void> {
    // Common task types with their embeddings (simplified)
    const commonTasks = [
      'email_check', 'code_review', 'meeting_prep', 'documentation',
      'bug_fix', 'feature_development', 'testing', 'deployment',
      'research', 'planning', 'design', 'analysis', 'reporting'
    ];
    
    commonTasks.forEach((task, index) => {
      // Create simple embeddings (in production, use pre-trained embeddings)
      const embedding = new Array(50).fill(0).map(() => Math.random() * 0.1);
      embedding[index % 50] = 1; // One-hot-like encoding
      this.taskEmbeddings.set(task, embedding);
    });
  }

  /**
   * Convert task to embedding vector
   */
  private getTaskEmbedding(task: Task): number[] {
    // Try to get existing embedding
    if (this.taskEmbeddings.has(task.id)) {
      return this.taskEmbeddings.get(task.id)!;
    }
    
    // Create embedding based on task properties
    const embedding = new Array(50).fill(0);
    
    // Encode task properties
    embedding[0] = task.priority / 5; // Normalized priority
    embedding[1] = Math.min(task.estimatedDuration / 480, 1); // Normalized duration (max 8 hours)
    embedding[2] = task.dependencies?.length || 0 / 10; // Normalized dependencies
    
    // Encode task type (simplified)
    const taskTypes = ['development', 'meeting', 'review', 'documentation', 'testing', 'planning'];
    const typeIndex = taskTypes.findIndex(type => 
      task.title.toLowerCase().includes(type) || 
      task.description?.toLowerCase().includes(type)
    );
    if (typeIndex !== -1) {
      embedding[3 + typeIndex] = 1;
    }
    
    // Add some randomness for uniqueness
    for (let i = 10; i < 50; i++) {
      embedding[i] = Math.random() * 0.1;
    }
    
    // Cache the embedding
    this.taskEmbeddings.set(task.id, embedding);
    return embedding;
  }

  /**
   * Prepare sequence data for model input
   */
  private prepareSequenceData(taskHistory: TaskHistory): number[][] {
    const tasks = taskHistory.completedTasks.slice(-this.sequenceLength);
    const sequence: number[][] = [];
    
    // Pad sequence if too short
    while (tasks.length < this.sequenceLength) {
      tasks.unshift({
        id: 'padding',
        title: '',
        description: '',
        priority: 0,
        estimatedDuration: 0,
        dependencies: [],
        context: { type: 'none', data: {} },
        aiGenerated: false
      });
    }
    
    // Convert tasks to embeddings
    tasks.forEach(task => {
      sequence.push(this.getTaskEmbedding(task));
    });
    
    return sequence;
  }

  /**
   * Predict next tasks based on history and context
   */
  async predictNextTasks(
    taskHistory: TaskHistory,
    context: WorkContext,
    topK: number = 3
  ): Promise<TaskPrediction[]> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    const sequenceData = this.prepareSequenceData(taskHistory);
    const inputTensor = tf.tensor3d([sequenceData]);
    
    try {
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      const probabilities = await prediction.data();
      
      // Get top K predictions
      const topIndices = Array.from(probabilities)
        .map((prob, index) => ({ prob, index }))
        .sort((a, b) => b.prob - a.prob)
        .slice(0, topK);
      
      // Convert to task predictions
      const predictions: TaskPrediction[] = topIndices.map(({ prob, index }) => ({
        taskId: `predicted_${index}`,
        confidence: prob,
        reasoning: this.generateReasoning(taskHistory, context, prob),
        suggestedTime: this.predictOptimalTime(context),
        estimatedDuration: this.estimateDuration(index),
        priority: this.calculatePriority(prob, context)
      }));
      
      return predictions;
    } finally {
      inputTensor.dispose();
    }
  }

  /**
   * Generate reasoning for task prediction
   */
  private generateReasoning(
    _taskHistory: TaskHistory,
    context: WorkContext,
    confidence: number
  ): string {
    const reasons = [];
    
    if (confidence > 0.8) {
      reasons.push('Strong pattern match with historical behavior');
    } else if (confidence > 0.6) {
      reasons.push('Moderate pattern match with recent activities');
    } else {
      reasons.push('Weak pattern match, consider as alternative');
    }
    
    if (context.timeOfDay === 'morning') {
      reasons.push('Optimal for morning productivity');
    } else if (context.timeOfDay === 'afternoon') {
      reasons.push('Suitable for afternoon focus');
    }
    
    return reasons.join('. ');
  }

  /**
   * Predict optimal time for task execution
   */
  private predictOptimalTime(context: WorkContext): Date {
    const now = new Date();
    const optimalHour = context.timeOfDay === 'morning' ? 9 : 14;
    
    const optimalTime = new Date(now);
    optimalTime.setHours(optimalHour, 0, 0, 0);
    
    // If optimal time has passed today, suggest tomorrow
    if (optimalTime <= now) {
      optimalTime.setDate(optimalTime.getDate() + 1);
    }
    
    return optimalTime;
  }

  /**
   * Estimate task duration based on prediction index
   */
  private estimateDuration(predictionIndex: number): number {
    // Simple heuristic - in production, this would be more sophisticated
    const baseDuration = 30; // 30 minutes
    const variation = (predictionIndex % 5) * 15; // 0-60 minutes variation
    return baseDuration + variation;
  }

  /**
   * Calculate task priority based on confidence and context
   */
  private calculatePriority(confidence: number, context: WorkContext): number {
    let priority = Math.floor(confidence * 5); // Base priority from confidence
    
    // Adjust based on context
    if (context.urgency === 'high') {
      priority = Math.min(priority + 1, 5);
    } else if (context.urgency === 'low') {
      priority = Math.max(priority - 1, 1);
    }
    
    return priority;
  }

  /**
   * Train the model with task sequences
   */
  async trainModel(
    taskSequences: Task[][],
    nextTasks: Task[]
  ): Promise<void> {
    if (!this.model || this.isTraining) {
      return;
    }

    this.isTraining = true;

    try {
      // Prepare training data
      const sequences = taskSequences.map(sequence => {
        const paddedSequence = sequence.slice(-this.sequenceLength);
        while (paddedSequence.length < this.sequenceLength) {
          paddedSequence.unshift({
            id: 'padding',
            title: '',
            description: '',
            priority: 0,
            estimatedDuration: 0,
            dependencies: [],
            context: { type: 'none', data: {} },
            aiGenerated: false
          });
        }
        return paddedSequence.map(task => this.getTaskEmbedding(task));
      });

      const labels = nextTasks.map(task => {
        const oneHot = new Array(100).fill(0);
        const taskIndex = Math.abs(task.id.hashCode()) % 100; // Simple hash to index
        oneHot[taskIndex] = 1;
        return oneHot;
      });

      const xs = tf.tensor3d(sequences);
      const ys = tf.tensor2d(labels);

      // Train the model
      await this.model.fit(xs, ys, {
        epochs: 30,
        batchSize: 16,
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Task Prediction Epoch ${epoch + 1}: loss = ${logs?.['loss']?.toFixed(4)}`);
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
   * Save the model to browser storage
   */
  private async saveModel(): Promise<void> {
    if (!this.model) return;
    
    try {
      await this.model.save('localstorage://task-prediction-model');
      console.log('Task prediction model saved successfully');
    } catch (error) {
      console.error('Failed to save task prediction model:', error);
    }
  }

  /**
   * Load existing model from browser storage
   */
  private async loadModel(): Promise<tf.LayersModel> {
    return await tf.loadLayersModel('localstorage://task-prediction-model');
  }

  /**
   * Get model performance metrics
   */
  getModelMetrics(): any {
    if (!this.model) {
      return null;
    }
    
    return {
      parameters: this.model.countParams(),
      layers: this.model.layers.length,
      inputSpec: this.model.inputSpec,
      outputShape: this.model.outputShape
    };
  }

  /**
   * Dispose of the model and free memory
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.taskEmbeddings.clear();
  }
}

// Extend String prototype for simple hash function
declare global {
  interface String {
    hashCode(): number;
  }
}

String.prototype.hashCode = function(): number {
  let hash = 0;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
};