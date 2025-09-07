import { ModelPrediction, PredictionContext } from './EnsembleModelSystem';

export interface ConfidenceScore {
  overall: number;
  components: ConfidenceComponents;
  factors: ConfidenceFactor[];
  reliability: ReliabilityMetrics;
  calibration: CalibrationMetrics;
}

export interface ConfidenceComponents {
  modelAgreement: number;
  historicalAccuracy: number;
  dataQuality: number;
  contextMatch: number;
  predictionStability: number;
}

export interface ConfidenceFactor {
  name: string;
  impact: number; // -1 to 1, negative means reduces confidence
  description: string;
  weight: number;
}

export interface ReliabilityMetrics {
  consistency: number; // How consistent predictions are across similar contexts
  robustness: number; // How stable predictions are to small input changes
  coverage: number; // How well the training data covers the current context
}

export interface CalibrationMetrics {
  calibrationError: number; // How well confidence scores match actual accuracy
  overconfidence: number; // Tendency to be overconfident
  underconfidence: number; // Tendency to be underconfident
  sharpness: number; // How decisive the predictions are
}

export interface ConfidenceHistory {
  timestamp: Date;
  predictedConfidence: number;
  actualAccuracy: number;
  context: string;
  modelId: string;
}

export class ConfidenceScoring {
  private confidenceHistory: ConfidenceHistory[] = [];
  private calibrationData: Map<string, CalibrationBin[]> = new Map();
  private contextSimilarity: ContextSimilarityCalculator;

  constructor() {
    this.contextSimilarity = new ContextSimilarityCalculator();
    this.initializeCalibrationBins();
  }

  calculateConfidence(
    predictions: ModelPrediction[],
    context: PredictionContext,
    historicalData?: any[]
  ): ConfidenceScore {
    // Calculate individual confidence components
    const components = this.calculateConfidenceComponents(predictions, context, historicalData);
    
    // Calculate overall confidence as weighted combination
    const overall = this.combineConfidenceComponents(components);
    
    // Identify confidence factors
    const factors = this.identifyConfidenceFactors(predictions, context, components);
    
    // Calculate reliability metrics
    const reliability = this.calculateReliabilityMetrics(predictions, context);
    
    // Calculate calibration metrics
    const calibration = this.calculateCalibrationMetrics(predictions);

    return {
      overall,
      components,
      factors,
      reliability,
      calibration
    };
  }

  private calculateConfidenceComponents(
    predictions: ModelPrediction[],
    context: PredictionContext,
    historicalData?: any[]
  ): ConfidenceComponents {
    return {
      modelAgreement: this.calculateModelAgreement(predictions),
      historicalAccuracy: this.calculateHistoricalAccuracy(predictions, context),
      dataQuality: this.calculateDataQuality(historicalData || []),
      contextMatch: this.calculateContextMatch(context),
      predictionStability: this.calculatePredictionStability(predictions)
    };
  }

