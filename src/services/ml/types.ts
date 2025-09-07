// Shared types for ML services to avoid circular imports

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
  type: 'meeting' | 'deadline' | 'reminder' | 'block';
}

export interface ExternalEvent {
  id: string;
  type: 'email' | 'notification' | 'calendar_change' | 'system_alert';
  title: string;
  description?: string;
  urgency?: 'low' | 'medium' | 'high';
  timestamp: Date;
  metadata: any;
}

export interface Deadline {
  id: string;
  taskId: string;
  date: Date;
  type: 'hard' | 'soft';
  importance: number;
}

export interface TimeBlock {
  taskId: string;
  startTime: Date;
  endTime: Date;
  type: 'focused_work' | 'meeting' | 'break' | 'buffer';
  priority: number;
}

export interface CalendarInsights {
  meetingDensity: number;
  focusTimeAvailable: number;
  optimalWorkPeriods: TimeBlock[];
  conflictingEvents: CalendarEvent[];
  timestamp: number;
}

export interface ResourceRequirement {
  type: 'file' | 'tool' | 'data' | 'connection';
  name: string;
  available: boolean;
  preparationTime: number;
  priority: number;
}

export interface EventPreparation {
  eventId: string;
  resourcesPrepared: string[];
  documentsReady: string[];
  toolsActivated: string[];
  preparationTime: number;
  status: 'success' | 'partial' | 'failed';
}

export interface PreparationResult {
  eventsProcessed: number;
  preparations: EventPreparation[];
  timestamp: Date;
}

export interface TaskAdjustmentSuggestion {
  taskId: string;
  currentPriority: number;
  suggestedPriority: number;
  reason: string;
  urgency: 'low' | 'medium' | 'high';
  priority: number;
}

export interface EventImpact {
  severity: number;
  affectedTasks: string[];
  type: string;
  urgency: string;
}

export interface DeadlineReorganizationResult {
  reorganized: boolean;
  suggestions: any[];
  timeBlocks: TimeBlock[];
  message: string;
}

export interface ResourceEfficiencyMetrics {
  averagePreparationTime: number;
  successRate: number;
  mostUsedResources: string[];
  bottlenecks: string[];
}

export interface ProductivityRecommendation {
  type: 'task_focus' | 'schedule_optimization' | 'resource_optimization';
  priority: 'low' | 'medium' | 'high';
  message: string;
  action: string;
  taskId?: string;
}

export interface TaskFeedback {
  accuracy: number;
  usefulness: number;
  resourcesUsed: string[];
  comments?: string;
}

export interface EnhancedTaskPrediction {
  taskId: string;
  confidence: number;
  reasoning: string;
  suggestedTime: Date;
  estimatedDuration: number;
  priority: number;
  resourceRequirements: ResourceRequirement[];
  preparationStatus: 'pending' | 'preparing' | 'ready' | 'failed';
  enhancedConfidence: number;
}

export interface ProductivityInsights {
  predictedTasks: EnhancedTaskPrediction[];
  calendarInsights: CalendarInsights;
  resourceEfficiency: ResourceEfficiencyMetrics;
  recommendations: ProductivityRecommendation[];
  timestamp: Date;
}

// Advanced AI Model Types
export interface MLModelConfig {
  modelType: 'behavioral' | 'task_prediction' | 'priority_optimization' | 'llama' | 'ensemble';
  hyperparameters: Record<string, any>;
  trainingData?: TrainingDataset;
}

export interface TrainingDataset {
  features: number[][];
  labels: number[];
  metadata: {
    size: number;
    features: string[];
    createdAt: Date;
  };
}

export class ModelLoadingError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'ModelLoadingError';
  }
}

export class ModelInferenceError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'ModelInferenceError';
  }
}

export class ModelQuantizationError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'ModelQuantizationError';
  }
}