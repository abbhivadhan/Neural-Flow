import { PredictionContext, ModelConfig } from './EnsembleModelSystem';

export interface ModelSelectionCriteria {
  accuracy: number;
  latency: number;
  resourceUsage: number;
  contextRelevance: number;
}

export interface ModelPerformanceMetrics {
  modelId: string;
  accuracy: number;
  averageLatency: number;
  memoryUsage: number;
  cpuUsage: number;
  successRate: number;
  lastUpdated: Date;
  contextPerformance: Map<string, ContextPerformance>;
}

export interface ContextPerformance {
  context: string;
  accuracy: number;
  latency: number;
  sampleCount: number;
  confidence: number;
}

export interface ModelSelectionStrategy {
  name: string;
  description: string;
  selectModel(
    availableModels: ModelConfig[],
    context: PredictionContext,
    criteria: ModelSelectionCriteria,
    performanceHistory: Map<string, ModelPerformanceMetrics>
  ): ModelConfig[];
}

export class DynamicModelSelector {
  private performanceHistory: Map<string, ModelPerformanceMetrics> = new Map();
  private selectionStrategies: Map<string, ModelSelectionStrategy> = new Map();
  private contextClassifier: ContextClassifier;

  constructor() {
    this.initializeStrategies();
    this.contextClassifier = new ContextClassifier();
  }

  selectOptimalModels(
    availableModels: ModelConfig[],
    context: PredictionContext,
    criteria: ModelSelectionCriteria,
    maxModels: number = 3
  ): ModelConfig[] {
    // Classify the context to determine the best selection strategy
    const contextType = this.contextClassifier.classifyContext(context);
    const strategy = this.getStrategyForContext(contextType);

    // Get model selection from strategy
    const selectedModels = strategy.selectModel(
      availableModels,
      context,
      criteria,
      this.performanceHistory
    );

    // Limit to maxModels and ensure they're ranked by suitability
    return selectedModels
      .slice(0, maxModels)
      .sort((a, b) => this.calculateModelScore(b, context, criteria) - 
                     this.calculateModelScore(a, context, criteria));
  }

  updateModelPerformance(
    modelId: string,
    context: PredictionContext,
    metrics: {
      accuracy: number;
      latency: number;
      memoryUsage: number;
      cpuUsage: number;
      success: boolean;
    }
  ): void {
    let modelMetrics = this.performanceHistory.get(modelId);
    
    if (!modelMetrics) {
      modelMetrics = {
        modelId,
        accuracy: 0,
        averageLatency: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        successRate: 0,
        lastUpdated: new Date(),
        contextPerformance: new Map()
      };
      this.performanceHistory.set(modelId, modelMetrics);
    }

    // Update overall metrics using exponential moving average
    const alpha = 0.1; // Learning rate
    modelMetrics.accuracy = this.updateEMA(modelMetrics.accuracy, metrics.accuracy, alpha);
    modelMetrics.averageLatency = this.updateEMA(modelMetrics.averageLatency, metrics.latency, alpha);
    modelMetrics.memoryUsage = this.updateEMA(modelMetrics.memoryUsage, metrics.memoryUsage, alpha);
    modelMetrics.cpuUsage = this.updateEMA(modelMetrics.cpuUsage, metrics.cpuUsage, alpha);
    modelMetrics.successRate = this.updateEMA(modelMetrics.successRate, metrics.success ? 1 : 0, alpha);
    modelMetrics.lastUpdated = new Date();

    // Update context-specific performance
    const contextKey = this.getContextKey(context);
    let contextPerf = modelMetrics.contextPerformance.get(contextKey);
    
    if (!contextPerf) {
      contextPerf = {
        context: contextKey,
        accuracy: metrics.accuracy,
        latency: metrics.latency,
        sampleCount: 1,
        confidence: 0.5
      };
    } else {
      contextPerf.accuracy = this.updateEMA(contextPerf.accuracy, metrics.accuracy, alpha);
      contextPerf.latency = this.updateEMA(contextPerf.latency, metrics.latency, alpha);
      contextPerf.sampleCount++;
      contextPerf.confidence = Math.min(1.0, contextPerf.sampleCount / 10); // Confidence increases with samples
    }
    
    modelMetrics.contextPerformance.set(contextKey, contextPerf);
  }

