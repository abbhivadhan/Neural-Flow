// Collaboration-related Zod validation schemas
import { z } from 'zod';
import { 
  BaseEntitySchema, 
  UUIDSchema, 
  TimestampSchema, 
  MetadataSchema
} from './common';

// Enums
export const TeamStatusSchema = z.enum(['active', 'inactive', 'archived']);
export const TeamRoleSchema = z.enum(['leader', 'senior', 'member', 'junior', 'intern', 'consultant']);
export const TeamPermissionSchema = z.enum(['view_team', 'edit_team', 'manage_members', 'create_projects', 'manage_projects', 'view_analytics', 'export_data']);
export const MemberStatusSchema = z.enum(['active', 'away', 'busy', 'offline', 'on_leave']);
export const ExpertiseLevelSchema = z.enum(['novice', 'intermediate', 'advanced', 'expert', 'thought_leader']);
export const ChannelTypeSchema = z.enum(['general', 'project', 'team', 'announcement', 'random', 'help', 'private']);
export const ChannelStatusSchema = z.enum(['active', 'archived', 'muted']);
export const SessionTypeSchema = z.enum(['meeting', 'brainstorming', 'code_review', 'pair_programming', 'workshop', 'presentation', 'standup']);
export const SessionStatusSchema = z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed']);

// Core schemas
export const ExpertiseAreaSchema = z.object({
  domain: z.string().min(1).max(100),
  level: ExpertiseLevelSchema,
  verified: z.boolean(),
  endorsements: z.number().min(0),
  lastUsed: TimestampSchema,
});

export const ContributionMetricsSchema = z.object({
  tasksCompleted: z.number().min(0),
  codeCommits: z.number().min(0),
  documentsCreated: z.number().min(0),
  meetingsAttended: z.number().min(0),
  helpProvided: z.number().min(0),
  knowledgeShared: z.number().min(0),
  lastContribution: TimestampSchema,
});

export const TeamMemberSchema = z.object({
  userId: UUIDSchema,
  role: TeamRoleSchema,
  permissions: z.array(TeamPermissionSchema),
  joinedAt: TimestampSchema,
  status: MemberStatusSchema,
  contribution: ContributionMetricsSchema,
  expertise: z.array(ExpertiseAreaSchema),
});

export const CommunicationRuleSchema = z.object({
  type: z.enum(['response_time', 'availability', 'escalation', 'notification']),
  description: z.string().min(1).max(500),
  parameters: MetadataSchema,
  enabled: z.boolean(),
});

export const WorkingHoursPolicySchema = z.object({
  timezone: z.string().min(1),
  coreHours: z.object({
    start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  }),
  flexibleHours: z.boolean(),
  overlapRequirement: z.number().min(0).max(24),
});

export const MeetingPreferencesSchema = z.object({
  defaultDuration: z.number().min(15).max(480),
  bufferTime: z.number().min(0).max(60),
  maxDailyMeetings: z.number().min(1).max(20),
  preferredTimes: z.array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)),
  blackoutTimes: z.array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)),
  recurringMeetingLimit: z.number().min(0).max(10),
});

export const ToolIntegrationSchema = z.object({
  toolName: z.string().min(1).max(100),
  enabled: z.boolean(),
  configuration: MetadataSchema,
  permissions: z.array(z.string()),
  lastSync: TimestampSchema,
});

export const TeamSettingsSchema = z.object({
  visibility: z.enum(['private', 'internal', 'public']),
  joinPolicy: z.enum(['open', 'approval', 'invitation']),
  communicationRules: z.array(CommunicationRuleSchema),
  workingHours: WorkingHoursPolicySchema,
  meetingPreferences: MeetingPreferencesSchema,
  collaborationTools: z.array(ToolIntegrationSchema),
});

export const ProductivityMetricsSchema = z.object({
  tasksCompletedPerWeek: z.number().min(0),
  averageTaskCompletionTime: z.number().min(0),
  velocityTrend: z.enum(['increasing', 'stable', 'decreasing']),
  burndownRate: z.number(),
  cycleTime: z.number().min(0),
  throughput: z.number().min(0),
});

export const CollaborationMetricsSchema = z.object({
  crossFunctionalProjects: z.number().min(0),
  knowledgeSharingEvents: z.number().min(0),
  peerReviews: z.number().min(0),
  mentoringSessions: z.number().min(0),
  collaborationScore: z.number().min(0).max(100),
  networkDensity: z.number().min(0).max(1),
});

export const CommunicationMetricsSchema = z.object({
  messagesPerDay: z.number().min(0),
  responseTime: z.number().min(0),
  meetingEfficiency: z.number().min(0).max(1),
  documentationQuality: z.number().min(0).max(1),
  clarificationRequests: z.number().min(0),
  communicationClarity: z.number().min(0).max(1),
});

