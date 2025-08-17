// AI and Machine Learning related type definitions
import { BaseEntity, UUID, Timestamp, Metadata } from './common';

export interface AIModel extends BaseEntity {
  name: string;
  type: ModelType;
  version: string;
  description: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastTrained: Timestamp;
  trainingData: TrainingDataset;
  parameters: ModelParameters;
  deployment: ModelDeployment;
  performance: ModelPerformance;
  status: ModelStatus;
  metadata: Metadata;
}

export enum ModelType {
  TASK_PREDICTION = 'task_prediction',
  BEHAVIOR_ANALYSIS = 'behavior_analysis',
  CONTENT_GENERATION = 'content_generation',
  SENTIMENT_ANALYSIS = 'sentiment_analysis',
  ANOMALY_DETECTION = 'anomaly_detection',
  RECOMMENDATION = 'recommendation',
  CLASSIFICATION = 'classification',
  REGRESSION = 'regression',
  CLUSTERING = 'clustering',
  NLP = 'nlp',
  COMPUTER_VISION = 'computer_vision',
  TIME_SERIES = 'time_series'
}

export enum ModelStatus {
  TRAINING = 'training',
  DEPLOYED = 'deployed',
  DEPRECATED = 'deprecated',
  FAILED = 'failed',
  TESTING = 'testing'
}

export interface TrainingDataset {
  id: UUID;
  name: string;
  size: number;
  features: DataFeature[];
  labels: string[];
  splitRatio: {
    train: number;
    validation: number;
    test: number;
  };
  preprocessing: PreprocessingStep[];
  quality: DataQuality;
}

export interface DataFeature {
  name: string;
  type: 'numerical' | 'categorical' | 'text' | 'image' | 'audio' | 'video';
  importance: number;
  distribution: FeatureDistribution;
  missing: number;
  outliers: number;
}

export interface FeatureDistribution {
  mean?: number;
  median?: number;
  std?: number;
  min?: number;
  max?: number;
  categories?: { [key: string]: number };
}

export interface PreprocessingStep {
  name: string;
  type: 'normalization' | 'encoding' | 'feature_selection' | 'dimensionality_reduction';
  parameters: Metadata;
  order: number;
}

export interface DataQuality {
  completeness: number; // 0-1
  consistency: number; // 0-1
  accuracy: number; // 0-1
  validity: number; // 0-1
  uniqueness: number; // 0-1
  issues: DataIssue[];
}

export interface DataIssue {
  type: 'missing_values' | 'duplicates' | 'outliers' | 'inconsistency' | 'bias';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedRecords: number;
  recommendation: string;
}

export interface ModelParameters {
  hyperparameters: { [key: string]: any };
  architecture: ModelArchitecture;
  optimizer: OptimizerConfig;
  loss: LossConfig;
  metrics: string[];
  callbacks: CallbackConfig[];
}

export interface ModelArchitecture {
  type: 'neural_network' | 'decision_tree' | 'random_forest' | 'svm' | 'linear' | 'ensemble';
  layers?: LayerConfig[];
  nodes?: number;
  depth?: number;
  complexity: 'simple' | 'moderate' | 'complex';
}

export interface LayerConfig {
  type: string;
  units?: number;
  activation?: string;
  dropout?: number;
  parameters: Metadata;
}

export interface OptimizerConfig {
  name: string;
  learningRate: number;
  parameters: Metadata;
}

export interface LossConfig {
  name: string;
  parameters: Metadata;
}

export interface CallbackConfig {
  name: string;
  parameters: Metadata;
}

export interface ModelDeployment {
  environment: 'development' | 'staging' | 'production';
  endpoint?: string;
  runtime: 'browser' | 'node' | 'webassembly' | 'gpu';
  resources: ResourceRequirements;
  scaling: ScalingConfig;
  monitoring: MonitoringConfig;
}

export interface ResourceRequirements {
  memory: number; // MB
  cpu: number; // cores
  gpu?: boolean;
  storage: number; // MB
}

export interface ScalingConfig {
  minInstances: number;
  maxInstances: number;
  targetUtilization: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
}

export interface MonitoringConfig {
  metricsCollection: boolean;
  alerting: AlertConfig[];
  logging: LoggingConfig;
}

export interface AlertConfig {
  metric: string;
  threshold: number;
  operator: 'greater_than' | 'less_than' | 'equals';
  recipients: string[];
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  retention: number; // days
  sampling: number; // 0-1
}

export interface ModelPerformance {
  latency: PerformanceMetric;
  throughput: PerformanceMetric;
  accuracy: PerformanceMetric;
  resourceUsage: ResourceUsage;
  errorRate: number;
  uptime: number;
  lastEvaluated: Timestamp;
}

export interface PerformanceMetric {
  current: number;
  average: number;
  p95: number;
  p99: number;
  trend: 'improving' | 'stable' | 'degrading';
}

export interface ResourceUsage {
  memory: PerformanceMetric;
  cpu: PerformanceMetric;
  gpu?: PerformanceMetric;
  network: PerformanceMetric;
}

export interface Prediction {
  id: UUID;
  modelId: UUID;
  type: PredictionType;
  input: any;
  output: any;
  confidence: number;
  probability?: number;
  alternatives?: PredictionAlternative[];
  explanation: PredictionExplanation;
  timestamp: Timestamp;
  userId?: UUID;
  feedback?: PredictionFeedback;
  metadata: Metadata;
}

