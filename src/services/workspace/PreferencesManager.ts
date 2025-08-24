// User preferences and pattern storage system
import { storage, StorageKeys } from '../../utils/storage';
import { 
  UserPreferences, 
  WorkspacePreferences, 
  BehaviorPattern, 
  AIPreferences,
  NotificationPreferences
} from '../../types/user';
import { 
  UserPreferencesSchema
} from '../../schemas/user';
import { WorkContext } from './ContextAnalyzer';
// import { LayoutConfiguration } from './LayoutOptimizer';

export interface PreferencesUpdate {
  category: 'workspace' | 'ai' | 'notifications' | 'privacy' | 'behavior';
  changes: Partial<UserPreferences>;
  reason: string;
  confidence: number;
}

export interface PatternInsight {
  type: 'preference' | 'behavior' | 'performance' | 'efficiency';
  insight: string;
  recommendation: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
}

export interface PreferencesAnalysis {
  currentPreferences: UserPreferences;
  suggestedUpdates: PreferencesUpdate[];
  patterns: PatternInsight[];
  conflicts: PreferenceConflict[];
}

export interface PreferenceConflict {
  type: 'setting_conflict' | 'behavior_mismatch' | 'context_incompatibility';
  description: string;
  severity: 'low' | 'medium' | 'high';
  resolution: string;
}

export interface PreferenceLearning {
  setting: string;
  oldValue: any;
  newValue: any;
  context: WorkContext['type'];
  frequency: number;
  lastChanged: number;
  confidence: number;
}

class PreferencesManager {
  private currentPreferences: UserPreferences | null = null;
  private preferenceLearnings: PreferenceLearning[] = [];
  private readonly LEARNING_THRESHOLD = 3; // Minimum frequency to suggest changes
  private readonly LEARNING_CONFIDENCE_THRESHOLD = 0.7;
  private readonly MAX_LEARNING_HISTORY = 1000;

  constructor() {
    this.loadStoredPreferences();
    this.loadPreferenceLearnings();
  }

