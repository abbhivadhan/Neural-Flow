// User-related Zod validation schemas
import { z } from 'zod';
import { 
  BaseEntitySchema, 
  TimestampSchema, 
  ThemeSchema, 
  MetadataSchema,
  validateEmail,
  validateURL,
  TimeRangeSchema,
  DurationSchema
} from './common';

// Enums
export const SkillLevelSchema = z.enum(['beginner', 'intermediate', 'advanced', 'expert']);
export const DigestFrequencySchema = z.enum(['never', 'daily', 'weekly', 'monthly']);
export const LayoutTypeSchema = z.enum(['grid', 'list', 'kanban', 'timeline', 'calendar']);

// Core schemas
export const SkillSchema = z.object({
  name: z.string().min(1).max(100),
  level: SkillLevelSchema,
  category: z.string().min(1).max(50),
  verified: z.boolean(),
  endorsements: z.number().min(0),
});

export const SocialLinkSchema = z.object({
  platform: z.string().min(1).max(50),
  url: validateURL,
  verified: z.boolean(),
});

export const UserProfileSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: validateEmail,
  avatar: validateURL.optional(),
  title: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  timezone: z.string().min(1),
  locale: z.string().min(2).max(10),
  bio: z.string().max(500).optional(),
  skills: z.array(SkillSchema),
  socialLinks: z.array(SocialLinkSchema),
});

export const NotificationCategorySchema = z.object({
  type: z.string().min(1),
  enabled: z.boolean(),
  priority: z.enum(['low', 'medium', 'high']),
});

export const NotificationPreferencesSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
  inApp: z.boolean(),
  digest: DigestFrequencySchema,
  categories: z.array(NotificationCategorySchema),
});

export const PrivacyPreferencesSchema = z.object({
  dataSharing: z.boolean(),
  analytics: z.boolean(),
  personalizedAds: z.boolean(),
  publicProfile: z.boolean(),
  activityTracking: z.boolean(),
});

export const KeyboardShortcutSchema = z.object({
  action: z.string().min(1),
  keys: z.array(z.string().min(1)),
  enabled: z.boolean(),
});

export const WorkspacePreferencesSchema = z.object({
  defaultLayout: LayoutTypeSchema,
  sidebarPosition: z.enum(['left', 'right']),
  density: z.enum(['compact', 'comfortable', 'spacious']),
  animations: z.boolean(),
  shortcuts: z.array(KeyboardShortcutSchema),
});

export const AIPreferencesSchema = z.object({
  enablePredictions: z.boolean(),
  enableContentGeneration: z.boolean(),
  enableVoiceCommands: z.boolean(),
  enableGestureControl: z.boolean(),
  modelComplexity: z.enum(['simple', 'balanced', 'advanced']),
  privacyMode: z.boolean(),
});

export const UserPreferencesSchema = z.object({
  theme: ThemeSchema,
  notifications: NotificationPreferencesSchema,
  privacy: PrivacyPreferencesSchema,
  workspace: WorkspacePreferencesSchema,
  ai: AIPreferencesSchema,
});

export const TaskSequenceSchema = z.object({
  sequence: z.array(z.string()),
  frequency: z.number().min(0),
  confidence: z.number().min(0).max(1),
  lastOccurred: TimestampSchema,
});

export const TimePatternSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  hour: z.number().min(0).max(23),
  activity: z.string().min(1),
  frequency: z.number().min(0),
  productivity: z.number().min(0).max(1),
});

export const ToolUsagePatternSchema = z.object({
  toolId: z.string().min(1),
  usageFrequency: z.number().min(0),
  averageSessionDuration: DurationSchema,
  preferredTimeSlots: z.array(TimeRangeSchema),
  efficiency: z.number().min(0).max(1),
});

export const ProductivityMetricSchema = z.object({
  date: TimestampSchema,
  tasksCompleted: z.number().min(0),
  focusTime: DurationSchema,
  distractionCount: z.number().min(0),
  energyLevel: z.number().min(1).max(10),
  satisfaction: z.number().min(1).max(10),
});

export const WorkingHoursSchema = z.object({
  monday: z.array(TimeRangeSchema),
  tuesday: z.array(TimeRangeSchema),
  wednesday: z.array(TimeRangeSchema),
  thursday: z.array(TimeRangeSchema),
  friday: z.array(TimeRangeSchema),
  saturday: z.array(TimeRangeSchema),
  sunday: z.array(TimeRangeSchema),
});

export const BreakPatternSchema = z.object({
  type: z.enum(['short', 'long', 'lunch']),
  duration: DurationSchema,
  frequency: z.number().min(0),
  preferredTimes: z.array(z.number().min(0).max(23)),
});

export const BehaviorPatternSchema = z.object({
  taskSequences: z.array(TaskSequenceSchema),
  timePatterns: z.array(TimePatternSchema),
  toolUsage: z.array(ToolUsagePatternSchema),
  productivityMetrics: z.array(ProductivityMetricSchema),
  workingHours: WorkingHoursSchema,
  breakPatterns: z.array(BreakPatternSchema),
});

export const WorkingStyleSchema = z.object({
  focusPreference: z.enum(['deep', 'shallow', 'mixed']),
  collaborationStyle: z.enum(['independent', 'collaborative', 'balanced']),
  communicationStyle: z.enum(['direct', 'detailed', 'visual']),
  decisionMaking: z.enum(['quick', 'deliberate', 'consultative']),
  stressResponse: z.enum(['proactive', 'reactive', 'adaptive']),
  learningStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'mixed']),
});

export const UserSettingsSchema = z.object({
  language: z.string().min(2).max(10),
  dateFormat: z.string().min(1),
  timeFormat: z.enum(['12h', '24h']),
  currency: z.string().length(3),
  autoSave: z.boolean(),
  offlineMode: z.boolean(),
  dataSync: z.boolean(),
  backupFrequency: z.enum(['never', 'daily', 'weekly', 'monthly']),
  metadata: MetadataSchema,
});

export const UserSchema = BaseEntitySchema.extend({
  profile: UserProfileSchema,
  preferences: UserPreferencesSchema,
  behaviorPattern: BehaviorPatternSchema,
  workingStyle: WorkingStyleSchema,
  settings: UserSettingsSchema,
});

// Validation functions
export const validateUser = (data: unknown) => UserSchema.safeParse(data);
export const validateUserProfile = (data: unknown) => UserProfileSchema.safeParse(data);
export const validateUserPreferences = (data: unknown) => UserPreferencesSchema.safeParse(data);

// Partial schemas for updates
export const UserUpdateSchema = UserSchema.partial();
export const UserProfileUpdateSchema = UserProfileSchema.partial();
export const UserPreferencesUpdateSchema = UserPreferencesSchema.partial();