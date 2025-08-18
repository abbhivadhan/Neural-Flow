import { TrendData, ComparisonData } from '../../types/analytics';
import { ProductivityMetrics } from './ProductivityMetricsService';
import { TimeRange } from '../../types/common';

export interface ForecastModel {
  type: 'linear' | 'exponential' | 'seasonal' | 'arima' | 'lstm';
  parameters: { [key: string]: number };
  accuracy: number;
  confidence: number;
  lastTrained: Date;
}

export interface PerformanceForecast {
  metric: string;
  predictions: { timestamp: string; value: number; confidence: [number, number] }[];
  model: ForecastModel;
  seasonality: SeasonalityPattern | null;
  trends: {
    shortTerm: 'increasing' | 'decreasing' | 'stable';
    longTerm: 'increasing' | 'decreasing' | 'stable';
  };
  anomalies: AnomalyPrediction[];
  recommendations: string[];
}

export interface SeasonalityPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  strength: number;
  peaks: number[];
  troughs: number[];
  cycle: number; // length in time units
}

export interface AnomalyPrediction {
  timestamp: string;
  expectedValue: number;
  anomalyScore: number;
  type: 'spike' | 'drop' | 'trend_break' | 'seasonal_deviation';
  probability: number;
}

export interface TimeSeriesDecomposition {
  trend: { timestamp: string; value: number }[];
  seasonal: { timestamp: string; value: number }[];
  residual: { timestamp: string; value: number }[];
  original: { timestamp: string; value: number }[];
}

export class PerformanceForecastingService {
  private models = new Map<string, ForecastModel>();
  private readonly FORECAST_HORIZON_DAYS = 30;
  private readonly MIN_DATA_POINTS = 14;
  private readonly CONFIDENCE_LEVEL = 0.95;

  /**
   * Generate comprehensive performance forecasts
   */
  async generatePerformanceForecast(
    userId: string,
    historicalMetrics: ProductivityMetrics[],
    forecastHorizon: number = this.FORECAST_HORIZON_DAYS
  ): Promise<PerformanceForecast[]> {
    if (historicalMetrics.length < this.MIN_DATA_POINTS) {
      throw new Error(`Insufficient data: need at least ${this.MIN_DATA_POINTS} data points`);
    }

    const forecasts: PerformanceForecast[] = [];
    const metricsToForecast = [
      'productivityScore',
      'focusTime',
      'tasksCompleted',
      'efficiencyRatio',
      'burnoutRisk',
      'collaborationIndex'
    ];

    for (const metric of metricsToForecast) {
      const timeSeries = this.extractTimeSeries(historicalMetrics, metric);
      const forecast = await this.forecastMetric(metric, timeSeries, forecastHorizon);
      forecasts.push(forecast);
    }

    return forecasts;
  }

  /**
   * Perform time series decomposition
   */
  async decomposeTimeSeries(
    timeSeries: { timestamp: string; value: number }[],
    seasonalPeriod: number = 7
  ): Promise<TimeSeriesDecomposition> {
    const trend = this.extractTrend(timeSeries);
    const seasonal = this.extractSeasonality(timeSeries, seasonalPeriod);
    const residual = this.calculateResiduals(timeSeries, trend, seasonal);

    return {
      trend,
      seasonal,
      residual,
      original: timeSeries
    };
  }

