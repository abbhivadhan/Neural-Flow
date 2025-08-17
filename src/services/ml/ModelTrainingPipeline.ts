import { BehavioralPatternModel } from './BehavioralPatternModel';
import { TaskPredictionModel } from './TaskPredictionModel';
import { UserInteraction, Task, TaskHistory, BehaviorPattern } from '../../types/ai';

/**
 * Model Training Pipeline for Continuous Learning
 * Manages the training and updating of ML models based on user interactions
 */
export class ModelTrainingPipeline {
  private behavioralModel: BehavioralPatternModel;
  private taskPredictionModel: TaskPredictionModel;
  private trainingQueue: TrainingData[] = [];
  private isTraining = false;
  private trainingInterval: number | null = null;
  private minTrainingDataSize = 50;
  private maxTrainingDataSize = 1000;

  constructor() {
    this.behavioralModel = new BehavioralPatternModel();
    this.taskPredictionModel = new TaskPredictionModel();
  }

  /**
   * Initialize the training pipeline
   */
  async initialize(): Promise<void> {
    await Promise.all([
      this.behavioralModel.initialize(),
      this.taskPredictionModel.initialize()
    ]);

    // Start periodic training
    this.startPeriodicTraining();
    
    console.log('Model training pipeline initialized');
  }

  /**
   * Add new training data to the queue
   */
  addTrainingData(data: TrainingData): void {
    this.trainingQueue.push({
      ...data,
      timestamp: Date.now()
    });

    // Remove old data if queue is too large
    if (this.trainingQueue.length > this.maxTrainingDataSize) {
      this.trainingQueue = this.trainingQueue.slice(-this.maxTrainingDataSize);
    }

    // Trigger training if we have enough data
    if (this.trainingQueue.length >= this.minTrainingDataSize && !this.isTraining) {
      this.scheduleTraining();
    }
  }

  /**
   * Process user interactions for behavioral learning
   */
  processUserInteractions(interactions: UserInteraction[], behaviorLabel: string): void {
    this.addTrainingData({
      type: 'behavioral',
      data: {
        interactions,
        label: behaviorLabel
      }
    });
  }

  /**
   * Process task completion for task prediction learning
   */
  processTaskCompletion(taskHistory: TaskHistory, completedTask: Task): void {
    this.addTrainingData({
      type: 'task_prediction',
      data: {
        taskSequence: taskHistory.completedTasks.slice(-10), // Last 10 tasks
        nextTask: completedTask
      }
    });
  }

  /**
   * Start periodic training
   */
  private startPeriodicTraining(): void {
    // Train models every 30 minutes
    this.trainingInterval = window.setInterval(() => {
      if (this.trainingQueue.length >= this.minTrainingDataSize) {
        this.scheduleTraining();
      }
    }, 30 * 60 * 1000);
  }

  /**
   * Schedule training to run asynchronously
   */
  private scheduleTraining(): void {
    // Use setTimeout to avoid blocking the main thread
    setTimeout(() => {
      this.trainModels();
    }, 1000);
  }

  /**
   * Train all models with queued data
   */
  private async trainModels(): Promise<void> {
    if (this.isTraining || this.trainingQueue.length === 0) {
      return;
    }

    this.isTraining = true;
    console.log(`Starting model training with ${this.trainingQueue.length} samples`);

    try {
      // Separate training data by type
      const behavioralData = this.trainingQueue.filter(d => d.type === 'behavioral');
      const taskPredictionData = this.trainingQueue.filter(d => d.type === 'task_prediction');

      // Train behavioral pattern model
      if (behavioralData.length >= 10) {
        await this.trainBehavioralModel(behavioralData);
      }

      // Train task prediction model
      if (taskPredictionData.length >= 10) {
        await this.trainTaskPredictionModel(taskPredictionData);
      }

      // Clear processed training data
      this.trainingQueue = [];
      
      console.log('Model training completed successfully');
    } catch (error) {
      console.error('Model training failed:', error);
    } finally {
      this.isTraining = false;
    }
  }

  /**
   * Train the behavioral pattern model
   */
  private async trainBehavioralModel(trainingData: TrainingData[]): Promise<void> {
    const interactions = trainingData.map(d => d.data.interactions);
    const labels = trainingData.map(d => d.data.label);

    await this.behavioralModel.trainModel(interactions, labels);
    console.log('Behavioral pattern model training completed');
  }

