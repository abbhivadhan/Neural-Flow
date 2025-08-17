// Project-related Zod validation schemas
import { z } from 'zod';
import { 
  BaseEntitySchema, 
  UUIDSchema, 
  TimestampSchema, 
  PrioritySchema,
  MetadataSchema
} from './common';

// Enums
export const ProjectStatusSchema = z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled', 'archived']);
export const ProjectRoleSchema = z.enum(['owner', 'admin', 'member', 'viewer', 'guest']);
export const ProjectPermissionSchema = z.enum(['read', 'write', 'delete', 'manage_members', 'manage_settings', 'export_data']);
export const ResourceTypeSchema = z.enum(['document', 'image', 'video', 'audio', 'link', 'code', 'dataset', 'model']);
export const ProjectVisibilitySchema = z.enum(['private', 'team', 'organization', 'public']);
export const RiskTypeSchema = z.enum(['schedule_delay', 'budget_overrun', 'resource_shortage', 'scope_creep', 'quality_issues', 'team_burnout', 'dependency_failure']);
export const RecommendationTypeSchema = z.enum(['resource_allocation', 'timeline_adjustment', 'scope_modification', 'team_optimization', 'process_improvement', 'risk_mitigation']);

// Core schemas
export const BudgetItemSchema = z.object({
  category: z.string().min(1).max(100),
  allocated: z.number().min(0),
  spent: z.number().min(0),
  description: z.string().max(500).optional(),
});

export const BudgetSchema = z.object({
  total: z.number().min(0),
  spent: z.number().min(0),
  currency: z.string().length(3),
  breakdown: z.array(BudgetItemSchema),
});

export const ProjectMemberSchema = z.object({
  userId: UUIDSchema,
  role: ProjectRoleSchema,
  permissions: z.array(ProjectPermissionSchema),
  joinedAt: TimestampSchema,
  contribution: z.number().min(0).max(1),
  lastActive: TimestampSchema,
});

export const ResourceSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  type: ResourceTypeSchema,
  url: z.string().url().optional(),
  content: z.string().optional(),
  size: z.number().min(0).optional(),
  uploadedBy: UUIDSchema,
  uploadedAt: TimestampSchema,
  tags: z.array(z.string().min(1).max(50)),
  metadata: MetadataSchema,
});

export const DeliverableSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(200),
  description: z.string().max(1000),
  dueDate: TimestampSchema,
  status: z.enum(['pending', 'in_progress', 'completed', 'overdue']),
  assignee: UUIDSchema,
  artifacts: z.array(UUIDSchema),
});

export const ProjectPhaseSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(1000),
  startDate: TimestampSchema,
  endDate: TimestampSchema,
  status: ProjectStatusSchema,
  tasks: z.array(UUIDSchema),
  deliverables: z.array(DeliverableSchema),
  progress: z.number().min(0).max(1),
});

export const PhaseDependencySchema = z.object({
  fromPhase: UUIDSchema,
  toPhase: UUIDSchema,
  type: z.enum(['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish']),
  lag: z.number(),
});

export const TimelineSchema = z.object({
  phases: z.array(ProjectPhaseSchema),
  dependencies: z.array(PhaseDependencySchema),
  criticalPath: z.array(UUIDSchema),
  estimatedDuration: z.number().min(0),
  actualDuration: z.number().min(0).optional(),
});

export const MilestoneSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(1000),
  dueDate: TimestampSchema,
  status: z.enum(['upcoming', 'at_risk', 'completed', 'missed']),
  criteria: z.array(z.string().min(1).max(200)),
  dependencies: z.array(UUIDSchema),
  importance: z.enum(['low', 'medium', 'high', 'critical']),
});

export const RiskFactorSchema = z.object({
  type: RiskTypeSchema,
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  probability: z.number().min(0).max(1),
  impact: z.string().min(1).max(500),
  mitigation: z.array(z.string().min(1).max(200)),
  detectedAt: TimestampSchema,
});

