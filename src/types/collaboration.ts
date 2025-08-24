export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  expertise: string[];
  availability: 'available' | 'busy' | 'away' | 'offline';
  currentProject?: string;
  skills: Skill[];
  communicationStyle: CommunicationStyle;
}

export interface Skill {
  name: string;
  level: number; // 1-10
  category: string;
  verified: boolean;
}

export interface CommunicationStyle {
  responseTime: number; // average in minutes
  preferredChannels: string[];
  workingHours: TimeRange;
  timezone: string;
}

export interface TimeRange {
  start: string; // HH:MM format
  end: string;
}

export interface CollaborationSession {
  id: string;
  projectId: string;
  participants: TeamMember[];
  startTime: Date;
  endTime?: Date;
  type: 'editing' | 'meeting' | 'review' | 'brainstorm';
  status: 'active' | 'paused' | 'ended';
}

export interface Operation {
  id: string;
  type: 'insert' | 'delete' | 'retain' | 'format';
  position: number;
  content?: string;
  length?: number;
  attributes?: Record<string, any>;
  userId: string;
  timestamp: Date;
  sessionId: string;
}

export interface OperationResult {
  operation: Operation;
  transformed: boolean;
  conflicts: Conflict[];
}

export interface Conflict {
  id: string;
  operations: Operation[];
  type: 'concurrent_edit' | 'format_conflict' | 'deletion_conflict';
  severity: 'low' | 'medium' | 'high';
  resolution?: ConflictResolution;
}

export interface ConflictResolution {
  strategy: 'merge' | 'override' | 'manual' | 'ai_resolve';
  chosenOperation?: Operation;
  mergedResult?: string;
  confidence: number;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'code' | 'file' | 'system';
  metadata?: Record<string, any>;
  sentiment?: 'positive' | 'neutral' | 'negative';
  intent?: MessageIntent;
}

export interface MessageIntent {
  type: 'question' | 'request' | 'information' | 'decision' | 'feedback';
  confidence: number;
  entities: string[];
  actionItems?: string[];
}

export interface TeamInsights {
  communicationPatterns: CommunicationPattern[];
  collaborationEfficiency: number;
  expertiseGaps: string[];
  recommendedConnections: TeamMemberConnection[];
  productivityTrends: ProductivityTrend[];
}

export interface CommunicationPattern {
  pattern: string;
  frequency: number;
  participants: string[];
  effectiveness: number;
}

export interface TeamMemberConnection {
  member1: string;
  member2: string;
  reason: string;
  confidence: number;
  potentialBenefit: string;
}

export interface ProductivityTrend {
  metric: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  value: number;
  timeframe: string;
}

export interface WebSocketMessage {
  type: 'operation' | 'cursor' | 'presence' | 'chat' | 'system';
  payload: any;
  sessionId: string;
  userId: string;
  timestamp: Date;
}

export interface CursorPosition {
  userId: string;
  position: number;
  selection?: {
    start: number;
    end: number;
  };
  color: string;
}

export interface PresenceInfo {
  userId: string;
  status: 'active' | 'idle' | 'away';
  lastSeen: Date;
  currentDocument?: string;
  cursor?: CursorPosition;
}