  getModelRecommendations(
    context: PredictionContext,
    criteria: ModelSelectionCriteria
  ): ModelRecommendation[] {
    const recommendations: ModelRecommendation[] = [];
    
    this.performanceHistory.forEach((metrics, modelId) => {
      const score = this.calculateModelScore({ modelId } as ModelConfig, context, criteria);
      const contextKey = this.getContextKey(context);
      const contextPerf = metrics.contextPerformance.get(contextKey);
      
      recommendations.push({
        modelId,
        score,
        reasoning: this.generateRecommendationReasoning(metrics, contextPerf, criteria),
        confidence: contextPerf?.confidence || 0.1,
        expectedPerformance: {
          accuracy: contextPerf?.accuracy || metrics.accuracy,
          latency: contextPerf?.latency || metrics.averageLatency,
          resourceUsage: (metrics.memoryUsage + metrics.cpuUsage) / 2
        }
      });
    });

    return recommendations.sort((a, b) => b.score - a.score);
  }

  private initializeStrategies(): void {
    // Accuracy-first strategy
    this.selectionStrategies.set('accuracy_first', {
      name: 'Accuracy First',
      description: 'Prioritizes models with highest accuracy',
      selectModel: (models, context, criteria, history) => {
        return models
          .filter(model => history.has(model.modelId))
          .sort((a, b) => {
            const aMetrics = history.get(a.modelId)!;
            const bMetrics = history.get(b.modelId)!;
            return bMetrics.accuracy - aMetrics.accuracy;
          });
      }
    });

    // Speed-first strategy
    this.selectionStrategies.set('speed_first', {
      name: 'Speed First',
      description: 'Prioritizes models with lowest latency',
      selectModel: (models, context, criteria, history) => {
        return models
          .filter(model => history.has(model.modelId))
          .sort((a, b) => {
            const aMetrics = history.get(a.modelId)!;
            const bMetrics = history.get(b.modelId)!;
            return aMetrics.averageLatency - bMetrics.averageLatency;
          });
      }
    });

    // Balanced strategy
    this.selectionStrategies.set('balanced', {
      name: 'Balanced',
      description: 'Balances accuracy, speed, and resource usage',
      selectModel: (models, context, criteria, history) => {
        return models
          .filter(model => history.has(model.modelId))
          .sort((a, b) => {
            const aScore = this.calculateBalancedScore(a, context, criteria, history);
            const bScore = this.calculateBalancedScore(b, context, criteria, history);
            return bScore - aScore;
          });
      }
    });

    // Context-aware strategy
    this.selectionStrategies.set('context_aware', {
      name: 'Context Aware',
      description: 'Selects models based on context-specific performance',
      selectModel: (models, context, criteria, history) => {
        const contextKey = this.getContextKey(context);
        
        return models
          .filter(model => {
            const metrics = history.get(model.modelId);
            return metrics && metrics.contextPerformance.has(contextKey);
          })
          .sort((a, b) => {
            const aMetrics = history.get(a.modelId)!;
            const bMetrics = history.get(b.modelId)!;
            const aContextPerf = aMetrics.contextPerformance.get(contextKey)!;
            const bContextPerf = bMetrics.contextPerformance.get(contextKey)!;
            
            // Weight by confidence and accuracy
            const aScore = aContextPerf.accuracy * aContextPerf.confidence;
            const bScore = bContextPerf.accuracy * bContextPerf.confidence;
            
            return bScore - aScore;
          });
      }
    });

    // Ensemble strategy
    this.selectionStrategies.set('ensemble', {
      name: 'Ensemble',
      description: 'Selects diverse models for ensemble prediction',
      selectModel: (models, context, criteria, history) => {
        // Select models that are diverse in their approaches
        const selectedModels: ModelConfig[] = [];
        const modelTypes = new Set<string>();
        
        // First, select the best model from each type
        models.forEach(model => {
          if (!modelTypes.has(model.modelType) && history.has(model.modelId)) {
            selectedModels.push(model);
            modelTypes.add(model.modelType);
          }
        });
        
        // Then add more models based on performance
        const remainingModels = models.filter(m => !selectedModels.includes(m));
        remainingModels
          .filter(model => history.has(model.modelId))
          .sort((a, b) => {
            const aMetrics = history.get(a.modelId)!;
            const bMetrics = history.get(b.modelId)!;
            return bMetrics.accuracy - aMetrics.accuracy;
          })
          .slice(0, 3 - selectedModels.length)
          .forEach(model => selectedModels.push(model));
        
        return selectedModels;
      }
    });
  }

