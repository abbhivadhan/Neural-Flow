// AI and ML related Zod validation schemas
import { z } from 'zod';
import { 
  BaseEntitySchema, 
  UUIDSchema, 
  TimestampSchema, 
  MetadataSchema
} from './common';

// Enums
export const ModelTypeSchema = z.enum([
  'task_prediction', 'behavior_analysis', 'content_generation', 'sentiment_analysis',
  'anomaly_detection', 'recommendation', 'classification', 'regression', 'clustering',
  'nlp', 'computer_vision', 'time_series'
]);

export const ModelStatusSchema = z.enum(['training', 'deployed', 'deprecated', 'failed', 'testing']);
export const PredictionTypeSchema = z.enum([
  'next_task', 'task_duration', 'task_priority', 'resource_need', 'collaboration_opportunity',
  'burnout_risk', 'project_success', 'content_suggestion', 'workflow_optimization'
]);

export const AgentTypeSchema = z.enum([
  'task_assistant', 'content_creator', 'productivity_coach', 'collaboration_facilitator',
  'analytics_advisor', 'workflow_optimizer'
]);

export const AgentCapabilitySchema = z.enum([
  'natural_language', 'voice_recognition', 'gesture_recognition', 'image_analysis',
  'document_processing', 'data_analysis', 'prediction', 'recommendation', 'automation'
]);

export const AgentStatusSchema = z.enum(['active', 'idle', 'busy', 'offline', 'error']);
export const InteractionTypeSchema = z.enum(['query', 'command', 'feedback', 'conversation', 'task_request', 'information_request']);

// Core schemas
export const DataFeatureSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['numerical', 'categorical', 'text', 'image', 'audio', 'video']),
  importance: z.number().min(0).max(1),
  distribution: z.object({
    mean: z.number().optional(),
    median: z.number().optional(),
    std: z.number().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    categories: z.record(z.number()).optional(),
  }),
  missing: z.number().min(0),
  outliers: z.number().min(0),
});

export const PreprocessingStepSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['normalization', 'encoding', 'feature_selection', 'dimensionality_reduction']),
  parameters: MetadataSchema,
  order: z.number().min(0),
});

export const DataIssueSchema = z.object({
  type: z.enum(['missing_values', 'duplicates', 'outliers', 'inconsistency', 'bias']),
  severity: z.enum(['low', 'medium', 'high']),
  description: z.string().min(1).max(500),
  affectedRecords: z.number().min(0),
  recommendation: z.string().min(1).max(500),
});

export const DataQualitySchema = z.object({
  completeness: z.number().min(0).max(1),
  consistency: z.number().min(0).max(1),
  accuracy: z.number().min(0).max(1),
  validity: z.number().min(0).max(1),
  uniqueness: z.number().min(0).max(1),
  issues: z.array(DataIssueSchema),
});

export const TrainingDatasetSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(200),
  size: z.number().min(0),
  features: z.array(DataFeatureSchema),
  labels: z.array(z.string()),
  splitRatio: z.object({
    train: z.number().min(0).max(1),
    validation: z.number().min(0).max(1),
    test: z.number().min(0).max(1),
  }).refine(data => Math.abs(data.train + data.validation + data.test - 1) < 0.001, {
    message: "Split ratios must sum to 1",
  }),
  preprocessing: z.array(PreprocessingStepSchema),
  quality: DataQualitySchema,
});

export const LayerConfigSchema = z.object({
  type: z.string().min(1),
  units: z.number().min(1).optional(),
  activation: z.string().optional(),
  dropout: z.number().min(0).max(1).optional(),
  parameters: MetadataSchema,
});

export const ModelArchitectureSchema = z.object({
  type: z.enum(['neural_network', 'decision_tree', 'random_forest', 'svm', 'linear', 'ensemble']),
  layers: z.array(LayerConfigSchema).optional(),
  nodes: z.number().min(1).optional(),
  depth: z.number().min(1).optional(),
  complexity: z.enum(['simple', 'moderate', 'complex']),
});

export const OptimizerConfigSchema = z.object({
  name: z.string().min(1),
  learningRate: z.number().min(0),
  parameters: MetadataSchema,
});

export const LossConfigSchema = z.object({
  name: z.string().min(1),
  parameters: MetadataSchema,
});

export const CallbackConfigSchema = z.object({
  name: z.string().min(1),
  parameters: MetadataSchema,
});

export const ModelParametersSchema = z.object({
  hyperparameters: z.record(z.any()),
  architecture: ModelArchitectureSchema,
  optimizer: OptimizerConfigSchema,
  loss: LossConfigSchema,
  metrics: z.array(z.string()),
  callbacks: z.array(CallbackConfigSchema),
});

export const ResourceRequirementsSchema = z.object({
  memory: z.number().min(0),
  cpu: z.number().min(0),
  gpu: z.boolean().optional(),
  storage: z.number().min(0),
});

