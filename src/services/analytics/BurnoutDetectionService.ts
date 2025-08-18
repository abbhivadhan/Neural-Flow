import { ProductivityMetrics, BurnoutIndicators } from './ProductivityMetricsService';
import { TrendData, Insight, InsightType, InsightCategory, InsightSeverity } from '../../types/analytics';
import { TimeRange } from '../../types/common';

export interface BurnoutRiskFactors {
  workloadIntensity: number;
  workingHoursExcess: number;
  taskCompletionDecline: number;
  collaborationReduction: number;
  responseTimeIncrease: number;
  qualityDecline: number;
  emotionalExhaustion: number;
  cynicism: number;
  personalAccomplishment: number;
}

export interface BurnoutPrediction {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  timeToOnset: number; // days
  primaryFactors: string[];
  interventionRecommendations: string[];
  confidenceInterval: [number, number];
}

export interface BurnoutIntervention {
  type: 'immediate' | 'short_term' | 'long_term';
  priority: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  description: string;
  expectedImpact: number;
  implementationEffort: 'low' | 'medium' | 'high';
  timeline: number; // days
}

export class BurnoutDetectionService {
  private readonly BURNOUT_THRESHOLDS = {
    workloadIntensity: 0.8,
    workingHoursExcess: 1.5, // 50% above normal
    taskCompletionDecline: -0.2, // 20% decline
    collaborationReduction: -0.3, // 30% reduction
    responseTimeIncrease: 2.0, // 2x increase
    qualityDecline: -0.15, // 15% decline
    overallRisk: 0.7
  };

  private readonly MASLACH_WEIGHTS = {
    emotionalExhaustion: 0.4,
    cynicism: 0.3,
    personalAccomplishment: 0.3
  };

  /**
   * Analyze comprehensive burnout risk factors
   */
  async analyzeBurnoutRisk(
    userId: string,
    currentMetrics: ProductivityMetrics,
    historicalMetrics: ProductivityMetrics[],
    timeRange: TimeRange
  ): Promise<BurnoutRiskFactors> {
    const baseline = this.calculateBaseline(historicalMetrics);
    
    return {
      workloadIntensity: this.calculateWorkloadIntensity(currentMetrics, baseline),
      workingHoursExcess: this.calculateWorkingHoursExcess(currentMetrics, baseline),
      taskCompletionDecline: this.calculateTaskCompletionDecline(currentMetrics, baseline),
      collaborationReduction: this.calculateCollaborationReduction(currentMetrics, baseline),
      responseTimeIncrease: this.calculateResponseTimeIncrease(currentMetrics, baseline),
      qualityDecline: this.calculateQualityDecline(currentMetrics, baseline),
      emotionalExhaustion: this.assessEmotionalExhaustion(currentMetrics, historicalMetrics),
      cynicism: this.assessCynicism(currentMetrics, historicalMetrics),
      personalAccomplishment: this.assessPersonalAccomplishment(currentMetrics, historicalMetrics)
    };
  }

  /**
   * Predict burnout probability and timeline using machine learning
   */
  async predictBurnoutRisk(
    riskFactors: BurnoutRiskFactors,
    historicalTrends: TrendData[],
    userProfile: any
  ): Promise<BurnoutPrediction> {
    const riskScore = this.calculateOverallRiskScore(riskFactors);
    const riskLevel = this.categorizeBurnoutRisk(riskScore);
    const probability = this.calculateBurnoutProbability(riskFactors, historicalTrends);
    const timeToOnset = this.predictTimeToOnset(riskFactors, historicalTrends);
    const primaryFactors = this.identifyPrimaryRiskFactors(riskFactors);
    const interventionRecommendations = this.generateInterventionRecommendations(riskFactors, riskLevel);
    const confidenceInterval = this.calculateConfidenceInterval(probability, historicalTrends.length);

    return {
      riskLevel,
      probability,
      timeToOnset,
      primaryFactors,
      interventionRecommendations,
      confidenceInterval
    };
  }

