import { TutorialFlow, TutorialStep, TutorialProgress, TutorialState, TutorialInteraction, TutorialReward } from '../../types/tutorial';

export class TutorialEngine {
  private state: TutorialState;
  private listeners: Map<string, Function[]> = new Map();
  private progressStorage = 'neural-flow-tutorial-progress';

  constructor() {
    this.state = this.loadState();
    this.initializeEventListeners();
  }

  private loadState(): TutorialState {
    const saved = localStorage.getItem(this.progressStorage);
    const defaultState: TutorialState = {
      isActive: false,
      progress: {},
      availableFlows: [],
      completedFlows: [],
      unlockedRewards: [],
      showTooltips: true,
      contextualHelpEnabled: true,
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultState, ...parsed };
      } catch (error) {
        console.warn('Failed to parse tutorial state:', error);
      }
    }

    return defaultState;
  }

  private saveState(): void {
    try {
      localStorage.setItem(this.progressStorage, JSON.stringify(this.state));
    } catch (error) {
      console.warn('Failed to save tutorial state:', error);
    }
  }

  private initializeEventListeners(): void {
    // Listen for DOM changes to update contextual help
    if (typeof window !== 'undefined') {
      const observer = new MutationObserver(() => {
        this.updateContextualHelp();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }
  }

  public registerTutorialFlow(flow: TutorialFlow): void {
    const existingIndex = this.state.availableFlows.findIndex(f => f.id === flow.id);
    if (existingIndex >= 0) {
      this.state.availableFlows[existingIndex] = flow;
    } else {
      this.state.availableFlows.push(flow);
    }
    this.saveState();
    this.emit('flowRegistered', flow);
  }

  public startTutorial(flowId: string): boolean {
    const flow = this.state.availableFlows.find(f => f.id === flowId);
    if (!flow) {
      console.warn(`Tutorial flow ${flowId} not found`);
      return false;
    }

    // Check prerequisites
    if (flow.prerequisites) {
      const unmetPrereqs = flow.prerequisites.filter(
        prereq => !this.state.completedFlows.includes(prereq)
      );
      if (unmetPrereqs.length > 0) {
        console.warn(`Prerequisites not met for ${flowId}:`, unmetPrereqs);
        return false;
      }
    }

    // Initialize progress
    const progress: TutorialProgress = {
      userId: 'current-user', // In real app, get from auth
      flowId,
      currentStepIndex: 0,
      completedSteps: [],
      startedAt: new Date(),
      lastActiveAt: new Date(),
      skippedSteps: [],
      timeSpent: 0,
      interactions: [],
    };

    this.state.progress[flowId] = progress;
    this.state.currentFlow = flow;
    this.state.currentStep = flow.steps[0];
    this.state.isActive = true;

    this.saveState();
    this.emit('tutorialStarted', { flow, step: flow.steps[0] });
    
    return true;
  }

  public nextStep(): boolean {
    if (!this.state.currentFlow || !this.state.currentStep) {
      return false;
    }

    const progress = this.state.progress[this.state.currentFlow.id];
    if (!progress) return false;

    // Mark current step as completed
    if (!progress.completedSteps.includes(this.state.currentStep.id)) {
      progress.completedSteps.push(this.state.currentStep.id);
    }

    // Move to next step
    const nextIndex = progress.currentStepIndex + 1;
    if (nextIndex >= this.state.currentFlow.steps.length) {
      return this.completeTutorial();
    }

    progress.currentStepIndex = nextIndex;
    progress.lastActiveAt = new Date();
    this.state.currentStep = this.state.currentFlow.steps[nextIndex];

    this.saveState();
    this.emit('stepChanged', { step: this.state.currentStep, progress });
    
    return true;
  }

  public previousStep(): boolean {
    if (!this.state.currentFlow || !this.state.currentStep) {
      return false;
    }

    const progress = this.state.progress[this.state.currentFlow.id];
    if (!progress || progress.currentStepIndex <= 0) {
      return false;
    }

    progress.currentStepIndex -= 1;
    progress.lastActiveAt = new Date();
    this.state.currentStep = this.state.currentFlow.steps[progress.currentStepIndex];

    this.saveState();
    this.emit('stepChanged', { step: this.state.currentStep, progress });
    
    return true;
  }

  public skipStep(): boolean {
    if (!this.state.currentFlow || !this.state.currentStep) {
      return false;
    }

    if (!this.state.currentStep.skippable) {
      return false;
    }

    const progress = this.state.progress[this.state.currentFlow.id];
    if (!progress) return false;

    progress.skippedSteps.push(this.state.currentStep.id);
    return this.nextStep();
  }

  public completeTutorial(): boolean {
    if (!this.state.currentFlow) {
      return false;
    }

    const flowId = this.state.currentFlow.id;
    const progress = this.state.progress[flowId];
    if (!progress) return false;

    progress.completedAt = new Date();
    this.state.completedFlows.push(flowId);

    // Award rewards
    if (this.state.currentFlow.rewards) {
      this.state.unlockedRewards.push(...this.state.currentFlow.rewards);
    }

    // Reset active state
    this.state.isActive = false;
    this.state.currentFlow = undefined;
    this.state.currentStep = undefined;

    this.saveState();
    this.emit('tutorialCompleted', { flowId, progress });
    
    return true;
  }

  public pauseTutorial(): void {
    this.state.isActive = false;
    this.saveState();
    this.emit('tutorialPaused');
  }

  public resumeTutorial(flowId: string): boolean {
    const flow = this.state.availableFlows.find(f => f.id === flowId);
    const progress = this.state.progress[flowId];
    
    if (!flow || !progress || progress.completedAt) {
      return false;
    }

    this.state.currentFlow = flow;
    this.state.currentStep = flow.steps[progress.currentStepIndex];
    this.state.isActive = true;
    progress.lastActiveAt = new Date();

    this.saveState();
    this.emit('tutorialResumed', { flow, step: this.state.currentStep });
    
    return true;
  }

  public recordInteraction(stepId: string, action: string, success: boolean, timeToComplete?: number): void {
    if (!this.state.currentFlow) return;

    const progress = this.state.progress[this.state.currentFlow.id];
    if (!progress) return;

    const interaction: TutorialInteraction = {
      stepId,
      action,
      timestamp: new Date(),
      success,
      timeToComplete,
    };

    progress.interactions.push(interaction);
    progress.lastActiveAt = new Date();
    
    this.saveState();
    this.emit('interactionRecorded', interaction);
  }

  public getAvailableTutorials(): TutorialFlow[] {
    return this.state.availableFlows.filter(flow => {
      // Check if already completed
      if (this.state.completedFlows.includes(flow.id)) {
        return false;
      }

      // Check prerequisites
      if (flow.prerequisites) {
        return flow.prerequisites.every(prereq => 
          this.state.completedFlows.includes(prereq)
        );
      }

      return true;
    });
  }

  public getProgress(flowId: string): TutorialProgress | undefined {
    return this.state.progress[flowId];
  }

  public getCurrentState(): TutorialState {
    return { ...this.state };
  }

  public updateContextualHelp(): void {
    // This would analyze current page/context and suggest relevant help
    this.emit('contextualHelpUpdated');
  }

  public toggleTooltips(enabled: boolean): void {
    this.state.showTooltips = enabled;
    this.saveState();
    this.emit('tooltipsToggled', enabled);
  }

  public toggleContextualHelp(enabled: boolean): void {
    this.state.contextualHelpEnabled = enabled;
    this.saveState();
    this.emit('contextualHelpToggled', enabled);
  }

  // Event system
  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}

export const tutorialEngine = new TutorialEngine();