  /**
   * Get current user preferences
   */
  async getCurrentPreferences(): Promise<UserPreferences> {
    if (!this.currentPreferences) {
      await this.loadStoredPreferences();
    }
    
    return this.currentPreferences || this.getDefaultPreferences();
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    updates: Partial<UserPreferences>,
    context?: WorkContext,
    reason?: string
  ): Promise<boolean> {
    try {
      const currentPrefs = await this.getCurrentPreferences();
      const updatedPrefs = { ...currentPrefs, ...updates };

      // Validate the updated preferences
      const validation = UserPreferencesSchema.safeParse(updatedPrefs);
      if (!validation.success) {
        console.error('Invalid preferences update:', validation.error);
        return false;
      }

      // Store the updated preferences
      const result = await storage.set(StorageKeys.USER_PREFERENCES, updatedPrefs, {
        validate: true,
        schema: UserPreferencesSchema
      });

      if (result.success) {
        this.currentPreferences = updatedPrefs;
        
        // Record the learning if context is provided
        if (context && reason) {
          this.recordPreferenceLearning(updates, context, reason);
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error updating preferences:', error);
      return false;
    }
  }

  /**
   * Analyze preferences and suggest improvements
   */
  async analyzePreferences(
    behaviorPattern: BehaviorPattern,
    contextHistory: Array<{ context: WorkContext; timestamp: number }>
  ): Promise<PreferencesAnalysis> {
    const currentPreferences = await this.getCurrentPreferences();
    const suggestedUpdates = this.generatePreferenceUpdates(behaviorPattern, contextHistory);
    const patterns = this.analyzePatterns(behaviorPattern, currentPreferences);
    const conflicts = this.detectConflicts(currentPreferences, behaviorPattern);

    return {
      currentPreferences,
      suggestedUpdates,
      patterns,
      conflicts
    };
  }

  /**
   * Learn from user behavior and adapt preferences
   */
  async learnFromBehavior(
    behaviorPattern: BehaviorPattern,
    context: WorkContext
  ): Promise<PreferencesUpdate[]> {
    const updates: PreferencesUpdate[] = [];
    const currentPrefs = await this.getCurrentPreferences();

    // Learn workspace preferences from behavior
    const workspaceUpdates = this.learnWorkspacePreferences(behaviorPattern, context, currentPrefs.workspace);
    if (workspaceUpdates) {
      updates.push(workspaceUpdates);
    }

    // Learn AI preferences from usage patterns
    const aiUpdates = this.learnAIPreferences(behaviorPattern, context, currentPrefs.ai);
    if (aiUpdates) {
      updates.push(aiUpdates);
    }

    // Learn notification preferences from interaction patterns
    const notificationUpdates = this.learnNotificationPreferences(behaviorPattern, currentPrefs.notifications);
    if (notificationUpdates) {
      updates.push(notificationUpdates);
    }

    return updates;
  }

  /**
   * Apply learned preferences automatically
   */
  async applyLearnings(maxUpdates: number = 3): Promise<number> {
    const learnings = this.preferenceLearnings
      .filter(l => l.frequency >= this.LEARNING_THRESHOLD && l.confidence >= this.LEARNING_CONFIDENCE_THRESHOLD)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxUpdates);

    let appliedCount = 0;

    for (const learning of learnings) {
      const success = await this.applyLearning(learning);
      if (success) {
        appliedCount++;
        // Remove applied learning
        this.preferenceLearnings = this.preferenceLearnings.filter(l => l !== learning);
      }
    }

    if (appliedCount > 0) {
      await this.savePreferenceLearnings();
    }

    return appliedCount;
  }

  /**
   * Get preference recommendations for specific context
   */
  getContextualRecommendations(context: WorkContext): string[] {
    const recommendations: string[] = [];
    const prefs = this.currentPreferences;

    if (!prefs) return recommendations;

    switch (context.type) {
      case 'coding':
        if (prefs.workspace.density !== 'compact') {
          recommendations.push('Consider using compact density for more screen space while coding');
        }
        if (!prefs.ai.enablePredictions) {
          recommendations.push('Enable AI predictions to get intelligent code suggestions');
        }
        break;

      case 'writing':
        if (prefs.workspace.density !== 'comfortable') {
          recommendations.push('Comfortable density works best for writing tasks');
        }
        if (prefs.theme.isDark) {
          recommendations.push('Light theme can improve readability for writing');
        }
        break;

      case 'meeting':
        if (prefs.notifications.inApp) {
          recommendations.push('Consider disabling in-app notifications during meetings');
        }
        break;

      case 'research':
        if (prefs.workspace.defaultLayout !== 'grid') {
          recommendations.push('Grid layout is optimal for research with multiple sources');
        }
        break;
    }

    // Time-based recommendations
    if (context.timeContext.timeOfDay === 'evening' && !prefs.theme.isDark) {
      recommendations.push('Switch to dark theme to reduce eye strain in the evening');
    }

    // Environment-based recommendations
    if (context.environment.device === 'mobile' && prefs.workspace.density !== 'compact') {
      recommendations.push('Use compact density on mobile devices for better usability');
    }

    return recommendations;
  }

  /**
   * Export preferences for backup
   */
  async exportPreferences(): Promise<{ preferences: UserPreferences; learnings: PreferenceLearning[] }> {
    const preferences = await this.getCurrentPreferences();
    return {
      preferences,
      learnings: this.preferenceLearnings
    };
  }

  /**
   * Import preferences from backup
   */
  async importPreferences(data: { preferences: UserPreferences; learnings?: PreferenceLearning[] }): Promise<boolean> {
    try {
      const success = await this.updatePreferences(data.preferences);
      
      if (success && data.learnings) {
        this.preferenceLearnings = data.learnings;
        await this.savePreferenceLearnings();
      }

      return success;
    } catch (error) {
      console.error('Error importing preferences:', error);
      return false;
    }
  }

  /**
   * Reset preferences to defaults
   */
  async resetToDefaults(): Promise<boolean> {
    const defaultPrefs = this.getDefaultPreferences();
    const success = await this.updatePreferences(defaultPrefs);
    
    if (success) {
      this.preferenceLearnings = [];
      await this.savePreferenceLearnings();
    }

    return success;
  }

  // Private methods
  private async loadStoredPreferences(): Promise<void> {
    const result = await storage.get(StorageKeys.USER_PREFERENCES);
    if (result.success && result.data) {
      this.currentPreferences = result.data as UserPreferences;
    }
  }

  private async loadPreferenceLearnings(): Promise<void> {
    const result = await storage.get('preference_learnings');
    if (result.success && result.data) {
      this.preferenceLearnings = result.data as PreferenceLearning[];
    }
  }

  private async savePreferenceLearnings(): Promise<void> {
    await storage.set('preference_learnings', this.preferenceLearnings);
  }

  private recordPreferenceLearning(
    updates: Partial<UserPreferences>,
    context: WorkContext,
    _reason: string
  ): void {
    Object.entries(updates).forEach(([key, value]) => {
      const existing = this.preferenceLearnings.find(
        l => l.setting === key && l.context === context.type
      );

      if (existing) {
        existing.frequency++;
        existing.newValue = value;
        existing.lastChanged = Date.now();
        existing.confidence = Math.min(existing.confidence + 0.1, 1.0);
      } else {
        this.preferenceLearnings.push({
          setting: key,
          oldValue: this.currentPreferences?.[key as keyof UserPreferences],
          newValue: value,
          context: context.type,
          frequency: 1,
          lastChanged: Date.now(),
          confidence: 0.3
        });
      }
    });

    // Maintain learning history size
    if (this.preferenceLearnings.length > this.MAX_LEARNING_HISTORY) {
      this.preferenceLearnings = this.preferenceLearnings
        .sort((a, b) => b.lastChanged - a.lastChanged)
        .slice(0, this.MAX_LEARNING_HISTORY);
    }

    this.savePreferenceLearnings();
  }

  private generatePreferenceUpdates(
    behaviorPattern: BehaviorPattern,
    contextHistory: Array<{ context: WorkContext; timestamp: number }>
  ): PreferencesUpdate[] {
    const updates: PreferencesUpdate[] = [];

    // Analyze productivity patterns
    const avgProductivity = behaviorPattern.productivityMetrics.reduce(
      (sum, metric) => sum + metric.satisfaction, 0
    ) / behaviorPattern.productivityMetrics.length;

    if (avgProductivity < 6) {
      updates.push({
        category: 'workspace',
        changes: {
          workspace: {
            ...this.currentPreferences?.workspace,
            density: 'spacious',
            animations: false
          } as WorkspacePreferences
        },
        reason: 'Low productivity detected, suggesting less distracting workspace',
        confidence: 0.7
      });
    }

    // Analyze context patterns
    const contextCounts = contextHistory.reduce((counts, entry) => {
      counts[entry.context.type] = (counts[entry.context.type] || 0) + 1;
      return counts;
    }, {} as { [key: string]: number });

    const mostCommonContext = Object.entries(contextCounts)
      .sort(([, a], [, b]) => b - a)[0];

    if (mostCommonContext && mostCommonContext[1] > contextHistory.length * 0.6) {
      const contextType = mostCommonContext[0] as WorkContext['type'];
      const optimizedLayout = this.getOptimalLayoutForContext(contextType);
      
      updates.push({
        category: 'workspace',
        changes: {
          workspace: {
            ...this.currentPreferences?.workspace,
            defaultLayout: optimizedLayout
          } as WorkspacePreferences
        },
        reason: `Optimizing for most common context: ${contextType}`,
        confidence: 0.8
      });
    }

    return updates;
  }

  private analyzePatterns(
    behaviorPattern: BehaviorPattern,
    preferences: UserPreferences
  ): PatternInsight[] {
    const insights: PatternInsight[] = [];

    // Analyze time patterns vs preferences
    const eveningWork = behaviorPattern.timePatterns.filter(
      p => p.hour >= 18 || p.hour <= 6
    ).length;

    if (eveningWork > 5 && !preferences.theme.isDark) {
      insights.push({
        type: 'preference',
        insight: 'You work frequently in the evening but use light theme',
        recommendation: 'Consider switching to dark theme or auto theme for better eye comfort',
        confidence: 0.8,
        impact: 'medium'
      });
    }

    // Analyze tool usage vs AI preferences
    const aiToolUsage = behaviorPattern.toolUsage.filter(
      t => t.toolId.includes('ai') || t.toolId.includes('assistant')
    );

    if (aiToolUsage.length > 0 && !preferences.ai.enablePredictions) {
      insights.push({
        type: 'behavior',
        insight: 'You use AI tools but have predictions disabled',
        recommendation: 'Enable AI predictions to get more intelligent suggestions',
        confidence: 0.9,
        impact: 'high'
      });
    }

    return insights;
  }

  private detectConflicts(
    preferences: UserPreferences,
    behaviorPattern: BehaviorPattern
  ): PreferenceConflict[] {
    const conflicts: PreferenceConflict[] = [];

    // Check for notification conflicts
    if (preferences.notifications.inApp && behaviorPattern.productivityMetrics.some(m => m.distractionCount > 10)) {
      conflicts.push({
        type: 'behavior_mismatch',
        description: 'High distraction count with notifications enabled',
        severity: 'medium',
        resolution: 'Consider reducing notification frequency or enabling focus mode'
      });
    }

    // Check for workspace density conflicts
    if (preferences.workspace.density === 'spacious' && 
        behaviorPattern.toolUsage.length > 5) {
      conflicts.push({
        type: 'setting_conflict',
        description: 'Spacious layout with many tools may reduce efficiency',
        severity: 'low',
        resolution: 'Consider compact or comfortable density for better tool access'
      });
    }

    return conflicts;
  }

  private learnWorkspacePreferences(
    behaviorPattern: BehaviorPattern,
    context: WorkContext,
    currentWorkspace: WorkspacePreferences
  ): PreferencesUpdate | null {
    // Learn from layout usage patterns
    const frequentTools = behaviorPattern.toolUsage
      .filter(t => t.usageFrequency > 10)
      .length;

    if (frequentTools > 5 && currentWorkspace.density === 'spacious') {
      return {
        category: 'workspace',
        changes: {
          workspace: {
            ...currentWorkspace,
            density: 'compact'
          }
        },
        reason: 'Many tools used frequently, compact layout would be more efficient',
        confidence: 0.7
      };
    }

    return null;
  }

  private learnAIPreferences(
    behaviorPattern: BehaviorPattern,
    _context: WorkContext,
    currentAI: AIPreferences
  ): PreferencesUpdate | null {
    // Learn from AI tool usage
    const aiInteractions = behaviorPattern.toolUsage.filter(
      t => t.toolId.includes('ai') || t.toolId.includes('assistant')
    );

    if (aiInteractions.length > 0 && !currentAI.enablePredictions) {
      return {
        category: 'ai',
        changes: {
          ai: {
            ...currentAI,
            enablePredictions: true
          }
        },
        reason: 'AI tools are being used, predictions would enhance the experience',
        confidence: 0.8
      };
    }

    return null;
  }

  private learnNotificationPreferences(
    behaviorPattern: BehaviorPattern,
    currentNotifications: NotificationPreferences
  ): PreferencesUpdate | null {
    // Learn from distraction patterns
    const avgDistractions = behaviorPattern.productivityMetrics.reduce(
      (sum, m) => sum + m.distractionCount, 0
    ) / behaviorPattern.productivityMetrics.length;

    if (avgDistractions > 8 && currentNotifications.inApp) {
      return {
        category: 'notifications',
        changes: {
          notifications: {
            ...currentNotifications,
            inApp: false
          }
        },
        reason: 'High distraction count suggests notifications should be reduced',
        confidence: 0.7
      };
    }

    return null;
  }

  private async applyLearning(learning: PreferenceLearning): Promise<boolean> {
    // const currentPrefs = await this.getCurrentPreferences();
    const updates = { [learning.setting]: learning.newValue };
    
    return this.updatePreferences(updates, undefined, 'Automatic learning application');
  }

  private getOptimalLayoutForContext(contextType: WorkContext['type']): any {
    const layoutMap = {
      coding: 'grid',
      writing: 'list',
      research: 'grid',
      meeting: 'timeline',
      planning: 'kanban',
      design: 'grid',
      communication: 'list'
    };

    return (layoutMap as any)[contextType] || 'grid';
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'AUTO' as any,
      notifications: {
        email: true,
        push: true,
        inApp: true,
        digest: 'daily',
        categories: []
      },
      privacy: {
        dataSharing: false,
        analytics: true,
        personalizedAds: false,
        publicProfile: false,
        activityTracking: true
      },
      workspace: {
        defaultLayout: 'grid',
        sidebarPosition: 'left',
        density: 'comfortable',
        animations: true,
        shortcuts: []
      },
      ai: {
        enablePredictions: true,
        enableContentGeneration: true,
        enableVoiceCommands: false,
        enableGestureControl: false,
        modelComplexity: 'balanced',
        privacyMode: false
      }
    } as UserPreferences;
  }
}

export const preferencesManager = new PreferencesManager();