  /**
   * Generate early warning alerts for burnout risk
   */
  async generateBurnoutAlerts(
    userId: string,
    riskFactors: BurnoutRiskFactors,
    prediction: BurnoutPrediction
  ): Promise<Insight[]> {
    const alerts: Insight[] = [];

    // Critical risk alert
    if (prediction.riskLevel === 'critical') {
      alerts.push(this.createCriticalBurnoutAlert(riskFactors, prediction));
    }

    // High risk alert
    if (prediction.riskLevel === 'high') {
      alerts.push(this.createHighBurnoutAlert(riskFactors, prediction));
    }

    // Trend-based alerts
    if (riskFactors.workingHoursExcess > this.BURNOUT_THRESHOLDS.workingHoursExcess) {
      alerts.push(this.createWorkingHoursAlert(riskFactors));
    }

    if (riskFactors.taskCompletionDecline < this.BURNOUT_THRESHOLDS.taskCompletionDecline) {
      alerts.push(this.createProductivityDeclineAlert(riskFactors));
    }

    if (riskFactors.collaborationReduction < this.BURNOUT_THRESHOLDS.collaborationReduction) {
      alerts.push(this.createSocialWithdrawalAlert(riskFactors));
    }

    return alerts;
  }

  /**
   * Recommend personalized burnout interventions
   */
  async recommendInterventions(
    riskFactors: BurnoutRiskFactors,
    prediction: BurnoutPrediction,
    userPreferences: any
  ): Promise<BurnoutIntervention[]> {
    const interventions: BurnoutIntervention[] = [];

    // Immediate interventions for critical risk
    if (prediction.riskLevel === 'critical') {
      interventions.push(...this.getImmediateInterventions(riskFactors));
    }

    // Short-term interventions
    if (prediction.riskLevel === 'high' || prediction.riskLevel === 'critical') {
      interventions.push(...this.getShortTermInterventions(riskFactors));
    }

    // Long-term interventions
    interventions.push(...this.getLongTermInterventions(riskFactors, userPreferences));

    // Sort by priority and expected impact
    return interventions.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.expectedImpact - a.expectedImpact;
    });
  }

  /**
   * Monitor intervention effectiveness
   */
  async monitorInterventionEffectiveness(
    userId: string,
    interventions: BurnoutIntervention[],
    beforeMetrics: ProductivityMetrics,
    afterMetrics: ProductivityMetrics
  ): Promise<{
    overallEffectiveness: number;
    interventionResults: { intervention: BurnoutIntervention; effectiveness: number }[];
    recommendations: string[];
  }> {
    const interventionResults = interventions.map(intervention => ({
      intervention,
      effectiveness: this.calculateInterventionEffectiveness(intervention, beforeMetrics, afterMetrics)
    }));

    const overallEffectiveness = interventionResults.reduce((sum, result) => 
      sum + result.effectiveness, 0) / interventionResults.length;

    const recommendations = this.generateFollowUpRecommendations(interventionResults, overallEffectiveness);

    return {
      overallEffectiveness,
      interventionResults,
      recommendations
    };
  }

  // Private helper methods

  private calculateBaseline(historicalMetrics: ProductivityMetrics[]): ProductivityMetrics {
    if (historicalMetrics.length === 0) {
      // Return default baseline if no historical data
      return {
        tasksCompleted: 5,
        tasksCreated: 6,
        averageCompletionTime: 2,
        focusTime: 6,
        interruptionCount: 8,
        productivityScore: 0.8,
        efficiencyRatio: 0.8,
        burnoutRisk: 0.2,
        workloadBalance: 0.8,
        collaborationIndex: 0.7
      };
    }

    const count = historicalMetrics.length;
    return {
      tasksCompleted: historicalMetrics.reduce((sum, m) => sum + m.tasksCompleted, 0) / count,
      tasksCreated: historicalMetrics.reduce((sum, m) => sum + m.tasksCreated, 0) / count,
      averageCompletionTime: historicalMetrics.reduce((sum, m) => sum + m.averageCompletionTime, 0) / count,
      focusTime: historicalMetrics.reduce((sum, m) => sum + m.focusTime, 0) / count,
      interruptionCount: historicalMetrics.reduce((sum, m) => sum + m.interruptionCount, 0) / count,
      productivityScore: historicalMetrics.reduce((sum, m) => sum + m.productivityScore, 0) / count,
      efficiencyRatio: historicalMetrics.reduce((sum, m) => sum + m.efficiencyRatio, 0) / count,
      burnoutRisk: historicalMetrics.reduce((sum, m) => sum + m.burnoutRisk, 0) / count,
      workloadBalance: historicalMetrics.reduce((sum, m) => sum + m.workloadBalance, 0) / count,
      collaborationIndex: historicalMetrics.reduce((sum, m) => sum + m.collaborationIndex, 0) / count
    };
  }

  private calculateWorkloadIntensity(current: ProductivityMetrics, baseline: ProductivityMetrics): number {
    const taskIntensity = current.tasksCreated / Math.max(baseline.tasksCreated, 1);
    const focusIntensity = current.focusTime / Math.max(baseline.focusTime, 1);
    return (taskIntensity + focusIntensity) / 2;
  }

  private calculateWorkingHoursExcess(current: ProductivityMetrics, baseline: ProductivityMetrics): number {
    return current.focusTime / Math.max(baseline.focusTime, 1) - 1;
  }

  private calculateTaskCompletionDecline(current: ProductivityMetrics, baseline: ProductivityMetrics): number {
    return (current.tasksCompleted / Math.max(baseline.tasksCompleted, 1)) - 1;
  }

  private calculateCollaborationReduction(current: ProductivityMetrics, baseline: ProductivityMetrics): number {
    return (current.collaborationIndex / Math.max(baseline.collaborationIndex, 0.1)) - 1;
  }

  private calculateResponseTimeIncrease(current: ProductivityMetrics, baseline: ProductivityMetrics): number {
    return current.averageCompletionTime / Math.max(baseline.averageCompletionTime, 0.1);
  }

  private calculateQualityDecline(current: ProductivityMetrics, baseline: ProductivityMetrics): number {
    return (current.efficiencyRatio / Math.max(baseline.efficiencyRatio, 0.1)) - 1;
  }

  private assessEmotionalExhaustion(current: ProductivityMetrics, historical: ProductivityMetrics[]): number {
    // Assess based on productivity decline, working hours, and interruption patterns
    const productivityDecline = 1 - current.productivityScore;
    const workingHoursStress = Math.max(0, (current.focusTime - 8) / 4);
    const interruptionStress = Math.min(current.interruptionCount / 20, 1);
    
    return (productivityDecline * 0.4 + workingHoursStress * 0.3 + interruptionStress * 0.3);
  }

  private assessCynicism(current: ProductivityMetrics, historical: ProductivityMetrics[]): number {
    // Assess based on collaboration reduction and task engagement
    const collaborationDecline = Math.max(0, 0.8 - current.collaborationIndex);
    const engagementDecline = Math.max(0, 0.8 - current.efficiencyRatio);
    
    return (collaborationDecline * 0.6 + engagementDecline * 0.4);
  }

  private assessPersonalAccomplishment(current: ProductivityMetrics, historical: ProductivityMetrics[]): number {
    // Higher scores indicate lower personal accomplishment (inverse relationship)
    const accomplishmentLevel = current.productivityScore * current.efficiencyRatio;
    return Math.max(0, 1 - accomplishmentLevel);
  }

  private calculateOverallRiskScore(riskFactors: BurnoutRiskFactors): number {
    // Maslach Burnout Inventory inspired calculation
    const maslachScore = (
      riskFactors.emotionalExhaustion * this.MASLACH_WEIGHTS.emotionalExhaustion +
      riskFactors.cynicism * this.MASLACH_WEIGHTS.cynicism +
      riskFactors.personalAccomplishment * this.MASLACH_WEIGHTS.personalAccomplishment
    );

    // Objective metrics
    const objectiveScore = (
      Math.max(0, riskFactors.workloadIntensity - 1) * 0.2 +
      Math.max(0, riskFactors.workingHoursExcess) * 0.15 +
      Math.max(0, -riskFactors.taskCompletionDecline) * 0.15 +
      Math.max(0, -riskFactors.collaborationReduction) * 0.1 +
      Math.max(0, riskFactors.responseTimeIncrease - 1) * 0.1 +
      Math.max(0, -riskFactors.qualityDecline) * 0.1
    );

    return (maslachScore * 0.7 + objectiveScore * 0.3);
  }

  private categorizeBurnoutRisk(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore < 0.3) return 'low';
    if (riskScore < 0.5) return 'medium';
    if (riskScore < 0.7) return 'high';
    return 'critical';
  }

  private calculateBurnoutProbability(riskFactors: BurnoutRiskFactors, trends: TrendData[]): number {
    const riskScore = this.calculateOverallRiskScore(riskFactors);
    
    // Adjust probability based on trend direction
    const trendAdjustment = trends.reduce((adj, trend) => {
      if (trend.direction === 'down' && trend.metric.includes('productivity')) {
        return adj + 0.1;
      }
      if (trend.direction === 'up' && trend.metric.includes('burnout')) {
        return adj + 0.1;
      }
      return adj;
    }, 0);

    return Math.min(0.95, riskScore + trendAdjustment);
  }

  private predictTimeToOnset(riskFactors: BurnoutRiskFactors, trends: TrendData[]): number {
    const riskScore = this.calculateOverallRiskScore(riskFactors);
    
    // Base prediction: higher risk = shorter time to onset
    let daysToOnset = Math.max(7, 90 * (1 - riskScore));
    
    // Adjust based on trend velocity
    const avgChangeRate = trends.reduce((sum, trend) => sum + Math.abs(trend.changeRate), 0) / trends.length;
    if (avgChangeRate > 0.1) {
      daysToOnset *= 0.7; // Faster onset if trends are accelerating
    }
    
    return Math.round(daysToOnset);
  }

  private identifyPrimaryRiskFactors(riskFactors: BurnoutRiskFactors): string[] {
    const factors = Object.entries(riskFactors)
      .map(([key, value]) => ({ factor: key, value: Math.abs(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map(item => this.formatFactorName(item.factor));

    return factors;
  }

  private formatFactorName(factor: string): string {
    const nameMap: { [key: string]: string } = {
      workloadIntensity: 'Excessive Workload',
      workingHoursExcess: 'Long Working Hours',
      taskCompletionDecline: 'Declining Productivity',
      collaborationReduction: 'Social Withdrawal',
      responseTimeIncrease: 'Slower Response Times',
      qualityDecline: 'Quality Issues',
      emotionalExhaustion: 'Emotional Exhaustion',
      cynicism: 'Cynicism',
      personalAccomplishment: 'Low Sense of Achievement'
    };
    return nameMap[factor] || factor;
  }

  private generateInterventionRecommendations(riskFactors: BurnoutRiskFactors, riskLevel: string): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'critical') {
      recommendations.push('Consider immediate workload reduction');
      recommendations.push('Schedule urgent consultation with manager');
      recommendations.push('Take immediate time off if possible');
    }

    if (riskFactors.workingHoursExcess > 0.5) {
      recommendations.push('Implement strict work hour boundaries');
    }

    if (riskFactors.emotionalExhaustion > 0.6) {
      recommendations.push('Practice stress management techniques');
      recommendations.push('Consider professional counseling support');
    }

    if (riskFactors.collaborationReduction < -0.2) {
      recommendations.push('Re-engage with team activities');
      recommendations.push('Schedule regular check-ins with colleagues');
    }

    return recommendations;
  }

  private calculateConfidenceInterval(probability: number, sampleSize: number): [number, number] {
    // Simple confidence interval calculation
    const margin = 1.96 * Math.sqrt((probability * (1 - probability)) / Math.max(sampleSize, 10));
    return [
      Math.max(0, probability - margin),
      Math.min(1, probability + margin)
    ];
  }

  private getImmediateInterventions(riskFactors: BurnoutRiskFactors): BurnoutIntervention[] {
    return [
      {
        type: 'immediate',
        priority: 'critical',
        action: 'workload_reduction',
        description: 'Immediately reduce current workload by 30-50%',
        expectedImpact: 0.8,
        implementationEffort: 'medium',
        timeline: 1
      },
      {
        type: 'immediate',
        priority: 'high',
        action: 'emergency_break',
        description: 'Take a 2-3 day break to recover',
        expectedImpact: 0.6,
        implementationEffort: 'low',
        timeline: 1
      }
    ];
  }

  private getShortTermInterventions(riskFactors: BurnoutRiskFactors): BurnoutIntervention[] {
    return [
      {
        type: 'short_term',
        priority: 'high',
        action: 'schedule_restructure',
        description: 'Restructure daily schedule with mandatory breaks',
        expectedImpact: 0.7,
        implementationEffort: 'medium',
        timeline: 7
      },
      {
        type: 'short_term',
        priority: 'medium',
        action: 'delegation_training',
        description: 'Learn and practice task delegation',
        expectedImpact: 0.5,
        implementationEffort: 'medium',
        timeline: 14
      }
    ];
  }

  private getLongTermInterventions(riskFactors: BurnoutRiskFactors, userPreferences: any): BurnoutIntervention[] {
    return [
      {
        type: 'long_term',
        priority: 'medium',
        action: 'skill_development',
        description: 'Develop stress management and time management skills',
        expectedImpact: 0.6,
        implementationEffort: 'high',
        timeline: 30
      },
      {
        type: 'long_term',
        priority: 'medium',
        action: 'work_environment_optimization',
        description: 'Optimize work environment and processes',
        expectedImpact: 0.4,
        implementationEffort: 'medium',
        timeline: 21
      }
    ];
  }

  private calculateInterventionEffectiveness(
    intervention: BurnoutIntervention,
    before: ProductivityMetrics,
    after: ProductivityMetrics
  ): number {
    // Calculate effectiveness based on improvement in relevant metrics
    const burnoutRiskImprovement = before.burnoutRisk - after.burnoutRisk;
    const productivityImprovement = after.productivityScore - before.productivityScore;
    const workloadBalanceImprovement = after.workloadBalance - before.workloadBalance;

    return (burnoutRiskImprovement * 0.5 + productivityImprovement * 0.3 + workloadBalanceImprovement * 0.2);
  }

  private generateFollowUpRecommendations(
    results: { intervention: BurnoutIntervention; effectiveness: number }[],
    overallEffectiveness: number
  ): string[] {
    const recommendations: string[] = [];

    if (overallEffectiveness < 0.3) {
      recommendations.push('Consider more intensive interventions');
      recommendations.push('Seek professional support');
    }

    const mostEffective = results.reduce((max, result) => 
      result.effectiveness > max.effectiveness ? result : max, results[0]);
    
    if (mostEffective.effectiveness > 0.5) {
      recommendations.push(`Continue with ${mostEffective.intervention.action} as it shows good results`);
    }

    const leastEffective = results.reduce((min, result) => 
      result.effectiveness < min.effectiveness ? result : min, results[0]);
    
    if (leastEffective.effectiveness < 0.2) {
      recommendations.push(`Consider modifying or replacing ${leastEffective.intervention.action}`);
    }

    return recommendations;
  }

  private createCriticalBurnoutAlert(riskFactors: BurnoutRiskFactors, prediction: BurnoutPrediction): Insight {
    return {
      id: `alert-${Date.now()}-critical-burnout`,
      title: 'Critical Burnout Risk Detected',
      description: `Immediate attention required: ${(prediction.probability * 100).toFixed(1)}% burnout probability detected. Primary factors: ${prediction.primaryFactors.join(', ')}.`,
      type: InsightType.RISK,
      category: InsightCategory.WELLBEING,
      severity: InsightSeverity.CRITICAL,
      confidence: 0.9,
      impact: {
        scope: 'individual',
        magnitude: 'large',
        timeframe: 'immediate',
        metrics: ['burnout_risk', 'productivity_score', 'wellbeing']
      },
      recommendations: prediction.interventionRecommendations.map(rec => ({
        id: `rec-${Date.now()}-${rec.replace(/\s+/g, '-').toLowerCase()}`,
        title: rec,
        description: `Immediate action required: ${rec}`,
        priority: 'high' as const,
        effort: 'medium' as const,
        impact: 'high' as const,
        actions: [{
          description: rec,
          type: 'manual' as const,
          status: 'pending' as const
        }],
        timeline: 1,
        dependencies: []
      })),
      data: {
        metrics: {
          burnout_probability: prediction.probability,
          time_to_onset: prediction.timeToOnset,
          risk_level: prediction.riskLevel
        },
        trends: [],
        comparisons: [],
        correlations: [],
        segments: []
      },
      status: 'new',
      feedback: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {}
    };
  }

  private createHighBurnoutAlert(riskFactors: BurnoutRiskFactors, prediction: BurnoutPrediction): Insight {
    return {
      id: `alert-${Date.now()}-high-burnout`,
      title: 'High Burnout Risk Warning',
      description: `Elevated burnout risk detected (${(prediction.probability * 100).toFixed(1)}%). Preventive measures recommended within ${prediction.timeToOnset} days.`,
      type: InsightType.RISK,
      category: InsightCategory.WELLBEING,
      severity: InsightSeverity.HIGH,
      confidence: 0.85,
      impact: {
        scope: 'individual',
        magnitude: 'medium',
        timeframe: 'short_term',
        metrics: ['burnout_risk', 'productivity_score']
      },
      recommendations: [],
      data: {
        metrics: {
          burnout_probability: prediction.probability,
          primary_factors: prediction.primaryFactors
        },
        trends: [],
        comparisons: [],
        correlations: [],
        segments: []
      },
      status: 'new',
      feedback: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {}
    };
  }

  private createWorkingHoursAlert(riskFactors: BurnoutRiskFactors): Insight {
    return {
      id: `alert-${Date.now()}-working-hours`,
      title: 'Excessive Working Hours Detected',
      description: `Working hours are ${(riskFactors.workingHoursExcess * 100).toFixed(1)}% above normal levels. Consider implementing work-life balance measures.`,
      type: InsightType.PATTERN,
      category: InsightCategory.WELLBEING,
      severity: InsightSeverity.MEDIUM,
      confidence: 0.8,
      impact: {
        scope: 'individual',
        magnitude: 'medium',
        timeframe: 'short_term',
        metrics: ['working_hours', 'burnout_risk']
      },
      recommendations: [],
      data: {
        metrics: {
          working_hours_excess: riskFactors.workingHoursExcess
        },
        trends: [],
        comparisons: [],
        correlations: [],
        segments: []
      },
      status: 'new',
      feedback: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {}
    };
  }

  private createProductivityDeclineAlert(riskFactors: BurnoutRiskFactors): Insight {
    return {
      id: `alert-${Date.now()}-productivity-decline`,
      title: 'Productivity Decline Warning',
      description: `Task completion has declined by ${Math.abs(riskFactors.taskCompletionDecline * 100).toFixed(1)}%. This may indicate early burnout symptoms.`,
      type: InsightType.TREND,
      category: InsightCategory.PRODUCTIVITY,
      severity: InsightSeverity.MEDIUM,
      confidence: 0.75,
      impact: {
        scope: 'individual',
        magnitude: 'medium',
        timeframe: 'short_term',
        metrics: ['task_completion', 'productivity_score']
      },
      recommendations: [],
      data: {
        metrics: {
          task_completion_decline: riskFactors.taskCompletionDecline
        },
        trends: [],
        comparisons: [],
        correlations: [],
        segments: []
      },
      status: 'new',
      feedback: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {}
    };
  }

  private createSocialWithdrawalAlert(riskFactors: BurnoutRiskFactors): Insight {
    return {
      id: `alert-${Date.now()}-social-withdrawal`,
      title: 'Social Withdrawal Pattern Detected',
      description: `Collaboration activity has decreased by ${Math.abs(riskFactors.collaborationReduction * 100).toFixed(1)}%. Consider re-engaging with team activities.`,
      type: InsightType.PATTERN,
      category: InsightCategory.COLLABORATION,
      severity: InsightSeverity.MEDIUM,
      confidence: 0.7,
      impact: {
        scope: 'individual',
        magnitude: 'medium',
        timeframe: 'short_term',
        metrics: ['collaboration_index', 'team_engagement']
      },
      recommendations: [],
      data: {
        metrics: {
          collaboration_reduction: riskFactors.collaborationReduction
        },
        trends: [],
        comparisons: [],
        correlations: [],
        segments: []
      },
      status: 'new',
      feedback: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {}
    };
  }
}