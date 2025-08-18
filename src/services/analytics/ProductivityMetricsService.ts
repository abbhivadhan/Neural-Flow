import { 
  TrendData, 
  ComparisonData, 
  InsightData, 
  Insight,
  InsightType,
  InsightCategory,
  InsightSeverity,
  Recommendation
} from '../../types/analytics';
import { Task, TaskStatus, TaskPriority } from '../../types/task';
import { User } from '../../types/user';
import { TimeRange } from '../../types/common';

export interface ProductivityMetrics {
  tasksCompleted: number;
  tasksCreated: number;
  averageCompletionTime: number;
  focusTime: number;
  interruptionCount: number;
  productivityScore: number;
  efficiencyRatio: number;
  burnoutRisk: number;
  workloadBalance: number;
  collaborationIndex: number;
}

export interface ProductivityTrends {
  daily: TrendData[];
  weekly: TrendData[];
  monthly: TrendData[];
}

export interface BurnoutIndicators {
  workingHoursIncrease: number;
  taskCompletionDecrease: number;
  responseTimeIncrease: number;
  collaborationDecrease: number;
  overallRisk: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export class ProductivityMetricsService {
  private readonly BURNOUT_THRESHOLD = 0.7;
  private readonly EFFICIENCY_BASELINE = 0.8;
  private readonly FOCUS_TIME_TARGET = 4; // hours per day

  /**
   * Calculate comprehensive productivity metrics for a user
   */
  async calculateProductivityMetrics(
    userId: string,
    timeRange: TimeRange,
    tasks: Task[],
    userBehavior: any[]
  ): Promise<ProductivityMetrics> {
    const completedTasks = tasks.filter(task => task.status === TaskStatus.COMPLETED);
    const createdTasks = tasks.filter(task => 
      new Date(task.createdAt) >= new Date(timeRange.start) &&
      new Date(task.createdAt) <= new Date(timeRange.end)
    );

    const averageCompletionTime = this.calculateAverageCompletionTime(completedTasks);
    const focusTime = this.calculateFocusTime(userBehavior, timeRange);
    const interruptionCount = this.calculateInterruptions(userBehavior);
    const efficiencyRatio = this.calculateEfficiencyRatio(tasks);
    const workloadBalance = this.calculateWorkloadBalance(tasks);
    const collaborationIndex = this.calculateCollaborationIndex(tasks, userBehavior);

    const productivityScore = this.calculateProductivityScore({
      tasksCompleted: completedTasks.length,
      averageCompletionTime,
      focusTime,
      interruptionCount,
      efficiencyRatio,
      workloadBalance,
      collaborationIndex
    });

    const burnoutRisk = this.calculateBurnoutRisk({
      focusTime,
      interruptionCount,
      workloadBalance,
      efficiencyRatio
    });

    return {
      tasksCompleted: completedTasks.length,
      tasksCreated: createdTasks.length,
      averageCompletionTime,
      focusTime,
      interruptionCount,
      productivityScore,
      efficiencyRatio,
      burnoutRisk,
      workloadBalance,
      collaborationIndex
    };
  }

  /**
   * Generate productivity trends over time
   */
  async generateProductivityTrends(
    userId: string,
    timeRange: TimeRange,
    granularity: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<ProductivityTrends> {
    const intervals = this.generateTimeIntervals(timeRange, granularity);
    const trends: ProductivityTrends = {
      daily: [],
      weekly: [],
      monthly: []
    };

    for (const interval of intervals) {
      const metrics = await this.calculateProductivityMetrics(
        userId,
        interval,
        [], // Would fetch tasks for this interval
        []  // Would fetch user behavior for this interval
      );

      const trendData: TrendData = {
        metric: 'productivity_score',
        values: [{
          timestamp: interval.end,
          value: metrics.productivityScore
        }],
        direction: this.determineTrendDirection(metrics.productivityScore, 0.8),
        changeRate: this.calculateChangeRate(metrics.productivityScore, 0.8),
        significance: 0.85
      };

      trends[granularity].push(trendData);
    }

    return trends;
  }

  /**
   * Detect burnout indicators and risk level
   */
  async detectBurnoutIndicators(
    userId: string,
    timeRange: TimeRange,
    historicalData: ProductivityMetrics[]
  ): Promise<BurnoutIndicators> {
    const currentMetrics = historicalData[historicalData.length - 1];
    const previousMetrics = historicalData[historicalData.length - 2] || currentMetrics;

    const workingHoursIncrease = this.calculatePercentageChange(
      currentMetrics.focusTime,
      previousMetrics.focusTime
    );

    const taskCompletionDecrease = this.calculatePercentageChange(
      previousMetrics.tasksCompleted,
      currentMetrics.tasksCompleted
    );

    const collaborationDecrease = this.calculatePercentageChange(
      previousMetrics.collaborationIndex,
      currentMetrics.collaborationIndex
    );

    const overallRisk = this.calculateOverallBurnoutRisk({
      workingHoursIncrease,
      taskCompletionDecrease,
      collaborationDecrease,
      currentEfficiency: currentMetrics.efficiencyRatio
    });

    return {
      workingHoursIncrease,
      taskCompletionDecrease,
      responseTimeIncrease: 0, // Would calculate from communication data
      collaborationDecrease,
      overallRisk,
      riskLevel: this.categorizeBurnoutRisk(overallRisk)
    };
  }

  /**
   * Generate actionable insights based on productivity data
   */
  async generateProductivityInsights(
    userId: string,
    metrics: ProductivityMetrics,
    trends: ProductivityTrends,
    burnoutIndicators: BurnoutIndicators
  ): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Productivity trend insight
    if (trends.weekly.length > 0) {
      const latestTrend = trends.weekly[trends.weekly.length - 1];
      if (latestTrend.direction === 'down' && latestTrend.changeRate < -0.1) {
        insights.push(this.createProductivityDeclineInsight(latestTrend, metrics));
      }
    }

    // Burnout risk insight
    if (burnoutIndicators.riskLevel === 'high' || burnoutIndicators.riskLevel === 'critical') {
      insights.push(this.createBurnoutRiskInsight(burnoutIndicators, metrics));
    }

    // Focus time optimization insight
    if (metrics.focusTime < this.FOCUS_TIME_TARGET) {
      insights.push(this.createFocusTimeInsight(metrics));
    }

    // Efficiency improvement insight
    if (metrics.efficiencyRatio < this.EFFICIENCY_BASELINE) {
      insights.push(this.createEfficiencyInsight(metrics));
    }

    return insights;
  }

  /**
   * Generate performance forecasts using time series analysis
   */
  async generatePerformanceForecast(
    userId: string,
    historicalMetrics: ProductivityMetrics[],
    forecastDays: number = 30
  ): Promise<TrendData[]> {
    if (historicalMetrics.length < 7) {
      throw new Error('Insufficient historical data for forecasting');
    }

    const forecasts: TrendData[] = [];
    const metrics = ['productivityScore', 'focusTime', 'efficiencyRatio', 'burnoutRisk'];

    for (const metric of metrics) {
      const values = historicalMetrics.map((m, index) => ({
        timestamp: new Date(Date.now() - (historicalMetrics.length - index) * 24 * 60 * 60 * 1000).toISOString(),
        value: (m as any)[metric]
      }));

      const forecast = this.performTimeSeriesForecasting(values, forecastDays);
      forecasts.push(forecast);
    }

    return forecasts;
  }

  // Private helper methods

  private calculateAverageCompletionTime(tasks: Task[]): number {
    if (tasks.length === 0) return 0;
    
    const completionTimes = tasks
      .filter(task => task.completedAt && task.createdAt)
      .map(task => {
        const created = new Date(task.createdAt).getTime();
        const completed = new Date(task.completedAt!).getTime();
        return (completed - created) / (1000 * 60 * 60); // hours
      });

    return completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
  }

  private calculateFocusTime(userBehavior: any[], timeRange: TimeRange): number {
    // Analyze user behavior patterns to determine focused work time
    // This would integrate with the behavioral tracking system
    return 6.5; // Mock value - would calculate from actual behavior data
  }

  private calculateInterruptions(userBehavior: any[]): number {
    // Count context switches, notifications, and interruptions
    return 12; // Mock value
  }

  private calculateEfficiencyRatio(tasks: Task[]): number {
    const completedTasks = tasks.filter(task => task.status === TaskStatus.COMPLETED);
    const totalTasks = tasks.length;
    
    if (totalTasks === 0) return 1;
    
    const completionRate = completedTasks.length / totalTasks;
    const priorityWeightedCompletion = this.calculatePriorityWeightedCompletion(completedTasks);
    
    return (completionRate + priorityWeightedCompletion) / 2;
  }

  private calculatePriorityWeightedCompletion(tasks: Task[]): number {
    if (tasks.length === 0) return 0;
    
    const weights = {
      [TaskPriority.CRITICAL]: 4,
      [TaskPriority.HIGH]: 3,
      [TaskPriority.MEDIUM]: 2,
      [TaskPriority.LOW]: 1
    };
    
    const totalWeight = tasks.reduce((sum, task) => sum + weights[task.priority], 0);
    const maxPossibleWeight = tasks.length * weights[TaskPriority.CRITICAL];
    
    return totalWeight / maxPossibleWeight;
  }

  private calculateWorkloadBalance(tasks: Task[]): number {
    // Analyze task distribution across time and priority levels
    const priorityDistribution = this.calculatePriorityDistribution(tasks);
    const timeDistribution = this.calculateTimeDistribution(tasks);
    
    return (priorityDistribution + timeDistribution) / 2;
  }

  private calculatePriorityDistribution(tasks: Task[]): number {
    const priorities = Object.values(TaskPriority);
    const distribution = priorities.map(priority => 
      tasks.filter(task => task.priority === priority).length
    );
    
    // Calculate balance score (closer to even distribution = higher score)
    const total = tasks.length;
    if (total === 0) return 1;
    
    const idealDistribution = total / priorities.length;
    const variance = distribution.reduce((sum, count) => 
      sum + Math.pow(count - idealDistribution, 2), 0
    ) / priorities.length;
    
    return Math.max(0, 1 - (variance / (idealDistribution * idealDistribution)));
  }

  private calculateTimeDistribution(tasks: Task[]): number {
    // Analyze task completion times for balance
    return 0.8; // Mock implementation
  }

  private calculateCollaborationIndex(tasks: Task[], userBehavior: any[]): number {
    const collaborativeTasks = tasks.filter(task => 
      task.assignees && task.assignees.length > 1
    );
    
    const collaborationRate = collaborativeTasks.length / Math.max(tasks.length, 1);
    
    // Factor in communication patterns from user behavior
    const communicationScore = 0.7; // Mock value
    
    return (collaborationRate + communicationScore) / 2;
  }

  private calculateProductivityScore(metrics: Partial<ProductivityMetrics>): number {
    const weights = {
      tasksCompleted: 0.25,
      focusTime: 0.20,
      efficiencyRatio: 0.25,
      workloadBalance: 0.15,
      collaborationIndex: 0.15
    };

    const normalizedMetrics = {
      tasksCompleted: Math.min((metrics.tasksCompleted || 0) / 10, 1),
      focusTime: Math.min((metrics.focusTime || 0) / this.FOCUS_TIME_TARGET, 1),
      efficiencyRatio: metrics.efficiencyRatio || 0,
      workloadBalance: metrics.workloadBalance || 0,
      collaborationIndex: metrics.collaborationIndex || 0
    };

    return Object.entries(weights).reduce((score, [metric, weight]) => {
      return score + (normalizedMetrics[metric as keyof typeof normalizedMetrics] * weight);
    }, 0);
  }

  private calculateBurnoutRisk(factors: {
    focusTime: number;
    interruptionCount: number;
    workloadBalance: number;
    efficiencyRatio: number;
  }): number {
    const riskFactors = {
      excessiveFocusTime: Math.max(0, (factors.focusTime - 8) / 4), // Risk increases after 8 hours
      highInterruptions: Math.min(factors.interruptionCount / 20, 1),
      poorWorkloadBalance: 1 - factors.workloadBalance,
      lowEfficiency: 1 - factors.efficiencyRatio
    };

    const weights = {
      excessiveFocusTime: 0.3,
      highInterruptions: 0.25,
      poorWorkloadBalance: 0.25,
      lowEfficiency: 0.2
    };

    return Object.entries(riskFactors).reduce((risk, [factor, value]) => {
      return risk + (value * weights[factor as keyof typeof weights]);
    }, 0);
  }

  private calculateOverallBurnoutRisk(indicators: {
    workingHoursIncrease: number;
    taskCompletionDecrease: number;
    collaborationDecrease: number;
    currentEfficiency: number;
  }): number {
    const riskScore = (
      Math.max(0, indicators.workingHoursIncrease / 100) * 0.3 +
      Math.max(0, indicators.taskCompletionDecrease / 100) * 0.3 +
      Math.max(0, indicators.collaborationDecrease / 100) * 0.2 +
      Math.max(0, (0.8 - indicators.currentEfficiency)) * 0.2
    );

    return Math.min(riskScore, 1);
  }

  private categorizeBurnoutRisk(risk: number): 'low' | 'medium' | 'high' | 'critical' {
    if (risk < 0.3) return 'low';
    if (risk < 0.5) return 'medium';
    if (risk < 0.7) return 'high';
    return 'critical';
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private determineTrendDirection(current: number, baseline: number): 'up' | 'down' | 'stable' {
    const threshold = 0.05; // 5% threshold for stability
    const change = (current - baseline) / baseline;
    
    if (Math.abs(change) < threshold) return 'stable';
    return change > 0 ? 'up' : 'down';
  }

  private calculateChangeRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 1 : 0;
    return (current - previous) / previous;
  }

  private generateTimeIntervals(timeRange: TimeRange, granularity: 'daily' | 'weekly' | 'monthly'): TimeRange[] {
    const intervals: TimeRange[] = [];
    const start = new Date(timeRange.start);
    const end = new Date(timeRange.end);
    
    let current = new Date(start);
    
    while (current < end) {
      const intervalEnd = new Date(current);
      
      switch (granularity) {
        case 'daily':
          intervalEnd.setDate(intervalEnd.getDate() + 1);
          break;
        case 'weekly':
          intervalEnd.setDate(intervalEnd.getDate() + 7);
          break;
        case 'monthly':
          intervalEnd.setMonth(intervalEnd.getMonth() + 1);
          break;
      }
      
      intervals.push({
        start: current.toISOString(),
        end: Math.min(intervalEnd.getTime(), end.getTime()).toString()
      });
      
      current = intervalEnd;
    }
    
    return intervals;
  }

  private performTimeSeriesForecasting(values: { timestamp: string; value: number }[], forecastDays: number): TrendData {
    // Simple linear regression for forecasting
    const n = values.length;
    const x = values.map((_, i) => i);
    const y = values.map(v => v.value);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const forecastValues = [];
    for (let i = 0; i < forecastDays; i++) {
      const futureX = n + i;
      const futureValue = slope * futureX + intercept;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i + 1);
      
      forecastValues.push({
        timestamp: futureDate.toISOString(),
        value: Math.max(0, futureValue) // Ensure non-negative values
      });
    }
    
    return {
      metric: 'forecast',
      values: forecastValues,
      direction: slope > 0 ? 'up' : slope < 0 ? 'down' : 'stable',
      changeRate: slope,
      significance: 0.75 // Confidence level for simple linear regression
    };
  }