  private calculateModelAgreement(predictions: ModelPrediction[]): number {
    if (predictions.length < 2) return 0.5;

    // Calculate pairwise agreement between predictions
    let totalAgreement = 0;
    let comparisons = 0;

    for (let i = 0; i < predictions.length; i++) {
      for (let j = i + 1; j < predictions.length; j++) {
        const agreement = this.calculatePredictionSimilarity(
          predictions[i].prediction,
          predictions[j].prediction
        );
        totalAgreement += agreement;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalAgreement / comparisons : 0.5;
  }

  private calculatePredictionSimilarity(pred1: any, pred2: any): number {
    // Handle different prediction types
    if (typeof pred1 === 'number' && typeof pred2 === 'number') {
      const maxDiff = Math.max(Math.abs(pred1), Math.abs(pred2), 1);
      const similarity = 1 - Math.abs(pred1 - pred2) / maxDiff;
      return Math.max(0, similarity);
    }

    if (Array.isArray(pred1) && Array.isArray(pred2)) {
      const minLength = Math.min(pred1.length, pred2.length);
      const maxLength = Math.max(pred1.length, pred2.length);
      
      if (maxLength === 0) return 1;

      let matches = 0;
      for (let i = 0; i < minLength; i++) {
        if (pred1[i] === pred2[i]) matches++;
      }

      return matches / maxLength;
    }

    // For objects, compare JSON strings (simple approach)
    const str1 = JSON.stringify(pred1);
    const str2 = JSON.stringify(pred2);
    
    if (str1 === str2) return 1;
    
    // Calculate string similarity using Jaccard similarity
    const set1 = new Set(str1.split(''));
    const set2 = new Set(str2.split(''));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private calculateHistoricalAccuracy(
    predictions: ModelPrediction[],
    context: PredictionContext
  ): number {
    // Calculate weighted average of historical accuracy for these models in similar contexts
    let totalAccuracy = 0;
    let totalWeight = 0;

    predictions.forEach(prediction => {
      const modelHistory = this.getModelHistoryForContext(prediction.modelId, context);
      if (modelHistory.length > 0) {
        const avgAccuracy = modelHistory.reduce((sum, h) => sum + h.actualAccuracy, 0) / modelHistory.length;
        const weight = Math.min(modelHistory.length / 10, 1); // More history = higher weight
        totalAccuracy += avgAccuracy * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? totalAccuracy / totalWeight : 0.5;
  }

  private calculateDataQuality(historicalData: any[]): number {
    if (historicalData.length === 0) return 0.3;

    // Assess data quality based on various factors
    let qualityScore = 0;
    let factors = 0;

    // Data completeness
    const completeness = this.calculateDataCompleteness(historicalData);
    qualityScore += completeness;
    factors++;

    // Data consistency
    const consistency = this.calculateDataConsistency(historicalData);
    qualityScore += consistency;
    factors++;

    // Data recency
    const recency = this.calculateDataRecency(historicalData);
    qualityScore += recency;
    factors++;

    // Data volume
    const volume = Math.min(historicalData.length / 1000, 1); // Normalize to 1000 samples
    qualityScore += volume;
    factors++;

    return factors > 0 ? qualityScore / factors : 0.5;
  }

  private calculateDataCompleteness(data: any[]): number {
    if (data.length === 0) return 0;

    let totalFields = 0;
    let completeFields = 0;

    data.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.values(item).forEach(value => {
          totalFields++;
          if (value !== null && value !== undefined && value !== '') {
            completeFields++;
          }
        });
      }
    });

    return totalFields > 0 ? completeFields / totalFields : 1;
  }

  private calculateDataConsistency(data: any[]): number {
    if (data.length < 2) return 1;

    // Check for consistent data types and value ranges
    const typeConsistency = this.checkTypeConsistency(data);
    const rangeConsistency = this.checkRangeConsistency(data);

    return (typeConsistency + rangeConsistency) / 2;
  }

  private checkTypeConsistency(data: any[]): number {
    if (data.length === 0) return 1;

    const firstItem = data[0];
    if (typeof firstItem !== 'object') {
      // For primitive types, check if all items have the same type
      const firstType = typeof firstItem;
      const consistentItems = data.filter(item => typeof item === firstType).length;
      return consistentItems / data.length;
    }

    // For objects, check field type consistency
    const fieldTypes = new Map<string, string>();
    let totalChecks = 0;
    let consistentChecks = 0;

    // Establish field types from first item
    Object.entries(firstItem).forEach(([key, value]) => {
      fieldTypes.set(key, typeof value);
    });

    // Check consistency across all items
    data.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        fieldTypes.forEach((expectedType, fieldName) => {
          totalChecks++;
          if (item[fieldName] !== undefined && typeof item[fieldName] === expectedType) {
            consistentChecks++;
          }
        });
      }
    });

    return totalChecks > 0 ? consistentChecks / totalChecks : 1;
  }

  private checkRangeConsistency(data: any[]): number {
    // Check if numeric values are within reasonable ranges (no extreme outliers)
    const numericValues: number[] = [];
    
    data.forEach(item => {
      if (typeof item === 'number') {
        numericValues.push(item);
      } else if (typeof item === 'object' && item !== null) {
        Object.values(item).forEach(value => {
          if (typeof value === 'number') {
            numericValues.push(value);
          }
        });
      }
    });

    if (numericValues.length === 0) return 1;

    // Calculate IQR and identify outliers
    const sorted = [...numericValues].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const outliers = numericValues.filter(v => v < lowerBound || v > upperBound).length;
    return 1 - (outliers / numericValues.length);
  }

