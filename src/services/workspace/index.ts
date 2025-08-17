// Adaptive Workspace Engine - Main exports
export { behaviorTracker, type UserInteraction, type BehaviorAnalysis } from './BehaviorTracker';
export { contextAnalyzer, type WorkContext, type ContextPrediction } from './ContextAnalyzer';
export { layoutOptimizer, type LayoutConfiguration, type LayoutOptimization } from './LayoutOptimizer';
export { preferencesManager, type PreferencesAnalysis, type PreferencesUpdate } from './PreferencesManager';
export { 
  adaptiveWorkspaceEngine, 
  type WorkspaceState, 
  type WorkspaceAdaptation, 
  type WorkspacePrediction,
  type WorkspaceInsight,
  type WorkspaceOptimizationResult
} from './AdaptiveWorkspaceEngine';

// Re-export commonly used types
export type {
  LayoutComponent,
  SidebarConfig,
  ToolbarConfig,
  PanelConfig,
  ShortcutConfig
} from './LayoutOptimizer';

export type {
  EnvironmentContext,
  TimeContext,
  TaskContext,
  CollaborationContext,
  ContextIndicator
} from './ContextAnalyzer';

export type {
  BehaviorInsight,
  BehaviorPrediction
} from './BehaviorTracker';