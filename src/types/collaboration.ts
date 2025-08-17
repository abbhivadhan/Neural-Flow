// Collaboration-related type definitions
import { BaseEntity, UUID, Timestamp, Metadata } from './common';

export interface Team extends BaseEntity {
  name: string;
  description: string;
  members: TeamMember[];
  projects: UUID[];
  settings: TeamSettings;
  metrics: TeamMetrics;
  communication: CommunicationChannel[];
  status: TeamStatus;
}

export enum TeamStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived'
}

export interface TeamMember {
  userId: UUID;
  role: TeamRole;
  permissions: TeamPermission[];
  joinedAt: Timestamp;
  status: MemberStatus;
  contribution: ContributionMetrics;
  expertise: ExpertiseArea[];
}

export enum TeamRole {
  LEADER = 'leader',
  SENIOR = 'senior',
  MEMBER = 'member',
  JUNIOR = 'junior',
  INTERN = 'intern',
  CONSULTANT = 'consultant'
}

export enum TeamPermission {
  VIEW_TEAM = 'view_team',
  EDIT_TEAM = 'edit_team',
  MANAGE_MEMBERS = 'manage_members',
  CREATE_PROJECTS = 'create_projects',
  MANAGE_PROJECTS = 'manage_projects',
  VIEW_ANALYTICS = 'view_analytics',
  EXPORT_DATA = 'export_data'
}

export enum MemberStatus {
  ACTIVE = 'active',
  AWAY = 'away',
  BUSY = 'busy',
  OFFLINE = 'offline',
  ON_LEAVE = 'on_leave'
}

export interface ContributionMetrics {
  tasksCompleted: number;
  codeCommits: number;
  documentsCreated: number;
  meetingsAttended: number;
  helpProvided: number;
  knowledgeShared: number;
  lastContribution: Timestamp;
}

export interface ExpertiseArea {
  domain: string;
  level: ExpertiseLevel;
  verified: boolean;
  endorsements: number;
  lastUsed: Timestamp;
}

export enum ExpertiseLevel {
  NOVICE = 'novice',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
  THOUGHT_LEADER = 'thought_leader'
}

export interface TeamSettings {
  visibility: 'private' | 'internal' | 'public';
  joinPolicy: 'open' | 'approval' | 'invitation';
  communicationRules: CommunicationRule[];
  workingHours: WorkingHoursPolicy;
  meetingPreferences: MeetingPreferences;
  collaborationTools: ToolIntegration[];
}

export interface CommunicationRule {
  type: 'response_time' | 'availability' | 'escalation' | 'notification';
  description: string;
  parameters: Metadata;
  enabled: boolean;
}

export interface WorkingHoursPolicy {
  timezone: string;
  coreHours: {
    start: string; // HH:MM
    end: string; // HH:MM
  };
  flexibleHours: boolean;
  overlapRequirement: number; // minimum hours of overlap
}

export interface MeetingPreferences {
  defaultDuration: number; // minutes
  bufferTime: number; // minutes
  maxDailyMeetings: number;
  preferredTimes: string[];
  blackoutTimes: string[];
  recurringMeetingLimit: number;
}

export interface ToolIntegration {
  toolName: string;
  enabled: boolean;
  configuration: Metadata;
  permissions: string[];
  lastSync: Timestamp;
}

export interface TeamMetrics {
  productivity: ProductivityMetrics;
  collaboration: CollaborationMetrics;
  communication: CommunicationMetrics;
  satisfaction: SatisfactionMetrics;
  performance: PerformanceMetrics;
  lastCalculated: Timestamp;
}

export interface ProductivityMetrics {
  tasksCompletedPerWeek: number;
  averageTaskCompletionTime: number;
  velocityTrend: 'increasing' | 'stable' | 'decreasing';
  burndownRate: number;
  cycleTime: number;
  throughput: number;
}

export interface CollaborationMetrics {
  crossFunctionalProjects: number;
  knowledgeSharingEvents: number;
  peerReviews: number;
  mentoringSessions: number;
  collaborationScore: number; // 0-100
  networkDensity: number; // 0-1
}

export interface CommunicationMetrics {
  messagesPerDay: number;
  responseTime: number; // minutes
  meetingEfficiency: number; // 0-1
  documentationQuality: number; // 0-1
  clarificationRequests: number;
  communicationClarity: number; // 0-1
}

export interface SatisfactionMetrics {
  teamSatisfaction: number; // 1-10
  workLifeBalance: number; // 1-10
  growthOpportunities: number; // 1-10
  toolSatisfaction: number; // 1-10
  leadershipRating: number; // 1-10
  overallMorale: number; // 1-10
}

