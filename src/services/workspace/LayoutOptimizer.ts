// Layout optimization algorithms for adaptive workspace
import { WorkContext } from './ContextAnalyzer';
import { BehaviorAnalysis } from './BehaviorTracker';
import { UserPreferences, WorkspacePreferences, LayoutType } from '../../types/user';
import { storage } from '../../utils/storage';

export interface LayoutConfiguration {
  type: LayoutType;
  components: LayoutComponent[];
  theme: 'light' | 'dark' | 'auto';
  density: 'compact' | 'comfortable' | 'spacious';
  sidebar: SidebarConfig;
  toolbar: ToolbarConfig;
  panels: PanelConfig[];
  shortcuts: ShortcutConfig[];
}

export interface LayoutComponent {
  id: string;
  type: 'task-list' | 'calendar' | 'notes' | 'chat' | 'files' | 'analytics' | 'ai-assistant' | 'quick-actions';
  position: { x: number; y: number; width: number; height: number };
  visible: boolean;
  priority: number;
  contextRelevance: { [context: string]: number };
}

export interface SidebarConfig {
  position: 'left' | 'right' | 'hidden';
  width: number;
  collapsible: boolean;
  autoHide: boolean;
  components: string[];
}

export interface ToolbarConfig {
  position: 'top' | 'bottom' | 'floating';
  items: ToolbarItem[];
  contextual: boolean;
  customizable: boolean;
}

export interface ToolbarItem {
  id: string;
  icon: string;
  label: string;
  action: string;
  contextRelevance: { [context: string]: number };
  shortcut?: string;
}

export interface PanelConfig {
  id: string;
  title: string;
  position: 'left' | 'right' | 'bottom' | 'floating';
  size: { width?: number; height?: number };
  resizable: boolean;
  collapsible: boolean;
  contextual: boolean;
}

export interface ShortcutConfig {
  keys: string[];
  action: string;
  context?: string;
  description: string;
}

export interface LayoutOptimization {
  layout: LayoutConfiguration;
  reasoning: string[];
  confidence: number;
  adaptations: LayoutAdaptation[];
}

export interface LayoutAdaptation {
  type: 'component_visibility' | 'component_position' | 'component_size' | 'theme_change' | 'density_change';
  description: string;
  impact: 'low' | 'medium' | 'high';
  reason: string;
}

class LayoutOptimizer {
  private currentLayout: LayoutConfiguration | null = null;
  private layoutHistory: Array<{ layout: LayoutConfiguration; timestamp: number; context: WorkContext }> = [];
  private readonly LAYOUT_HISTORY_LIMIT = 50;

  // Default layout templates for different contexts
  private readonly DEFAULT_LAYOUTS: { [context: string]: Partial<LayoutConfiguration> } = {
    coding: {
      type: LayoutType.GRID,
      density: 'compact',
      sidebar: {
        position: 'left',
        width: 300,
        collapsible: true,
        autoHide: false,
        components: ['files', 'ai-assistant', 'quick-actions']
      },
      components: [
        {
          id: 'code-editor',
          type: 'files',
          position: { x: 300, y: 0, width: 70, height: 80 },
          visible: true,
          priority: 10,
          contextRelevance: { coding: 1.0, writing: 0.3 }
        },
        {
          id: 'ai-assistant',
          type: 'ai-assistant',
          position: { x: 0, y: 0, width: 300, height: 50 },
          visible: true,
          priority: 8,
          contextRelevance: { coding: 0.9, writing: 0.8, research: 0.7 }
        }
      ]
    },
    writing: {
      type: LayoutType.LIST,
      density: 'comfortable',
      theme: 'light',
      sidebar: {
        position: 'right',
        width: 250,
        collapsible: true,
        autoHide: true,
        components: ['notes', 'ai-assistant']
      }
    },
    research: {
      type: LayoutType.GRID,
      density: 'spacious',
      sidebar: {
        position: 'left',
        width: 350,
        collapsible: false,
        autoHide: false,
        components: ['notes', 'files', 'analytics']
      }
    },
    meeting: {
      type: LayoutType.TIMELINE,
      density: 'comfortable',
      sidebar: {
        position: 'right',
        width: 300,
        collapsible: true,
        autoHide: false,
        components: ['calendar', 'notes', 'chat']
      }
    },
    planning: {
      type: LayoutType.KANBAN,
      density: 'comfortable',
      sidebar: {
        position: 'left',
        width: 280,
        collapsible: true,
        autoHide: false,
        components: ['calendar', 'analytics', 'quick-actions']
      }
    }
  };

