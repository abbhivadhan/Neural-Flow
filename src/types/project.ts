// Project-related type definitions
import { BaseEntity, UUID, Timestamp, Priority, Metadata } from './common';

export interface Project extends BaseEntity {
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  startDate: Timestamp;
  endDate?: Timestamp;
  actualEndDate?: Timestamp;
  budget?: Budget;
  owner: UUID;
  collaborators: ProjectMember[];
  tasks: UUID[];
  resources: Resource[];
  timeline: Timeline;
  milestones: Milestone[];
  tags: string[];
  visibility: ProjectVisibility;
  aiInsights: ProjectInsights;
  settings: ProjectSettings;
  metadata: Metadata;
}

export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived'
}

export interface Budget {
  total: number;
  spent: number;
  currency: string;
  breakdown: BudgetItem[];
}

export interface BudgetItem {
  category: string;
  allocated: number;
  spent: number;
  description?: string;
}

export interface ProjectMember {
  userId: UUID;
  role: ProjectRole;
  permissions: ProjectPermission[];
  joinedAt: Timestamp;
  contribution: number; // 0-1
  lastActive: Timestamp;
}

export enum ProjectRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
  GUEST = 'guest'
}

export enum ProjectPermission {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  MANAGE_MEMBERS = 'manage_members',
  MANAGE_SETTINGS = 'manage_settings',
  EXPORT_DATA = 'export_data'
}

export interface Resource {
  id: UUID;
  name: string;
  type: ResourceType;
  url?: string;
  content?: string;
  size?: number;
  uploadedBy: UUID;
  uploadedAt: Timestamp;
  tags: string[];
  metadata: Metadata;
}

export enum ResourceType {
  DOCUMENT = 'document',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  LINK = 'link',
  CODE = 'code',
  DATASET = 'dataset',
  MODEL = 'model'
}

export interface Timeline {
  phases: ProjectPhase[];
  dependencies: PhaseDependency[];
  criticalPath: UUID[];
  estimatedDuration: number;
  actualDuration?: number;
}

export interface ProjectPhase {
  id: UUID;
  name: string;
  description: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: ProjectStatus;
  tasks: UUID[];
  deliverables: Deliverable[];
  progress: number; // 0-1
}

export interface PhaseDependency {
  fromPhase: UUID;
  toPhase: UUID;
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  lag: number; // in days
}

export interface Deliverable {
  id: UUID;
  name: string;
  description: string;
  dueDate: Timestamp;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  assignee: UUID;
  artifacts: UUID[];
}

export interface Milestone {
  id: UUID;
  name: string;
  description: string;
  dueDate: Timestamp;
  status: 'upcoming' | 'at_risk' | 'completed' | 'missed';
  criteria: string[];
  dependencies: UUID[];
  importance: 'low' | 'medium' | 'high' | 'critical';
}

export enum ProjectVisibility {
  PRIVATE = 'private',
  TEAM = 'team',
  ORGANIZATION = 'organization',
  PUBLIC = 'public'
}

export interface ProjectInsights {
  healthScore: number; // 0-100
  riskFactors: RiskFactor[];
  predictions: ProjectPrediction[];
  recommendations: Recommendation[];
  trends: ProjectTrend[];
  benchmarks: Benchmark[];
  lastAnalyzed: Timestamp;
}

export interface RiskFactor {
  type: RiskType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-1
  impact: string;
  mitigation: string[];
  detectedAt: Timestamp;
}

export enum RiskType {
  SCHEDULE_DELAY = 'schedule_delay',
  BUDGET_OVERRUN = 'budget_overrun',
  RESOURCE_SHORTAGE = 'resource_shortage',
  SCOPE_CREEP = 'scope_creep',
  QUALITY_ISSUES = 'quality_issues',
  TEAM_BURNOUT = 'team_burnout',
  DEPENDENCY_FAILURE = 'dependency_failure'
}

export interface ProjectPrediction {
  type: 'completion_date' | 'budget_usage' | 'success_probability';
  value: any;
  confidence: number;
  reasoning: string;
  factors: string[];
  createdAt: Timestamp;
}

export interface Recommendation {
  id: UUID;
  type: RecommendationType;
  title: string;
  description: string;
  priority: Priority;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  actions: string[];
  deadline?: Timestamp;
  status: 'pending' | 'accepted' | 'rejected' | 'implemented';
}

export enum RecommendationType {
  RESOURCE_ALLOCATION = 'resource_allocation',
  TIMELINE_ADJUSTMENT = 'timeline_adjustment',
  SCOPE_MODIFICATION = 'scope_modification',
  TEAM_OPTIMIZATION = 'team_optimization',
  PROCESS_IMPROVEMENT = 'process_improvement',
  RISK_MITIGATION = 'risk_mitigation'
}

export interface ProjectTrend {
  metric: string;
  values: TrendDataPoint[];
  direction: 'up' | 'down' | 'stable';
  significance: 'low' | 'medium' | 'high';
}

export interface TrendDataPoint {
  timestamp: Timestamp;
  value: number;
  metadata?: Metadata;
}

export interface Benchmark {
  metric: string;
  currentValue: number;
  industryAverage: number;
  topPercentile: number;
  comparison: 'above' | 'at' | 'below';
}

export interface ProjectSettings {
  autoAssignment: boolean;
  notificationRules: NotificationRule[];
  workflowRules: WorkflowRule[];
  integrations: Integration[];
  customFields: CustomField[];
  templates: ProjectTemplate[];
}

export interface NotificationRule {
  id: UUID;
  trigger: string;
  conditions: Condition[];
  recipients: UUID[];
  channels: ('email' | 'push' | 'slack' | 'teams')[];
  enabled: boolean;
}

export interface Condition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface WorkflowRule {
  id: UUID;
  name: string;
  trigger: string;
  conditions: Condition[];
  actions: WorkflowAction[];
  enabled: boolean;
}

export interface WorkflowAction {
  type: 'assign' | 'update_status' | 'create_task' | 'send_notification' | 'update_field';
  parameters: Metadata;
}

export interface Integration {
  id: UUID;
  service: string;
  enabled: boolean;
  configuration: Metadata;
  lastSync?: Timestamp;
  syncStatus: 'success' | 'error' | 'pending';
}

export interface CustomField {
  id: UUID;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multi_select';
  required: boolean;
  options?: string[];
  defaultValue?: any;
}

export interface ProjectTemplate {
  id: UUID;
  name: string;
  description: string;
  phases: ProjectPhase[];
  taskTemplates: UUID[];
  settings: ProjectSettings;
  isPublic: boolean;
  usageCount: number;
}