import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useTutorial, useTooltips, useContextualHelp } from '../../hooks/useTutorial';
import { TutorialOverlay } from './TutorialOverlay';
import { TutorialLauncher } from './TutorialLauncher';
import { TooltipManager } from './TutorialTooltip';
import { ContextualHelpPanel } from './ContextualHelp';
import { defaultTutorialFlows } from '../../services/tutorial/TutorialFlows';
import { TooltipConfig, ContextualHelp } from '../../types/tutorial';

interface TutorialContextType {
  // Tutorial controls
  startTutorial: (flowId: string) => boolean;
  nextStep: () => boolean;
  previousStep: () => boolean;
  skipStep: () => boolean;
  pauseTutorial: () => void;
  resumeTutorial: (flowId: string) => boolean;
  openLauncher: () => void;
  closeLauncher: () => void;
  
  // Tooltip controls
  registerTooltip: (tooltip: TooltipConfig) => void;
  unregisterTooltip: (tooltipId: string) => void;
  toggleTooltips: (enabled: boolean) => void;
  
  // Contextual help controls
  registerHelp: (help: ContextualHelp) => void;
  unregisterHelp: (helpId: string) => void;
  toggleContextualHelp: (enabled: boolean) => void;
  
  // State
  isActive: boolean;
  showTooltips: boolean;
  showContextualHelp: boolean;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

interface TutorialProviderProps {
  children: ReactNode;
  autoRegisterFlows?: boolean;
}

export const TutorialProvider: React.FC<TutorialProviderProps> = ({
  children,
  autoRegisterFlows = true,
}) => {
  const tutorial = useTutorial();
  const tooltips = useTooltips();
  const contextualHelp = useContextualHelp();

  // Register default tutorial flows
  useEffect(() => {
    if (autoRegisterFlows) {
      defaultTutorialFlows.forEach(flow => {
        tutorial.registerTutorialFlow(flow);
      });
    }
  }, [autoRegisterFlows, tutorial.registerTutorialFlow]);

  // Register default tooltips
  useEffect(() => {
    const defaultTooltips: TooltipConfig[] = [
      {
        id: 'main-nav-tooltip',
        target: '[data-tutorial="main-nav"]',
        content: 'Navigate between different sections of Neural Flow',
        trigger: 'hover',
        position: 'bottom',
        delay: 1000,
      },
      {
        id: 'add-task-tooltip',
        target: '[data-tutorial="add-task"]',
        content: 'Create a new task with AI-powered suggestions',
        trigger: 'hover',
        position: 'top',
        delay: 500,
      },
      {
        id: 'ai-assistant-tooltip',
        target: '[data-tutorial="ai-assistant"]',
        content: 'Get contextual help and AI-powered suggestions',
        trigger: 'hover',
        position: 'left',
        delay: 800,
      },
    ];

    defaultTooltips.forEach(tooltip => {
      tooltips.registerTooltip(tooltip);
    });
  }, [tooltips.registerTooltip]);

  // Register default contextual help
  useEffect(() => {
    const defaultHelp: ContextualHelp[] = [
      {
        id: 'workspace-help',
        context: 'workspace',
        priority: 10,
        conditions: [
          { type: 'route', value: '/workspace' },
          { type: 'time_spent', value: 30000, operator: 'greater_than' },
        ],
        suggestions: [
          {
            type: 'tip',
            title: 'Organize with AI',
            description: 'Let AI automatically organize your tasks based on priority and deadlines',
            action: () => console.log('Show AI organization options'),
          },
          {
            type: 'tutorial',
            title: 'Master Your Workspace',
            description: 'Learn advanced workspace features',
            tutorialId: 'workspace-mastery',
          },
        ],
      },
      {
        id: 'first-time-help',
        context: 'general',
        priority: 20,
        conditions: [
          { type: 'feature_used', value: 'onboarding', operator: 'equals' },
        ],
        suggestions: [
          {
            type: 'tutorial',
            title: 'Get Started',
            description: 'Take a quick tour of Neural Flow',
            tutorialId: 'neural-flow-onboarding',
          },
        ],
      },
      {
        id: 'content-creation-help',
        context: 'content',
        priority: 15,
        conditions: [
          { type: 'element_visible', value: '[data-tutorial="content-editor"]' },
        ],
        suggestions: [
          {
            type: 'feature',
            title: 'AI Content Generation',
            description: 'Generate content with AI assistance',
            action: () => console.log('Open content generation'),
          },
          {
            type: 'shortcut',
            title: 'Quick Enhancement',
            description: 'Press Ctrl+E to enhance selected text',
          },
        ],
      },
    ];

    defaultHelp.forEach(help => {
      contextualHelp.registerHelp(help);
    });
  }, [contextualHelp.registerHelp]);

  const contextValue: TutorialContextType = {
    // Tutorial controls
    startTutorial: tutorial.startTutorial,
    nextStep: tutorial.nextStep,
    previousStep: tutorial.previousStep,
    skipStep: tutorial.skipStep,
    pauseTutorial: tutorial.pauseTutorial,
    resumeTutorial: tutorial.resumeTutorial,
    openLauncher: tutorial.openLauncher,
    closeLauncher: tutorial.closeLauncher,
    
    // Tooltip controls
    registerTooltip: tooltips.registerTooltip,
    unregisterTooltip: tooltips.unregisterTooltip,
    toggleTooltips: tooltips.toggleTooltips,
    
    // Contextual help controls
    registerHelp: contextualHelp.registerHelp,
    unregisterHelp: contextualHelp.unregisterHelp,
    toggleContextualHelp: contextualHelp.toggleContextualHelp,
    
    // State
    isActive: tutorial.tutorialState.isActive,
    showTooltips: tooltips.enabled,
    showContextualHelp: contextualHelp.enabled,
  };

  return (
    <TutorialContext.Provider value={contextValue}>
      {children}
      
      {/* Tutorial Overlay */}
      <TutorialOverlay
        isActive={tutorial.tutorialState.isActive}
        currentStep={tutorial.tutorialState.currentStep}
        currentFlow={tutorial.tutorialState.currentFlow}
        progress={tutorial.tutorialState.currentFlow ? 
          tutorial.tutorialState.progress[tutorial.tutorialState.currentFlow.id] : 
          undefined
        }
        onNext={tutorial.nextStep}
        onPrevious={tutorial.previousStep}
        onSkip={tutorial.skipStep}
        onClose={tutorial.pauseTutorial}
      />
      
      {/* Tutorial Launcher */}
      <TutorialLauncher
        isOpen={tutorial.isLauncherOpen}
        onClose={tutorial.closeLauncher}
        onStartTutorial={tutorial.startTutorial}
      />
      
      {/* Tooltip Manager */}
      <TooltipManager
        tooltips={tooltips.tooltips}
        enabled={tooltips.enabled}
      />
      
      {/* Contextual Help */}
      <ContextualHelpPanel
        enabled={contextualHelp.enabled}
        helpItems={contextualHelp.helpItems}
        onStartTutorial={tutorial.startTutorial}
      />
    </TutorialContext.Provider>
  );
};

export const useTutorialContext = (): TutorialContextType => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorialContext must be used within a TutorialProvider');
  }
  return context;
};