export const ProjectPredictionSchema = z.object({
  type: z.enum(['completion_date', 'budget_usage', 'success_probability']),
  value: z.any(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().min(1).max(1000),
  factors: z.array(z.string().min(1).max(100)),
  createdAt: TimestampSchema,
});

export const RecommendationSchema = z.object({
  id: UUIDSchema,
  type: RecommendationTypeSchema,
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  priority: PrioritySchema,
  impact: z.enum(['low', 'medium', 'high']),
  effort: z.enum(['low', 'medium', 'high']),
  actions: z.array(z.string().min(1).max(200)),
  deadline: TimestampSchema.optional(),
  status: z.enum(['pending', 'accepted', 'rejected', 'implemented']),
});

export const TrendDataPointSchema = z.object({
  timestamp: TimestampSchema,
  value: z.number(),
  metadata: MetadataSchema.optional(),
});

export const ProjectTrendSchema = z.object({
  metric: z.string().min(1).max(100),
  values: z.array(TrendDataPointSchema),
  direction: z.enum(['up', 'down', 'stable']),
  significance: z.enum(['low', 'medium', 'high']),
});

export const BenchmarkSchema = z.object({
  metric: z.string().min(1).max(100),
  currentValue: z.number(),
  industryAverage: z.number(),
  topPercentile: z.number(),
  comparison: z.enum(['above', 'at', 'below']),
});

export const ProjectInsightsSchema = z.object({
  healthScore: z.number().min(0).max(100),
  riskFactors: z.array(RiskFactorSchema),
  predictions: z.array(ProjectPredictionSchema),
  recommendations: z.array(RecommendationSchema),
  trends: z.array(ProjectTrendSchema),
  benchmarks: z.array(BenchmarkSchema),
  lastAnalyzed: TimestampSchema,
});

export const ProjectSchema = BaseEntitySchema.extend({
  name: z.string().min(1).max(200),
  description: z.string().max(2000),
  status: ProjectStatusSchema,
  priority: PrioritySchema,
  startDate: TimestampSchema,
  endDate: TimestampSchema.optional(),
  actualEndDate: TimestampSchema.optional(),
  budget: BudgetSchema.optional(),
  owner: UUIDSchema,
  collaborators: z.array(ProjectMemberSchema),
  tasks: z.array(UUIDSchema),
  resources: z.array(ResourceSchema),
  timeline: TimelineSchema,
  milestones: z.array(MilestoneSchema),
  tags: z.array(z.string().min(1).max(50)),
  visibility: ProjectVisibilitySchema,
  aiInsights: ProjectInsightsSchema,
  settings: z.object({
    autoAssignment: z.boolean(),
    notificationRules: z.array(z.any()),
    workflowRules: z.array(z.any()),
    integrations: z.array(z.any()),
    customFields: z.array(z.any()),
    templates: z.array(z.any()),
  }),
  metadata: MetadataSchema,
});

// Validation functions
export const validateProject = (data: unknown) => ProjectSchema.safeParse(data);
export const validateProjectMember = (data: unknown) => ProjectMemberSchema.safeParse(data);
export const validateBudget = (data: unknown) => BudgetSchema.safeParse(data);
export const validateMilestone = (data: unknown) => MilestoneSchema.safeParse(data);

// Partial schemas for updates
export const ProjectUpdateSchema = ProjectSchema.partial();
export const ProjectCreateSchema = ProjectSchema.omit({ id: true, createdAt: true, updatedAt: true });

// Custom validation rules
export const validateProjectDates = (project: { startDate: Date; endDate?: Date; actualEndDate?: Date }) => {
  const errors: string[] = [];
  
  if (project.endDate && project.startDate > project.endDate) {
    errors.push('Start date must be before end date');
  }
  
  if (project.actualEndDate && project.startDate > project.actualEndDate) {
    errors.push('Start date must be before actual end date');
  }
  
  return errors;
};

export const validateBudgetConsistency = (budget: { total: number; breakdown: Array<{ allocated: number; spent: number }> }) => {
  const errors: string[] = [];
  
  const totalAllocated = budget.breakdown.reduce((sum, item) => sum + item.allocated, 0);
  const totalSpent = budget.breakdown.reduce((sum, item) => sum + item.spent, 0);
  
  if (Math.abs(totalAllocated - budget.total) > 0.01) {
    errors.push('Total budget must equal sum of allocated amounts');
  }
  
  if (totalSpent > budget.total) {
    errors.push('Total spent cannot exceed total budget');
  }
  
  return errors;
};