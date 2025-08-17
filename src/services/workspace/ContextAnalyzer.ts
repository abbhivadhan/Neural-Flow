// Context analysis engine for work environment detection
import { behaviorTracker } from './BehaviorTracker';
// import { storage, StorageKeys } from '../../utils/storage';

export interface WorkContext {
  type: 'coding' | 'writing' | 'research' | 'meeting' | 'planning' | 'design' | 'communication' | 'unknown';
  confidence: number;
  indicators: ContextIndicator[];
  environment: EnvironmentContext;
  timeContext: TimeContext;
  taskContext: TaskContext;
  collaborationContext: CollaborationContext;
}

export interface ContextIndicator {
  type: 'application' | 'content' | 'behavior' | 'time' | 'calendar' | 'communication';
  signal: string;
  weight: number;
  confidence: number;
}

export interface EnvironmentContext {
  device: 'desktop' | 'mobile' | 'tablet';
  location: 'office' | 'home' | 'remote' | 'unknown';
  networkQuality: 'excellent' | 'good' | 'poor' | 'offline';
  batteryLevel?: number;
  screenSize: { width: number; height: number };
  timeZone: string;
  brightness: 'auto' | 'high' | 'medium' | 'low';
}

export interface TimeContext {
  currentTime: Date;
  dayOfWeek: number;
  isWorkingHours: boolean;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  workSession: {
    duration: number;
    breaksSinceStart: number;
    productivityTrend: 'increasing' | 'stable' | 'decreasing';
  };
}

export interface TaskContext {
  activeTask?: string;
  recentTasks: string[];
  upcomingDeadlines: Array<{ task: string; deadline: Date; priority: 'high' | 'medium' | 'low' }>;
  projectContext?: string;
  estimatedRemainingWork: number; // in minutes
}

export interface CollaborationContext {
  activeCollaborators: string[];
  recentCommunications: Array<{ type: 'email' | 'chat' | 'call'; timestamp: Date; participants: string[] }>;
  meetingStatus: 'none' | 'upcoming' | 'active' | 'just_ended';
  teamAvailability: { [userId: string]: 'available' | 'busy' | 'away' | 'offline' };
}

export interface ContextPrediction {
  nextContext: WorkContext['type'];
  confidence: number;
  timeframe: number; // minutes
  reasoning: string[];
}

