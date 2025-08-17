// import * as tf from '@tensorflow/tfjs';
import { Task, TaskHistory, TaskPrediction, WorkContext } from '../../types/ai';
import { TaskPredictionModel } from './TaskPredictionModel';
import { ResourcePreparationSystem } from './ResourcePreparationSystem';
import { PriorityOptimizationEngine } from './PriorityOptimizationEngine';
import { CalendarAnalyzer } from './CalendarAnalyzer';
import {
  CalendarEvent,
  ExternalEvent,
  Deadline,
  TimeBlock,
  CalendarInsights,
  ResourceRequirement,
  EventPreparation,
  PreparationResult,
  TaskAdjustmentSuggestion,
  EventImpact,
  DeadlineReorganizationResult,
  ResourceEfficiencyMetrics,
  ProductivityRecommendation,
  TaskFeedback,
  EnhancedTaskPrediction,
  ProductivityInsights
} from './types';

/**
 * Predictive Task Intelligence System
 * Orchestrates task prediction, resource preparation, priority optimization, and calendar analysis
 */
export class PredictiveTaskIntelligence {
  private taskPredictionModel: TaskPredictionModel;
  private resourcePreparationSystem: ResourcePreparationSystem;
  private priorityOptimizationEngine: PriorityOptimizationEngine;
  private calendarAnalyzer: CalendarAnalyzer;
  private isInitialized = false;

  constructor() {
    this.taskPredictionModel = new TaskPredictionModel();
    this.resourcePreparationSystem = new ResourcePreparationSystem();
    this.priorityOptimizationEngine = new PriorityOptimizationEngine();
    this.calendarAnalyzer = new CalendarAnalyzer();
  }

