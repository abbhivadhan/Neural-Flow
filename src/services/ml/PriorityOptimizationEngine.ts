import { Task, TaskPrediction, WorkContext } from '../../types/ai';
import { 
  CalendarInsights, 
  TaskAdjustmentSuggestion, 
  ExternalEvent, 
  EventImpact, 
  Deadline 
} from './types';

/**
 * Priority Optimization Engine
 * Dynamically optimizes task priorities based on context, deadlines, and external events
 */
export class PriorityOptimizationEngine {
  private priorityModel: PriorityModel;
  private contextWeights: ContextWeights;
  private historicalData: PriorityHistoryEntry[] = [];
  private optimizationRules: OptimizationRule[] = [];

  constructor() {
    this.priorityModel = new PriorityModel();
    this.contextWeights = this.initializeContextWeights();
    this.initializeOptimizationRules();
  }

  /**
   * Initialize the priority optimization engine
   */
  async initialize(): Promise<void> {
    console.log('Initializing Priority Optimization Engine...');
    
    // Load historical priority data
    await this.loadHistoricalData();
    
    // Initialize the priority model
    await this.priorityModel.initialize();
    
    // Load optimization rules
    await this.loadOptimizationRules();
    
    console.log('Priority Optimization Engine initialized');
  }

  /**
   * Optimize task priorities based on calendar insights and context
   */
  async optimizePriorities(
    predictions: TaskPrediction[],
    calendarInsights: CalendarInsights,
    _context: WorkContext
  ): Promise<TaskPrediction[]> {
    const optimizedPredictions: TaskPrediction[] = [];

    for (const prediction of predictions) {
      const optimizedPriority = await this.calculateOptimizedPriority(
        prediction,
        calendarInsights,
        _context
      );

      optimizedPredictions.push({
        ...prediction,
        priority: optimizedPriority,
        reasoning: this.enhanceReasoning(prediction.reasoning, optimizedPriority, _context)
      });
    }

    // Sort by optimized priority
    return optimizedPredictions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Suggest task adjustments based on external events
   */
  async suggestAdjustment(
    event: ExternalEvent,
    currentTasks: Task[],
    impact: EventImpact,
    context: WorkContext
  ): Promise<TaskAdjustmentSuggestion> {
    // Find the most affected task
    const affectedTask = currentTasks.find(task => 
      impact.affectedTasks.includes(task.id)
    );

    if (!affectedTask) {
      throw new Error('No affected task found for adjustment');
    }

    const currentPriority = affectedTask.priority;
    const suggestedPriority = await this.calculateAdjustedPriority(
      affectedTask,
      event,
      impact,
      context
    );

    return {
      taskId: affectedTask.id,
      currentPriority,
      suggestedPriority,
      reason: this.generateAdjustmentReason(event, impact, currentPriority, suggestedPriority),
      urgency: this.determineAdjustmentUrgency(impact, currentPriority, suggestedPriority),
      priority: this.calculateAdjustmentPriority(impact, Math.abs(suggestedPriority - currentPriority))
    };
  }

  /**
   * Reorganize tasks for approaching deadlines
   */
  async reorganizeForDeadlines(
    tasks: Task[],
    deadlines: Deadline[],
    _context: WorkContext
  ): Promise<Task[]> {
    const reorganizedTasks: Task[] = [];
    const deadlineMap = new Map<string, Deadline>();
    
    // Create deadline lookup
    deadlines.forEach(deadline => {
      deadlineMap.set(deadline.taskId, deadline);
    });

    for (const task of tasks) {
      const deadline = deadlineMap.get(task.id);
      let adjustedTask = { ...task };

      if (deadline) {
        // Calculate urgency-based priority adjustment
        const timeToDeadline = deadline.date.getTime() - Date.now();
        const urgencyMultiplier = this.calculateUrgencyMultiplier(timeToDeadline, deadline.type);
        
        adjustedTask.priority = Math.min(
          Math.round(task.priority * urgencyMultiplier),
          5 // Max priority
        );

        // Adjust estimated duration if needed
        if (timeToDeadline < task.estimatedDuration * 60 * 1000) {
          adjustedTask.estimatedDuration = Math.max(
            Math.floor(timeToDeadline / (60 * 1000)),
            30 // Minimum 30 minutes
          );
        }
      }

      reorganizedTasks.push(adjustedTask);
    }

    // Sort by adjusted priority and deadline proximity
    return reorganizedTasks.sort((a, b) => {
      const deadlineA = deadlineMap.get(a.id);
      const deadlineB = deadlineMap.get(b.id);
      
      // Primary sort: priority
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      
      // Secondary sort: deadline proximity
      if (deadlineA && deadlineB) {
        return deadlineA.date.getTime() - deadlineB.date.getTime();
      }
      
      return 0;
    });
  }

  /**
   * Update the engine with task completion data
   */
  async updateWithCompletion(
    completedTask: Task,
    actualDuration: number,
    context: WorkContext
  ): Promise<void> {
    const historyEntry: PriorityHistoryEntry = {
      taskId: completedTask.id,
      originalPriority: completedTask.priority,
      actualDuration,
      estimatedDuration: completedTask.estimatedDuration,
      context: { ...context },
      completedAt: Date.now(),
      success: actualDuration <= completedTask.estimatedDuration * 1.2 // 20% tolerance
    };

    this.historicalData.push(historyEntry);
    
    // Keep only recent history (last 1000 entries)
    if (this.historicalData.length > 1000) {
      this.historicalData = this.historicalData.slice(-1000);
    }

    // Update priority model with new data
    await this.priorityModel.updateWithFeedback(historyEntry);
    
    // Adjust context weights based on success patterns
    this.adjustContextWeights(historyEntry);
    
    // Persist historical data
    this.persistHistoricalData();
  }

  // Private methods

  private async calculateOptimizedPriority(
    prediction: TaskPrediction,
    calendarInsights: CalendarInsights,
    context: WorkContext
  ): Promise<number> {
    let basePriority = prediction.priority;
    
    // Apply context-based adjustments
    const contextMultiplier = this.calculateContextMultiplier(context);
    const calendarMultiplier = this.calculateCalendarMultiplier(calendarInsights, context);
    const confidenceMultiplier = this.calculateConfidenceMultiplier(prediction.confidence);
    
    // Apply optimization rules
    const ruleAdjustment = this.applyOptimizationRules(prediction, context);
    
    // Calculate final priority
    let optimizedPriority = basePriority * contextMultiplier * calendarMultiplier * confidenceMultiplier + ruleAdjustment;
    
    // Ensure priority stays within bounds
    return Math.max(1, Math.min(5, Math.round(optimizedPriority)));
  }

  private calculateContextMultiplier(context: WorkContext): number {
    let multiplier = 1.0;
    
    // Time of day adjustments
    if (context.timeOfDay === 'morning') {
      multiplier *= this.contextWeights.timeOfDay.morning;
    } else if (context.timeOfDay === 'afternoon') {
      multiplier *= this.contextWeights.timeOfDay.afternoon;
    } else if (context.timeOfDay === 'evening') {
      multiplier *= this.contextWeights.timeOfDay.evening;
    }
    
    // Urgency adjustments
    if (context.urgency === 'high') {
      multiplier *= this.contextWeights.urgency.high;
    } else if (context.urgency === 'low') {
      multiplier *= this.contextWeights.urgency.low;
    }
    
    return multiplier;
  }

  private calculateCalendarMultiplier(
    calendarInsights: CalendarInsights,
    _context: WorkContext
  ): number {
    let multiplier = 1.0;
    
    // Adjust based on meeting density
    if (calendarInsights.meetingDensity > 0.7) {
      multiplier *= 0.8; // Lower priority for complex tasks when many meetings
    } else if (calendarInsights.meetingDensity < 0.3) {
      multiplier *= 1.2; // Higher priority when more focus time available
    }
    
    // Adjust based on available focus time
    if (calendarInsights.focusTimeAvailable > 240) { // 4+ hours
      multiplier *= 1.1; // Boost priority for longer tasks
    } else if (calendarInsights.focusTimeAvailable < 60) { // < 1 hour
      multiplier *= 0.9; // Lower priority for complex tasks
    }
    
    return multiplier;
  }

  private calculateConfidenceMultiplier(confidence: number): number {
    // Higher confidence predictions get slight priority boost
    return 0.9 + (confidence * 0.2); // Range: 0.9 to 1.1
  }

  private applyOptimizationRules(
    prediction: TaskPrediction,
    context: WorkContext
  ): number {
    let adjustment = 0;
    
    for (const rule of this.optimizationRules) {
      if (rule.condition(prediction, context)) {
        adjustment += rule.adjustment;
      }
    }
    
    return adjustment;
  }

  private async calculateAdjustedPriority(
    task: Task,
    event: ExternalEvent,
    impact: EventImpact,
    _context: WorkContext
  ): Promise<number> {
    let adjustedPriority = task.priority;
    
    // Adjust based on event urgency
    if (event.urgency === 'high') {
      adjustedPriority += 1;
    } else if (event.urgency === 'low') {
      adjustedPriority -= 0.5;
    }
    
    // Adjust based on impact severity
    adjustedPriority += impact.severity * 2;
    
    // Ensure bounds
    return Math.max(1, Math.min(5, Math.round(adjustedPriority)));
  }

  private calculateUrgencyMultiplier(timeToDeadline: number, deadlineType: 'hard' | 'soft'): number {
    const hoursToDeadline = timeToDeadline / (60 * 60 * 1000);
    
    let multiplier = 1.0;
    
    if (hoursToDeadline <= 4) {
      multiplier = deadlineType === 'hard' ? 2.0 : 1.5;
    } else if (hoursToDeadline <= 12) {
      multiplier = deadlineType === 'hard' ? 1.5 : 1.3;
    } else if (hoursToDeadline <= 24) {
      multiplier = deadlineType === 'hard' ? 1.3 : 1.2;
    } else if (hoursToDeadline <= 48) {
      multiplier = deadlineType === 'hard' ? 1.2 : 1.1;
    }
    
    return multiplier;
  }

  private enhanceReasoning(
    originalReasoning: string,
    optimizedPriority: number,
    context: WorkContext
  ): string {
    let enhancement = originalReasoning;
    
    if (context.timeOfDay === 'morning' && optimizedPriority > 3) {
      enhancement += '. Prioritized for morning productivity peak.';
    }
    
    if (context.urgency === 'high') {
      enhancement += '. Elevated due to high urgency context.';
    }
    
    return enhancement;
  }

  private generateAdjustmentReason(
    event: ExternalEvent,
    impact: EventImpact,
    currentPriority: number,
    suggestedPriority: number
  ): string {
    const change = suggestedPriority - currentPriority;
    const direction = change > 0 ? 'increased' : 'decreased';
    
    return `Priority ${direction} due to ${event.type} event with ${impact.severity.toFixed(2)} impact severity. ` +
           `Event affects ${impact.affectedTasks.length} related tasks.`;
  }

  private determineAdjustmentUrgency(
    impact: EventImpact,
    currentPriority: number,
    suggestedPriority: number
  ): 'low' | 'medium' | 'high' {
    const priorityChange = Math.abs(suggestedPriority - currentPriority);
    
    if (impact.severity > 0.7 || priorityChange >= 2) {
      return 'high';
    } else if (impact.severity > 0.4 || priorityChange >= 1) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private calculateAdjustmentPriority(impact: EventImpact, priorityChange: number): number {
    return Math.round((impact.severity * 3) + (priorityChange * 2));
  }

  private adjustContextWeights(historyEntry: PriorityHistoryEntry): void {
    const learningRate = 0.01; // Small adjustments
    
    if (historyEntry.success) {
      // Reinforce successful context patterns
      if (historyEntry.context.timeOfDay === 'morning') {
        this.contextWeights.timeOfDay.morning += learningRate;
      }
      if (historyEntry.context.urgency === 'high') {
        this.contextWeights.urgency.high += learningRate;
      }
    } else {
      // Reduce weights for unsuccessful patterns
      if (historyEntry.context.timeOfDay === 'morning') {
        this.contextWeights.timeOfDay.morning -= learningRate;
      }
      if (historyEntry.context.urgency === 'high') {
        this.contextWeights.urgency.high -= learningRate;
      }
    }
    
    // Ensure weights stay within reasonable bounds
    this.normalizeContextWeights();
  }

  private normalizeContextWeights(): void {
    // Ensure all weights are between 0.5 and 2.0
    Object.keys(this.contextWeights.timeOfDay).forEach(key => {
      this.contextWeights.timeOfDay[key as keyof typeof this.contextWeights.timeOfDay] = 
        Math.max(0.5, Math.min(2.0, this.contextWeights.timeOfDay[key as keyof typeof this.contextWeights.timeOfDay]));
    });
    
    Object.keys(this.contextWeights.urgency).forEach(key => {
      this.contextWeights.urgency[key as keyof typeof this.contextWeights.urgency] = 
        Math.max(0.5, Math.min(2.0, this.contextWeights.urgency[key as keyof typeof this.contextWeights.urgency]));
    });
  }

  private initializeContextWeights(): ContextWeights {
    return {
      timeOfDay: {
        morning: 1.1,
        afternoon: 1.0,
        evening: 0.9
      },
      urgency: {
        low: 0.8,
        medium: 1.0,
        high: 1.3
      },
      workload: {
        light: 1.1,
        moderate: 1.0,
        heavy: 0.9
      }
    };
  }

  private initializeOptimizationRules(): void {
    this.optimizationRules = [
      {
        name: 'High Confidence Boost',
        condition: (prediction, _context) => prediction.confidence > 0.8,
        adjustment: 0.2
      },
      {
        name: 'Morning Focus Time',
        condition: (prediction, context) => 
          context.timeOfDay === 'morning' && prediction.estimatedDuration > 60,
        adjustment: 0.3
      },
      {
        name: 'Quick Task Afternoon',
        condition: (prediction, context) => 
          context.timeOfDay === 'afternoon' && prediction.estimatedDuration < 30,
        adjustment: 0.2
      },
      {
        name: 'High Urgency Context',
        condition: (_prediction, context) => context.urgency === 'high',
        adjustment: 0.5
      }
    ];
  }

  private async loadHistoricalData(): Promise<void> {
    try {
      const stored = localStorage.getItem('priority-history');
      if (stored) {
        this.historicalData = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load priority history:', error);
    }
  }

  private async loadOptimizationRules(): Promise<void> {
    // In a real implementation, this might load rules from a configuration file
    // For now, we use the initialized rules
  }

  private persistHistoricalData(): void {
    try {
      localStorage.setItem('priority-history', JSON.stringify(this.historicalData));
    } catch (error) {
      console.warn('Failed to persist priority history:', error);
    }
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.historicalData = [];
    this.optimizationRules = [];
    this.priorityModel.dispose();
  }
}

/**
 * Simple priority model for learning from feedback
 */
class PriorityModel {
  private weights: number[] = [1, 1, 1, 1, 1]; // Simple weight vector
  
  async initialize(): Promise<void> {
    // Load saved weights
    try {
      const stored = localStorage.getItem('priority-model-weights');
      if (stored) {
        this.weights = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load priority model weights:', error);
    }
  }
  
  async updateWithFeedback(historyEntry: PriorityHistoryEntry): Promise<void> {
    // Simple learning: adjust weights based on success/failure
    const learningRate = 0.01;
    const adjustment = historyEntry.success ? learningRate : -learningRate;
    
    // Adjust weight based on priority level
    if (historyEntry.originalPriority >= 1 && historyEntry.originalPriority <= 5) {
      const weightIndex = historyEntry.originalPriority - 1;
      if (this.weights[weightIndex] !== undefined) {
        this.weights[weightIndex] = (this.weights[weightIndex] || 0) + adjustment;
      }
    }
    
    // Persist updated weights
    try {
      localStorage.setItem('priority-model-weights', JSON.stringify(this.weights));
    } catch (error) {
      console.warn('Failed to save priority model weights:', error);
    }
  }
  
  dispose(): void {
    this.weights = [1, 1, 1, 1, 1];
  }
}

// Supporting interfaces
interface ContextWeights {
  timeOfDay: {
    morning: number;
    afternoon: number;
    evening: number;
  };
  urgency: {
    low: number;
    medium: number;
    high: number;
  };
  workload: {
    light: number;
    moderate: number;
    heavy: number;
  };
}

interface OptimizationRule {
  name: string;
  condition: (prediction: TaskPrediction, context: WorkContext) => boolean;
  adjustment: number;
}

interface PriorityHistoryEntry {
  taskId: string;
  originalPriority: number;
  actualDuration: number;
  estimatedDuration: number;
  context: WorkContext;
  completedAt: number;
  success: boolean;
}