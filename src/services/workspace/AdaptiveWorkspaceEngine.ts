// Main adaptive workspace engine that coordinates all workspace intelligence
import { behaviorTracker, BehaviorAnalysis, UserInteraction } from './BehaviorTracker';
import { contextAnalyzer, WorkContext } from './ContextAnalyzer';
import { layoutOptimizer, LayoutConfiguration, LayoutOptimization } from './LayoutOptimizer';
import { preferencesManager, PreferencesAnalysis } from './PreferencesManager';
import { UserPreferences } from '../../types/user';
import { storage } from '../../utils/storage';

export interface WorkspaceState {
  context: WorkContext;
  layout: LayoutConfiguration;
  preferences: UserPreferences;
  behaviorAnalysis: BehaviorAnalysis;
  adaptations: WorkspaceAdaptation[];
  predictions: WorkspacePrediction[];
  recommendations: string[];
}

export interface WorkspaceAdaptation {
  type: 'layout' | 'context' | 'preferences' | 'behavior';
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  timestamp: number;
  applied: boolean;
}

export interface WorkspacePrediction {
  type: 'context_change' | 'task_switch' | 'break_needed' | 'productivity_dip' | 'tool_switch';
  prediction: string;
  confidence: number;
  timeframe: number; // minutes
  actions: string[];
}

export interface WorkspaceInsight {
  category: 'productivity' | 'efficiency' | 'wellbeing' | 'optimization';
  title: string;
  description: string;
  actionable: boolean;
  actions?: string[];
  confidence: number;
}

export interface WorkspaceOptimizationResult {
  state: WorkspaceState;
  insights: WorkspaceInsight[];
  appliedAdaptations: WorkspaceAdaptation[];
  confidence: number;
}

class AdaptiveWorkspaceEngine {
  private currentState: WorkspaceState | null = null;
  private adaptationHistory: WorkspaceAdaptation[] = [];
  private readonly ADAPTATION_HISTORY_LIMIT = 200;
  private readonly AUTO_OPTIMIZATION_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private optimizationTimer: NodeJS.Timeout | null = null;
  private isOptimizing = false;

  constructor() {
    this.initializeEngine();
    this.startAutoOptimization();
  }

  /**
   * Get current workspace state
   */
  async getCurrentState(): Promise<WorkspaceState> {
    if (!this.currentState) {
      await this.analyzeWorkspace();
    }
    return this.currentState!;
  }