  constructor() {
    this.loadStoredLayout();
  }

  /**
   * Optimize layout based on current context and user behavior
   */
  async optimizeLayout(
    context: WorkContext,
    userPreferences: UserPreferences,
    behaviorAnalysis: BehaviorAnalysis
  ): Promise<LayoutOptimization> {
    const baseLayout = this.getBaseLayoutForContext(context.type, userPreferences.workspace);
    const adaptations: LayoutAdaptation[] = [];
    const reasoning: string[] = [];

    // Apply context-based optimizations
    const contextOptimizations = this.applyContextOptimizations(baseLayout, context);
    adaptations.push(...contextOptimizations.adaptations);
    reasoning.push(...contextOptimizations.reasoning);

    // Apply behavior-based optimizations
    const behaviorOptimizations = this.applyBehaviorOptimizations(baseLayout, behaviorAnalysis);
    adaptations.push(...behaviorOptimizations.adaptations);
    reasoning.push(...behaviorOptimizations.reasoning);

    // Apply time-based optimizations
    const timeOptimizations = this.applyTimeOptimizations(baseLayout, context.timeContext);
    adaptations.push(...timeOptimizations.adaptations);
    reasoning.push(...timeOptimizations.reasoning);

    // Apply environment-based optimizations
    const envOptimizations = this.applyEnvironmentOptimizations(baseLayout, context.environment);
    adaptations.push(...envOptimizations.adaptations);
    reasoning.push(...envOptimizations.reasoning);

    // Calculate confidence based on available data
    const confidence = this.calculateOptimizationConfidence(context, behaviorAnalysis, adaptations);

    const optimizedLayout = this.applyAdaptations(baseLayout, adaptations);

    // Store the optimized layout
    this.currentLayout = optimizedLayout;
    this.updateLayoutHistory(optimizedLayout, context);

    return {
      layout: optimizedLayout,
      reasoning,
      confidence,
      adaptations
    };
  }

  /**
   * Get current layout configuration
   */
  getCurrentLayout(): LayoutConfiguration | null {
    return this.currentLayout;
  }

  /**
   * Apply a specific layout adaptation
   */
  applyLayoutAdaptation(adaptation: LayoutAdaptation): void {
    if (!this.currentLayout) return;

    switch (adaptation.type) {
      case 'component_visibility':
        this.toggleComponentVisibility(adaptation.description);
        break;
      case 'component_position':
        this.adjustComponentPosition(adaptation.description);
        break;
      case 'component_size':
        this.adjustComponentSize(adaptation.description);
        break;
      case 'theme_change':
        this.changeTheme(adaptation.description);
        break;
      case 'density_change':
        this.changeDensity(adaptation.description);
        break;
    }

    this.saveCurrentLayout();
  }

  /**
   * Get layout recommendations based on usage patterns
   */
  getLayoutRecommendations(): string[] {
    const recommendations: string[] = [];

    if (!this.currentLayout || this.layoutHistory.length < 5) {
      return ['Use the workspace for a few days to get personalized layout recommendations'];
    }

    // Analyze layout usage patterns
    const contextUsage = this.analyzeContextUsage();
    const componentUsage = this.analyzeComponentUsage();
    const timePatterns = this.analyzeTimePatterns();

    // Generate recommendations based on patterns
    if (contextUsage['coding'] && contextUsage['coding'] > 0.6) {
      recommendations.push('Consider using a dual-monitor setup for better code visibility');
      recommendations.push('Enable compact density for more screen real estate');
    }

    if (componentUsage && componentUsage['ai-assistant'] && componentUsage['ai-assistant'] > 0.8) {
      recommendations.push('Pin the AI assistant for quick access');
    }

    if (timePatterns.eveningUsage > 0.3) {
      recommendations.push('Enable automatic dark mode for evening work sessions');
    }

    return recommendations;
  }

  /**
   * Reset layout to default for current context
   */
  resetToDefault(contextType: WorkContext['type']): LayoutConfiguration {
    const defaultLayout = this.getBaseLayoutForContext(contextType, this.getDefaultWorkspacePreferences());
    this.currentLayout = defaultLayout;
    this.saveCurrentLayout();
    return defaultLayout;
  }

