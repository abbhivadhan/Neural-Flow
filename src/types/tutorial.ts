export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target: string; // CSS selector for the element to highlight
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'input' | 'wait';
  actionTarget?: string;
  nextTrigger?: 'auto' | 'manual' | 'action';
  delay?: number;
  skippable?: boolean;
  required?: boolean;
  fallbackTargets?: string[]; // Alternative CSS selectors if primary target is not found
  beforeShow?: () => void; // Function to execute before showing the step
}

export interface TutorialFlow {
  id: string;
  name: string;
  description: string;
  category: 'onboarding' | 'feature' | 'advanced';
  steps: TutorialStep[];
  prerequisites?: string[];
  estimatedDuration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rewards?: TutorialReward[];
}

export interface TutorialReward {
  type: 'badge' | 'feature_unlock' | 'customization' | 'achievement';
  id: string;
  name: string;
  description: string;
  icon?: string;
  unlocks?: string[];
}

export interface TutorialProgress {
  userId: string;
  flowId: string;
  currentStepIndex: number;
  completedSteps: string[];
  startedAt: Date;
  lastActiveAt: Date;
  completedAt?: Date;
  skippedSteps: string[];
  timeSpent: number; // in seconds
  interactions: TutorialInteraction[];
}

export interface TutorialInteraction {
  stepId: string;
  action: string;
  timestamp: Date;
  success: boolean;
  timeToComplete?: number;
}

export interface TutorialState {
  isActive: boolean;
  currentFlow?: TutorialFlow;
  currentStep?: TutorialStep;
  progress: Record<string, TutorialProgress>;
  availableFlows: TutorialFlow[];
  completedFlows: string[];
  unlockedRewards: TutorialReward[];
  showTooltips: boolean;
  contextualHelpEnabled: boolean;
}

export interface TooltipConfig {
  id: string;
  target: string;
  content: string;
  trigger: 'hover' | 'click' | 'focus' | 'contextual';
  position: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  persistent?: boolean;
  contextConditions?: ContextCondition[];
}

export interface ContextCondition {
  type: 'route' | 'element_visible' | 'user_action' | 'time_spent' | 'feature_used';
  value: string | number | boolean;
  operator?: 'equals' | 'contains' | 'greater_than' | 'less_than';
}

export interface ContextualHelp {
  id: string;
  context: string;
  suggestions: HelpSuggestion[];
  priority: number;
  conditions: ContextCondition[];
}

export interface HelpSuggestion {
  type: 'tip' | 'shortcut' | 'feature' | 'tutorial';
  title: string;
  description: string;
  action?: () => void;
  tutorialId?: string;
}