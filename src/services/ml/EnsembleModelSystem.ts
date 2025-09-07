import { TaskPredictionModel } from './TaskPredictionModel';
import { BehavioralPatternModel } from './BehavioralPatternModel';
import { PriorityOptimizationEngine } from './PriorityOptimizationEngine';
import { UserAdaptationService } from './UserAdaptationService';

export interface ModelPrediction {
  modelId: string;
  prediction: any;
  confidence: number;
  timestamp: Date;
  context: PredictionContext;
}

export interface PredictionContext {
  userId: string;
  taskType: string;
  timeOfDay: number;
  workloadLevel: 'low' | 'medium' | 'high';
  recentActivity: string[];
}

export interface EnsembleConfig {
  models: ModelConfig[];
  aggregationStrategy: 'weighted_average' | 'voting' | 'stacking' | 'dynamic';
  confidenceThreshold: number;
  contextWeights: Record<string, number>;
}

export interface ModelConfig {
  modelId: string;
  modelType: 'task_prediction' | 'behavioral_pattern' | 'priority_optimization' | 'user_adaptation';
  weight: number;
  enabled: boolean;
  contextFilters: string[];
}

export interface AggregatedPrediction {
  prediction: any;
  confidence: number;
  contributingModels: string[];
  aggregationMethod: string;
  metadata: {
    modelScores: Record<string, number>;
    contextMatch: number;
    timestamp: Date;
  };
}

export class EnsembleModelSystem {
  private models: Map<string, any> = new Map();
  private config: EnsembleConfig;
  private performanceHistory: Map<string, ModelPerformance[]> = new Map();

  constructor(config: EnsembleConfig) {
    this.config = config;
    this.initializeModels();
  }

  private initializeModels(): void {
    // Initialize individual models
    this.models.set('task_prediction', new TaskPredictionModel());
    this.models.set('behavioral_pattern', new BehavioralPatternModel());
    this.models.set('priority_optimization', new PriorityOptimizationEngine());
    this.models.set('user_adaptation', new UserAdaptationService());
  }

  async predict(input: any, context: PredictionContext): Promise<AggregatedPrediction> {
    // Get predictions from all enabled models
    const modelPredictions = await this.getModelPredictions(input, context);
    
    // Filter predictions based on confidence threshold
    const validPredictions = modelPredictions.filter(
      pred => pred.confidence >= this.config.confidenceThreshold
    );

    if (validPredictions.length === 0) {
      throw new Error('No models meet confidence threshold');
    }

    // Select aggregation strategy based on context
    const strategy = this.selectAggregationStrategy(context, validPredictions);
    
    // Aggregate predictions
    const aggregatedPrediction = await this.aggregatePredictions(
      validPredictions, 
      strategy, 
      context
    );

    // Update performance tracking
    this.updatePerformanceTracking(validPredictions, aggregatedPrediction);

    return aggregatedPrediction;
  }

  private async getModelPredictions(
    input: any, 
    context: PredictionContext
  ): Promise<ModelPrediction[]> {
    const predictions: ModelPrediction[] = [];

    for (const modelConfig of this.config.models) {
      if (!modelConfig.enabled) continue;

      // Check if model is suitable for current context
      if (!this.isModelSuitableForContext(modelConfig, context)) continue;

      try {
        const model = this.models.get(modelConfig.modelType);
        if (!model) continue;

        const prediction = await this.getPredictionFromModel(model, input, context);
        const confidence = this.calculateModelConfidence(
          modelConfig, 
          prediction, 
          context
        );

        predictions.push({
          modelId: modelConfig.modelId,
          prediction,
          confidence,
          timestamp: new Date(),
          context
        });
      } catch (error) {
        console.warn(`Model ${modelConfig.modelId} failed:`, error);
      }
    }

    return predictions;
  }

  private async getPredictionFromModel(
    model: any, 
    input: any, 
    context: PredictionContext
  ): Promise<any> {
    // Adapt input based on model type
    if (model instanceof TaskPredictionModel) {
      return await model.predictNextTasks(input, context.userId);
    } else if (model instanceof BehavioralPatternModel) {
      return await model.analyzeBehavior(input);
    } else if (model instanceof PriorityOptimizationEngine) {
      return await model.optimizePriorities(input, context);
    } else if (model instanceof UserAdaptationService) {
      return await model.adaptToUser(input, context.userId);
    }
    
    throw new Error('Unknown model type');
  }

  private isModelSuitableForContext(
    modelConfig: ModelConfig, 
    context: PredictionContext
  ): boolean {
    // Check context filters
    if (modelConfig.contextFilters.length > 0) {
      const contextString = `${context.taskType}_${context.workloadLevel}_${context.timeOfDay}`;
      return modelConfig.contextFilters.some(filter => 
        contextString.includes(filter)
      );
    }
    return true;
  }

  private calculateModelConfidence(
    modelConfig: ModelConfig,
    prediction: any,
    context: PredictionContext
  ): number {
    // Base confidence from model weight
    let confidence = modelConfig.weight;

    // Adjust based on historical performance
    const performance = this.getModelPerformance(modelConfig.modelId, context);
    if (performance) {
      confidence *= performance.accuracy;
    }

    // Adjust based on context match
    const contextMatch = this.calculateContextMatch(modelConfig, context);
    confidence *= contextMatch;

    // Normalize to [0, 1]
    return Math.min(Math.max(confidence, 0), 1);
  }