export const ScalingConfigSchema = z.object({
  minInstances: z.number().min(1),
  maxInstances: z.number().min(1),
  targetUtilization: z.number().min(0).max(1),
  scaleUpThreshold: z.number().min(0).max(1),
  scaleDownThreshold: z.number().min(0).max(1),
});

export const AlertConfigSchema = z.object({
  metric: z.string().min(1),
  threshold: z.number(),
  operator: z.enum(['greater_than', 'less_than', 'equals']),
  recipients: z.array(z.string().email()),
});

export const LoggingConfigSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']),
  retention: z.number().min(1),
  sampling: z.number().min(0).max(1),
});

export const MonitoringConfigSchema = z.object({
  metricsCollection: z.boolean(),
  alerting: z.array(AlertConfigSchema),
  logging: LoggingConfigSchema,
});

export const ModelDeploymentSchema = z.object({
  environment: z.enum(['development', 'staging', 'production']),
  endpoint: z.string().url().optional(),
  runtime: z.enum(['browser', 'node', 'webassembly', 'gpu']),
  resources: ResourceRequirementsSchema,
  scaling: ScalingConfigSchema,
  monitoring: MonitoringConfigSchema,
});

export const PerformanceMetricSchema = z.object({
  current: z.number(),
  average: z.number(),
  p95: z.number(),
  p99: z.number(),
  trend: z.enum(['improving', 'stable', 'degrading']),
});

export const ResourceUsageSchema = z.object({
  memory: PerformanceMetricSchema,
  cpu: PerformanceMetricSchema,
  gpu: PerformanceMetricSchema.optional(),
  network: PerformanceMetricSchema,
});

export const ModelPerformanceSchema = z.object({
  latency: PerformanceMetricSchema,
  throughput: PerformanceMetricSchema,
  accuracy: PerformanceMetricSchema,
  resourceUsage: ResourceUsageSchema,
  errorRate: z.number().min(0).max(1),
  uptime: z.number().min(0).max(1),
  lastEvaluated: TimestampSchema,
});

export const AIModelSchema = BaseEntitySchema.extend({
  name: z.string().min(1).max(200),
  type: ModelTypeSchema,
  version: z.string().min(1).max(50),
  description: z.string().max(1000),
  accuracy: z.number().min(0).max(1),
  precision: z.number().min(0).max(1),
  recall: z.number().min(0).max(1),
  f1Score: z.number().min(0).max(1),
  lastTrained: TimestampSchema,
  trainingData: TrainingDatasetSchema,
  parameters: ModelParametersSchema,
  deployment: ModelDeploymentSchema,
  performance: ModelPerformanceSchema,
  status: ModelStatusSchema,
  metadata: MetadataSchema,
});

export const FeatureImportanceSchema = z.object({
  feature: z.string().min(1),
  importance: z.number(),
  direction: z.enum(['positive', 'negative']),
  value: z.any(),
});

export const VisualizationSchema = z.object({
  type: z.enum(['chart', 'heatmap', 'tree', 'network']),
  data: z.any(),
  config: MetadataSchema,
});

export const PredictionExplanationSchema = z.object({
  method: z.enum(['lime', 'shap', 'attention', 'feature_importance', 'rule_based']),
  features: z.array(FeatureImportanceSchema),
  reasoning: z.string().min(1).max(1000),
  visualizations: z.array(VisualizationSchema).optional(),
});

export const PredictionAlternativeSchema = z.object({
  output: z.any(),
  confidence: z.number().min(0).max(1),
  probability: z.number().min(0).max(1).optional(),
  reasoning: z.string().min(1).max(500),
});

export const PredictionFeedbackSchema = z.object({
  correct: z.boolean(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
  actualOutcome: z.any().optional(),
  submittedAt: TimestampSchema,
  submittedBy: UUIDSchema,
});

export const PredictionSchema = z.object({
  id: UUIDSchema,
  modelId: UUIDSchema,
  type: PredictionTypeSchema,
  input: z.any(),
  output: z.any(),
  confidence: z.number().min(0).max(1),
  probability: z.number().min(0).max(1).optional(),
  alternatives: z.array(PredictionAlternativeSchema).optional(),
  explanation: PredictionExplanationSchema,
  timestamp: TimestampSchema,
  userId: UUIDSchema.optional(),
  feedback: PredictionFeedbackSchema.optional(),
  metadata: MetadataSchema,
});

// Validation functions
export const validateAIModel = (data: unknown) => AIModelSchema.safeParse(data);
export const validatePrediction = (data: unknown) => PredictionSchema.safeParse(data);
export const validateTrainingDataset = (data: unknown) => TrainingDatasetSchema.safeParse(data);

// Partial schemas for updates
export const AIModelUpdateSchema = AIModelSchema.partial();
export const PredictionUpdateSchema = PredictionSchema.partial();