  private calculateDataRecency(data: any[]): number {
    if (data.length === 0) return 0;

    // Assume data has timestamp field or use current time
    const now = new Date().getTime();
    const timestamps = data
      .map(item => {
        if (item.timestamp) return new Date(item.timestamp).getTime();
        if (item.date) return new Date(item.date).getTime();
        return now; // Assume recent if no timestamp
      })
      .filter(ts => !isNaN(ts));

    if (timestamps.length === 0) return 0.5;

    const avgAge = timestamps.reduce((sum, ts) => sum + (now - ts), 0) / timestamps.length;
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

    return Math.max(0, 1 - (avgAge / maxAge));
  }

  private calculateContextMatch(context: PredictionContext): number {
    // Calculate how well the current context matches historical contexts
    const similarContexts = this.findSimilarContexts(context);
    
    if (similarContexts.length === 0) return 0.3; // Low confidence for unseen contexts

    const avgSimilarity = similarContexts.reduce((sum, sim) => sum + sim.similarity, 0) / similarContexts.length;
    return avgSimilarity;
  }

  private calculatePredictionStability(predictions: ModelPrediction[]): number {
    if (predictions.length < 2) return 0.5;

    // Calculate how stable predictions are (low variance indicates high stability)
    const confidences = predictions.map(p => p.confidence);
    const mean = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    const variance = confidences.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / confidences.length;
    const stability = 1 / (1 + variance); // Higher variance = lower stability

    return Math.min(1, Math.max(0, stability));
  }

  private combineConfidenceComponents(components: ConfidenceComponents): number {
    // Weighted combination of confidence components
    const weights = {
      modelAgreement: 0.25,
      historicalAccuracy: 0.30,
      dataQuality: 0.20,
      contextMatch: 0.15,
      predictionStability: 0.10
    };

    return (
      components.modelAgreement * weights.modelAgreement +
      components.historicalAccuracy * weights.historicalAccuracy +
      components.dataQuality * weights.dataQuality +
      components.contextMatch * weights.contextMatch +
      components.predictionStability * weights.predictionStability
    );
  }

  private identifyConfidenceFactors(
    predictions: ModelPrediction[],
    context: PredictionContext,
    components: ConfidenceComponents
  ): ConfidenceFactor[] {
    const factors: ConfidenceFactor[] = [];

    // High model agreement
    if (components.modelAgreement > 0.8) {
      factors.push({
        name: 'High Model Agreement',
        impact: 0.2,
        description: 'Multiple models agree on the prediction',
        weight: 0.25
      });
    } else if (components.modelAgreement < 0.3) {
      factors.push({
        name: 'Low Model Agreement',
        impact: -0.3,
        description: 'Models disagree significantly on the prediction',
        weight: 0.25
      });
    }

    // Historical accuracy
    if (components.historicalAccuracy > 0.9) {
      factors.push({
        name: 'Strong Historical Performance',
        impact: 0.25,
        description: 'Models have performed well in similar contexts',
        weight: 0.30
      });
    } else if (components.historicalAccuracy < 0.5) {
      factors.push({
        name: 'Poor Historical Performance',
        impact: -0.4,
        description: 'Models have struggled in similar contexts',
        weight: 0.30
      });
    }

    // Data quality
    if (components.dataQuality < 0.4) {
      factors.push({
        name: 'Low Data Quality',
        impact: -0.3,
        description: 'Training data quality is insufficient',
        weight: 0.20
      });
    }

    // Context match
    if (components.contextMatch < 0.3) {
      factors.push({
        name: 'Novel Context',
        impact: -0.2,
        description: 'Current context differs from training scenarios',
        weight: 0.15
      });
    }

    // Prediction stability
    if (components.predictionStability < 0.4) {
      factors.push({
        name: 'Unstable Predictions',
        impact: -0.15,
        description: 'Predictions show high variance',
        weight: 0.10
      });
    }

    // Additional contextual factors
    if (predictions.length === 1) {
      factors.push({
        name: 'Single Model',
        impact: -0.1,
        description: 'Only one model available for prediction',
        weight: 0.1
      });
    }

    if (context.workloadLevel === 'high') {
      factors.push({
        name: 'High Workload Context',
        impact: -0.05,
        description: 'High workload may affect prediction accuracy',
        weight: 0.05
      });
    }

    return factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  }

