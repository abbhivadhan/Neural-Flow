// Task-related Zod validation schemas
import { z } from 'zod';
import { 
  BaseEntitySchema, 
  UUIDSchema, 
  TimestampSchema, 
  PrioritySchema,
  MetadataSchema,
  DurationSchema
} from './common';

// Enums
export const TaskStatusSchema = z.enum(['todo', 'in_progress', 'blocked', 'review', 'done', 'cancelled']);
export const DependencyTypeSchema = z.enum(['blocks', 'blocked_by', 'relates_to', 'duplicates', 'subtask_of']);
export const WorkTypeSchema = z.enum(['coding', 'writing', 'research', 'design', 'meeting', 'review', 'planning', 'learning', 'administrative']);
export const ComplexityLevelSchema = z.enum(['trivial', 'simple', 'moderate', 'complex', 'expert']);
export const EnvironmentTypeSchema = z.enum(['focused', 'collaborative', 'creative', 'analytical', 'social']);
export const CollaborationLevelSchema = z.enum(['solo', 'pair', 'small_team', 'large_team', 'cross_functional']);
export const TaskActionSchema = z.enum(['created', 'updated', 'status_changed', 'assigned', 'unassigned', 'commented', 'attached', 'deleted', 'restored']);

// Core schemas
export const TaskDependencySchema = z.object({
  taskId: UUIDSchema,
  type: DependencyTypeSchema,
  required: z.boolean(),
});

export const TaskContextSchema = z.object({
  workType: WorkTypeSchema,
  domain: z.string().min(1).max(100),
  complexity: ComplexityLevelSchema,
  skillsRequired: z.array(z.string().min(1).max(50)),
  toolsRequired: z.array(z.string().min(1).max(50)),
  environment: EnvironmentTypeSchema,
  collaborationLevel: CollaborationLevelSchema,
});

export const AttachmentSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  type: z.string().min(1).max(50),
  size: z.number().min(0),
  url: z.string().url(),
  uploadedAt: TimestampSchema,
  uploadedBy: UUIDSchema,
});

export const ReactionSchema = z.object({
  emoji: z.string().min(1).max(10),
  users: z.array(UUIDSchema),
  count: z.number().min(0),
});

export const CommentSchema = z.object({
  id: UUIDSchema,
  content: z.string().min(1).max(2000),
  author: UUIDSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema.optional(),
  mentions: z.array(UUIDSchema),
  reactions: z.array(ReactionSchema),
});

export const ChecklistItemSchema = z.object({
  id: UUIDSchema,
  text: z.string().min(1).max(500),
  completed: z.boolean(),
  required: z.boolean(),
  order: z.number().min(0),
});

export const TaskTemplateSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(1000),
  defaultDuration: DurationSchema,
  defaultPriority: PrioritySchema,
  requiredFields: z.array(z.string()),
  context: TaskContextSchema,
  checklist: z.array(ChecklistItemSchema),
  isPublic: z.boolean(),
  createdBy: UUIDSchema,
  usageCount: z.number().min(0),
});

export const TaskPredictionSchema = z.object({
  taskId: UUIDSchema.optional(),
  suggestedTitle: z.string().min(1).max(200),
  suggestedDescription: z.string().max(2000),
  predictedPriority: PrioritySchema,
  predictedDuration: DurationSchema,
  confidence: z.number().min(0).max(1),
  reasoning: z.string().max(1000),
  suggestedTags: z.array(z.string().min(1).max(50)),
  suggestedDependencies: z.array(UUIDSchema),
});

export const TaskHistorySchema = z.object({
  taskId: UUIDSchema,
  action: TaskActionSchema,
  timestamp: TimestampSchema,
  userId: UUIDSchema,
  oldValue: z.any().optional(),
  newValue: z.any().optional(),
  metadata: MetadataSchema,
});

export const TaskFilterSchema = z.object({
  status: z.array(TaskStatusSchema).optional(),
  priority: z.array(PrioritySchema).optional(),
  assignee: z.array(UUIDSchema).optional(),
  creator: z.array(UUIDSchema).optional(),
  projectId: z.array(UUIDSchema).optional(),
  tags: z.array(z.string()).optional(),
  workType: z.array(WorkTypeSchema).optional(),
  dateRange: z.object({
    field: z.enum(['createdAt', 'dueDate', 'completedDate']),
    start: TimestampSchema.optional(),
    end: TimestampSchema.optional(),
  }).optional(),
  search: z.string().optional(),
});

export const TaskSortSchema = z.object({
  field: z.enum(['createdAt', 'updatedAt', 'dueDate', 'priority', 'title']),
  direction: z.enum(['asc', 'desc']),
});

export const TaskSchema = BaseEntitySchema.extend({
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  priority: PrioritySchema,
  status: TaskStatusSchema,
  estimatedDuration: DurationSchema,
  actualDuration: DurationSchema.optional(),
  dueDate: TimestampSchema.optional(),
  startDate: TimestampSchema.optional(),
  completedDate: TimestampSchema.optional(),
  dependencies: z.array(TaskDependencySchema),
  context: TaskContextSchema,
  tags: z.array(z.string().min(1).max(50)),
  assignee: UUIDSchema.optional(),
  creator: UUIDSchema,
  projectId: UUIDSchema.optional(),
  parentTaskId: UUIDSchema.optional(),
  subtasks: z.array(UUIDSchema),
  attachments: z.array(AttachmentSchema),
  comments: z.array(CommentSchema),
  aiGenerated: z.boolean(),
  aiConfidence: z.number().min(0).max(1).optional(),
  metadata: MetadataSchema,
});

// Validation functions
export const validateTask = (data: unknown) => TaskSchema.safeParse(data);
export const validateTaskContext = (data: unknown) => TaskContextSchema.safeParse(data);
export const validateTaskFilter = (data: unknown) => TaskFilterSchema.safeParse(data);
export const validateTaskPrediction = (data: unknown) => TaskPredictionSchema.safeParse(data);

// Partial schemas for updates
export const TaskUpdateSchema = TaskSchema.partial();
export const TaskCreateSchema = TaskSchema.omit({ id: true, createdAt: true, updatedAt: true });

// Custom validation rules
export const validateTaskDates = (task: { startDate?: Date; dueDate?: Date; completedDate?: Date }) => {
  const errors: string[] = [];
  
  if (task.startDate && task.dueDate && task.startDate > task.dueDate) {
    errors.push('Start date must be before due date');
  }
  
  if (task.completedDate && task.startDate && task.completedDate < task.startDate) {
    errors.push('Completion date must be after start date');
  }
  
  return errors;
};

export const validateTaskDependencies = (task: { id: string; dependencies: Array<{ taskId: string; type: string }> }) => {
  const errors: string[] = [];
  
  // Check for self-dependency
  if (task.dependencies.some(dep => dep.taskId === task.id)) {
    errors.push('Task cannot depend on itself');
  }
  
  // Check for duplicate dependencies
  const dependencyIds = task.dependencies.map(dep => dep.taskId);
  const uniqueIds = new Set(dependencyIds);
  if (dependencyIds.length !== uniqueIds.size) {
    errors.push('Duplicate dependencies are not allowed');
  }
  
  return errors;
};