  /**
   * Train the task prediction model
   */
  private async trainTaskPredictionModel(trainingData: TrainingData[]): Promise<void> {
    const taskSequences = trainingData.map(d => d.data.taskSequence);
    const nextTasks = trainingData.map(d => d.data.nextTask);

    await this.taskPredictionModel.trainModel(taskSequences, nextTasks);
    console.log('Task prediction model training completed');
  }

  /**
   * Get training pipeline status
   */
  getStatus(): TrainingPipelineStatus {
    return {
      isTraining: this.isTraining,
      queueSize: this.trainingQueue.length,
      minTrainingDataSize: this.minTrainingDataSize,
      lastTrainingTime: this.getLastTrainingTime(),
      models: {
        behavioral: {
          initialized: this.behavioralModel !== null,
          summary: this.behavioralModel.getModelSummary()
        },
        taskPrediction: {
          initialized: this.taskPredictionModel !== null,
          metrics: this.taskPredictionModel.getModelMetrics()
        }
      }
    };
  }

  /**
   * Get last training time from local storage
   */
  private getLastTrainingTime(): Date | null {
    const timestamp = localStorage.getItem('lastTrainingTime');
    return timestamp ? new Date(parseInt(timestamp)) : null;
  }

  /**
   * Set last training time in local storage
   */
  private setLastTrainingTime(): void {
    localStorage.setItem('lastTrainingTime', Date.now().toString());
  }

  /**
   * Force immediate training
   */
  async forceTraining(): Promise<void> {
    if (this.trainingQueue.length === 0) {
      console.log('No training data available');
      return;
    }

    await this.trainModels();
    this.setLastTrainingTime();
  }

  /**
   * Clear training queue
   */
  clearTrainingQueue(): void {
    this.trainingQueue = [];
    console.log('Training queue cleared');
  }

  /**
   * Update training configuration
   */
  updateConfig(config: Partial<TrainingConfig>): void {
    if (config.minTrainingDataSize !== undefined) {
      this.minTrainingDataSize = config.minTrainingDataSize;
    }
    if (config.maxTrainingDataSize !== undefined) {
      this.maxTrainingDataSize = config.maxTrainingDataSize;
    }
    
    console.log('Training pipeline configuration updated');
  }

  /**
   * Export training data for analysis
   */
  exportTrainingData(): TrainingData[] {
    return [...this.trainingQueue];
  }

  /**
   * Import training data
   */
  importTrainingData(data: TrainingData[]): void {
    this.trainingQueue.push(...data);
    
    // Ensure we don't exceed max size
    if (this.trainingQueue.length > this.maxTrainingDataSize) {
      this.trainingQueue = this.trainingQueue.slice(-this.maxTrainingDataSize);
    }
  }

  /**
   * Get model predictions for evaluation
   */
  async getModelPredictions(
    interactions: UserInteraction[],
    taskHistory: TaskHistory
  ): Promise<ModelPredictions> {
    const [behaviorPattern, taskPredictions] = await Promise.all([
      this.behavioralModel.predictPattern(interactions),
      this.taskPredictionModel.predictNextTasks(taskHistory, {
        type: 'work',
        timeOfDay: this.getTimeOfDay(),
        urgency: 'medium',
        data: {}
      })
    ]);

    return {
      behaviorPattern,
      taskPredictions
    };
  }

  /**
   * Get current time of day
   */
  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  /**
   * Dispose of all models and stop training
   */
  dispose(): void {
    if (this.trainingInterval) {
      clearInterval(this.trainingInterval);
      this.trainingInterval = null;
    }

    this.behavioralModel.dispose();
    this.taskPredictionModel.dispose();
    this.trainingQueue = [];
    
    console.log('Model training pipeline disposed');
  }
}

// Type definitions
interface TrainingData {
  type: 'behavioral' | 'task_prediction';
  data: any;
  timestamp?: number;
}

interface TrainingPipelineStatus {
  isTraining: boolean;
  queueSize: number;
  minTrainingDataSize: number;
  lastTrainingTime: Date | null;
  models: {
    behavioral: {
      initialized: boolean;
      summary: string;
    };
    taskPrediction: {
      initialized: boolean;
      metrics: any;
    };
  };
}

interface TrainingConfig {
  minTrainingDataSize: number;
  maxTrainingDataSize: number;
}

interface ModelPredictions {
  behaviorPattern: BehaviorPattern;
  taskPredictions: any[];
}