  // Private methods
  private getBaseLayoutForContext(
    contextType: WorkContext['type'],
    preferences: WorkspacePreferences
  ): LayoutConfiguration {
    const template = this.DEFAULT_LAYOUTS[contextType] || this.DEFAULT_LAYOUTS['coding'];
    
    return {
      type: preferences.defaultLayout || template?.type || LayoutType.GRID,
      components: template?.components || [],
      theme: this.determineTheme(preferences),
      density: preferences.density || template?.density || 'comfortable',
      sidebar: {
        ...template?.sidebar,
        position: preferences.sidebarPosition || template?.sidebar?.position || 'left'
      } as SidebarConfig,
      toolbar: this.getDefaultToolbarConfig(contextType),
      panels: this.getDefaultPanelConfig(contextType),
      shortcuts: preferences.shortcuts?.map(s => ({
        keys: s.keys,
        action: s.action,
        description: s.action
      })) || []
    };
  }

  private applyContextOptimizations(
    layout: LayoutConfiguration,
    context: WorkContext
  ): { adaptations: LayoutAdaptation[]; reasoning: string[] } {
    const adaptations: LayoutAdaptation[] = [];
    const reasoning: string[] = [];

    // Adjust component visibility based on context relevance
    layout.components.forEach(component => {
      const relevance = component.contextRelevance[context.type] || 0;
      
      if (relevance < 0.3 && component.visible) {
        adaptations.push({
          type: 'component_visibility',
          description: `Hide ${component.type} (low relevance for ${context.type})`,
          impact: 'medium',
          reason: `Component has low relevance (${relevance}) for current context`
        });
        reasoning.push(`Hiding ${component.type} as it's not relevant for ${context.type} work`);
      } else if (relevance > 0.8 && !component.visible) {
        adaptations.push({
          type: 'component_visibility',
          description: `Show ${component.type} (high relevance for ${context.type})`,
          impact: 'high',
          reason: `Component has high relevance (${relevance}) for current context`
        });
        reasoning.push(`Showing ${component.type} as it's highly relevant for ${context.type} work`);
      }
    });

    // Adjust layout type based on context
    if (context.type === 'planning' && layout.type !== LayoutType.KANBAN) {
      adaptations.push({
        type: 'component_position',
        description: 'Switch to Kanban layout for planning',
        impact: 'high',
        reason: 'Kanban layout is optimal for planning activities'
      });
      reasoning.push('Switching to Kanban layout for better task planning visualization');
    }

    return { adaptations, reasoning };
  }

  private applyBehaviorOptimizations(
    layout: LayoutConfiguration,
    behaviorAnalysis: BehaviorAnalysis
  ): { adaptations: LayoutAdaptation[]; reasoning: string[] } {
    const adaptations: LayoutAdaptation[] = [];
    const reasoning: string[] = [];

    // Analyze tool usage patterns
    const frequentTools = behaviorAnalysis.patterns.toolUsage
      .filter(tool => tool.usageFrequency > 10)
      .sort((a, b) => b.usageFrequency - a.usageFrequency)
      .slice(0, 3);

    frequentTools.forEach(tool => {
      const component = layout.components.find(c => c.type === tool.toolId);
      if (component && !component.visible) {
        adaptations.push({
          type: 'component_visibility',
          description: `Show ${tool.toolId} (frequently used)`,
          impact: 'medium',
          reason: `Tool is used frequently (${tool.usageFrequency} times)`
        });
        reasoning.push(`Making ${tool.toolId} visible due to frequent usage`);
      }
    });

    // Adjust density based on productivity patterns
    const avgProductivity = behaviorAnalysis.patterns.productivityMetrics.reduce(
      (sum, metric) => sum + metric.satisfaction, 0
    ) / behaviorAnalysis.patterns.productivityMetrics.length;

    if (avgProductivity < 6 && layout.density !== 'spacious') {
      adaptations.push({
        type: 'density_change',
        description: 'Switch to spacious density for better focus',
        impact: 'medium',
        reason: 'Low productivity detected, spacious layout may help'
      });
      reasoning.push('Switching to spacious layout to improve focus and reduce cognitive load');
    }

    return { adaptations, reasoning };
  }