  private selectAggregationStrategy(
    context: PredictionContext,
    predictions: ModelPrediction[]
  ): string {
    if (this.config.aggregationStrategy === 'dynamic') {
      // Select strategy based on context and prediction diversity
      const confidenceVariance = this.calculateConfidenceVariance(predictions);
      
      if (confidenceVariance < 0.1) {
        return 'weighted_average';
      } else if (predictions.length >= 3) {
        return 'voting';
      } else {
        return 'stacking';
      }
    }
    
    return this.config.aggregationStrategy;
  }

  private async aggregatePredictions(
    predictions: ModelPrediction[],
    strategy: string,
    context: PredictionContext
  ): Promise<AggregatedPrediction> {
    switch (strategy) {
      case 'weighted_average':
        return this.weightedAverageAggregation(predictions, context);
      case 'voting':
        return this.votingAggregation(predictions, context);
      case 'stacking':
        return this.stackingAggregation(predictions, context);
      default:
        throw new Error(`Unknown aggregation strategy: ${strategy}`);
    }
  }

  private weightedAverageAggregation(
    predictions: ModelPrediction[],
    context: PredictionContext
  ): AggregatedPrediction {
    const totalWeight = predictions.reduce((sum, pred) => sum + pred.confidence, 0);
    
    // Aggregate predictions based on weighted average
    const aggregatedPrediction = this.combineNumericPredictions(predictions, totalWeight);
    
    const avgConfidence = totalWeight / predictions.length;
    
    return {
      prediction: aggregatedPrediction,
      confidence: avgConfidence,
      contributingModels: predictions.map(p => p.modelId),
      aggregationMethod: 'weighted_average',
      metadata: {
        modelScores: this.getModelScores(predictions),
        contextMatch: this.calculateContextMatch(null, context),
        timestamp: new Date()
      }
    };
  }

  private votingAggregation(
    predictions: ModelPrediction[],
    context: PredictionContext
  ): AggregatedPrediction {
    // Implement majority voting for categorical predictions
    const votes = new Map<string, number>();
    
    predictions.forEach(pred => {
      const key = JSON.stringify(pred.prediction);
      votes.set(key, (votes.get(key) || 0) + pred.confidence);
    });

    const winner = Array.from(votes.entries())
      .sort((a, b) => b[1] - a[1])[0];

    const winningPrediction = JSON.parse(winner[0]);
    const confidence = winner[1] / predictions.length;

    return {
      prediction: winningPrediction,
      confidence,
      contributingModels: predictions.map(p => p.modelId),
      aggregationMethod: 'voting',
      metadata: {
        modelScores: this.getModelScores(predictions),
        contextMatch: this.calculateContextMatch(null, context),
        timestamp: new Date()
      }
    };
  }

