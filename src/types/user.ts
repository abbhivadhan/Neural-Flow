// User-related type definitions
import { BaseEntity, Timestamp, Theme, Metadata, TimeRange } from './common';

export interface User extends BaseEntity {
  profile: UserProfile;
  preferences: UserPreferences;
  behaviorPattern: BehaviorPattern;
  workingStyle: WorkingStyle;
  settings: UserSettings;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  title?: string;
  department?: string;
  timezone: string;
  locale: string;
  bio?: string;
  skills: Skill[];
  socialLinks: SocialLink[];
}

export interface Skill {
  name: string;
  level: SkillLevel;
  category: string;
  verified: boolean;
  endorsements: number;
}

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export interface SocialLink {
  platform: string;
  url: string;
  verified: boolean;
}

export interface UserPreferences {
  theme: Theme;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  workspace: WorkspacePreferences;
  ai: AIPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  digest: DigestFrequency;
  categories: NotificationCategory[];
}

export enum DigestFrequency {
  NEVER = 'never',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export interface NotificationCategory {
  type: string;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface PrivacyPreferences {
  dataSharing: boolean;
  analytics: boolean;
  personalizedAds: boolean;
  publicProfile: boolean;
  activityTracking: boolean;
}

export interface WorkspacePreferences {
  defaultLayout: LayoutType;
  sidebarPosition: 'left' | 'right';
  density: 'compact' | 'comfortable' | 'spacious';
  animations: boolean;
  shortcuts: KeyboardShortcut[];
}

export enum LayoutType {
  GRID = 'grid',
  LIST = 'list',
  KANBAN = 'kanban',
  TIMELINE = 'timeline',
  CALENDAR = 'calendar'
}

export interface KeyboardShortcut {
  action: string;
  keys: string[];
  enabled: boolean;
}

export interface AIPreferences {
  enablePredictions: boolean;
  enableContentGeneration: boolean;
  enableVoiceCommands: boolean;
  enableGestureControl: boolean;
  modelComplexity: 'simple' | 'balanced' | 'advanced';
  privacyMode: boolean;
}

export interface BehaviorPattern {
  taskSequences: TaskSequence[];
  timePatterns: TimePattern[];
  toolUsage: ToolUsagePattern[];
  productivityMetrics: ProductivityMetric[];
  workingHours: WorkingHours;
  breakPatterns: BreakPattern[];
}

export interface TaskSequence {
  sequence: string[];
  frequency: number;
  confidence: number;
  lastOccurred: Timestamp;
}

export interface TimePattern {
  dayOfWeek: number; // 0-6, Sunday = 0
  hour: number; // 0-23
  activity: string;
  frequency: number;
  productivity: number; // 0-1
}

export interface ToolUsagePattern {
  toolId: string;
  usageFrequency: number;
  averageSessionDuration: Duration;
  preferredTimeSlots: TimeRange[];
  efficiency: number; // 0-1
}

export interface ProductivityMetric {
  date: Timestamp;
  tasksCompleted: number;
  focusTime: Duration;
  distractionCount: number;
  energyLevel: number; // 1-10
  satisfaction: number; // 1-10
}

export interface WorkingHours {
  monday: TimeRange[];
  tuesday: TimeRange[];
  wednesday: TimeRange[];
  thursday: TimeRange[];
  friday: TimeRange[];
  saturday: TimeRange[];
  sunday: TimeRange[];
}

export interface BreakPattern {
  type: 'short' | 'long' | 'lunch';
  duration: Duration;
  frequency: number; // per day
  preferredTimes: number[]; // hours of day
}

export interface WorkingStyle {
  focusPreference: 'deep' | 'shallow' | 'mixed';
  collaborationStyle: 'independent' | 'collaborative' | 'balanced';
  communicationStyle: 'direct' | 'detailed' | 'visual';
  decisionMaking: 'quick' | 'deliberate' | 'consultative';
  stressResponse: 'proactive' | 'reactive' | 'adaptive';
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
}

export interface UserSettings {
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;
  autoSave: boolean;
  offlineMode: boolean;
  dataSync: boolean;
  backupFrequency: 'never' | 'daily' | 'weekly' | 'monthly';
  metadata: Metadata;
}