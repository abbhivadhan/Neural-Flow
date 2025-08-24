// Behavioral pattern tracking system for Neural Flow
import { storage, StorageKeys } from '../../utils/storage';
import { BehaviorPattern, TaskSequence, TimePattern, ToolUsagePattern, ProductivityMetric } from '../../types/user';
import { TimeRange, Duration } from '../../types/common';
import { BehaviorPatternSchema } from '../../schemas/user';

export interface UserInteraction {
  type: 'click' | 'keyboard' | 'scroll' | 'focus' | 'blur' | 'task_complete' | 'task_create' | 'tool_switch';
  target: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface BehaviorAnalysis {
  patterns: BehaviorPattern;
  insights: BehaviorInsight[];
  predictions: BehaviorPrediction[];
  confidence: number;
}

export interface BehaviorInsight {
  type: 'productivity' | 'efficiency' | 'pattern' | 'anomaly';
  message: string;
  confidence: number;
  actionable: boolean;
  recommendation?: string;
}

export interface BehaviorPrediction {
  type: 'next_task' | 'break_needed' | 'tool_switch' | 'productivity_dip';
  prediction: string;
  confidence: number;
  timeframe: number; // minutes
}

class BehaviorTracker {
  private interactions: UserInteraction[] = [];
  private currentSession: {
    startTime: number;
    interactions: UserInteraction[];
    focusTime: number;
    distractionCount: number;
  } = {
    startTime: Date.now(),
    interactions: [],
    focusTime: 0,
    distractionCount: 0
  };

  private readonly MAX_INTERACTIONS = 10000;
  // private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly PATTERN_MIN_FREQUENCY = 3;

  constructor() {
    this.loadStoredBehavior();
    this.initializeTracking();
  }

  /**
   * Track a user interaction
   */
  trackInteraction(interaction: UserInteraction): void {
    const enhancedInteraction = {
      ...interaction,
      timestamp: interaction.timestamp || Date.now(),
      sessionId: this.getCurrentSessionId()
    };

    this.interactions.push(enhancedInteraction);
    this.currentSession.interactions.push(enhancedInteraction);

    // Update session metrics
    this.updateSessionMetrics(enhancedInteraction);

    // Maintain interaction history size
    if (this.interactions.length > this.MAX_INTERACTIONS) {
      this.interactions = this.interactions.slice(-this.MAX_INTERACTIONS);
    }

    // Auto-save periodically
    if (this.interactions.length % 50 === 0) {
      this.saveBehaviorData();
    }
  }

  /**
   * Analyze current behavior patterns
   */
  analyzeBehavior(): BehaviorAnalysis {
    const patterns = this.extractPatterns();
    const insights = this.generateInsights(patterns);
    const predictions = this.generatePredictions(patterns);
    const confidence = this.calculateConfidence(patterns);

    return {
      patterns,
      insights,
      predictions,
      confidence
    };
  }