  private stackingAggregation(
    predictions: ModelPrediction[],
    context: PredictionContext
  ): AggregatedPrediction {
    // Use a meta-learner to combine predictions
    // For now, implement a simple weighted combination based on historical performance
    const weights = predictions.map(pred => {
      const performance = this.getModelPerformance(pred.modelId, context);
      return performance ? performance.accuracy : pred.confidence;
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const normalizedWeights = weights.map(w => w / totalWeight);

    const aggregatedPrediction = this.combineWithWeights(predictions, normalizedWeights);
    const confidence = this.calculateStackingConfidence(predictions, normalizedWeights);

    return {
      prediction: aggregatedPrediction,
      confidence,
      contributingModels: predictions.map(p => p.modelId),
      aggregationMethod: 'stacking',
      metadata: {
        modelScores: this.getModelScores(predictions),
        contextMatch: this.calculateContextMatch(null, context),
        timestamp: new Date()
      }
    };
  }

  private combineNumericPredictions(predictions: ModelPrediction[], totalWeight: number): any {
    // Combine numeric predictions using weighted average
    if (predictions.length === 0) return null;

    const firstPred = predictions[0].prediction;
    if (typeof firstPred === 'number') {
      return predictions.reduce((sum, pred) => 
        sum + (pred.prediction * pred.confidence), 0) / totalWeight;
    }

    // For complex objects, combine recursively
    return this.combineComplexPredictions(predictions, totalWeight);
  }

  private combineComplexPredictions(predictions: ModelPrediction[], totalWeight: number): any {
    // Handle arrays and objects
    const firstPred = predictions[0].prediction;
    
    if (Array.isArray(firstPred)) {
      // Combine arrays by averaging corresponding elements
      const maxLength = Math.max(...predictions.map(p => p.prediction.length));
      const result = [];
      
      for (let i = 0; i < maxLength; i++) {
        let sum = 0;
        let count = 0;
        
        predictions.forEach(pred => {
          if (pred.prediction[i] !== undefined) {
            sum += pred.prediction[i] * pred.confidence;
            count += pred.confidence;
          }
        });
        
        result[i] = count > 0 ? sum / count : 0;
      }
      
      return result;
    }

    // For objects, combine properties
    const result: any = {};
    const allKeys = new Set<string>();
    
    predictions.forEach(pred => {
      if (typeof pred.prediction === 'object' && pred.prediction !== null) {
        Object.keys(pred.prediction).forEach(key => allKeys.add(key));
      }
    });

    allKeys.forEach(key => {
      const values = predictions
        .filter(pred => pred.prediction[key] !== undefined)
        .map(pred => ({ value: pred.prediction[key], weight: pred.confidence }));
      
      if (values.length > 0) {
        const totalKeyWeight = values.reduce((sum, v) => sum + v.weight, 0);
        result[key] = values.reduce((sum, v) => sum + (v.value * v.weight), 0) / totalKeyWeight;
      }
    });

    return result;
  }

  private combineWithWeights(predictions: ModelPrediction[], weights: number[]): any {
    // Similar to combineNumericPredictions but with explicit weights
    const weightedPredictions = predictions.map((pred, i) => ({
      ...pred,
      confidence: weights[i]
    }));
    
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    return this.combineNumericPredictions(weightedPredictions, totalWeight);
  }

  private calculateStackingConfidence(predictions: ModelPrediction[], weights: number[]): number {
    // Calculate confidence for stacking based on weighted model confidences
    return predictions.reduce((sum, pred, i) => 
      sum + (pred.confidence * weights[i]), 0);
  }

  private calculateConfidenceVariance(predictions: ModelPrediction[]): number {
    const confidences = predictions.map(p => p.confidence);
    const mean = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    const variance = confidences.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / confidences.length;
    return variance;
  }

  private calculateContextMatch(modelConfig: ModelConfig | null, context: PredictionContext): number {
    // Calculate how well the context matches the expected context
    // This is a simplified implementation
    return 1.0; // For now, assume perfect match
  }

  private getModelScores(predictions: ModelPrediction[]): Record<string, number> {
    const scores: Record<string, number> = {};
    predictions.forEach(pred => {
      scores[pred.modelId] = pred.confidence;
    });
    return scores;
  }

  private getModelPerformance(modelId: string, context: PredictionContext): ModelPerformance | null {
    const history = this.performanceHistory.get(modelId);
    if (!history || history.length === 0) return null;

    // Return most recent performance or context-specific performance
    return history[history.length - 1];
  }

  private updatePerformanceTracking(
    predictions: ModelPrediction[],
    aggregatedPrediction: AggregatedPrediction
  ): void {
    // This would be called after we have ground truth to compare against
    // For now, just track that predictions were made
    predictions.forEach(pred => {
      if (!this.performanceHistory.has(pred.modelId)) {
        this.performanceHistory.set(pred.modelId, []);
      }
    });
  }

  // Public methods for performance tracking
  recordPredictionOutcome(
    modelId: string,
    predicted: any,
    actual: any,
    context: PredictionContext
  ): void {
    const accuracy = this.calculateAccuracy(predicted, actual);
    const performance: ModelPerformance = {
      modelId,
      accuracy,
      timestamp: new Date(),
      context: context.taskType,
      sampleSize: 1
    };

    if (!this.performanceHistory.has(modelId)) {
      this.performanceHistory.set(modelId, []);
    }

    this.performanceHistory.get(modelId)!.push(performance);

    // Keep only recent history (last 100 entries)
    const history = this.performanceHistory.get(modelId)!;
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
  }

  private calculateAccuracy(predicted: any, actual: any): number {
    // Implement accuracy calculation based on prediction type
    if (typeof predicted === 'number' && typeof actual === 'number') {
      const error = Math.abs(predicted - actual) / Math.abs(actual);
      return Math.max(0, 1 - error);
    }

    if (Array.isArray(predicted) && Array.isArray(actual)) {
      const matches = predicted.filter((p, i) => p === actual[i]).length;
      return matches / Math.max(predicted.length, actual.length);
    }

    // For objects, compare JSON strings (simple approach)
    return JSON.stringify(predicted) === JSON.stringify(actual) ? 1.0 : 0.0;
  }

  getModelPerformanceReport(): Record<string, ModelPerformanceReport> {
    const report: Record<string, ModelPerformanceReport> = {};

    this.performanceHistory.forEach((history, modelId) => {
      if (history.length === 0) return;

      const accuracies = history.map(h => h.accuracy);
      const avgAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
      const minAccuracy = Math.min(...accuracies);
      const maxAccuracy = Math.max(...accuracies);

      report[modelId] = {
        modelId,
        averageAccuracy: avgAccuracy,
        minAccuracy,
        maxAccuracy,
        sampleCount: history.length,
        lastUpdated: history[history.length - 1].timestamp
      };
    });

    return report;
  }
}

interface ModelPerformance {
  modelId: string;
  accuracy: number;
  timestamp: Date;
  context: string;
  sampleSize: number;
}

interface ModelPerformanceReport {
  modelId: string;
  averageAccuracy: number;
  minAccuracy: number;
  maxAccuracy: number;
  sampleCount: number;
  lastUpdated: Date;
}