  /**
   * Initialize all components of the predictive task intelligence system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing Predictive Task Intelligence System...');
      
      // Initialize all components in parallel
      await Promise.all([
        this.taskPredictionModel.initialize(),
        this.resourcePreparationSystem.initialize(),
        this.priorityOptimizationEngine.initialize(),
        this.calendarAnalyzer.initialize()
      ]);

      this.isInitialized = true;
      console.log('Predictive Task Intelligence System initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Predictive Task Intelligence System:', error);
      throw error;
    }
  }

  /**
   * Predict next tasks with enhanced intelligence
   * Requirement 2.1: Predict next 3 most likely tasks with 85% accuracy
   */
  async predictNextTasks(
    taskHistory: TaskHistory,
    context: WorkContext,
    calendarEvents: CalendarEvent[] = [],
    topK: number = 3
  ): Promise<EnhancedTaskPrediction[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Get base predictions from the task prediction model
      const basePredictions = await this.taskPredictionModel.predictNextTasks(
        taskHistory,
        context,
        topK * 2 // Get more predictions for filtering
      );

      // Analyze calendar context for better predictions
      const calendarInsights = await this.calendarAnalyzer.analyzeUpcomingEvents(
        calendarEvents,
        context
      );

      // Optimize priorities based on current context and deadlines
      const optimizedPriorities = await this.priorityOptimizationEngine.optimizePriorities(
        basePredictions,
        calendarInsights,
        context
      );

      // Enhance predictions with resource preparation
      const enhancedPredictions = await this.enhancePredictionsWithResources(
        optimizedPriorities.slice(0, topK),
        context
      );

      // Prepare resources proactively for top predictions
      await this.resourcePreparationSystem.prepareResourcesForTasks(
        enhancedPredictions,
        context
      );

      return enhancedPredictions;
    } catch (error) {
      console.error('Error predicting next tasks:', error);
      throw error;
    }
  }

  /**
   * Proactively prepare for upcoming meetings and deadlines
   * Requirement 2.2: Prepare relevant documents 15 minutes before meetings
   */
  async prepareForUpcomingEvents(
    calendarEvents: CalendarEvent[],
    context: WorkContext
  ): Promise<PreparationResult> {
    const upcomingEvents = calendarEvents.filter(event => {
      const eventTime = new Date(event.startTime);
      const now = new Date();
      const timeDiff = eventTime.getTime() - now.getTime();
      return timeDiff > 0 && timeDiff <= 15 * 60 * 1000; // 15 minutes
    });

    const preparationResults: EventPreparation[] = [];

    for (const event of upcomingEvents) {
      const preparation = await this.resourcePreparationSystem.prepareForEvent(
        event,
        context
      );
      preparationResults.push(preparation);
    }

    return {
      eventsProcessed: upcomingEvents.length,
      preparations: preparationResults,
      timestamp: new Date()
    };
  }

  /**
   * Analyze and suggest task adjustments based on external events
   * Requirement 2.4: Intelligently prioritize and suggest task adjustments
   */
  async analyzeExternalEvents(
    externalEvents: ExternalEvent[],
    currentTasks: Task[],
    context: WorkContext
  ): Promise<TaskAdjustmentSuggestion[]> {
    const suggestions: TaskAdjustmentSuggestion[] = [];

    for (const event of externalEvents) {
      const impact = await this.assessEventImpact(event, currentTasks, context);
      
      if (impact.severity > 0.3) { // Significant impact threshold
        const adjustment = await this.priorityOptimizationEngine.suggestAdjustment(
          event,
          currentTasks,
          impact,
          context
        );
        suggestions.push(adjustment);
      }
    }

    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Reorganize priorities when approaching deadlines
   * Requirement 2.5: Automatically reorganize priorities and suggest time-blocking
   */
  async reorganizeForDeadlines(
    tasks: Task[],
    deadlines: Deadline[],
    context: WorkContext
  ): Promise<DeadlineReorganizationResult> {
    const urgentDeadlines = deadlines.filter(deadline => {
      const timeToDeadline = deadline.date.getTime() - Date.now();
      return timeToDeadline <= 48 * 60 * 60 * 1000; // 48 hours
    });

    if (urgentDeadlines.length === 0) {
      return {
        reorganized: false,
        suggestions: [],
        timeBlocks: [],
        message: 'No urgent deadlines requiring reorganization'
      };
    }

    // Reorganize task priorities
    const reorganizedTasks = await this.priorityOptimizationEngine.reorganizeForDeadlines(
      tasks,
      urgentDeadlines,
      context
    );

    // Generate time-blocking suggestions
    const timeBlocks = await this.generateTimeBlockingSuggestions(
      reorganizedTasks,
      urgentDeadlines,
      context
    );

    return {
      reorganized: true,
      suggestions: reorganizedTasks,
      timeBlocks,
      message: `Reorganized ${reorganizedTasks.length} tasks for ${urgentDeadlines.length} urgent deadlines`
    };
  }

  /**
   * Get comprehensive productivity insights
   */
  async getProductivityInsights(
    taskHistory: TaskHistory,
    context: WorkContext
  ): Promise<ProductivityInsights> {
    const predictions = await this.predictNextTasks(taskHistory, context);
    const calendarAnalysis = await this.calendarAnalyzer.analyzeProductivityPatterns(
      taskHistory,
      context
    );
    const resourceEfficiency = await this.resourcePreparationSystem.getEfficiencyMetrics();

    return {
      predictedTasks: predictions,
      calendarInsights: calendarAnalysis,
      resourceEfficiency,
      recommendations: this.generateProductivityRecommendations(
        predictions,
        calendarAnalysis,
        resourceEfficiency
      ),
      timestamp: new Date()
    };
  }

  /**
   * Train the system with new task completion data
   */
  async trainWithCompletedTask(
    completedTask: Task,
    actualDuration: number,
    userFeedback: TaskFeedback,
    context: WorkContext
  ): Promise<void> {
    // Update task prediction model
    // Note: updateWithFeedback method needs to be implemented in TaskPredictionModel
    // await this.taskPredictionModel.updateWithFeedback(
    //   completedTask,
    //   actualDuration,
    //   userFeedback
    // );

    // Update priority optimization engine
    await this.priorityOptimizationEngine.updateWithCompletion(
      completedTask,
      actualDuration,
      context
    );

    // Update resource preparation system
    await this.resourcePreparationSystem.updateResourceUsageData(
      completedTask,
      userFeedback.resourcesUsed || []
    );
  }

  // Private helper methods

  private async enhancePredictionsWithResources(
    predictions: TaskPrediction[],
    _context: WorkContext
  ): Promise<EnhancedTaskPrediction[]> {
    const enhanced: EnhancedTaskPrediction[] = [];

    for (const prediction of predictions) {
      const resourceRequirements = await this.resourcePreparationSystem.analyzeResourceRequirements(
        prediction,
        context
      );

      enhanced.push({
        ...prediction,
        resourceRequirements,
        preparationStatus: 'pending',
        enhancedConfidence: this.calculateEnhancedConfidence(prediction, resourceRequirements)
      });
    }

    return enhanced;
  }

  private async assessEventImpact(
    event: ExternalEvent,
    currentTasks: Task[],
    context: WorkContext
  ): Promise<EventImpact> {
    // Analyze how the external event affects current tasks
    let severity = 0;
    const affectedTasks: string[] = [];

    for (const task of currentTasks) {
      if (this.isTaskAffectedByEvent(task, event)) {
        affectedTasks.push(task.id);
        severity += task.priority / 5; // Normalize priority impact
      }
    }

    return {
      severity: Math.min(severity / currentTasks.length, 1),
      affectedTasks,
      type: event.type,
      urgency: event.urgency || 'medium'
    };
  }

  private isTaskAffectedByEvent(task: Task, event: ExternalEvent): boolean {
    // Simple heuristic - in production, this would be more sophisticated
    const taskKeywords = [task.title, task.description || ''].join(' ').toLowerCase();
    const eventKeywords = [event.title, event.description || ''].join(' ').toLowerCase();
    
    // Check for keyword overlap
    const taskWords = taskKeywords.split(' ');
    const eventWords = eventKeywords.split(' ');
    
    const overlap = taskWords.filter(word => 
      word.length > 3 && eventWords.includes(word)
    ).length;
    
    return overlap > 0;
  }

  private async generateTimeBlockingSuggestions(
    tasks: Task[],
    deadlines: Deadline[],
    context: WorkContext
  ): Promise<TimeBlock[]> {
    const timeBlocks: TimeBlock[] = [];
    const workingHours = this.getWorkingHours(context);
    
    let currentTime = new Date();
    currentTime.setHours(workingHours.start, 0, 0, 0);

    for (const task of tasks.slice(0, 5)) { // Top 5 priority tasks
      const duration = task.estimatedDuration;
      const endTime = new Date(currentTime.getTime() + duration * 60 * 1000);

      timeBlocks.push({
        taskId: task.id,
        startTime: new Date(currentTime),
        endTime,
        type: 'focused_work',
        priority: task.priority
      });

      // Add buffer time
      currentTime = new Date(endTime.getTime() + 15 * 60 * 1000);
      
      // Check if we've exceeded working hours
      if (currentTime.getHours() >= workingHours.end) {
        currentTime.setDate(currentTime.getDate() + 1);
        currentTime.setHours(workingHours.start, 0, 0, 0);
      }
    }

    return timeBlocks;
  }

  private getWorkingHours(_context: WorkContext): { start: number; end: number } {
    // Default working hours - could be personalized
    return { start: 9, end: 17 };
  }

  private calculateEnhancedConfidence(
    prediction: TaskPrediction,
    resourceRequirements: ResourceRequirement[]
  ): number {
    let confidence = prediction.confidence;
    
    // Boost confidence if resources are readily available
    const availableResources = resourceRequirements.filter(req => req.available).length;
    const totalResources = resourceRequirements.length;
    
    if (totalResources > 0) {
      const resourceAvailability = availableResources / totalResources;
      confidence = confidence * (0.7 + 0.3 * resourceAvailability);
    }
    
    return Math.min(confidence, 1);
  }

  private generateProductivityRecommendations(
    predictions: EnhancedTaskPrediction[],
    calendarInsights: CalendarInsights,
    resourceEfficiency: ResourceEfficiencyMetrics
  ): ProductivityRecommendation[] {
    const recommendations: ProductivityRecommendation[] = [];

    // Task-based recommendations
    if (predictions.length > 0 && predictions[0]?.enhancedConfidence && predictions[0].enhancedConfidence > 0.8) {
      recommendations.push({
        type: 'task_focus',
        priority: 'high',
        message: `High confidence prediction: Focus on "${predictions[0]?.reasoning}" next`,
        action: 'start_task',
        taskId: predictions[0]?.taskId
      });
    }

    // Calendar-based recommendations
    if (calendarInsights.meetingDensity > 0.7) {
      recommendations.push({
        type: 'schedule_optimization',
        priority: 'medium',
        message: 'High meeting density detected. Consider blocking focus time.',
        action: 'block_time'
      });
    }

    // Resource efficiency recommendations
    if (resourceEfficiency.averagePreparationTime > 300) { // 5 minutes
      recommendations.push({
        type: 'resource_optimization',
        priority: 'low',
        message: 'Resource preparation taking longer than optimal. Consider pre-loading common resources.',
        action: 'optimize_resources'
      });
    }

    return recommendations;
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.taskPredictionModel.dispose();
    this.resourcePreparationSystem.dispose();
    this.priorityOptimizationEngine.dispose();
    this.calendarAnalyzer.dispose();
    this.isInitialized = false;
  }
}

// Export types from shared module for convenience
export * from './types';