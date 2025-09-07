import { EnsembleModelSystem, PredictionContext, AggregatedPrediction } from './EnsembleModelSystem';

export interface ABTestConfig {
  testId: string;
  name: string;
  description: string;
  variants: ABTestVariant[];
  trafficSplit: Record<string, number>; // variant -> percentage
  startDate: Date;
  endDate: Date;
  successMetrics: string[];
  minimumSampleSize: number;
  confidenceLevel: number;
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  ensembleConfig: any; // EnsembleConfig
  isControl: boolean;
}

export interface ABTestResult {
  testId: string;
  variantId: string;
  userId: string;
  prediction: any;
  actualOutcome?: any;
  timestamp: Date;
  context: PredictionContext;
  metrics: Record<string, number>;
}

export interface ABTestAnalysis {
  testId: string;
  status: 'running' | 'completed' | 'stopped';
  results: Record<string, VariantAnalysis>;
  winner?: string;
  confidence: number;
  recommendations: string[];
  startDate: Date;
  endDate?: Date;
}

export interface VariantAnalysis {
  variantId: string;
  sampleSize: number;
  conversionRate: number;
  averageAccuracy: number;
  confidenceInterval: [number, number];
  metrics: Record<string, StatisticalSummary>;
}

export interface StatisticalSummary {
  mean: number;
  median: number;
  standardDeviation: number;
  min: number;
  max: number;
  count: number;
}

export class ABTestingFramework {
  private activeTests: Map<string, ABTestConfig> = new Map();
  private testResults: Map<string, ABTestResult[]> = new Map();
  private ensembleSystems: Map<string, EnsembleModelSystem> = new Map();
  private userAssignments: Map<string, Map<string, string>> = new Map(); // userId -> testId -> variantId

  constructor() {
    this.loadActiveTests();
  }

  createTest(config: ABTestConfig): void {
    // Validate test configuration
    this.validateTestConfig(config);

    // Initialize ensemble systems for each variant
    config.variants.forEach(variant => {
      const ensembleSystem = new EnsembleModelSystem(variant.ensembleConfig);
      this.ensembleSystems.set(`${config.testId}_${variant.id}`, ensembleSystem);
    });

    // Store test configuration
    this.activeTests.set(config.testId, config);
    this.testResults.set(config.testId, []);

    console.log(`A/B test created: ${config.testId}`);
  }

  async getPrediction(
    testId: string,
    userId: string,
    input: any,
    context: PredictionContext
  ): Promise<AggregatedPrediction> {
    const test = this.activeTests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    // Check if test is active
    const now = new Date();
    if (now < test.startDate || now > test.endDate) {
      throw new Error(`Test ${testId} is not active`);
    }

    // Get or assign user to variant
    const variantId = this.assignUserToVariant(testId, userId, test);
    const ensembleKey = `${testId}_${variantId}`;
    const ensembleSystem = this.ensembleSystems.get(ensembleKey);

    if (!ensembleSystem) {
      throw new Error(`Ensemble system not found for ${ensembleKey}`);
    }

    // Get prediction from assigned variant
    const prediction = await ensembleSystem.predict(input, context);

    // Record the test result
    const testResult: ABTestResult = {
      testId,
      variantId,
      userId,
      prediction: prediction.prediction,
      timestamp: new Date(),
      context,
      metrics: this.extractMetrics(prediction)
    };

    this.recordTestResult(testResult);

    return prediction;
  }