export enum PredictionType {
  NEXT_TASK = 'next_task',
  TASK_DURATION = 'task_duration',
  TASK_PRIORITY = 'task_priority',
  RESOURCE_NEED = 'resource_need',
  COLLABORATION_OPPORTUNITY = 'collaboration_opportunity',
  BURNOUT_RISK = 'burnout_risk',
  PROJECT_SUCCESS = 'project_success',
  CONTENT_SUGGESTION = 'content_suggestion',
  WORKFLOW_OPTIMIZATION = 'workflow_optimization'
}

export interface PredictionAlternative {
  output: any;
  confidence: number;
  probability?: number;
  reasoning: string;
}

export interface PredictionExplanation {
  method: 'lime' | 'shap' | 'attention' | 'feature_importance' | 'rule_based';
  features: FeatureImportance[];
  reasoning: string;
  visualizations?: Visualization[];
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  direction: 'positive' | 'negative';
  value: any;
}

export interface Visualization {
  type: 'chart' | 'heatmap' | 'tree' | 'network';
  data: any;
  config: Metadata;
}

export interface PredictionFeedback {
  correct: boolean;
  rating: number; // 1-5
  comment?: string;
  actualOutcome?: any;
  submittedAt: Timestamp;
  submittedBy: UUID;
}

export interface AIAgent {
  id: UUID;
  name: string;
  type: AgentType;
  capabilities: AgentCapability[];
  models: UUID[];
  status: AgentStatus;
  configuration: AgentConfiguration;
  performance: AgentPerformance;
  interactions: AgentInteraction[];
  createdAt: Timestamp;
  lastActive: Timestamp;
}

export enum AgentType {
  TASK_ASSISTANT = 'task_assistant',
  CONTENT_CREATOR = 'content_creator',
  PRODUCTIVITY_COACH = 'productivity_coach',
  COLLABORATION_FACILITATOR = 'collaboration_facilitator',
  ANALYTICS_ADVISOR = 'analytics_advisor',
  WORKFLOW_OPTIMIZER = 'workflow_optimizer'
}

export enum AgentCapability {
  NATURAL_LANGUAGE = 'natural_language',
  VOICE_RECOGNITION = 'voice_recognition',
  GESTURE_RECOGNITION = 'gesture_recognition',
  IMAGE_ANALYSIS = 'image_analysis',
  DOCUMENT_PROCESSING = 'document_processing',
  DATA_ANALYSIS = 'data_analysis',
  PREDICTION = 'prediction',
  RECOMMENDATION = 'recommendation',
  AUTOMATION = 'automation'
}

export enum AgentStatus {
  ACTIVE = 'active',
  IDLE = 'idle',
  BUSY = 'busy',
  OFFLINE = 'offline',
  ERROR = 'error'
}

export interface AgentConfiguration {
  personality: AgentPersonality;
  responseStyle: ResponseStyle;
  proactivity: number; // 0-1
  learningRate: number; // 0-1
  privacyMode: boolean;
  customInstructions: string[];
}

export interface AgentPersonality {
  traits: { [trait: string]: number }; // 0-1 scale
  communicationStyle: 'formal' | 'casual' | 'friendly' | 'professional';
  humor: number; // 0-1
  empathy: number; // 0-1
}

export interface ResponseStyle {
  verbosity: 'concise' | 'balanced' | 'detailed';
  formality: 'casual' | 'professional' | 'academic';
  tone: 'neutral' | 'encouraging' | 'direct' | 'supportive';
}

export interface AgentPerformance {
  tasksCompleted: number;
  successRate: number;
  averageResponseTime: number;
  userSatisfaction: number;
  learningProgress: number;
  errorCount: number;
  lastEvaluated: Timestamp;
}

export interface AgentInteraction {
  id: UUID;
  userId: UUID;
  type: InteractionType;
  input: any;
  output: any;
  context: InteractionContext;
  satisfaction?: number;
  duration: number;
  timestamp: Timestamp;
}

export enum InteractionType {
  QUERY = 'query',
  COMMAND = 'command',
  FEEDBACK = 'feedback',
  CONVERSATION = 'conversation',
  TASK_REQUEST = 'task_request',
  INFORMATION_REQUEST = 'information_request'
}

export interface InteractionContext {
  channel: 'chat' | 'voice' | 'gesture' | 'api';
  device: string;
  location?: string;
  previousInteractions: UUID[];
  userState: UserState;
  environmentState: EnvironmentState;
}

export interface UserState {
  mood: 'positive' | 'neutral' | 'negative' | 'stressed' | 'focused';
  energy: number; // 0-1
  availability: 'available' | 'busy' | 'do_not_disturb';
  currentTask?: UUID;
  workingHours: boolean;
}

export interface EnvironmentState {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number;
  workload: 'light' | 'moderate' | 'heavy';
  deadlines: number;
  teamActivity: 'low' | 'medium' | 'high';
}

// Additional types for ML models
export interface UserInteraction {
  id: string;
  action: string;
  context: string;
  timestamp: number;
  duration: number;
  metadata: Metadata;
}

export interface BehaviorPattern {
  type: string;
  confidence: number;
  timestamp: number;
  features: {
    interactionFrequency: number;
    focusDuration: number;
    productivityScore: number;
    contextSwitches: number;
  };
}

export interface TaskHistory {
  completedTasks: Task[];
  patterns: BehaviorPattern[];
  preferences: Metadata;
}

export interface TaskPrediction {
  taskId: string;
  confidence: number;
  reasoning: string;
  suggestedTime: Date;
  estimatedDuration: number;
  priority: number;
}

export interface WorkContext {
  type: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  urgency?: 'low' | 'medium' | 'high';
  data: Metadata;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: number;
  estimatedDuration: number;
  dependencies: TaskDependency[];
  context: WorkContext;
  aiGenerated: boolean;
}

export interface TaskDependency {
  taskId: string;
  type: 'blocks' | 'requires' | 'related';
}