  private getStrategyForContext(contextType: string): ModelSelectionStrategy {
    const strategyMap: Record<string, string> = {
      'high_accuracy_required': 'accuracy_first',
      'real_time': 'speed_first',
      'resource_constrained': 'balanced',
      'complex_task': 'ensemble',
      'default': 'context_aware'
    };

    const strategyName = strategyMap[contextType] || 'balanced';
    return this.selectionStrategies.get(strategyName)!;
  }

  private calculateModelScore(
    model: ModelConfig,
    context: PredictionContext,
    criteria: ModelSelectionCriteria
  ): number {
    const metrics = this.performanceHistory.get(model.modelId);
    if (!metrics) return 0;

    const contextKey = this.getContextKey(context);
    const contextPerf = metrics.contextPerformance.get(contextKey);

    // Use context-specific performance if available, otherwise use overall metrics
    const accuracy = contextPerf?.accuracy || metrics.accuracy;
    const latency = contextPerf?.latency || metrics.averageLatency;
    const resourceUsage = (metrics.memoryUsage + metrics.cpuUsage) / 2;

    // Normalize metrics to [0, 1] range
    const normalizedAccuracy = Math.min(1, Math.max(0, accuracy));
    const normalizedLatency = Math.min(1, Math.max(0, 1 - (latency / 1000))); // Assume 1s is max acceptable
    const normalizedResourceUsage = Math.min(1, Math.max(0, 1 - (resourceUsage / 100))); // Assume 100% is max

    // Calculate weighted score
    const score = (
      criteria.accuracy * normalizedAccuracy +
      criteria.latency * normalizedLatency +
      criteria.resourceUsage * normalizedResourceUsage +
      criteria.contextRelevance * (contextPerf?.confidence || 0.1)
    ) / (criteria.accuracy + criteria.latency + criteria.resourceUsage + criteria.contextRelevance);

    return score;
  }

  private calculateBalancedScore(
    model: ModelConfig,
    context: PredictionContext,
    criteria: ModelSelectionCriteria,
    history: Map<string, ModelPerformanceMetrics>
  ): number {
    const metrics = history.get(model.modelId);
    if (!metrics) return 0;

    // Balanced scoring with equal weights
    const balancedCriteria: ModelSelectionCriteria = {
      accuracy: 0.4,
      latency: 0.3,
      resourceUsage: 0.2,
      contextRelevance: 0.1
    };

    return this.calculateModelScore(model, context, balancedCriteria);
  }

  private updateEMA(current: number, newValue: number, alpha: number): number {
    return alpha * newValue + (1 - alpha) * current;
  }

  private getContextKey(context: PredictionContext): string {
    return `${context.taskType}_${context.workloadLevel}_${Math.floor(context.timeOfDay / 4)}`;
  }

