// Core entity types
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  workingHours: {
    start: string;
    end: string;
  };
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  privacy: {
    analytics: boolean;
    personalization: boolean;
    dataSharing: boolean;
  };
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'archived' | 'on-hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  color?: string;
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  collaborators: string[];
  progress: number; // 0-100
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  projectId?: string;
  assigneeId?: string;
  tags: string[];
  estimatedDuration?: number; // in minutes
  actualDuration?: number; // in minutes
  deadline?: Date;
  dependencies: string[]; // Task IDs
  subtasks: string[]; // Task IDs
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// AI and ML types
export interface AIModel {
  id: string;
  name: string;
  type: 'prediction' | 'generation' | 'classification' | 'recommendation';
  version: string;
  accuracy: number;
  lastTrained: Date;
  isActive: boolean;
}

export interface Prediction {
  id: string;
  modelId: string;
  input: any;
  output: any;
  confidence: number;
  createdAt: Date;
}

// Workspace types
export interface WorkspaceLayout {
  id: string;
  name: string;
  components: LayoutComponent[];
  isDefault: boolean;
  userId: string;
}

export interface LayoutComponent {
  id: string;
  type: 'task-list' | 'calendar' | 'notes' | 'analytics' | 'chat';
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, any>;
}

// Analytics types
export interface ProductivityMetric {
  id: string;
  userId: string;
  date: Date;
  tasksCompleted: number;
  focusTime: number; // in minutes
  breakTime: number; // in minutes
  collaborationTime: number; // in minutes
  efficiency: number; // 0-1
  mood: number; // 1-5
}

export interface BehaviorPattern {
  id: string;
  userId: string;
  type: 'productivity' | 'focus' | 'break' | 'collaboration';
  pattern: Record<string, any>;
  confidence: number;
  detectedAt: Date;
}

// Integration types
export interface Integration {
  id: string;
  name: string;
  type: 'calendar' | 'email' | 'chat' | 'storage' | 'project-management';
  status: 'connected' | 'disconnected' | 'error';
  config: Record<string, any>;
  lastSync: Date;
}

// Search types
export interface SearchResult {
  id: string;
  type: 'task' | 'project' | 'document' | 'user';
  title: string;
  description?: string;
  relevance: number;
  highlights: string[];
  metadata: Record<string, any>;
}

export interface SearchQuery {
  query: string;
  filters: Record<string, any>;
  sort: 'relevance' | 'date' | 'priority';
  limit: number;
  offset: number;
}

// Collaboration types
export interface CollaborationSession {
  id: string;
  projectId: string;
  participants: string[];
  startTime: Date;
  endTime?: Date;
  type: 'meeting' | 'pair-programming' | 'review' | 'brainstorming';
}

// Error types
export interface AppError {
  id: string;
  message: string;
  code?: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// API types
export interface APIResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Event types
export interface AppEvent {
  type: string;
  payload: any;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  actions?: NotificationAction[];
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
}

export interface NotificationAction {
  id: string;
  label: string;
  action: string;
  style?: 'primary' | 'secondary' | 'danger';
}

// Theme types
export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  fonts: {
    primary: string;
    secondary: string;
    mono: string;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
}