  private applyTimeOptimizations(
    layout: LayoutConfiguration,
    timeContext: any
  ): { adaptations: LayoutAdaptation[]; reasoning: string[] } {
    const adaptations: LayoutAdaptation[] = [];
    const reasoning: string[] = [];

    // Adjust theme based on time of day
    if (timeContext.timeOfDay === 'evening' && layout.theme === 'light') {
      adaptations.push({
        type: 'theme_change',
        description: 'Switch to dark theme for evening work',
        impact: 'low',
        reason: 'Dark theme reduces eye strain in evening'
      });
      reasoning.push('Switching to dark theme to reduce eye strain during evening hours');
    } else if (timeContext.timeOfDay === 'morning' && layout.theme === 'dark') {
      adaptations.push({
        type: 'theme_change',
        description: 'Switch to light theme for morning work',
        impact: 'low',
        reason: 'Light theme is better for morning productivity'
      });
      reasoning.push('Switching to light theme for better morning visibility');
    }

    // Suggest breaks for long work sessions
    if (timeContext.workSession.duration > 90 * 60 * 1000) {
      reasoning.push('Consider taking a break - you\'ve been working for over 90 minutes');
    }

    return { adaptations, reasoning };
  }

  private applyEnvironmentOptimizations(
    _layout: LayoutConfiguration,
    environment: any
  ): { adaptations: LayoutAdaptation[]; reasoning: string[] } {
    const adaptations: LayoutAdaptation[] = [];
    const reasoning: string[] = [];

    // Adjust for mobile devices
    if (environment.device === 'mobile') {
      adaptations.push({
        type: 'density_change',
        description: 'Switch to compact density for mobile',
        impact: 'high',
        reason: 'Mobile devices need compact layouts'
      });
      reasoning.push('Optimizing layout for mobile device with compact density');
    }

    // Adjust for small screens
    if (environment.screenSize.width < 1366) {
      adaptations.push({
        type: 'component_position',
        description: 'Auto-hide sidebar for small screen',
        impact: 'medium',
        reason: 'Small screen needs more space for main content'
      });
      reasoning.push('Auto-hiding sidebar to maximize content area on small screen');
    }

    return { adaptations, reasoning };
  }