export const SatisfactionMetricsSchema = z.object({
  teamSatisfaction: z.number().min(1).max(10),
  workLifeBalance: z.number().min(1).max(10),
  growthOpportunities: z.number().min(1).max(10),
  toolSatisfaction: z.number().min(1).max(10),
  leadershipRating: z.number().min(1).max(10),
  overallMorale: z.number().min(1).max(10),
});

export const PerformanceMetricsSchema = z.object({
  goalAchievement: z.number().min(0).max(1),
  qualityScore: z.number().min(0).max(100),
  innovationIndex: z.number().min(0).max(100),
  riskMitigation: z.number().min(0).max(1),
  adaptability: z.number().min(0).max(1),
  efficiency: z.number().min(0).max(1),
});

export const TeamMetricsSchema = z.object({
  productivity: ProductivityMetricsSchema,
  collaboration: CollaborationMetricsSchema,
  communication: CommunicationMetricsSchema,
  satisfaction: SatisfactionMetricsSchema,
  performance: PerformanceMetricsSchema,
  lastCalculated: TimestampSchema,
});

export const TeamSchema = BaseEntitySchema.extend({
  name: z.string().min(1).max(200),
  description: z.string().max(1000),
  members: z.array(TeamMemberSchema),
  projects: z.array(UUIDSchema),
  settings: TeamSettingsSchema,
  metrics: TeamMetricsSchema,
  communication: z.array(z.any()), // CommunicationChannel references
  status: TeamStatusSchema,
});

export const ReactionSchema = z.object({
  emoji: z.string().min(1).max(10),
  users: z.array(UUIDSchema),
  timestamp: TimestampSchema,
});

export const MessageAttachmentSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  type: z.string().min(1).max(50),
  size: z.number().min(0),
  url: z.string().url(),
  thumbnail: z.string().url().optional(),
  metadata: MetadataSchema,
});

export const MessageMetadataSchema = z.object({
  edited: z.boolean(),
  pinned: z.boolean(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  tags: z.array(z.string().min(1).max(50)),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  topics: z.array(z.string().min(1).max(100)),
  language: z.string().min(2).max(10),
});

export const MessageSchema = z.object({
  id: UUIDSchema,
  content: z.string().min(1).max(4000),
  author: UUIDSchema,
  channelId: UUIDSchema,
  timestamp: TimestampSchema,
  editedAt: TimestampSchema.optional(),
  replyTo: UUIDSchema.optional(),
  mentions: z.array(UUIDSchema),
  reactions: z.array(ReactionSchema),
  attachments: z.array(MessageAttachmentSchema),
  metadata: MessageMetadataSchema,
  aiGenerated: z.boolean(),
});

export const RetentionPolicySchema = z.object({
  enabled: z.boolean(),
  duration: z.number().min(1),
  archiveOldMessages: z.boolean(),
});

export const ModerationRuleSchema = z.object({
  type: z.enum(['spam', 'profanity', 'off_topic', 'file_type', 'size_limit']),
  action: z.enum(['warn', 'delete', 'moderate', 'ban']),
  parameters: MetadataSchema,
});

export const ChannelSettingsSchema = z.object({
  description: z.string().max(500),
  isPrivate: z.boolean(),
  allowThreads: z.boolean(),
  allowReactions: z.boolean(),
  allowFileSharing: z.boolean(),
  retentionPolicy: RetentionPolicySchema,
  moderationRules: z.array(ModerationRuleSchema),
});

export const SentimentTrendSchema = z.object({
  date: TimestampSchema,
  positive: z.number().min(0).max(1),
  neutral: z.number().min(0).max(1),
  negative: z.number().min(0).max(1),
});

export const ActivityPatternSchema = z.object({
  hour: z.number().min(0).max(23),
  messageCount: z.number().min(0),
  activeUsers: z.number().min(0),
});

export const ChannelAnalyticsSchema = z.object({
  messageCount: z.number().min(0),
  activeMembers: z.number().min(0),
  averageResponseTime: z.number().min(0),
  engagementRate: z.number().min(0).max(1),
  topContributors: z.array(UUIDSchema),
  popularTopics: z.array(z.string()),
  sentimentTrend: z.array(SentimentTrendSchema),
  activityPattern: z.array(ActivityPatternSchema),
});

export const CommunicationChannelSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(100),
  type: ChannelTypeSchema,
  members: z.array(UUIDSchema),
  settings: ChannelSettingsSchema,
  messages: z.array(MessageSchema),
  analytics: ChannelAnalyticsSchema,
  status: ChannelStatusSchema,
});

// Validation functions
export const validateTeam = (data: unknown) => TeamSchema.safeParse(data);
export const validateTeamMember = (data: unknown) => TeamMemberSchema.safeParse(data);
export const validateMessage = (data: unknown) => MessageSchema.safeParse(data);
export const validateCommunicationChannel = (data: unknown) => CommunicationChannelSchema.safeParse(data);

// Partial schemas for updates
export const TeamUpdateSchema = TeamSchema.partial();
export const MessageUpdateSchema = MessageSchema.partial();