  private createProductivityDeclineInsight(trend: TrendData, metrics: ProductivityMetrics): Insight {
    return {
      id: `insight-${Date.now()}-productivity-decline`,
      title: 'Productivity Decline Detected',
      description: `Your productivity score has decreased by ${Math.abs(trend.changeRate * 100).toFixed(1)}% over the past week. This may indicate increased workload or external factors affecting your performance.`,
      type: InsightType.TREND,
      category: InsightCategory.PRODUCTIVITY,
      severity: InsightSeverity.MEDIUM,
      confidence: trend.significance,
      impact: {
        scope: 'individual',
        magnitude: 'medium',
        timeframe: 'short_term',
        metrics: ['productivity_score', 'efficiency_ratio']
      },
      recommendations: [
        {
          id: `rec-${Date.now()}-focus-time`,
          title: 'Increase Focus Time',
          description: 'Schedule dedicated focus blocks to improve deep work productivity',
          priority: 'high',
          effort: 'low',
          impact: 'high',
          actions: [
            {
              description: 'Block 2-hour focus sessions in calendar',
              type: 'manual',
              status: 'pending'
            }
          ],
          timeline: 7,
          dependencies: []
        }
      ],
      data: {
        metrics: {
          current_productivity: metrics.productivityScore,
          change_rate: trend.changeRate
        },
        trends: [trend],
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

  private createBurnoutRiskInsight(burnoutIndicators: BurnoutIndicators, metrics: ProductivityMetrics): Insight {
    return {
      id: `insight-${Date.now()}-burnout-risk`,
      title: 'High Burnout Risk Detected',
      description: `Multiple indicators suggest elevated burnout risk (${(burnoutIndicators.overallRisk * 100).toFixed(1)}%). Consider adjusting workload and taking breaks.`,
      type: InsightType.RISK,
      category: InsightCategory.WELLBEING,
      severity: burnoutIndicators.riskLevel === 'critical' ? InsightSeverity.CRITICAL : InsightSeverity.HIGH,
      confidence: 0.85,
      impact: {
        scope: 'individual',
        magnitude: 'large',
        timeframe: 'immediate',
        metrics: ['burnout_risk', 'focus_time', 'efficiency_ratio']
      },
      recommendations: [
        {
          id: `rec-${Date.now()}-workload-balance`,
          title: 'Rebalance Workload',
          description: 'Redistribute tasks and reduce daily working hours',
          priority: 'high',
          effort: 'medium',
          impact: 'high',
          actions: [
            {
              description: 'Review and postpone non-critical tasks',
              type: 'manual',
              status: 'pending'
            },
            {
              description: 'Set daily work hour limits',
              type: 'automated',
              status: 'pending'
            }
          ],
          timeline: 3,
          dependencies: []
        }
      ],
      data: {
        metrics: {
          burnout_risk: burnoutIndicators.overallRisk,
          working_hours_increase: burnoutIndicators.workingHoursIncrease,
          task_completion_decrease: burnoutIndicators.taskCompletionDecrease
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

  private createFocusTimeInsight(metrics: ProductivityMetrics): Insight {
    return {
      id: `insight-${Date.now()}-focus-time`,
      title: 'Focus Time Below Target',
      description: `Your daily focus time (${metrics.focusTime.toFixed(1)} hours) is below the recommended ${this.FOCUS_TIME_TARGET} hours. This may impact deep work productivity.`,
      type: InsightType.OPPORTUNITY,
      category: InsightCategory.PRODUCTIVITY,
      severity: InsightSeverity.MEDIUM,
      confidence: 0.8,
      impact: {
        scope: 'individual',
        magnitude: 'medium',
        timeframe: 'short_term',
        metrics: ['focus_time', 'productivity_score']
      },
      recommendations: [
        {
          id: `rec-${Date.now()}-focus-blocks`,
          title: 'Schedule Focus Blocks',
          description: 'Create dedicated time blocks for deep work without interruptions',
          priority: 'medium',
          effort: 'low',
          impact: 'medium',
          actions: [
            {
              description: 'Block morning hours for focused work',
              type: 'manual',
              status: 'pending'
            }
          ],
          timeline: 5,
          dependencies: []
        }
      ],
      data: {
        metrics: {
          current_focus_time: metrics.focusTime,
          target_focus_time: this.FOCUS_TIME_TARGET,
          gap: this.FOCUS_TIME_TARGET - metrics.focusTime
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

  private createEfficiencyInsight(metrics: ProductivityMetrics): Insight {
    return {
      id: `insight-${Date.now()}-efficiency`,
      title: 'Efficiency Below Baseline',
      description: `Your efficiency ratio (${(metrics.efficiencyRatio * 100).toFixed(1)}%) is below the baseline of ${(this.EFFICIENCY_BASELINE * 100)}%. Consider optimizing task prioritization.`,
      type: InsightType.OPPORTUNITY,
      category: InsightCategory.EFFICIENCY,
      severity: InsightSeverity.MEDIUM,
      confidence: 0.75,
      impact: {
        scope: 'individual',
        magnitude: 'medium',
        timeframe: 'short_term',
        metrics: ['efficiency_ratio', 'productivity_score']
      },
      recommendations: [
        {
          id: `rec-${Date.now()}-task-prioritization`,
          title: 'Improve Task Prioritization',
          description: 'Focus on high-impact tasks and eliminate low-value activities',
          priority: 'medium',
          effort: 'low',
          impact: 'medium',
          actions: [
            {
              description: 'Review and reprioritize task list',
              type: 'manual',
              status: 'pending'
            }
          ],
          timeline: 7,
          dependencies: []
        }
      ],
      data: {
        metrics: {
          current_efficiency: metrics.efficiencyRatio,
          baseline_efficiency: this.EFFICIENCY_BASELINE,
          improvement_potential: this.EFFICIENCY_BASELINE - metrics.efficiencyRatio
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