  private calculateOptimizationConfidence(
    context: WorkContext,
    behaviorAnalysis: BehaviorAnalysis,
    adaptations: LayoutAdaptation[]
  ): number {
    let confidence = 0.5; // Base confidence

    // Boost confidence based on context confidence
    confidence += context.confidence * 0.3;

    // Boost confidence based on behavior analysis confidence
    confidence += behaviorAnalysis.confidence * 0.2;

    // Reduce confidence if too many adaptations (might be unstable)
    if (adaptations.length > 5) {
      confidence -= 0.1;
    }

    // Boost confidence for high-impact adaptations
    const highImpactAdaptations = adaptations.filter(a => a.impact === 'high').length;
    confidence += highImpactAdaptations * 0.05;

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private applyAdaptations(
    layout: LayoutConfiguration,
    adaptations: LayoutAdaptation[]
  ): LayoutConfiguration {
    const optimizedLayout = JSON.parse(JSON.stringify(layout)); // Deep clone

    adaptations.forEach(adaptation => {
      switch (adaptation.type) {
        case 'component_visibility':
          this.applyVisibilityAdaptation(optimizedLayout, adaptation);
          break;
        case 'theme_change':
          this.applyThemeAdaptation(optimizedLayout, adaptation);
          break;
        case 'density_change':
          this.applyDensityAdaptation(optimizedLayout, adaptation);
          break;
        // Add more adaptation types as needed
      }
    });

    return optimizedLayout;
  }

  private applyVisibilityAdaptation(layout: LayoutConfiguration, adaptation: LayoutAdaptation): void {
    const isShow = adaptation.description.toLowerCase().includes('show');
    const componentType = this.extractComponentTypeFromDescription(adaptation.description);
    
    const component = layout.components.find(c => c.type === componentType);
    if (component) {
      component.visible = isShow;
    }
  }

  private applyThemeAdaptation(layout: LayoutConfiguration, adaptation: LayoutAdaptation): void {
    if (adaptation.description.includes('dark')) {
      layout.theme = 'dark';
    } else if (adaptation.description.includes('light')) {
      layout.theme = 'light';
    }
  }

  private applyDensityAdaptation(layout: LayoutConfiguration, adaptation: LayoutAdaptation): void {
    if (adaptation.description.includes('compact')) {
      layout.density = 'compact';
    } else if (adaptation.description.includes('spacious')) {
      layout.density = 'spacious';
    } else if (adaptation.description.includes('comfortable')) {
      layout.density = 'comfortable';
    }
  }

  private extractComponentTypeFromDescription(description: string): string {
    const types = ['task-list', 'calendar', 'notes', 'chat', 'files', 'analytics', 'ai-assistant', 'quick-actions'];
    return types.find(type => description.toLowerCase().includes(type.replace('-', ''))) || 'unknown';
  }

  private updateLayoutHistory(layout: LayoutConfiguration, context: WorkContext): void {
    this.layoutHistory.push({
      layout: JSON.parse(JSON.stringify(layout)),
      timestamp: Date.now(),
      context
    });

    if (this.layoutHistory.length > this.LAYOUT_HISTORY_LIMIT) {
      this.layoutHistory = this.layoutHistory.slice(-this.LAYOUT_HISTORY_LIMIT);
    }
  }

  private async loadStoredLayout(): Promise<void> {
    const result = await storage.get('current_layout');
    if (result.success && result.data) {
      this.currentLayout = result.data as LayoutConfiguration;
    }
  }

  private async saveCurrentLayout(): Promise<void> {
    if (this.currentLayout) {
      await storage.set('current_layout', this.currentLayout);
    }
  }

  private getDefaultToolbarConfig(_contextType: WorkContext['type']): ToolbarConfig {
    return {
      position: 'top',
      contextual: true,
      customizable: true,
      items: [
        {
          id: 'new-task',
          icon: 'plus',
          label: 'New Task',
          action: 'create_task',
          contextRelevance: { planning: 1.0, coding: 0.8 }
        },
        {
          id: 'ai-assist',
          icon: 'brain',
          label: 'AI Assistant',
          action: 'toggle_ai_assistant',
          contextRelevance: { coding: 0.9, writing: 0.9, research: 0.8 }
        }
      ]
    };
  }

  private getDefaultPanelConfig(_contextType: WorkContext['type']): PanelConfig[] {
    return [
      {
        id: 'properties',
        title: 'Properties',
        position: 'right',
        size: { width: 300 },
        resizable: true,
        collapsible: true,
        contextual: true
      }
    ];
  }

  private determineTheme(_preferences: WorkspacePreferences): 'light' | 'dark' | 'auto' {
    // This would check user preferences and system settings
    return 'auto';
  }

  private getDefaultWorkspacePreferences(): WorkspacePreferences {
    return {
      defaultLayout: LayoutType.GRID,
      sidebarPosition: 'left',
      density: 'comfortable',
      animations: true,
      shortcuts: []
    };
  }

  private analyzeContextUsage(): { [context: string]: number } {
    const contextCounts: { [context: string]: number } = {};
    let total = 0;

    this.layoutHistory.forEach(entry => {
      contextCounts[entry.context.type] = (contextCounts[entry.context.type] || 0) + 1;
      total++;
    });

    const usage: { [context: string]: number } = {};
    Object.entries(contextCounts).forEach(([context, count]) => {
      usage[context] = count / total;
    });

    return usage;
  }

  private analyzeComponentUsage(): { [component: string]: number } {
    // This would analyze which components are used most frequently
    return {};
  }

  private analyzeTimePatterns(): { eveningUsage: number; morningUsage: number } {
    let eveningCount = 0;
    let morningCount = 0;

    this.layoutHistory.forEach(entry => {
      const hour = new Date(entry.timestamp).getHours();
      if (hour >= 18 || hour <= 6) eveningCount++;
      if (hour >= 6 && hour <= 12) morningCount++;
    });

    const total = this.layoutHistory.length;
    return {
      eveningUsage: total > 0 ? eveningCount / total : 0,
      morningUsage: total > 0 ? morningCount / total : 0
    };
  }

  private toggleComponentVisibility(_description: string): void {
    // Implementation for toggling component visibility
  }

  private adjustComponentPosition(_description: string): void {
    // Implementation for adjusting component position
  }

  private adjustComponentSize(_description: string): void {
    // Implementation for adjusting component size
  }

  private changeTheme(description: string): void {
    if (!this.currentLayout) return;
    
    if (description.includes('dark')) {
      this.currentLayout.theme = 'dark';
    } else if (description.includes('light')) {
      this.currentLayout.theme = 'light';
    }
  }

  private changeDensity(description: string): void {
    if (!this.currentLayout) return;
    
    if (description.includes('compact')) {
      this.currentLayout.density = 'compact';
    } else if (description.includes('spacious')) {
      this.currentLayout.density = 'spacious';
    } else if (description.includes('comfortable')) {
      this.currentLayout.density = 'comfortable';
    }
  }
}

export const layoutOptimizer = new LayoutOptimizer();