  /**
   * Perform comprehensive workspace analysis and optimization
   */
  async analyzeWorkspace(): Promise<WorkspaceOptimizationResult> {
    if (this.isOptimizing) {
      return this.createOptimizationResult();
    }

    this.isOptimizing = true;

    try {
      // Gather all workspace intelligence
      const context = await contextAnalyzer.analyzeCurrentContext();
      const behaviorAnalysis = behaviorTracker.analyzeBehavior();
      const preferences = await preferencesManager.getCurrentPreferences();

      // Optimize layout based on current context and behavior
      const layoutOptimization = await layoutOptimizer.optimizeLayout(
        context,
        preferences,
        behaviorAnalysis
      );

      // Analyze preferences and suggest improvements
      const preferencesAnalysis = await preferencesManager.analyzePreferences(
        behaviorAnalysis.patterns,
        [{ context, timestamp: Date.now() }]
      );

      // Generate predictions
      const predictions = this.generateWorkspacePredictions(context, behaviorAnalysis);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        context,
        behaviorAnalysis,
        layoutOptimization,
        preferencesAnalysis
      );

      // Create adaptations
      const adaptations = this.createAdaptations(
        layoutOptimization,
        preferencesAnalysis,
        context
      );

      // Update workspace state
      this.currentState = {
        context,
        layout: layoutOptimization.layout,
        preferences,
        behaviorAnalysis,
        adaptations,
        predictions,
        recommendations
      };

      // Generate insights
      const insights = this.generateInsights(this.currentState);

      // Apply automatic adaptations
      const appliedAdaptations = await this.applyAutomaticAdaptations(adaptations);

      // Calculate overall confidence
      const confidence = this.calculateOverallConfidence(
        context,
        behaviorAnalysis,
        layoutOptimization
      );

      // Save state
      await this.saveWorkspaceState();

      return {
        state: this.currentState,
        insights,
        appliedAdaptations,
        confidence
      };
    } finally {
      this.isOptimizing = false;
    }
  }

  /**
   * Track user interaction and trigger adaptive responses
   */
  async trackInteraction(interaction: UserInteraction): Promise<void> {
    // Track the interaction
    behaviorTracker.trackInteraction(interaction);

    // Check if context has changed significantly
    const contextChanged = contextAnalyzer.hasContextChanged(0.3);
    
    if (contextChanged) {
      // Trigger workspace re-analysis
      await this.analyzeWorkspace();
    }

    // Check for immediate adaptations needed
    await this.checkImmediateAdaptations(interaction);
  }

  /**
   * Apply a specific workspace adaptation
   */
  async applyAdaptation(adaptation: WorkspaceAdaptation): Promise<boolean> {
    try {
      switch (adaptation.type) {
        case 'layout':
          await this.applyLayoutAdaptation(adaptation);
          break;
        case 'preferences':
          await this.applyPreferencesAdaptation(adaptation);
          break;
        case 'context':
          await this.applyContextAdaptation(adaptation);
          break;
        case 'behavior':
          await this.applyBehaviorAdaptation(adaptation);
          break;
      }

      adaptation.applied = true;
      adaptation.timestamp = Date.now();
      this.addToAdaptationHistory(adaptation);

      return true;
    } catch (error) {
      console.error('Error applying adaptation:', error);
      return false;
    }
  }

  /**
   * Get workspace insights and recommendations
   */
  async getWorkspaceInsights(): Promise<WorkspaceInsight[]> {
    const state = await this.getCurrentState();
    return this.generateInsights(state);
  }

  /**
   * Predict next workspace changes
   */
  async predictWorkspaceChanges(): Promise<WorkspacePrediction[]> {
    const state = await this.getCurrentState();
    return this.generateWorkspacePredictions(state.context, state.behaviorAnalysis);
  }

  /**
   * Learn from user feedback on adaptations
   */
  async learnFromFeedback(
    adaptationId: string,
    feedback: 'positive' | 'negative' | 'neutral',
    comments?: string
  ): Promise<void> {
    const adaptation = this.adaptationHistory.find(a => a.description === adaptationId);
    
    if (adaptation) {
      // Adjust confidence based on feedback
      if (feedback === 'positive') {
        adaptation.confidence = Math.min(adaptation.confidence + 0.1, 1.0);
      } else if (feedback === 'negative') {
        adaptation.confidence = Math.max(adaptation.confidence - 0.2, 0.1);
      }

      // Store feedback for future learning
      await this.storeFeedback(adaptation, feedback, comments);
    }
  }

  /**
   * Export workspace configuration
   */
  async exportWorkspaceConfig(): Promise<any> {
    const state = await this.getCurrentState();
    const preferencesData = await preferencesManager.exportPreferences();
    
    return {
      state,
      preferences: preferencesData,
      adaptationHistory: this.adaptationHistory,
      timestamp: Date.now()
    };
  }

  /**
   * Import workspace configuration
   */
  async importWorkspaceConfig(config: any): Promise<boolean> {
    try {
      if (config.preferences) {
        await preferencesManager.importPreferences(config.preferences);
      }

      if (config.adaptationHistory) {
        this.adaptationHistory = config.adaptationHistory;
      }

      // Re-analyze workspace with new configuration
      await this.analyzeWorkspace();

      return true;
    } catch (error) {
      console.error('Error importing workspace config:', error);
      return false;
    }
  }

  /**
   * Reset workspace to defaults
   */
  async resetWorkspace(): Promise<void> {
    await preferencesManager.resetToDefaults();
    this.adaptationHistory = [];
    this.currentState = null;
    await this.analyzeWorkspace();
  }

  // Private methods
  private async initializeEngine(): Promise<void> {
    // Load stored state if available
    await this.loadWorkspaceState();
    
    // Perform initial analysis
    await this.analyzeWorkspace();
  }

  private startAutoOptimization(): void {
    this.optimizationTimer = setInterval(async () => {
      // Only auto-optimize if there's been recent activity
      const recentActivity = this.hasRecentActivity();
      if (recentActivity) {
        await this.analyzeWorkspace();
      }
    }, this.AUTO_OPTIMIZATION_INTERVAL);
  }

  private generateWorkspacePredictions(
    context: WorkContext,
    behaviorAnalysis: BehaviorAnalysis
  ): WorkspacePrediction[] {
    const predictions: WorkspacePrediction[] = [];

    // Context change predictions
    const contextPrediction = contextAnalyzer.predictNextContext();
    if (contextPrediction.confidence > 0.6) {
      predictions.push({
        type: 'context_change',
        prediction: `Likely to switch to ${contextPrediction.nextContext} context`,
        confidence: contextPrediction.confidence,
        timeframe: contextPrediction.timeframe,
        actions: [`Prepare ${contextPrediction.nextContext} workspace layout`]
      });
    }

    // Break predictions from behavior analysis
    behaviorAnalysis.predictions.forEach(pred => {
      if (pred.type === 'break_needed') {
        predictions.push({
          type: 'break_needed',
          prediction: pred.prediction,
          confidence: pred.confidence,
          timeframe: pred.timeframe,
          actions: ['Suggest break reminder', 'Save current work', 'Prepare break activities']
        });
      }
    });

    // Productivity predictions
    if (context.timeContext.workSession.duration > 2 * 60 * 60 * 1000) { // 2 hours
      predictions.push({
        type: 'productivity_dip',
        prediction: 'Productivity may decline after extended work session',
        confidence: 0.7,
        timeframe: 30,
        actions: ['Suggest break', 'Switch to lighter tasks', 'Enable focus mode']
      });
    }

    return predictions;
  }

  private generateRecommendations(
    context: WorkContext,
    behaviorAnalysis: BehaviorAnalysis,
    _layoutOptimization: LayoutOptimization,
    _preferencesAnalysis: PreferencesAnalysis
  ): string[] {
    const recommendations: string[] = [];

    // Add context-specific recommendations
    recommendations.push(...contextAnalyzer.getContextRecommendations(context));

    // Add layout recommendations
    recommendations.push(...layoutOptimizer.getLayoutRecommendations());

    // Add behavior-based recommendations
    behaviorAnalysis.insights.forEach(insight => {
      if (insight.actionable && insight.recommendation) {
        recommendations.push(insight.recommendation);
      }
    });

    // Add preference recommendations
    recommendations.push(...preferencesManager.getContextualRecommendations(context));

    // Remove duplicates and limit to top 10
    return [...new Set(recommendations)].slice(0, 10);
  }

  private createAdaptations(
    layoutOptimization: LayoutOptimization,
    preferencesAnalysis: PreferencesAnalysis,
    _context: WorkContext
  ): WorkspaceAdaptation[] {
    const adaptations: WorkspaceAdaptation[] = [];

    // Layout adaptations
    layoutOptimization.adaptations.forEach(adaptation => {
      adaptations.push({
        type: 'layout',
        description: adaptation.description,
        confidence: layoutOptimization.confidence,
        impact: adaptation.impact,
        timestamp: Date.now(),
        applied: false
      });
    });

    // Preference adaptations
    preferencesAnalysis.suggestedUpdates.forEach(update => {
      adaptations.push({
        type: 'preferences',
        description: `Update ${update.category}: ${update.reason}`,
        confidence: update.confidence,
        impact: 'medium',
        timestamp: Date.now(),
        applied: false
      });
    });

    return adaptations;
  }

  private generateInsights(state: WorkspaceState): WorkspaceInsight[] {
    const insights: WorkspaceInsight[] = [];

    // Productivity insights
    const avgProductivity = state.behaviorAnalysis.patterns.productivityMetrics.reduce(
      (sum, metric) => sum + metric.satisfaction, 0
    ) / state.behaviorAnalysis.patterns.productivityMetrics.length;

    if (avgProductivity < 6) {
      insights.push({
        category: 'productivity',
        title: 'Productivity Below Average',
        description: 'Your productivity satisfaction has been below average recently.',
        actionable: true,
        actions: ['Take more breaks', 'Adjust workspace layout', 'Review task priorities'],
        confidence: 0.8
      });
    }

    // Context insights
    if (state.context.confidence < 0.5) {
      insights.push({
        category: 'optimization',
        title: 'Context Detection Uncertain',
        description: 'The system is having difficulty determining your current work context.',
        actionable: true,
        actions: ['Provide more context clues', 'Use consistent naming patterns', 'Enable more tracking'],
        confidence: 0.7
      });
    }

    // Efficiency insights
    const frequentToolSwitches = state.behaviorAnalysis.patterns.toolUsage.filter(
      tool => tool.usageFrequency > 20
    ).length;

    if (frequentToolSwitches > 8) {
      insights.push({
        category: 'efficiency',
        title: 'High Tool Switching',
        description: 'You switch between many tools frequently, which may impact efficiency.',
        actionable: true,
        actions: ['Consolidate similar tools', 'Use keyboard shortcuts', 'Create custom workflows'],
        confidence: 0.6
      });
    }

    return insights;
  }

  private async applyAutomaticAdaptations(adaptations: WorkspaceAdaptation[]): Promise<WorkspaceAdaptation[]> {
    const applied: WorkspaceAdaptation[] = [];

    // Only apply high-confidence, low-impact adaptations automatically
    const autoApplicable = adaptations.filter(
      a => a.confidence > 0.8 && (a.impact === 'low' || a.impact === 'medium')
    );

    for (const adaptation of autoApplicable) {
      const success = await this.applyAdaptation(adaptation);
      if (success) {
        applied.push(adaptation);
      }
    }

    return applied;
  }

  private calculateOverallConfidence(
    context: WorkContext,
    behaviorAnalysis: BehaviorAnalysis,
    layoutOptimization: LayoutOptimization
  ): number {
    const factors = [
      context.confidence * 0.4,
      behaviorAnalysis.confidence * 0.3,
      layoutOptimization.confidence * 0.3
    ];

    return factors.reduce((sum, factor) => sum + factor, 0);
  }

  private async checkImmediateAdaptations(interaction: UserInteraction): Promise<void> {
    // Check for immediate adaptations based on interaction
    if (interaction.type === 'tool_switch' && interaction.duration && interaction.duration < 5000) {
      // Quick tool switches might indicate inefficient layout
      const adaptation: WorkspaceAdaptation = {
        type: 'layout',
        description: 'Optimize tool placement for quicker access',
        confidence: 0.6,
        impact: 'medium',
        timestamp: Date.now(),
        applied: false
      };

      await this.applyAdaptation(adaptation);
    }
  }

  private async applyLayoutAdaptation(adaptation: WorkspaceAdaptation): Promise<void> {
    // Apply layout-specific adaptations
    if (this.currentState) {
      // This would trigger actual UI changes
      console.log('Applying layout adaptation:', adaptation.description);
    }
  }

  private async applyPreferencesAdaptation(adaptation: WorkspaceAdaptation): Promise<void> {
    // Apply preference changes
    console.log('Applying preferences adaptation:', adaptation.description);
  }

  private async applyContextAdaptation(adaptation: WorkspaceAdaptation): Promise<void> {
    // Apply context-specific changes
    console.log('Applying context adaptation:', adaptation.description);
  }

  private async applyBehaviorAdaptation(adaptation: WorkspaceAdaptation): Promise<void> {
    // Apply behavior-based changes
    console.log('Applying behavior adaptation:', adaptation.description);
  }

  private addToAdaptationHistory(adaptation: WorkspaceAdaptation): void {
    this.adaptationHistory.push(adaptation);

    if (this.adaptationHistory.length > this.ADAPTATION_HISTORY_LIMIT) {
      this.adaptationHistory = this.adaptationHistory.slice(-this.ADAPTATION_HISTORY_LIMIT);
    }
  }

  private async storeFeedback(
    adaptation: WorkspaceAdaptation,
    feedback: 'positive' | 'negative' | 'neutral',
    comments?: string
  ): Promise<void> {
    const feedbackData = {
      adaptationId: adaptation.description,
      feedback,
      comments,
      timestamp: Date.now()
    };

    await storage.set(`feedback_${Date.now()}`, feedbackData);
  }

  private hasRecentActivity(): boolean {
    // Check if there has been recent user activity
    const recentThreshold = 10 * 60 * 1000; // 10 minutes
    const lastActivity = behaviorTracker.getCurrentProductivityMetrics().date;
    const lastActivityTime = lastActivity instanceof Date ? lastActivity.getTime() : Date.parse(String(lastActivity));
    return Date.now() - lastActivityTime < recentThreshold;
  }

  private async saveWorkspaceState(): Promise<void> {
    if (this.currentState) {
      await storage.set('workspace_state', this.currentState);
    }
  }

  private async loadWorkspaceState(): Promise<void> {
    const result = await storage.get('workspace_state');
    if (result.success && result.data) {
      this.currentState = result.data as WorkspaceState;
    }
  }

  private createOptimizationResult(): WorkspaceOptimizationResult {
    return {
      state: this.currentState!,
      insights: [],
      appliedAdaptations: [],
      confidence: 0.5
    };
  }

  public destroy(): void {
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = null;
    }
    contextAnalyzer.destroy();
  }
}

export const adaptiveWorkspaceEngine = new AdaptiveWorkspaceEngine();