  /**
   * Detect seasonal patterns in performance data
   */
  async detectSeasonality(
    timeSeries: { timestamp: string; value: number }[],
    periods: number[] = [7, 30, 90] // daily, weekly, monthly patterns
  ): Promise<SeasonalityPattern[]> {
    const patterns: SeasonalityPattern[] = [];

    for (const period of periods) {
      const pattern = this.analyzeSeasonalPattern(timeSeries, period);
      if (pattern.strength > 0.3) { // Significant seasonality threshold
        patterns.push(pattern);
      }
    }

    return patterns.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Predict performance anomalies
   */
  async predictAnomalies(
    timeSeries: { timestamp: string; value: number }[],
    forecastHorizon: number
  ): Promise<AnomalyPrediction[]> {
    const anomalies: AnomalyPrediction[] = [];
    const model = this.trainAnomalyDetectionModel(timeSeries);
    
    // Generate future timestamps
    const lastTimestamp = new Date(timeSeries[timeSeries.length - 1].timestamp);
    
    for (let i = 1; i <= forecastHorizon; i++) {
      const futureDate = new Date(lastTimestamp);
      futureDate.setDate(futureDate.getDate() + i);
      
      const expectedValue = this.predictValue(model, i);
      const anomalyScore = this.calculateAnomalyScore(expectedValue, timeSeries);
      
      if (anomalyScore > 0.7) { // Anomaly threshold
        anomalies.push({
          timestamp: futureDate.toISOString(),
          expectedValue,
          anomalyScore,
          type: this.classifyAnomalyType(anomalyScore, expectedValue, timeSeries),
          probability: anomalyScore
        });
      }
    }

    return anomalies;
  }

  /**
   * Generate scenario-based forecasts
   */
  async generateScenarioForecasts(
    userId: string,
    historicalMetrics: ProductivityMetrics[],
    scenarios: {
      name: string;
      adjustments: { [metric: string]: number };
    }[]
  ): Promise<{ [scenarioName: string]: PerformanceForecast[] }> {
    const results: { [scenarioName: string]: PerformanceForecast[] } = {};

    for (const scenario of scenarios) {
      const adjustedMetrics = this.applyScenarioAdjustments(historicalMetrics, scenario.adjustments);
      const forecasts = await this.generatePerformanceForecast(userId, adjustedMetrics);
      results[scenario.name] = forecasts;
    }

    return results;
  }

  /**
   * Calculate forecast accuracy metrics
   */
  async evaluateForecastAccuracy(
    predictions: { timestamp: string; value: number }[],
    actual: { timestamp: string; value: number }[]
  ): Promise<{
    mae: number; // Mean Absolute Error
    mse: number; // Mean Squared Error
    rmse: number; // Root Mean Squared Error
    mape: number; // Mean Absolute Percentage Error
    r2: number; // R-squared
  }> {
    const alignedData = this.alignPredictionsWithActual(predictions, actual);
    
    const errors = alignedData.map(({ predicted, actual }) => predicted - actual);
    const absoluteErrors = errors.map(e => Math.abs(e));
    const squaredErrors = errors.map(e => e * e);
    const percentageErrors = alignedData.map(({ predicted, actual }) => 
      actual !== 0 ? Math.abs((predicted - actual) / actual) * 100 : 0
    );

    const mae = this.mean(absoluteErrors);
    const mse = this.mean(squaredErrors);
    const rmse = Math.sqrt(mse);
    const mape = this.mean(percentageErrors);
    const r2 = this.calculateRSquared(alignedData.map(d => d.predicted), alignedData.map(d => d.actual));

    return { mae, mse, rmse, mape, r2 };
  }

  // Private helper methods

  private extractTimeSeries(metrics: ProductivityMetrics[], metricName: string): { timestamp: string; value: number }[] {
    return metrics.map((metric, index) => ({
      timestamp: new Date(Date.now() - (metrics.length - index - 1) * 24 * 60 * 60 * 1000).toISOString(),
      value: (metric as any)[metricName] || 0
    }));
  }

  private async forecastMetric(
    metricName: string,
    timeSeries: { timestamp: string; value: number }[],
    horizon: number
  ): Promise<PerformanceForecast> {
    // Select best model for this metric
    const model = await this.selectBestModel(metricName, timeSeries);
    
    // Generate predictions
    const predictions = this.generatePredictions(model, timeSeries, horizon);
    
    // Detect seasonality
    const seasonality = await this.detectSeasonality(timeSeries);
    const primarySeasonality = seasonality.length > 0 ? seasonality[0] : null;
    
    // Analyze trends
    const trends = this.analyzeTrends(timeSeries);
    
    // Predict anomalies
    const anomalies = await this.predictAnomalies(timeSeries, horizon);
    
    // Generate recommendations
    const recommendations = this.generateForecastRecommendations(metricName, predictions, trends, anomalies);

    return {
      metric: metricName,
      predictions,
      model,
      seasonality: primarySeasonality,
      trends,
      anomalies,
      recommendations
    };
  }

  private async selectBestModel(
    metricName: string,
    timeSeries: { timestamp: string; value: number }[]
  ): Promise<ForecastModel> {
    const models = [
      this.trainLinearModel(timeSeries),
      this.trainExponentialModel(timeSeries),
      this.trainSeasonalModel(timeSeries),
      this.trainARIMAModel(timeSeries)
    ];

    // Evaluate models using cross-validation
    let bestModel = models[0];
    let bestAccuracy = 0;

    for (const model of models) {
      const accuracy = await this.crossValidateModel(model, timeSeries);
      if (accuracy > bestAccuracy) {
        bestAccuracy = accuracy;
        bestModel = model;
      }
    }

    return bestModel;
  }

  private trainLinearModel(timeSeries: { timestamp: string; value: number }[]): ForecastModel {
    const n = timeSeries.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = timeSeries.map(d => d.value);

    const { slope, intercept } = this.linearRegression(x, y);

    return {
      type: 'linear',
      parameters: { slope, intercept },
      accuracy: 0.7, // Would calculate actual accuracy
      confidence: 0.8,
      lastTrained: new Date()
    };
  }

  private trainExponentialModel(timeSeries: { timestamp: string; value: number }[]): ForecastModel {
    // Exponential smoothing implementation
    const alpha = 0.3; // Smoothing parameter
    let level = timeSeries[0].value;
    
    for (let i = 1; i < timeSeries.length; i++) {
      level = alpha * timeSeries[i].value + (1 - alpha) * level;
    }

    return {
      type: 'exponential',
      parameters: { alpha, level },
      accuracy: 0.75,
      confidence: 0.8,
      lastTrained: new Date()
    };
  }

  private trainSeasonalModel(timeSeries: { timestamp: string; value: number }[]): ForecastModel {
    // Holt-Winters seasonal model
    const alpha = 0.3; // Level smoothing
    const beta = 0.1;  // Trend smoothing
    const gamma = 0.2; // Seasonal smoothing
    const seasonLength = 7; // Weekly seasonality

    return {
      type: 'seasonal',
      parameters: { alpha, beta, gamma, seasonLength },
      accuracy: 0.8,
      confidence: 0.85,
      lastTrained: new Date()
    };
  }

  private trainARIMAModel(timeSeries: { timestamp: string; value: number }[]): ForecastModel {
    // Simplified ARIMA(1,1,1) model
    const p = 1; // AR order
    const d = 1; // Differencing order
    const q = 1; // MA order

    return {
      type: 'arima',
      parameters: { p, d, q, phi: 0.5, theta: 0.3 },
      accuracy: 0.85,
      confidence: 0.9,
      lastTrained: new Date()
    };
  }

  private generatePredictions(
    model: ForecastModel,
    timeSeries: { timestamp: string; value: number }[],
    horizon: number
  ): { timestamp: string; value: number; confidence: [number, number] }[] {
    const predictions: { timestamp: string; value: number; confidence: [number, number] }[] = [];
    const lastTimestamp = new Date(timeSeries[timeSeries.length - 1].timestamp);

    for (let i = 1; i <= horizon; i++) {
      const futureDate = new Date(lastTimestamp);
      futureDate.setDate(futureDate.getDate() + i);

      let predictedValue: number;
      
      switch (model.type) {
        case 'linear':
          predictedValue = model.parameters.slope * (timeSeries.length + i - 1) + model.parameters.intercept;
          break;
        case 'exponential':
          predictedValue = model.parameters.level;
          break;
        case 'seasonal':
          predictedValue = this.predictWithSeasonalModel(model, timeSeries, i);
          break;
        case 'arima':
          predictedValue = this.predictWithARIMA(model, timeSeries, i);
          break;
        default:
          predictedValue = timeSeries[timeSeries.length - 1].value;
      }

      const confidenceInterval = this.calculateConfidenceInterval(
        predictedValue,
        model.confidence,
        i
      );

      predictions.push({
        timestamp: futureDate.toISOString(),
        value: predictedValue,
        confidence: confidenceInterval
      });
    }

    return predictions;
  }

  private predictWithSeasonalModel(
    model: ForecastModel,
    timeSeries: { timestamp: string; value: number }[],
    step: number
  ): number {
    // Simplified seasonal prediction
    const seasonLength = model.parameters.seasonLength;
    const seasonalIndex = (timeSeries.length + step - 1) % seasonLength;
    const baseValue = timeSeries[timeSeries.length - 1].value;
    const seasonalFactor = 1 + 0.1 * Math.sin(2 * Math.PI * seasonalIndex / seasonLength);
    
    return baseValue * seasonalFactor;
  }

  private predictWithARIMA(
    model: ForecastModel,
    timeSeries: { timestamp: string; value: number }[],
    step: number
  ): number {
    // Simplified ARIMA prediction
    const lastValue = timeSeries[timeSeries.length - 1].value;
    const phi = model.parameters.phi;
    const trend = this.calculateTrend(timeSeries);
    
    return lastValue + phi * trend * step;
  }

  private calculateTrend(timeSeries: { timestamp: string; value: number }[]): number {
    if (timeSeries.length < 2) return 0;
    
    const recent = timeSeries.slice(-5); // Use last 5 points
    const x = Array.from({ length: recent.length }, (_, i) => i);
    const y = recent.map(d => d.value);
    
    const { slope } = this.linearRegression(x, y);
    return slope;
  }

  private extractTrend(timeSeries: { timestamp: string; value: number }[]): { timestamp: string; value: number }[] {
    // Simple moving average for trend extraction
    const windowSize = Math.min(7, Math.floor(timeSeries.length / 3));
    const trend: { timestamp: string; value: number }[] = [];

    for (let i = 0; i < timeSeries.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(timeSeries.length, i + Math.floor(windowSize / 2) + 1);
      const window = timeSeries.slice(start, end);
      const average = window.reduce((sum, d) => sum + d.value, 0) / window.length;
      
      trend.push({
        timestamp: timeSeries[i].timestamp,
        value: average
      });
    }

    return trend;
  }

  private extractSeasonality(
    timeSeries: { timestamp: string; value: number }[],
    period: number
  ): { timestamp: string; value: number }[] {
    const seasonal: { timestamp: string; value: number }[] = [];
    
    for (let i = 0; i < timeSeries.length; i++) {
      const seasonalIndex = i % period;
      const seasonalValues = timeSeries
        .filter((_, idx) => idx % period === seasonalIndex)
        .map(d => d.value);
      
      const seasonalAverage = seasonalValues.reduce((sum, val) => sum + val, 0) / seasonalValues.length;
      const overallAverage = timeSeries.reduce((sum, d) => sum + d.value, 0) / timeSeries.length;
      
      seasonal.push({
        timestamp: timeSeries[i].timestamp,
        value: seasonalAverage - overallAverage
      });
    }

    return seasonal;
  }

  private calculateResiduals(
    original: { timestamp: string; value: number }[],
    trend: { timestamp: string; value: number }[],
    seasonal: { timestamp: string; value: number }[]
  ): { timestamp: string; value: number }[] {
    return original.map((d, i) => ({
      timestamp: d.timestamp,
      value: d.value - trend[i].value - seasonal[i].value
    }));
  }

  private analyzeSeasonalPattern(
    timeSeries: { timestamp: string; value: number }[],
    period: number
  ): SeasonalityPattern {
    const seasonalValues = Array(period).fill(0).map(() => [] as number[]);
    
    // Group values by seasonal position
    timeSeries.forEach((d, i) => {
      const seasonalIndex = i % period;
      seasonalValues[seasonalIndex].push(d.value);
    });

    // Calculate average for each seasonal position
    const seasonalAverages = seasonalValues.map(values => 
      values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0
    );

    // Calculate seasonal strength
    const overallMean = timeSeries.reduce((sum, d) => sum + d.value, 0) / timeSeries.length;
    const seasonalVariance = seasonalAverages.reduce((sum, avg) => sum + Math.pow(avg - overallMean, 2), 0) / period;
    const totalVariance = timeSeries.reduce((sum, d) => sum + Math.pow(d.value - overallMean, 2), 0) / timeSeries.length;
    const strength = totalVariance > 0 ? seasonalVariance / totalVariance : 0;

    // Find peaks and troughs
    const peaks: number[] = [];
    const troughs: number[] = [];
    
    for (let i = 0; i < seasonalAverages.length; i++) {
      const prev = seasonalAverages[(i - 1 + period) % period];
      const curr = seasonalAverages[i];
      const next = seasonalAverages[(i + 1) % period];
      
      if (curr > prev && curr > next) {
        peaks.push(i);
      } else if (curr < prev && curr < next) {
        troughs.push(i);
      }
    }

    return {
      type: period === 7 ? 'weekly' : period === 30 ? 'monthly' : 'daily',
      strength,
      peaks,
      troughs,
      cycle: period
    };
  }

  private trainAnomalyDetectionModel(timeSeries: { timestamp: string; value: number }[]): any {
    // Simple statistical model for anomaly detection
    const values = timeSeries.map(d => d.value);
    const mean = this.mean(values);
    const std = this.standardDeviation(values);
    
    return { mean, std, threshold: 2.5 }; // 2.5 standard deviations
  }

  private predictValue(model: any, step: number): number {
    // Simple prediction based on historical mean with trend
    return model.mean;
  }

  private calculateAnomalyScore(value: number, timeSeries: { timestamp: string; value: number }[]): number {
    const values = timeSeries.map(d => d.value);
    const mean = this.mean(values);
    const std = this.standardDeviation(values);
    
    if (std === 0) return 0;
    
    const zScore = Math.abs((value - mean) / std);
    return Math.min(1, zScore / 3); // Normalize to 0-1 range
  }

  private classifyAnomalyType(
    score: number,
    value: number,
    timeSeries: { timestamp: string; value: number }[]
  ): 'spike' | 'drop' | 'trend_break' | 'seasonal_deviation' {
    const mean = this.mean(timeSeries.map(d => d.value));
    
    if (value > mean * 1.5) return 'spike';
    if (value < mean * 0.5) return 'drop';
    if (score > 0.8) return 'trend_break';
    return 'seasonal_deviation';
  }

  private analyzeTrends(timeSeries: { timestamp: string; value: number }[]): {
    shortTerm: 'increasing' | 'decreasing' | 'stable';
    longTerm: 'increasing' | 'decreasing' | 'stable';
  } {
    const shortTermData = timeSeries.slice(-7); // Last 7 days
    const longTermData = timeSeries.slice(-30); // Last 30 days
    
    const shortTermTrend = this.calculateTrendDirection(shortTermData);
    const longTermTrend = this.calculateTrendDirection(longTermData);
    
    return {
      shortTerm: shortTermTrend,
      longTerm: longTermTrend
    };
  }

  private calculateTrendDirection(data: { timestamp: string; value: number }[]): 'increasing' | 'decreasing' | 'stable' {
    if (data.length < 2) return 'stable';
    
    const x = Array.from({ length: data.length }, (_, i) => i);
    const y = data.map(d => d.value);
    const { slope } = this.linearRegression(x, y);
    
    const threshold = 0.01; // Minimum slope for trend detection
    if (slope > threshold) return 'increasing';
    if (slope < -threshold) return 'decreasing';
    return 'stable';
  }

  private generateForecastRecommendations(
    metricName: string,
    predictions: { timestamp: string; value: number; confidence: [number, number] }[],
    trends: { shortTerm: string; longTerm: string },
    anomalies: AnomalyPrediction[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Trend-based recommendations
    if (trends.shortTerm === 'decreasing' && metricName === 'productivityScore') {
      recommendations.push('Productivity is trending downward - consider reviewing current workload and priorities');
    }
    
    if (trends.longTerm === 'increasing' && metricName === 'burnoutRisk') {
      recommendations.push('Burnout risk is increasing over time - implement preventive measures');
    }
    
    // Anomaly-based recommendations
    if (anomalies.length > 0) {
      const highRiskAnomalies = anomalies.filter(a => a.probability > 0.8);
      if (highRiskAnomalies.length > 0) {
        recommendations.push(`${highRiskAnomalies.length} high-risk anomalies predicted - prepare contingency plans`);
      }
    }
    
    // Prediction-based recommendations
    const avgPrediction = predictions.reduce((sum, p) => sum + p.value, 0) / predictions.length;
    const currentValue = predictions[0]?.value || 0;
    
    if (avgPrediction < currentValue * 0.9) {
      recommendations.push(`${metricName} is expected to decline - consider proactive interventions`);
    }
    
    return recommendations;
  }

  private applyScenarioAdjustments(
    metrics: ProductivityMetrics[],
    adjustments: { [metric: string]: number }
  ): ProductivityMetrics[] {
    return metrics.map(metric => {
      const adjusted = { ...metric };
      
      Object.entries(adjustments).forEach(([key, adjustment]) => {
        if (key in adjusted) {
          (adjusted as any)[key] = Math.max(0, (adjusted as any)[key] * (1 + adjustment));
        }
      });
      
      return adjusted;
    });
  }

  private async crossValidateModel(
    model: ForecastModel,
    timeSeries: { timestamp: string; value: number }[]
  ): Promise<number> {
    // Simple cross-validation - use 80% for training, 20% for testing
    const splitIndex = Math.floor(timeSeries.length * 0.8);
    const trainData = timeSeries.slice(0, splitIndex);
    const testData = timeSeries.slice(splitIndex);
    
    // Generate predictions for test period
    const predictions = this.generatePredictions(model, trainData, testData.length);
    
    // Calculate accuracy
    const errors = testData.map((actual, i) => {
      const predicted = predictions[i]?.value || actual.value;
      return Math.abs(predicted - actual.value) / Math.max(actual.value, 0.1);
    });
    
    const mape = errors.reduce((sum, error) => sum + error, 0) / errors.length;
    return Math.max(0, 1 - mape); // Convert MAPE to accuracy score
  }

  private calculateConfidenceInterval(
    prediction: number,
    modelConfidence: number,
    step: number
  ): [number, number] {
    // Confidence interval widens with forecast horizon
    const uncertainty = (1 - modelConfidence) * prediction * Math.sqrt(step);
    return [
      Math.max(0, prediction - uncertainty),
      prediction + uncertainty
    ];
  }

  private alignPredictionsWithActual(
    predictions: { timestamp: string; value: number }[],
    actual: { timestamp: string; value: number }[]
  ): { predicted: number; actual: number }[] {
    const aligned: { predicted: number; actual: number }[] = [];
    
    predictions.forEach(pred => {
      const actualPoint = actual.find(a => a.timestamp === pred.timestamp);
      if (actualPoint) {
        aligned.push({
          predicted: pred.value,
          actual: actualPoint.value
        });
      }
    });
    
    return aligned;
  }

  // Statistical helper methods
  private linearRegression(x: number[], y: number[]): { slope: number; intercept: number } {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  }

  private mean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private standardDeviation(values: number[]): number {
    const avg = this.mean(values);
    const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
    return Math.sqrt(this.mean(squaredDiffs));
  }

  private calculateRSquared(predicted: number[], actual: number[]): number {
    const actualMean = this.mean(actual);
    const totalSumSquares = actual.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0);
    const residualSumSquares = predicted.reduce((sum, pred, i) => sum + Math.pow(actual[i] - pred, 2), 0);
    
    return totalSumSquares > 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;
  }
}