  /**
   * Get task sequences from interaction history
   */
  getTaskSequences(): TaskSequence[] {
    const sequences: Map<string, TaskSequence> = new Map();
    const taskInteractions = this.interactions.filter(i => 
      i.type === 'task_complete' || i.type === 'task_create'
    );

    // Group interactions by time windows (1 hour)
    const timeWindows = this.groupByTimeWindows(taskInteractions, 60 * 60 * 1000);

    timeWindows.forEach(window => {
      if (window.length < 2) return;

      const sequence = window.map(i => i.target).join(' -> ');
      const existing = sequences.get(sequence);

      if (existing) {
        existing.frequency++;
        const lastTimestamp = window[window.length - 1]?.timestamp;
        if (lastTimestamp) {
          const existingTime = existing.lastOccurred instanceof Date ? existing.lastOccurred.getTime() : existing.lastOccurred;
          const newTime = typeof lastTimestamp === 'number' ? lastTimestamp : Date.parse(String(lastTimestamp));
          existing.lastOccurred = new Date(Math.max(existingTime, newTime));
        }
      } else {
        sequences.set(sequence, {
          sequence: window.map(i => i.target),
          frequency: 1,
          confidence: this.calculateSequenceConfidence(window),
          lastOccurred: new Date(window[window.length - 1]?.timestamp || Date.now())
        });
      }
    });

    return Array.from(sequences.values())
      .filter(seq => seq.frequency >= this.PATTERN_MIN_FREQUENCY)
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Get time-based activity patterns
   */
  getTimePatterns(): TimePattern[] {
    const patterns: Map<string, TimePattern> = new Map();

    this.interactions.forEach(interaction => {
      const date = new Date(interaction.timestamp);
      const dayOfWeek = date.getDay();
      const hour = date.getHours();
      const key = `${dayOfWeek}-${hour}-${interaction.type}`;

      const existing = patterns.get(key);
      if (existing) {
        existing.frequency++;
      } else {
        patterns.set(key, {
          dayOfWeek,
          hour,
          activity: interaction.type,
          frequency: 1,
          productivity: this.calculateProductivityForTime(dayOfWeek, hour)
        });
      }
    });

    return Array.from(patterns.values())
      .filter(pattern => pattern.frequency >= this.PATTERN_MIN_FREQUENCY)
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Get tool usage patterns
   */
  getToolUsagePatterns(): ToolUsagePattern[] {
    const patterns: Map<string, ToolUsagePattern> = new Map();
    const toolSwitches = this.interactions.filter(i => i.type === 'tool_switch');

    toolSwitches.forEach(interaction => {
      const toolId = interaction.target;
      const existing = patterns.get(toolId);

      if (existing) {
        existing.usageFrequency++;
      } else {
        patterns.set(toolId, {
          toolId,
          usageFrequency: 1,
          averageSessionDuration: (this.calculateAverageSessionDuration(toolId) * 3600000) as Duration, // Convert hours to milliseconds
          preferredTimeSlots: this.getPreferredTimeSlots(toolId),
          efficiency: this.calculateToolEfficiency(toolId)
        });
      }
    });

    return Array.from(patterns.values())
      .sort((a, b) => b.usageFrequency - a.usageFrequency);
  }

  /**
   * Get productivity metrics for current session
   */
  getCurrentProductivityMetrics(): ProductivityMetric {
    const now = Date.now();

    return {
      date: new Date(now),
      tasksCompleted: this.currentSession.interactions.filter(i => i.type === 'task_complete').length,
      focusTime: (this.currentSession.focusTime * 3600000) as Duration, // Convert hours to milliseconds
      distractionCount: this.currentSession.distractionCount,
      energyLevel: this.estimateEnergyLevel(),
      satisfaction: this.estimateSatisfaction()
    };
  }

  /**
   * Start a new session
   */
  startNewSession(): void {
    // Save current session data
    this.saveBehaviorData();

    // Reset session
    this.currentSession = {
      startTime: Date.now(),
      interactions: [],
      focusTime: 0,
      distractionCount: 0
    };
  }

  /**
   * Save behavior data to storage
   */
  async saveBehaviorData(): Promise<void> {
    const behaviorPattern: BehaviorPattern = {
      taskSequences: this.getTaskSequences(),
      timePatterns: this.getTimePatterns(),
      toolUsage: this.getToolUsagePatterns(),
      productivityMetrics: await this.getStoredProductivityMetrics(),
      workingHours: this.calculateWorkingHours(),
      breakPatterns: this.calculateBreakPatterns()
    };

    // Add current session metrics
    behaviorPattern.productivityMetrics.push(this.getCurrentProductivityMetrics());

    // Validate and save
    const validation = BehaviorPatternSchema.safeParse(behaviorPattern);
    if (validation.success) {
      await storage.set(StorageKeys.USER_BEHAVIOR_PATTERN, behaviorPattern, {
        validate: true,
        schema: BehaviorPatternSchema
      });
    }
  }

  // Private methods
  private async loadStoredBehavior(): Promise<void> {
    const result = await storage.get(StorageKeys.USER_BEHAVIOR_PATTERN);
    if (result.success && result.data) {
      // Initialize with stored data if available
      // Could restore some interaction history from patterns
      // const stored = result.data as BehaviorPattern;
    }
  }

  private initializeTracking(): void {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackInteraction({
        type: document.hidden ? 'blur' : 'focus',
        target: 'window',
        timestamp: Date.now()
      });
    });

    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      this.trackInteraction({
        type: 'click',
        target: this.getElementIdentifier(target),
        timestamp: Date.now()
      });
    });

