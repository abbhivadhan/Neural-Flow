import { useState, useEffect, useCallback } from 'react';
import { TutorialFlow, TutorialStep, TutorialState, TooltipConfig, ContextualHelp } from '../types/tutorial';
import { tutorialEngine } from '../services/tutorial/TutorialEngine';

export const useTutorial = () => {
  const [tutorialState, setTutorialState] = useState<TutorialState>(tutorialEngine.getCurrentState());
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);

  useEffect(() => {
    const handleStateChange = () => {
      setTutorialState(tutorialEngine.getCurrentState());
    };

    // Subscribe to tutorial engine events
    tutorialEngine.on('tutorialStarted', handleStateChange);
    tutorialEngine.on('stepChanged', handleStateChange);
    tutorialEngine.on('tutorialCompleted', handleStateChange);
    tutorialEngine.on('tutorialPaused', handleStateChange);
    tutorialEngine.on('tutorialResumed', handleStateChange);
    tutorialEngine.on('interactionRecorded', handleStateChange);

    return () => {
      tutorialEngine.off('tutorialStarted', handleStateChange);
      tutorialEngine.off('stepChanged', handleStateChange);
      tutorialEngine.off('tutorialCompleted', handleStateChange);
      tutorialEngine.off('tutorialPaused', handleStateChange);
      tutorialEngine.off('tutorialResumed', handleStateChange);
      tutorialEngine.off('interactionRecorded', handleStateChange);
    };
  }, []);

  const startTutorial = useCallback((flowId: string) => {
    return tutorialEngine.startTutorial(flowId);
  }, []);

  const nextStep = useCallback(() => {
    return tutorialEngine.nextStep();
  }, []);

  const previousStep = useCallback(() => {
    return tutorialEngine.previousStep();
  }, []);

  const skipStep = useCallback(() => {
    return tutorialEngine.skipStep();
  }, []);

  const pauseTutorial = useCallback(() => {
    tutorialEngine.pauseTutorial();
  }, []);

  const resumeTutorial = useCallback((flowId: string) => {
    return tutorialEngine.resumeTutorial(flowId);
  }, []);

  const completeTutorial = useCallback(() => {
    return tutorialEngine.completeTutorial();
  }, []);

  const registerTutorialFlow = useCallback((flow: TutorialFlow) => {
    tutorialEngine.registerTutorialFlow(flow);
  }, []);

  const getAvailableTutorials = useCallback(() => {
    return tutorialEngine.getAvailableTutorials();
  }, []);

  const getProgress = useCallback((flowId: string) => {
    return tutorialEngine.getProgress(flowId);
  }, []);

  const toggleTooltips = useCallback((enabled: boolean) => {
    tutorialEngine.toggleTooltips(enabled);
  }, []);

  const toggleContextualHelp = useCallback((enabled: boolean) => {
    tutorialEngine.toggleContextualHelp(enabled);
  }, []);

  const openLauncher = useCallback(() => {
    setIsLauncherOpen(true);
  }, []);

  const closeLauncher = useCallback(() => {
    setIsLauncherOpen(false);
  }, []);

  return {
    // State
    tutorialState,
    isLauncherOpen,
    
    // Tutorial control
    startTutorial,
    nextStep,
    previousStep,
    skipStep,
    pauseTutorial,
    resumeTutorial,
    completeTutorial,
    
    // Tutorial management
    registerTutorialFlow,
    getAvailableTutorials,
    getProgress,
    
    // Settings
    toggleTooltips,
    toggleContextualHelp,
    
    // UI control
    openLauncher,
    closeLauncher,
  };
};

export const useTooltips = () => {
  const [tooltips, setTooltips] = useState<TooltipConfig[]>([]);
  const [enabled, setEnabled] = useState(true);

  const registerTooltip = useCallback((tooltip: TooltipConfig) => {
    setTooltips(prev => {
      const existing = prev.findIndex(t => t.id === tooltip.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = tooltip;
        return updated;
      }
      return [...prev, tooltip];
    });
  }, []);

  const unregisterTooltip = useCallback((tooltipId: string) => {
    setTooltips(prev => prev.filter(t => t.id !== tooltipId));
  }, []);

  const clearTooltips = useCallback(() => {
    setTooltips([]);
  }, []);

  const toggleTooltips = useCallback((isEnabled: boolean) => {
    setEnabled(isEnabled);
  }, []);

  return {
    tooltips,
    enabled,
    registerTooltip,
    unregisterTooltip,
    clearTooltips,
    toggleTooltips,
  };
};

export const useContextualHelp = () => {
  const [helpItems, setHelpItems] = useState<ContextualHelp[]>([]);
  const [enabled, setEnabled] = useState(true);

  const registerHelp = useCallback((help: ContextualHelp) => {
    setHelpItems(prev => {
      const existing = prev.findIndex(h => h.id === help.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = help;
        return updated;
      }
      return [...prev, help];
    });
  }, []);

  const unregisterHelp = useCallback((helpId: string) => {
    setHelpItems(prev => prev.filter(h => h.id !== helpId));
  }, []);

  const clearHelp = useCallback(() => {
    setHelpItems([]);
  }, []);

  const toggleContextualHelp = useCallback((isEnabled: boolean) => {
    setEnabled(isEnabled);
  }, []);

  return {
    helpItems,
    enabled,
    registerHelp,
    unregisterHelp,
    clearHelp,
    toggleContextualHelp,
  };
};