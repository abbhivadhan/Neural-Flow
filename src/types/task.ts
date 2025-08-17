// Task-related type definitions
import { BaseEntity, UUID, Timestamp, Priority, Duration, Metadata } from './common';

export interface Task extends BaseEntity {
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  estimatedDuration: Duration;
  actualDuration?: Duration;
  dueDate?: Timestamp;
  startDate?: Timestamp;
  completedDate?: Timestamp;
  dependencies: TaskDependency[];
  context: TaskContext;
  tags: string[];
  assignee?: UUID;
  creator: UUID;
  projectId?: UUID;
  parentTaskId?: UUID;
  subtasks: UUID[];
  attachments: Attachment[];
  comments: Comment[];
  aiGenerated: boolean;
  aiConfidence?: number;
  metadata: Metadata;
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  REVIEW = 'review',
  DONE = 'done',
  CANCELLED = 'cancelled'
}

export interface TaskDependency {
  taskId: UUID;
  type: DependencyType;
  required: boolean;
}

export enum DependencyType {
  BLOCKS = 'blocks',
  BLOCKED_BY = 'blocked_by',
  RELATES_TO = 'relates_to',
  DUPLICATES = 'duplicates',
  SUBTASK_OF = 'subtask_of'
}

export interface TaskContext {
  workType: WorkType;
  domain: string;
  complexity: ComplexityLevel;
  skillsRequired: string[];
  toolsRequired: string[];
  environment: EnvironmentType;
  collaborationLevel: CollaborationLevel;
}

export enum WorkType {
  CODING = 'coding',
  WRITING = 'writing',
  RESEARCH = 'research',
  DESIGN = 'design',
  MEETING = 'meeting',
  REVIEW = 'review',
  PLANNING = 'planning',
  LEARNING = 'learning',
  ADMINISTRATIVE = 'administrative'
}

export enum ComplexityLevel {
  TRIVIAL = 'trivial',
  SIMPLE = 'simple',
  MODERATE = 'moderate',
  COMPLEX = 'complex',
  EXPERT = 'expert'
}

export enum EnvironmentType {
  FOCUSED = 'focused',
  COLLABORATIVE = 'collaborative',
  CREATIVE = 'creative',
  ANALYTICAL = 'analytical',
  SOCIAL = 'social'
}

export enum CollaborationLevel {
  SOLO = 'solo',
  PAIR = 'pair',
  SMALL_TEAM = 'small_team',
  LARGE_TEAM = 'large_team',
  CROSS_FUNCTIONAL = 'cross_functional'
}

export interface Attachment {
  id: UUID;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Timestamp;
  uploadedBy: UUID;
}

export interface Comment {
  id: UUID;
  content: string;
  author: UUID;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  mentions: UUID[];
  reactions: Reaction[];
}

export interface Reaction {
  emoji: string;
  users: UUID[];
  count: number;
}

export interface TaskTemplate {
  id: UUID;
  name: string;
  description: string;
  defaultDuration: Duration;
  defaultPriority: Priority;
  requiredFields: string[];
  context: TaskContext;
  checklist: ChecklistItem[];
  isPublic: boolean;
  createdBy: UUID;
  usageCount: number;
}

export interface ChecklistItem {
  id: UUID;
  text: string;
  completed: boolean;
  required: boolean;
  order: number;
}

export interface TaskPrediction {
  taskId?: UUID;
  suggestedTitle: string;
  suggestedDescription: string;
  predictedPriority: Priority;
  predictedDuration: Duration;
  confidence: number;
  reasoning: string;
  suggestedTags: string[];
  suggestedDependencies: UUID[];
}

export interface TaskHistory {
  taskId: UUID;
  action: TaskAction;
  timestamp: Timestamp;
  userId: UUID;
  oldValue?: any;
  newValue?: any;
  metadata: Metadata;
}

export enum TaskAction {
  CREATED = 'created',
  UPDATED = 'updated',
  STATUS_CHANGED = 'status_changed',
  ASSIGNED = 'assigned',
  UNASSIGNED = 'unassigned',
  COMMENTED = 'commented',
  ATTACHED = 'attached',
  DELETED = 'deleted',
  RESTORED = 'restored'
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: Priority[];
  assignee?: UUID[];
  creator?: UUID[];
  projectId?: UUID[];
  tags?: string[];
  workType?: WorkType[];
  dateRange?: {
    field: 'createdAt' | 'dueDate' | 'completedDate';
    start?: Timestamp;
    end?: Timestamp;
  };
  search?: string;
}

export interface TaskSort {
  field: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title';
  direction: 'asc' | 'desc';
}