    // Track keyboard activity
    document.addEventListener('keydown', (event) => {
      this.trackInteraction({
        type: 'keyboard',
        target: event.key,
        timestamp: Date.now(),
        metadata: {
          ctrlKey: event.ctrlKey,
          altKey: event.altKey,
          shiftKey: event.shiftKey
        }
      });
    });

    // Track scroll activity
    let scrollTimeout: NodeJS.Timeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackInteraction({
          type: 'scroll',
          target: 'window',
          timestamp: Date.now(),
          metadata: {
            scrollY: window.scrollY,
            scrollX: window.scrollX
          }
        });
      }, 100);
    });
  }

  private getCurrentSessionId(): string {
    return `session_${this.currentSession.startTime}`;
  }

  private updateSessionMetrics(interaction: UserInteraction): void {
    // Update focus time
    if (interaction.type === 'focus' || interaction.type === 'keyboard' || interaction.type === 'click') {
      const lastInteraction = this.currentSession.interactions[this.currentSession.interactions.length - 2];
      if (lastInteraction && interaction.timestamp - lastInteraction.timestamp < 5000) {
        this.currentSession.focusTime += interaction.timestamp - lastInteraction.timestamp;
      }
    }

    // Count distractions
    if (interaction.type === 'blur' || (interaction.type === 'tool_switch' && 
        this.currentSession.interactions.filter(i => i.type === 'tool_switch').length > 5)) {
      this.currentSession.distractionCount++;
    }
  }

  private extractPatterns(): BehaviorPattern {
    return {
      taskSequences: this.getTaskSequences(),
      timePatterns: this.getTimePatterns(),
      toolUsage: this.getToolUsagePatterns(),
      productivityMetrics: [this.getCurrentProductivityMetrics()],
      workingHours: this.calculateWorkingHours(),
      breakPatterns: this.calculateBreakPatterns()
    };
  }

  private generateInsights(patterns: BehaviorPattern): BehaviorInsight[] {
    const insights: BehaviorInsight[] = [];

    // Productivity insights
    const avgProductivity = patterns.productivityMetrics.reduce((sum, m) => sum + m.satisfaction, 0) / patterns.productivityMetrics.length;
    if (avgProductivity < 6) {
      insights.push({
        type: 'productivity',
        message: 'Your productivity satisfaction is below average. Consider adjusting your work environment.',
        confidence: 0.8,
        actionable: true,
        recommendation: 'Try taking more breaks or changing your workspace layout.'
      });
    }

    // Pattern insights
    const mostCommonSequence = patterns.taskSequences[0];
    if (mostCommonSequence && mostCommonSequence.frequency > 10) {
      insights.push({
        type: 'pattern',
        message: `You frequently follow the pattern: ${mostCommonSequence.sequence.join(' → ')}`,
        confidence: mostCommonSequence.confidence,
        actionable: true,
        recommendation: 'Consider creating a template or automation for this workflow.'
      });
    }

    return insights;
  }

  private generatePredictions(patterns: BehaviorPattern): BehaviorPrediction[] {
    const predictions: BehaviorPrediction[] = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    // Predict next likely task based on time patterns
    const timePattern = patterns.timePatterns.find(p => 
      p.dayOfWeek === currentDay && Math.abs(p.hour - currentHour) <= 1
    );

    if (timePattern && timePattern.frequency > 5) {
      predictions.push({
        type: 'next_task',
        prediction: `You typically ${timePattern.activity} around this time`,
        confidence: Math.min(timePattern.frequency / 20, 0.9),
        timeframe: 30
      });
    }

    // Predict break needed based on focus time
    if (this.currentSession.focusTime > 90 * 60 * 1000) { // 90 minutes
      predictions.push({
        type: 'break_needed',
        prediction: 'You should consider taking a break soon',
        confidence: 0.85,
        timeframe: 15
      });
    }

    return predictions;
  }

  private calculateConfidence(patterns: BehaviorPattern): number {
    const factors = [
      patterns.taskSequences.length > 0 ? 0.3 : 0,
      patterns.timePatterns.length > 0 ? 0.3 : 0,
      patterns.toolUsage.length > 0 ? 0.2 : 0,
      patterns.productivityMetrics.length > 5 ? 0.2 : patterns.productivityMetrics.length * 0.04
    ];

    return factors.reduce((sum, factor) => sum + factor, 0);
  }

  private groupByTimeWindows(interactions: UserInteraction[], windowSize: number): UserInteraction[][] {
    const windows: UserInteraction[][] = [];
    let currentWindow: UserInteraction[] = [];
    let windowStart = 0;

    interactions.forEach(interaction => {
      if (currentWindow.length === 0) {
        windowStart = interaction.timestamp;
        currentWindow.push(interaction);
      } else if (interaction.timestamp - windowStart <= windowSize) {
        currentWindow.push(interaction);
      } else {
        if (currentWindow.length > 0) {
          windows.push(currentWindow);
        }
        currentWindow = [interaction];
        windowStart = interaction.timestamp;
      }
    });

    if (currentWindow.length > 0) {
      windows.push(currentWindow);
    }

    return windows;
  }

  private getTimestamp(timestamp: any): number {
    if (timestamp instanceof Date) {
      return timestamp.getTime();
    }
    if (typeof timestamp === 'number') {
      return timestamp;
    }
    return Date.parse(timestamp?.toString() || '0');
  }

  private calculateSequenceConfidence(sequence: UserInteraction[]): number {
    // Simple confidence based on sequence length and timing consistency
    const avgTimeBetween = sequence.length > 1 ? 
      (this.getTimestamp(sequence[sequence.length - 1]?.timestamp) - this.getTimestamp(sequence[0]?.timestamp)) / (sequence.length - 1) : 0;
    
    const consistencyScore = avgTimeBetween > 0 && avgTimeBetween < 30 * 60 * 1000 ? 0.8 : 0.4;
    const lengthScore = Math.min(sequence.length / 5, 1) * 0.2;
    
    return consistencyScore + lengthScore;
  }

  private calculateProductivityForTime(dayOfWeek: number, hour: number): number {
    // Simple heuristic - can be improved with actual productivity data
    const workingHours = [9, 10, 11, 14, 15, 16];
    const isWorkingHour = workingHours.includes(hour);
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    
    return (isWorkingHour ? 0.7 : 0.3) + (isWeekday ? 0.3 : 0);
  }

  private calculateAverageSessionDuration(toolId: string): number {
    const toolInteractions = this.interactions.filter(i => i.target === toolId);
    if (toolInteractions.length < 2) return 0;

    let totalDuration = 0;
    let sessionCount = 0;

    for (let i = 1; i < toolInteractions.length; i++) {
      const duration = this.getTimestamp(toolInteractions[i]?.timestamp) - this.getTimestamp(toolInteractions[i - 1]?.timestamp);
      if (duration < 60 * 60 * 1000) { // Less than 1 hour
        totalDuration += duration;
        sessionCount++;
      }
    }

    return sessionCount > 0 ? totalDuration / sessionCount : 0;
  }

  private getPreferredTimeSlots(toolId: string): TimeRange[] {
    const toolInteractions = this.interactions.filter(i => i.target === toolId);
    const hourCounts: { [hour: number]: number } = {};

    toolInteractions.forEach(interaction => {
      const hour = new Date(interaction.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const sortedHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    return sortedHours.map(hour => ({
      start: new Date(Date.now() - (Date.now() % (24 * 60 * 60 * 1000)) + hour * 60 * 60 * 1000),
      end: new Date(Date.now() - (Date.now() % (24 * 60 * 60 * 1000)) + (hour + 1) * 60 * 60 * 1000)
    }));
  }

  private calculateToolEfficiency(toolId: string): number {
    // Placeholder - would need task completion data to calculate real efficiency
    const toolInteractions = this.interactions.filter(i => i.target === toolId);
    const recentInteractions = toolInteractions.filter(i => 
      Date.now() - i.timestamp < 7 * 24 * 60 * 60 * 1000 // Last 7 days
    );

    return Math.min(recentInteractions.length / 10, 1);
  }

  private estimateEnergyLevel(): number {
    const hour = new Date().getHours();
    const focusRatio = this.currentSession.focusTime / (Date.now() - this.currentSession.startTime);
    
    // Simple energy estimation based on time of day and focus
    let baseEnergy = 5;
    if (hour >= 9 && hour <= 11) baseEnergy = 8; // Morning peak
    if (hour >= 14 && hour <= 16) baseEnergy = 7; // Afternoon peak
    if (hour >= 20 || hour <= 6) baseEnergy = 3; // Low energy hours
    
    const focusBonus = focusRatio > 0.7 ? 2 : focusRatio > 0.4 ? 1 : 0;
    const distractionPenalty = this.currentSession.distractionCount > 5 ? -2 : 0;
    
    return Math.max(1, Math.min(10, baseEnergy + focusBonus + distractionPenalty));
  }

  private estimateSatisfaction(): number {
    const tasksCompleted = this.currentSession.interactions.filter(i => i.type === 'task_complete').length;
    const sessionHours = (Date.now() - this.currentSession.startTime) / (60 * 60 * 1000);
    
    let satisfaction = 5; // Base satisfaction
    
    if (tasksCompleted > 0) {
      satisfaction += Math.min(tasksCompleted * 1.5, 3);
    }
    
    if (sessionHours > 0) {
      const tasksPerHour = tasksCompleted / sessionHours;
      if (tasksPerHour > 1) satisfaction += 1;
      if (tasksPerHour > 2) satisfaction += 1;
    }
    
    if (this.currentSession.distractionCount > 10) satisfaction -= 2;
    
    return Math.max(1, Math.min(10, satisfaction));
  }

  private calculateWorkingHours(): any {
    // Placeholder - would analyze time patterns to determine working hours
    return {
      monday: [{ start: 9, end: 17 }],
      tuesday: [{ start: 9, end: 17 }],
      wednesday: [{ start: 9, end: 17 }],
      thursday: [{ start: 9, end: 17 }],
      friday: [{ start: 9, end: 17 }],
      saturday: [],
      sunday: []
    };
  }

  private calculateBreakPatterns(): any[] {
    // Placeholder - would analyze break patterns from interactions
    return [
      { type: 'short', duration: 15 * 60 * 1000, frequency: 3, preferredTimes: [10, 15, 20] },
      { type: 'lunch', duration: 60 * 60 * 1000, frequency: 1, preferredTimes: [12, 13] }
    ];
  }

  private async getStoredProductivityMetrics(): Promise<ProductivityMetric[]> {
    const result = await storage.get(StorageKeys.USER_BEHAVIOR_PATTERN);
    if (result.success && result.data) {
      return (result.data as BehaviorPattern).productivityMetrics || [];
    }
    return [];
  }

  private getElementIdentifier(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }
}

export const behaviorTracker = new BehaviorTracker();