  private generateRecommendationReasoning(
    metrics: ModelPerformanceMetrics,
    contextPerf: ContextPerformance | undefined,
    criteria: ModelSelectionCriteria
  ): string {
    const reasons: string[] = [];

    if (metrics.accuracy > 0.9) {
      reasons.push('High accuracy (>90%)');
    }

    if (metrics.averageLatency < 100) {
      reasons.push('Low latency (<100ms)');
    }

    if (metrics.successRate > 0.95) {
      reasons.push('High reliability (>95% success rate)');
    }

    if (contextPerf && contextPerf.confidence > 0.8) {
      reasons.push('Strong performance in similar contexts');
    }

    if ((metrics.memoryUsage + metrics.cpuUsage) / 2 < 50) {
      reasons.push('Efficient resource usage');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'Standard performance metrics';
  }

  getPerformanceReport(): ModelPerformanceReport {
    const report: ModelPerformanceReport = {
      totalModels: this.performanceHistory.size,
      averageAccuracy: 0,
      averageLatency: 0,
      modelRankings: [],
      contextInsights: new Map(),
      recommendations: []
    };

    if (this.performanceHistory.size === 0) {
      return report;
    }

    // Calculate averages
    let totalAccuracy = 0;
    let totalLatency = 0;

    this.performanceHistory.forEach(metrics => {
      totalAccuracy += metrics.accuracy;
      totalLatency += metrics.averageLatency;
    });

    report.averageAccuracy = totalAccuracy / this.performanceHistory.size;
    report.averageLatency = totalLatency / this.performanceHistory.size;

    // Create model rankings
    report.modelRankings = Array.from(this.performanceHistory.values())
      .sort((a, b) => b.accuracy - a.accuracy)
      .map((metrics, index) => ({
        rank: index + 1,
        modelId: metrics.modelId,
        accuracy: metrics.accuracy,
        latency: metrics.averageLatency,
        resourceUsage: (metrics.memoryUsage + metrics.cpuUsage) / 2,
        successRate: metrics.successRate
      }));

    // Generate context insights
    const contextAccuracy = new Map<string, number[]>();
    
    this.performanceHistory.forEach(metrics => {
      metrics.contextPerformance.forEach((contextPerf, contextKey) => {
        if (!contextAccuracy.has(contextKey)) {
          contextAccuracy.set(contextKey, []);
        }
        contextAccuracy.get(contextKey)!.push(contextPerf.accuracy);
      });
    });

    contextAccuracy.forEach((accuracies, contextKey) => {
      const avgAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
      report.contextInsights.set(contextKey, {
        averageAccuracy: avgAccuracy,
        sampleCount: accuracies.length,
        bestModel: this.getBestModelForContext(contextKey),
        performance: avgAccuracy > report.averageAccuracy ? 'above_average' : 'below_average'
      });
    });

    // Generate recommendations
    report.recommendations = this.generateSystemRecommendations(report);

    return report;
  }

  private getBestModelForContext(contextKey: string): string {
    let bestModel = '';
    let bestAccuracy = 0;

    this.performanceHistory.forEach((metrics, modelId) => {
      const contextPerf = metrics.contextPerformance.get(contextKey);
      if (contextPerf && contextPerf.accuracy > bestAccuracy) {
        bestAccuracy = contextPerf.accuracy;
        bestModel = modelId;
      }
    });

    return bestModel;
  }

  private generateSystemRecommendations(report: ModelPerformanceReport): string[] {
    const recommendations: string[] = [];

    // Check for underperforming models
    const underperformingModels = report.modelRankings.filter(
      ranking => ranking.accuracy < report.averageAccuracy * 0.8
    );

    if (underperformingModels.length > 0) {
      recommendations.push(
        `Consider retraining or replacing ${underperformingModels.length} underperforming models`
      );
    }

    // Check for high latency models
    const highLatencyModels = report.modelRankings.filter(
      ranking => ranking.latency > report.averageLatency * 1.5
    );

    if (highLatencyModels.length > 0) {
      recommendations.push(
        `Optimize ${highLatencyModels.length} models with high latency`
      );
    }

    // Check context coverage
    if (report.contextInsights.size < 5) {
      recommendations.push('Increase context diversity to improve model selection accuracy');
    }

    return recommendations;
  }
}

class ContextClassifier {
  classifyContext(context: PredictionContext): string {
    // Simple rule-based classification
    // In a real implementation, this could use ML for more sophisticated classification
    
    if (context.workloadLevel === 'high' && context.recentActivity.length > 10) {
      return 'high_accuracy_required';
    }
    
    if (context.taskType.includes('real_time') || context.taskType.includes('live')) {
      return 'real_time';
    }
    
    if (context.workloadLevel === 'low') {
      return 'resource_constrained';
    }
    
    if (context.taskType.includes('complex') || context.recentActivity.length > 20) {
      return 'complex_task';
    }
    
    return 'default';
  }
}

interface ModelRecommendation {
  modelId: string;
  score: number;
  reasoning: string;
  confidence: number;
  expectedPerformance: {
    accuracy: number;
    latency: number;
    resourceUsage: number;
  };
}

interface ModelPerformanceReport {
  totalModels: number;
  averageAccuracy: number;
  averageLatency: number;
  modelRankings: ModelRanking[];
  contextInsights: Map<string, ContextInsight>;
  recommendations: string[];
}

interface ModelRanking {
  rank: number;
  modelId: string;
  accuracy: number;
  latency: number;
  resourceUsage: number;
  successRate: number;
}

interface ContextInsight {
  averageAccuracy: number;
  sampleCount: number;
  bestModel: string;
  performance: 'above_average' | 'below_average';
}