class ContextAnalyzer {
  private currentContext: WorkContext | null = null;
  private contextHistory: Array<{ context: WorkContext; timestamp: number }> = [];
  private readonly CONTEXT_HISTORY_LIMIT = 100;
  private readonly CONTEXT_UPDATE_INTERVAL = 30000; // 30 seconds
  private updateTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeContextAnalysis();
    this.startPeriodicUpdates();
  }

  /**
   * Analyze current work context
   */
  async analyzeCurrentContext(): Promise<WorkContext> {
    const indicators = await this.gatherContextIndicators();
    const environment = this.analyzeEnvironment();
    const timeContext = this.analyzeTimeContext();
    const taskContext = await this.analyzeTaskContext();
    const collaborationContext = await this.analyzeCollaborationContext();

    const contextType = this.determineContextType(indicators);
    const confidence = this.calculateContextConfidence(indicators, contextType);

    const context: WorkContext = {
      type: contextType,
      confidence,
      indicators,
      environment,
      timeContext,
      taskContext,
      collaborationContext
    };

    this.updateContextHistory(context);
    this.currentContext = context;

    return context;
  }

  /**
   * Get current context without re-analysis
   */
  getCurrentContext(): WorkContext | null {
    return this.currentContext;
  }

  /**
   * Predict next likely context
   */
  predictNextContext(): ContextPrediction {
    if (this.contextHistory.length < 3) {
      return {
        nextContext: 'unknown',
        confidence: 0.1,
        timeframe: 60,
        reasoning: ['Insufficient context history for prediction']
      };
    }

    const recentContexts = this.contextHistory.slice(-10);
    // const patterns = this.analyzeContextPatterns(recentContexts);
    const timeBasedPrediction = this.predictBasedOnTime();
    const behaviorBasedPrediction = this.predictBasedOnBehavior();

    // Combine predictions
    const predictions = [timeBasedPrediction, behaviorBasedPrediction];
    const bestPrediction = predictions.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    return bestPrediction;
  }

  /**
   * Check if context has changed significantly
   */
  hasContextChanged(threshold: number = 0.3): boolean {
    if (!this.currentContext || this.contextHistory.length < 2) return false;

    const previousContextEntry = this.contextHistory[this.contextHistory.length - 2];
    if (!previousContextEntry) return false;
    const previousContext = previousContextEntry.context;
    const currentContext = this.currentContext;

    // Check type change
    if (previousContext.type !== currentContext.type) return true;

    // Check confidence change
    const confidenceChange = Math.abs(previousContext.confidence - currentContext.confidence);
    if (confidenceChange > threshold) return true;

    // Check significant indicator changes
    const significantIndicatorChange = this.hasSignificantIndicatorChange(
      previousContext.indicators,
      currentContext.indicators
    );

    return significantIndicatorChange;
  }

  /**
   * Get context-specific recommendations
   */
  getContextRecommendations(context: WorkContext): string[] {
    const recommendations: string[] = [];

    switch (context.type) {
      case 'coding':
        recommendations.push('Enable focus mode to minimize distractions');
        recommendations.push('Consider using a code-optimized layout');
        if (context.environment.screenSize.width < 1920) {
          recommendations.push('Use a larger screen or dual monitor setup for better code visibility');
        }
        break;

      case 'writing':
        recommendations.push('Switch to a distraction-free writing environment');
        recommendations.push('Enable grammar and style checking tools');
        if (context.timeContext.timeOfDay === 'morning') {
          recommendations.push('Morning is often the best time for creative writing');
        }
        break;

      case 'research':
        recommendations.push('Organize research materials in a dedicated workspace');
        recommendations.push('Enable note-taking and bookmark tools');
        recommendations.push('Consider using a mind-mapping layout');
        break;

      case 'meeting':
        recommendations.push('Prepare meeting notes and agenda');
        recommendations.push('Ensure good audio/video quality');
        recommendations.push('Have relevant documents easily accessible');
        break;

      case 'planning':
        recommendations.push('Use a timeline or kanban view for better planning');
        recommendations.push('Enable calendar integration');
        recommendations.push('Consider using project management tools');
        break;

      case 'design':
        recommendations.push('Switch to a design-optimized workspace');
        recommendations.push('Ensure color accuracy and proper lighting');
        recommendations.push('Have design assets and inspiration readily available');
        break;
    }

    // Add time-based recommendations
    if (context.timeContext.workSession.duration > 90 * 60 * 1000) {
      recommendations.push('Consider taking a break - you\'ve been working for over 90 minutes');
    }

    if (context.timeContext.timeOfDay === 'evening' && context.environment.brightness === 'high') {
      recommendations.push('Consider switching to dark mode to reduce eye strain');
    }

    return recommendations;
  }

  // Private methods
  private async gatherContextIndicators(): Promise<ContextIndicator[]> {
    const indicators: ContextIndicator[] = [];

    // Analyze recent interactions
    const behaviorAnalysis = behaviorTracker.analyzeBehavior();
    behaviorAnalysis.patterns.timePatterns.forEach(pattern => {
      indicators.push({
        type: 'behavior',
        signal: pattern.activity,
        weight: pattern.frequency / 100,
        confidence: pattern.productivity
      });
    });

    // Analyze current page/application
    const currentUrl = window.location.href;
    const urlIndicator = this.analyzeUrlForContext(currentUrl);
    if (urlIndicator) {
      indicators.push(urlIndicator);
    }

    // Analyze document title and content
    const titleIndicator = this.analyzeTitleForContext(document.title);
    if (titleIndicator) {
      indicators.push(titleIndicator);
    }

    // Analyze time patterns
    const timeIndicator = this.analyzeTimeForContext();
    if (timeIndicator) {
      indicators.push(timeIndicator);
    }

    // Analyze user activity patterns
    const activityIndicators = this.analyzeActivityPatterns();
    indicators.push(...activityIndicators);

    return indicators;
  }

  private analyzeEnvironment(): EnvironmentContext {
    const screen = window.screen;
    const connection = (navigator as any).connection;

    return {
      device: this.detectDeviceType(),
      location: this.detectLocation(),
      networkQuality: this.analyzeNetworkQuality(connection),
      batteryLevel: this.getBatteryLevel() || 100,
      screenSize: {
        width: screen.width,
        height: screen.height
      },
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      brightness: this.detectBrightness()
    };
  }

  private analyzeTimeContext(): TimeContext {
    const now = new Date();
    const hour = now.getHours();
    
    return {
      currentTime: now,
      dayOfWeek: now.getDay(),
      isWorkingHours: this.isWorkingHours(hour, now.getDay()),
      timeOfDay: this.getTimeOfDay(hour),
      workSession: {
        duration: Date.now() - (behaviorTracker as any).currentSession.startTime,
        breaksSinceStart: (behaviorTracker as any).currentSession.distractionCount,
        productivityTrend: this.analyzeProductivityTrend()
      }
    };
  }

  private async analyzeTaskContext(): Promise<TaskContext> {
    // This would integrate with task management system
    // For now, return mock data
    return {
      recentTasks: ['Review code', 'Write documentation', 'Plan sprint'],
      upcomingDeadlines: [
        { task: 'Project milestone', deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), priority: 'high' }
      ],
      estimatedRemainingWork: 120
    };
  }

  private async analyzeCollaborationContext(): Promise<CollaborationContext> {
    // This would integrate with communication tools
    // For now, return mock data
    return {
      activeCollaborators: [],
      recentCommunications: [],
      meetingStatus: 'none',
      teamAvailability: {}
    };
  }

  private determineContextType(indicators: ContextIndicator[]): WorkContext['type'] {
    const contextScores: { [key in WorkContext['type']]: number } = {
      coding: 0,
      writing: 0,
      research: 0,
      meeting: 0,
      planning: 0,
      design: 0,
      communication: 0,
      unknown: 0
    };

    indicators.forEach(indicator => {
      const weight = indicator.weight * indicator.confidence;

      // Score based on signal content
      if (indicator.signal.includes('code') || indicator.signal.includes('programming')) {
        contextScores.coding += weight;
      }
      if (indicator.signal.includes('write') || indicator.signal.includes('document')) {
        contextScores.writing += weight;
      }
      if (indicator.signal.includes('research') || indicator.signal.includes('search')) {
        contextScores.research += weight;
      }
      if (indicator.signal.includes('meeting') || indicator.signal.includes('call')) {
        contextScores.meeting += weight;
      }
      if (indicator.signal.includes('plan') || indicator.signal.includes('schedule')) {
        contextScores.planning += weight;
      }
      if (indicator.signal.includes('design') || indicator.signal.includes('creative')) {
        contextScores.design += weight;
      }
      if (indicator.signal.includes('chat') || indicator.signal.includes('email')) {
        contextScores.communication += weight;
      }
    });

    // Find the context type with the highest score
    const maxScore = Math.max(...Object.values(contextScores));
    if (maxScore === 0) return 'unknown';

    const bestContext = Object.entries(contextScores).find(([, score]) => score === maxScore);
    return (bestContext?.[0] as WorkContext['type']) || 'unknown';
  }

  private calculateContextConfidence(indicators: ContextIndicator[], contextType: WorkContext['type']): number {
    if (indicators.length === 0) return 0;

    const relevantIndicators = indicators.filter(indicator => 
      this.isIndicatorRelevantToContext(indicator, contextType)
    );

    if (relevantIndicators.length === 0) return 0.1;

    const avgConfidence = relevantIndicators.reduce((sum, indicator) => 
      sum + indicator.confidence * indicator.weight, 0
    ) / relevantIndicators.length;

    // Boost confidence if multiple indicators agree
    const agreementBonus = Math.min(relevantIndicators.length / 5, 0.3);

    return Math.min(avgConfidence + agreementBonus, 1);
  }

  private updateContextHistory(context: WorkContext): void {
    this.contextHistory.push({
      context,
      timestamp: Date.now()
    });

    if (this.contextHistory.length > this.CONTEXT_HISTORY_LIMIT) {
      this.contextHistory = this.contextHistory.slice(-this.CONTEXT_HISTORY_LIMIT);
    }
  }

  private analyzeContextPatterns(contexts: Array<{ context: WorkContext; timestamp: number }>): any {
    // Analyze patterns in context transitions
    const transitions: { [key: string]: number } = {};
    
    for (let i = 1; i < contexts.length; i++) {
      const from = contexts[i - 1]?.context.type;
      const to = contexts[i]?.context.type;
      if (!from || !to) continue;
      const key = `${from}->${to}`;
      transitions[key] = (transitions[key] || 0) + 1;
    }

    return transitions;
  }

  private predictBasedOnTime(): ContextPrediction {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();

    // Simple time-based predictions
    if (hour >= 9 && hour <= 11 && dayOfWeek >= 1 && dayOfWeek <= 5) {
      return {
        nextContext: 'coding',
        confidence: 0.7,
        timeframe: 30,
        reasoning: ['Morning hours are typically productive for coding']
      };
    }

    if (hour >= 13 && hour <= 14) {
      return {
        nextContext: 'communication',
        confidence: 0.6,
        timeframe: 15,
        reasoning: ['Lunch time often involves communication and planning']
      };
    }

    return {
      nextContext: 'unknown',
      confidence: 0.3,
      timeframe: 60,
      reasoning: ['No strong time-based pattern identified']
    };
  }

  private predictBasedOnBehavior(): ContextPrediction {
    const behaviorAnalysis = behaviorTracker.analyzeBehavior();
    
    if (behaviorAnalysis.predictions.length > 0) {
      const prediction = behaviorAnalysis.predictions[0];
      if (prediction) {
        return {
          nextContext: this.mapPredictionToContext(prediction.prediction),
          confidence: prediction.confidence,
          timeframe: prediction.timeframe,
          reasoning: [`Based on behavior pattern: ${prediction.prediction}`]
        };
      }
    }

    return {
      nextContext: 'unknown',
      confidence: 0.2,
      timeframe: 60,
      reasoning: ['Insufficient behavior data for prediction']
    };
  }

  private hasSignificantIndicatorChange(prev: ContextIndicator[], current: ContextIndicator[]): boolean {
    // Simple check for significant changes in indicators
    const prevSignals = new Set(prev.map(i => i.signal));
    const currentSignals = new Set(current.map(i => i.signal));
    
    const intersection = new Set([...prevSignals].filter(x => currentSignals.has(x)));
    const union = new Set([...prevSignals, ...currentSignals]);
    
    const similarity = intersection.size / union.size;
    return similarity < 0.7; // 70% similarity threshold
  }

  private analyzeUrlForContext(url: string): ContextIndicator | null {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('github') || urlLower.includes('gitlab') || urlLower.includes('code')) {
      return {
        type: 'application',
        signal: 'coding_platform',
        weight: 0.8,
        confidence: 0.9
      };
    }
    
    if (urlLower.includes('docs') || urlLower.includes('wiki') || urlLower.includes('notion')) {
      return {
        type: 'application',
        signal: 'documentation',
        weight: 0.7,
        confidence: 0.8
      };
    }

    return null;
  }

  private analyzeTitleForContext(title: string): ContextIndicator | null {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('meeting') || titleLower.includes('call')) {
      return {
        type: 'content',
        signal: 'meeting_content',
        weight: 0.9,
        confidence: 0.9
      };
    }

    return null;
  }

  private analyzeTimeForContext(): ContextIndicator | null {
    const hour = new Date().getHours();
    
    if (hour >= 9 && hour <= 11) {
      return {
        type: 'time',
        signal: 'morning_productive_hours',
        weight: 0.6,
        confidence: 0.7
      };
    }

    return null;
  }

  private analyzeActivityPatterns(): ContextIndicator[] {
    // This would analyze recent user activity patterns
    // For now, return empty array
    return [];
  }

  private detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  private detectLocation(): 'office' | 'home' | 'remote' | 'unknown' {
    // This would use various signals to detect location
    // For now, return unknown
    return 'unknown';
  }

  private analyzeNetworkQuality(connection: any): 'excellent' | 'good' | 'poor' | 'offline' {
    if (!navigator.onLine) return 'offline';
    if (!connection) return 'good';
    
    const effectiveType = connection.effectiveType;
    if (effectiveType === '4g') return 'excellent';
    if (effectiveType === '3g') return 'good';
    return 'poor';
  }

  private getBatteryLevel(): number | undefined {
    // Battery API is deprecated, return undefined
    return undefined;
  }

  private detectBrightness(): 'auto' | 'high' | 'medium' | 'low' {
    // This would detect screen brightness
    // For now, return auto
    return 'auto';
  }

  private isWorkingHours(hour: number, dayOfWeek: number): boolean {
    return dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 9 && hour <= 17;
  }

  private getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  private analyzeProductivityTrend(): 'increasing' | 'stable' | 'decreasing' {
    // This would analyze recent productivity metrics
    // For now, return stable
    return 'stable';
  }

  private isIndicatorRelevantToContext(indicator: ContextIndicator, contextType: WorkContext['type']): boolean {
    const relevanceMap: { [key in WorkContext['type']]: string[] } = {
      coding: ['code', 'programming', 'github', 'development'],
      writing: ['write', 'document', 'text', 'content'],
      research: ['research', 'search', 'study', 'analysis'],
      meeting: ['meeting', 'call', 'conference', 'discussion'],
      planning: ['plan', 'schedule', 'organize', 'strategy'],
      design: ['design', 'creative', 'visual', 'graphics'],
      communication: ['chat', 'email', 'message', 'communication'],
      unknown: []
    };

    const relevantTerms = relevanceMap[contextType];
    return relevantTerms.some(term => indicator.signal.toLowerCase().includes(term));
  }

  private mapPredictionToContext(prediction: string): WorkContext['type'] {
    const predictionLower = prediction.toLowerCase();
    
    if (predictionLower.includes('code')) return 'coding';
    if (predictionLower.includes('write')) return 'writing';
    if (predictionLower.includes('research')) return 'research';
    if (predictionLower.includes('meeting')) return 'meeting';
    if (predictionLower.includes('plan')) return 'planning';
    if (predictionLower.includes('design')) return 'design';
    if (predictionLower.includes('communication')) return 'communication';
    
    return 'unknown';
  }

  private initializeContextAnalysis(): void {
    // Initialize with current context
    this.analyzeCurrentContext();
  }

  private startPeriodicUpdates(): void {
    this.updateTimer = setInterval(() => {
      this.analyzeCurrentContext();
    }, this.CONTEXT_UPDATE_INTERVAL);
  }

  public destroy(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }
}

export const contextAnalyzer = new ContextAnalyzer();