export interface PerformanceMetrics {
  goalAchievement: number; // 0-1
  qualityScore: number; // 0-100
  innovationIndex: number; // 0-100
  riskMitigation: number; // 0-1
  adaptability: number; // 0-1
  efficiency: number; // 0-1
}

export interface CommunicationChannel {
  id: UUID;
  name: string;
  type: ChannelType;
  members: UUID[];
  settings: ChannelSettings;
  messages: Message[];
  analytics: ChannelAnalytics;
  status: ChannelStatus;
}

export enum ChannelType {
  GENERAL = 'general',
  PROJECT = 'project',
  TEAM = 'team',
  ANNOUNCEMENT = 'announcement',
  RANDOM = 'random',
  HELP = 'help',
  PRIVATE = 'private'
}

export enum ChannelStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  MUTED = 'muted'
}

export interface ChannelSettings {
  description: string;
  isPrivate: boolean;
  allowThreads: boolean;
  allowReactions: boolean;
  allowFileSharing: boolean;
  retentionPolicy: RetentionPolicy;
  moderationRules: ModerationRule[];
}

export interface RetentionPolicy {
  enabled: boolean;
  duration: number; // days
  archiveOldMessages: boolean;
}

export interface ModerationRule {
  type: 'spam' | 'profanity' | 'off_topic' | 'file_type' | 'size_limit';
  action: 'warn' | 'delete' | 'moderate' | 'ban';
  parameters: Metadata;
}

export interface Message {
  id: UUID;
  content: string;
  author: UUID;
  channelId: UUID;
  timestamp: Timestamp;
  editedAt?: Timestamp;
  replyTo?: UUID;
  mentions: UUID[];
  reactions: Reaction[];
  attachments: MessageAttachment[];
  metadata: MessageMetadata;
  aiGenerated: boolean;
}

export interface Reaction {
  emoji: string;
  users: UUID[];
  timestamp: Timestamp;
}

export interface MessageAttachment {
  id: UUID;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnail?: string;
  metadata: Metadata;
}

export interface MessageMetadata {
  edited: boolean;
  pinned: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[];
  language: string;
}

export interface ChannelAnalytics {
  messageCount: number;
  activeMembers: number;
  averageResponseTime: number;
  engagementRate: number;
  topContributors: UUID[];
  popularTopics: string[];
  sentimentTrend: SentimentTrend[];
  activityPattern: ActivityPattern[];
}

export interface SentimentTrend {
  date: Timestamp;
  positive: number;
  neutral: number;
  negative: number;
}

export interface ActivityPattern {
  hour: number;
  messageCount: number;
  activeUsers: number;
}

export interface CollaborationSession {
  id: UUID;
  type: SessionType;
  participants: UUID[];
  startTime: Timestamp;
  endTime?: Timestamp;
  status: SessionStatus;
  resources: SessionResource[];
  outcomes: SessionOutcome[];
  recording?: SessionRecording;
  analytics: SessionAnalytics;
}

export enum SessionType {
  MEETING = 'meeting',
  BRAINSTORMING = 'brainstorming',
  CODE_REVIEW = 'code_review',
  PAIR_PROGRAMMING = 'pair_programming',
  WORKSHOP = 'workshop',
  PRESENTATION = 'presentation',
  STANDUP = 'standup'
}

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed'
}

export interface SessionResource {
  id: UUID;
  type: 'document' | 'screen_share' | 'whiteboard' | 'code' | 'presentation';
  name: string;
  url?: string;
  content?: any;
  sharedBy: UUID;
  timestamp: Timestamp;
}

export interface SessionOutcome {
  type: 'decision' | 'action_item' | 'insight' | 'question' | 'blocker';
  description: string;
  assignee?: UUID;
  dueDate?: Timestamp;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'completed';
}

export interface SessionRecording {
  id: UUID;
  url: string;
  duration: number;
  transcript?: string;
  highlights: RecordingHighlight[];
  accessibility: AccessibilityFeatures;
}

export interface RecordingHighlight {
  timestamp: number;
  duration: number;
  type: 'decision' | 'action' | 'insight' | 'question';
  description: string;
  participants: UUID[];
}

export interface AccessibilityFeatures {
  captions: boolean;
  transcript: boolean;
  audioDescription: boolean;
  signLanguage: boolean;
}

export interface SessionAnalytics {
  participationRate: { [userId: string]: number };
  speakingTime: { [userId: string]: number };
  interactionCount: number;
  engagementScore: number;
  effectivenessRating: number;
  followUpActions: number;
}