  recordOutcome(
    testId: string,
    userId: string,
    actualOutcome: any,
    timestamp: Date
  ): void {
    const results = this.testResults.get(testId);
    if (!results) return;

    // Find the most recent prediction for this user
    const userResults = results
      .filter(r => r.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (userResults.length === 0) return;

    const latestResult = userResults[0];
    
    // Update with actual outcome
    latestResult.actualOutcome = actualOutcome;
    
    // Calculate accuracy and update metrics
    const accuracy = this.calculateAccuracy(latestResult.prediction, actualOutcome);
    latestResult.metrics.accuracy = accuracy;

    // Update ensemble system performance
    const ensembleKey = `${testId}_${latestResult.variantId}`;
    const ensembleSystem = this.ensembleSystems.get(ensembleKey);
    
    if (ensembleSystem) {
      // Record outcome for all contributing models
      // This would need to be implemented based on the specific ensemble system
      console.log(`Recorded outcome for test ${testId}, variant ${latestResult.variantId}`);
    }
  }

  analyzeTest(testId: string): ABTestAnalysis {
    const test = this.activeTests.get(testId);
    const results = this.testResults.get(testId);

    if (!test || !results) {
      throw new Error(`Test ${testId} not found`);
    }

    const now = new Date();
    const status = now > test.endDate ? 'completed' : 'running';

    // Group results by variant
    const variantResults = this.groupResultsByVariant(results);
    
    // Analyze each variant
    const variantAnalyses: Record<string, VariantAnalysis> = {};
    
    for (const [variantId, variantResults] of variantResults.entries()) {
      variantAnalyses[variantId] = this.analyzeVariant(variantId, variantResults);
    }

    // Determine winner using statistical significance
    const winner = this.determineWinner(variantAnalyses, test.confidenceLevel);
    const confidence = this.calculateOverallConfidence(variantAnalyses);

    // Generate recommendations
    const recommendations = this.generateRecommendations(variantAnalyses, winner);

    return {
      testId,
      status,
      results: variantAnalyses,
      winner,
      confidence,
      recommendations,
      startDate: test.startDate,
      endDate: status === 'completed' ? test.endDate : undefined
    };
  }

  stopTest(testId: string): void {
    const test = this.activeTests.get(testId);
    if (!test) return;

    // Update end date to now
    test.endDate = new Date();
    
    console.log(`A/B test stopped: ${testId}`);
  }

  getActiveTests(): ABTestConfig[] {
    return Array.from(this.activeTests.values())
      .filter(test => {
        const now = new Date();
        return now >= test.startDate && now <= test.endDate;
      });
  }

  private validateTestConfig(config: ABTestConfig): void {
    // Validate traffic split sums to 100%
    const totalTraffic = Object.values(config.trafficSplit)
      .reduce((sum, percentage) => sum + percentage, 0);
    
    if (Math.abs(totalTraffic - 100) > 0.01) {
      throw new Error('Traffic split must sum to 100%');
    }

    // Validate variants exist in traffic split
    config.variants.forEach(variant => {
      if (!(variant.id in config.trafficSplit)) {
        throw new Error(`Variant ${variant.id} not found in traffic split`);
      }
    });

    // Validate dates
    if (config.startDate >= config.endDate) {
      throw new Error('Start date must be before end date');
    }

    // Validate at least one control variant
    const hasControl = config.variants.some(v => v.isControl);
    if (!hasControl) {
      throw new Error('At least one variant must be marked as control');
    }
  }

  private assignUserToVariant(testId: string, userId: string, test: ABTestConfig): string {
    // Check if user is already assigned
    if (!this.userAssignments.has(userId)) {
      this.userAssignments.set(userId, new Map());
    }

    const userTests = this.userAssignments.get(userId)!;
    if (userTests.has(testId)) {
      return userTests.get(testId)!;
    }

    // Assign user to variant based on traffic split
    const variantId = this.selectVariantForUser(userId, test);
    userTests.set(testId, variantId);

    return variantId;
  }

  private selectVariantForUser(userId: string, test: ABTestConfig): string {
    // Use consistent hashing to assign users to variants
    const hash = this.hashUserId(userId, test.testId);
    const percentage = hash % 100;

    let cumulativePercentage = 0;
    for (const variant of test.variants) {
      cumulativePercentage += test.trafficSplit[variant.id];
      if (percentage < cumulativePercentage) {
        return variant.id;
      }
    }

    // Fallback to first variant
    return test.variants[0].id;
  }

  private hashUserId(userId: string, testId: string): number {
    // Simple hash function for consistent user assignment
    const str = `${userId}_${testId}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private recordTestResult(result: ABTestResult): void {
    const results = this.testResults.get(result.testId);
    if (results) {
      results.push(result);
    }
  }

  private extractMetrics(prediction: AggregatedPrediction): Record<string, number> {
    return {
      confidence: prediction.confidence,
      contributingModelsCount: prediction.contributingModels.length,
      responseTime: Date.now() - prediction.metadata.timestamp.getTime()
    };
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

    return JSON.stringify(predicted) === JSON.stringify(actual) ? 1.0 : 0.0;
  }

  private groupResultsByVariant(results: ABTestResult[]): Map<string, ABTestResult[]> {
    const grouped = new Map<string, ABTestResult[]>();
    
    results.forEach(result => {
      if (!grouped.has(result.variantId)) {
        grouped.set(result.variantId, []);
      }
      grouped.get(result.variantId)!.push(result);
    });

    return grouped;
  }

  private analyzeVariant(variantId: string, results: ABTestResult[]): VariantAnalysis {
    const resultsWithOutcome = results.filter(r => r.actualOutcome !== undefined);
    
    if (resultsWithOutcome.length === 0) {
      return {
        variantId,
        sampleSize: 0,
        conversionRate: 0,
        averageAccuracy: 0,
        confidenceInterval: [0, 0],
        metrics: {}
      };
    }

    // Calculate conversion rate (assuming binary outcome)
    const conversions = resultsWithOutcome.filter(r => r.actualOutcome === true).length;
    const conversionRate = conversions / resultsWithOutcome.length;

    // Calculate average accuracy
    const accuracies = resultsWithOutcome
      .filter(r => r.metrics.accuracy !== undefined)
      .map(r => r.metrics.accuracy);
    
    const averageAccuracy = accuracies.length > 0 
      ? accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length 
      : 0;

    // Calculate confidence interval for conversion rate
    const confidenceInterval = this.calculateConfidenceInterval(
      conversionRate, 
      resultsWithOutcome.length, 
      0.95
    );

    // Calculate metrics summaries
    const metrics: Record<string, StatisticalSummary> = {};
    const metricKeys = ['confidence', 'contributingModelsCount', 'responseTime'];
    
    metricKeys.forEach(key => {
      const values = results
        .filter(r => r.metrics[key] !== undefined)
        .map(r => r.metrics[key]);
      
      if (values.length > 0) {
        metrics[key] = this.calculateStatisticalSummary(values);
      }
    });

    return {
      variantId,
      sampleSize: resultsWithOutcome.length,
      conversionRate,
      averageAccuracy,
      confidenceInterval,
      metrics
    };
  }

  private calculateConfidenceInterval(
    proportion: number, 
    sampleSize: number, 
    confidenceLevel: number
  ): [number, number] {
    // Calculate confidence interval for proportion using normal approximation
    const z = this.getZScore(confidenceLevel);
    const standardError = Math.sqrt((proportion * (1 - proportion)) / sampleSize);
    const margin = z * standardError;
    
    return [
      Math.max(0, proportion - margin),
      Math.min(1, proportion + margin)
    ];
  }

  private getZScore(confidenceLevel: number): number {
    // Z-scores for common confidence levels
    const zScores: Record<number, number> = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576
    };
    
    return zScores[confidenceLevel] || 1.96;
  }

  private calculateStatisticalSummary(values: number[]): StatisticalSummary {
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((s, v) => s + v, 0);
    const mean = sum / values.length;
    
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    return {
      mean,
      median,
      standardDeviation,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  }

  private determineWinner(
    analyses: Record<string, VariantAnalysis>, 
    confidenceLevel: number
  ): string | undefined {
    const variants = Object.values(analyses);
    
    if (variants.length < 2) return undefined;

    // Find control variant
    const controlVariant = variants.find(v => 
      this.activeTests.get(Object.keys(analyses)[0])?.variants
        .find(variant => variant.id === v.variantId)?.isControl
    );

    if (!controlVariant) return undefined;

    // Compare each variant to control
    let bestVariant = controlVariant;
    let significantDifference = false;

    variants.forEach(variant => {
      if (variant.variantId === controlVariant.variantId) return;

      // Perform statistical significance test
      const isSignificant = this.isStatisticallySignificant(
        controlVariant, 
        variant, 
        confidenceLevel
      );

      if (isSignificant && variant.conversionRate > bestVariant.conversionRate) {
        bestVariant = variant;
        significantDifference = true;
      }
    });

    return significantDifference ? bestVariant.variantId : undefined;
  }

  private isStatisticallySignificant(
    control: VariantAnalysis, 
    variant: VariantAnalysis, 
    confidenceLevel: number
  ): boolean {
    // Perform two-proportion z-test
    const p1 = control.conversionRate;
    const n1 = control.sampleSize;
    const p2 = variant.conversionRate;
    const n2 = variant.sampleSize;

    if (n1 === 0 || n2 === 0) return false;

    const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2);
    const standardError = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
    
    if (standardError === 0) return false;

    const zStat = Math.abs(p1 - p2) / standardError;
    const criticalZ = this.getZScore(confidenceLevel);

    return zStat > criticalZ;
  }

  private calculateOverallConfidence(analyses: Record<string, VariantAnalysis>): number {
    const variants = Object.values(analyses);
    const totalSamples = variants.reduce((sum, v) => sum + v.sampleSize, 0);
    
    if (totalSamples === 0) return 0;

    // Calculate weighted average confidence based on sample sizes
    const weightedConfidence = variants.reduce((sum, v) => {
      const weight = v.sampleSize / totalSamples;
      return sum + (v.averageAccuracy * weight);
    }, 0);

    return weightedConfidence;
  }

  private generateRecommendations(
    analyses: Record<string, VariantAnalysis>, 
    winner?: string
  ): string[] {
    const recommendations: string[] = [];
    const variants = Object.values(analyses);

    if (winner) {
      recommendations.push(`Implement variant ${winner} as it shows statistically significant improvement`);
    } else {
      recommendations.push('No statistically significant winner found. Consider extending test duration or increasing sample size');
    }

    // Check for low sample sizes
    const lowSampleVariants = variants.filter(v => v.sampleSize < 100);
    if (lowSampleVariants.length > 0) {
      recommendations.push('Some variants have low sample sizes. Consider running test longer for more reliable results');
    }

    // Check for high variance in metrics
    variants.forEach(variant => {
      Object.entries(variant.metrics).forEach(([metric, summary]) => {
        if (summary.standardDeviation > summary.mean * 0.5) {
          recommendations.push(`High variance detected in ${metric} for variant ${variant.variantId}. Investigate potential causes`);
        }
      });
    });

    return recommendations;
  }

  private loadActiveTests(): void {
    // In a real implementation, this would load from persistent storage
    // For now, we'll start with an empty state
  }
}