  private calculateReliabilityMetrics(
    predictions: ModelPrediction[],
    context: PredictionContext
  ): ReliabilityMetrics {
    return {
      consistency: this.calculateConsistency(predictions, context),
      robustness: this.calculateRobustness(predictions),
      coverage: this.calculateCoverage(context)
    };
  }

  private calculateConsistency(predictions: ModelPrediction[], context: PredictionContext): number {
    // How consistent are predictions across similar contexts
    const similarPredictions = this.findSimilarPredictions(context);
    
    if (similarPredictions.length < 2) return 0.5;

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < similarPredictions.length; i++) {
      for (let j = i + 1; j < similarPredictions.length; j++) {
        const similarity = this.calculatePredictionSimilarity(
          similarPredictions[i],
          similarPredictions[j]
        );
        totalSimilarity += similarity;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0.5;
  }

  private calculateRobustness(predictions: ModelPrediction[]): number {
    // How stable are predictions to small changes (estimated from confidence variance)
    if (predictions.length < 2) return 0.5;

    const confidences = predictions.map(p => p.confidence);
    const mean = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    const variance = confidences.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / confidences.length;
    
    // Lower variance indicates higher robustness
    return Math.max(0, 1 - variance);
  }

  private calculateCoverage(context: PredictionContext): number {
    // How well does training data cover the current context
    const similarContexts = this.findSimilarContexts(context);
    const coverageScore = Math.min(similarContexts.length / 10, 1); // Normalize to 10 similar contexts
    
    return coverageScore;
  }

  private calculateCalibrationMetrics(predictions: ModelPrediction[]): CalibrationMetrics {
    const calibrationBins = this.getCalibrationBins();
    
    let calibrationError = 0;
    let totalSamples = 0;
    let overconfidenceCount = 0;
    let underconfidenceCount = 0;
    let totalConfidence = 0;

    calibrationBins.forEach(bin => {
      if (bin.count > 0) {
        const binError = Math.abs(bin.averageConfidence - bin.averageAccuracy);
        calibrationError += binError * bin.count;
        totalSamples += bin.count;

        if (bin.averageConfidence > bin.averageAccuracy) {
          overconfidenceCount += bin.count;
        } else if (bin.averageConfidence < bin.averageAccuracy) {
          underconfidenceCount += bin.count;
        }

        totalConfidence += bin.averageConfidence * bin.count;
      }
    });

    const avgCalibrationError = totalSamples > 0 ? calibrationError / totalSamples : 0;
    const overconfidence = totalSamples > 0 ? overconfidenceCount / totalSamples : 0;
    const underconfidence = totalSamples > 0 ? underconfidenceCount / totalSamples : 0;
    const sharpness = totalSamples > 0 ? totalConfidence / totalSamples : 0.5;

    return {
      calibrationError: avgCalibrationError,
      overconfidence,
      underconfidence,
      sharpness
    };
  }

  // Helper methods
  private getModelHistoryForContext(modelId: string, context: PredictionContext): ConfidenceHistory[] {
    const contextKey = this.getContextKey(context);
    return this.confidenceHistory.filter(h => 
      h.modelId === modelId && h.context === contextKey
    );
  }

  private findSimilarContexts(context: PredictionContext): Array<{context: PredictionContext, similarity: number}> {
    // This would use the context similarity calculator to find similar contexts
    // For now, return a simplified implementation
    return [];
  }

  private findSimilarPredictions(context: PredictionContext): any[] {
    // Find predictions made in similar contexts
    const contextKey = this.getContextKey(context);
    return this.confidenceHistory
      .filter(h => h.context === contextKey)
      .map(h => h.predictedConfidence);
  }

  private getContextKey(context: PredictionContext): string {
    return `${context.taskType}_${context.workloadLevel}_${Math.floor(context.timeOfDay / 4)}`;
  }

  private initializeCalibrationBins(): void {
    // Initialize calibration bins for different confidence ranges
    for (let i = 0; i < 10; i++) {
      const binStart = i / 10;
      const binEnd = (i + 1) / 10;
      this.calibrationData.set(`bin_${i}`, [{
        binStart,
        binEnd,
        count: 0,
        averageConfidence: 0,
        averageAccuracy: 0
      }]);
    }
  }

  private getCalibrationBins(): CalibrationBin[] {
    const allBins: CalibrationBin[] = [];
    this.calibrationData.forEach(bins => {
      allBins.push(...bins);
    });
    return allBins;
  }

  // Public methods for updating calibration data
  updateCalibration(
    modelId: string,
    predictedConfidence: number,
    actualAccuracy: number,
    context: PredictionContext
  ): void {
    const history: ConfidenceHistory = {
      timestamp: new Date(),
      predictedConfidence,
      actualAccuracy,
      context: this.getContextKey(context),
      modelId
    };

    this.confidenceHistory.push(history);

    // Update calibration bins
    const binIndex = Math.min(Math.floor(predictedConfidence * 10), 9);
    const binKey = `bin_${binIndex}`;
    const bins = this.calibrationData.get(binKey) || [];
    
    if (bins.length > 0) {
      const bin = bins[0];
      const newCount = bin.count + 1;
      bin.averageConfidence = (bin.averageConfidence * bin.count + predictedConfidence) / newCount;
      bin.averageAccuracy = (bin.averageAccuracy * bin.count + actualAccuracy) / newCount;
      bin.count = newCount;
    }

    // Keep only recent history (last 1000 entries)
    if (this.confidenceHistory.length > 1000) {
      this.confidenceHistory = this.confidenceHistory.slice(-1000);
    }
  }
}

class ContextSimilarityCalculator {
  calculateSimilarity(context1: PredictionContext, context2: PredictionContext): number {
    let similarity = 0;
    let factors = 0;

    // Task type similarity
    if (context1.taskType === context2.taskType) {
      similarity += 1;
    } else if (this.areTaskTypesRelated(context1.taskType, context2.taskType)) {
      similarity += 0.5;
    }
    factors++;

    // Workload level similarity
    const workloadSimilarity = this.calculateWorkloadSimilarity(
      context1.workloadLevel, 
      context2.workloadLevel
    );
    similarity += workloadSimilarity;
    factors++;

    // Time of day similarity
    const timeSimilarity = 1 - Math.abs(context1.timeOfDay - context2.timeOfDay) / 24;
    similarity += timeSimilarity;
    factors++;

    // Recent activity similarity
    const activitySimilarity = this.calculateActivitySimilarity(
      context1.recentActivity,
      context2.recentActivity
    );
    similarity += activitySimilarity;
    factors++;

    return factors > 0 ? similarity / factors : 0;
  }

  private areTaskTypesRelated(type1: string, type2: string): boolean {
    // Define related task types
    const relatedTypes = new Map([
      ['coding', ['debugging', 'testing', 'reviewing']],
      ['writing', ['editing', 'proofreading', 'research']],
      ['analysis', ['research', 'planning', 'reporting']]
    ]);

    const related1 = relatedTypes.get(type1) || [];
    const related2 = relatedTypes.get(type2) || [];

    return related1.includes(type2) || related2.includes(type1);
  }

  private calculateWorkloadSimilarity(level1: string, level2: string): number {
    const levels = ['low', 'medium', 'high'];
    const index1 = levels.indexOf(level1);
    const index2 = levels.indexOf(level2);

    if (index1 === -1 || index2 === -1) return 0;
    if (index1 === index2) return 1;

    return 1 - Math.abs(index1 - index2) / (levels.length - 1);
  }

  private calculateActivitySimilarity(activity1: string[], activity2: string[]): number {
    const set1 = new Set(activity1);
    const set2 = new Set(activity2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }
}

interface CalibrationBin {
  binStart: number;
  binEnd: number;
  count: number;
  averageConfidence: number;
  averageAccuracy: number;
}