import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TutorialEngine } from '../../../services/tutorial/TutorialEngine';
import { TutorialFlow, TutorialStep } from '../../../types/tutorial';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock MutationObserver
global.MutationObserver = class MutationObserver {
  constructor(callback: MutationCallback) {}
  observe() {}
  disconnect() {}
  takeRecords() { return []; }
};

describe('TutorialEngine', () => {
  let tutorialEngine: TutorialEngine;
  let mockFlow: TutorialFlow;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    tutorialEngine = new TutorialEngine();
    
    mockFlow = {
      id: 'test-flow',
      name: 'Test Flow',
      description: 'A test tutorial flow',
      category: 'onboarding',
      difficulty: 'beginner',
      estimatedDuration: 5,
      steps: [
        {
          id: 'step-1',
          title: 'First Step',
          content: 'This is the first step',
          target: '.test-target',
          position: 'center',
          nextTrigger: 'manual',
          skippable: true,
        },
        {
          id: 'step-2',
          title: 'Second Step',
          content: 'This is the second step',
          target: '.test-target-2',
          position: 'bottom',
          nextTrigger: 'manual',
          skippable: false,
        },
      ],
      rewards: [
        {
          type: 'badge',
          id: 'test-badge',
          name: 'Test Badge',
          description: 'Completed test flow',
        },
      ],
    };
  });

  describe('registerTutorialFlow', () => {
    it('should register a new tutorial flow', () => {
      tutorialEngine.registerTutorialFlow(mockFlow);
      
      const availableFlows = tutorialEngine.getAvailableTutorials();
      expect(availableFlows).toContain(mockFlow);
    });

    it('should update existing tutorial flow', () => {
      tutorialEngine.registerTutorialFlow(mockFlow);
      
      const updatedFlow = { ...mockFlow, name: 'Updated Test Flow' };
      tutorialEngine.registerTutorialFlow(updatedFlow);
      
      const availableFlows = tutorialEngine.getAvailableTutorials();
      const foundFlow = availableFlows.find(f => f.id === mockFlow.id);
      expect(foundFlow?.name).toBe('Updated Test Flow');
    });
  });

  describe('startTutorial', () => {
    beforeEach(() => {
      tutorialEngine.registerTutorialFlow(mockFlow);
    });

    it('should start a tutorial successfully', () => {
      const result = tutorialEngine.startTutorial('test-flow');
      
      expect(result).toBe(true);
      
      const state = tutorialEngine.getCurrentState();
      expect(state.isActive).toBe(true);
      expect(state.currentFlow).toEqual(mockFlow);
      expect(state.currentStep).toEqual(mockFlow.steps[0]);
    });

    it('should not start non-existent tutorial', () => {
      const result = tutorialEngine.startTutorial('non-existent');
      
      expect(result).toBe(false);
      
      const state = tutorialEngine.getCurrentState();
      expect(state.isActive).toBe(false);
    });

    it('should not start tutorial with unmet prerequisites', () => {
      const flowWithPrereqs = {
        ...mockFlow,
        id: 'prereq-flow',
        prerequisites: ['required-flow'],
      };
      
      tutorialEngine.registerTutorialFlow(flowWithPrereqs);
      const result = tutorialEngine.startTutorial('prereq-flow');
      
      expect(result).toBe(false);
    });
  });

  describe('nextStep', () => {
    beforeEach(() => {
      tutorialEngine.registerTutorialFlow(mockFlow);
      tutorialEngine.startTutorial('test-flow');
    });

    it('should advance to next step', () => {
      const result = tutorialEngine.nextStep();
      
      expect(result).toBe(true);
      
      const state = tutorialEngine.getCurrentState();
      expect(state.currentStep).toEqual(mockFlow.steps[1]);
      
      const progress = tutorialEngine.getProgress('test-flow');
      expect(progress?.currentStepIndex).toBe(1);
      expect(progress?.completedSteps).toContain('step-1');
    });

    it('should complete tutorial on last step', () => {
      // Move to last step
      tutorialEngine.nextStep();
      
      const result = tutorialEngine.nextStep();
      
      expect(result).toBe(true);
      
      const state = tutorialEngine.getCurrentState();
      expect(state.isActive).toBe(false);
      expect(state.completedFlows).toContain('test-flow');
      expect(state.unlockedRewards).toEqual(mockFlow.rewards);
    });
  });

  describe('previousStep', () => {
    beforeEach(() => {
      tutorialEngine.registerTutorialFlow(mockFlow);
      tutorialEngine.startTutorial('test-flow');
      tutorialEngine.nextStep(); // Move to second step
    });

    it('should go back to previous step', () => {
      const result = tutorialEngine.previousStep();
      
      expect(result).toBe(true);
      
      const state = tutorialEngine.getCurrentState();
      expect(state.currentStep).toEqual(mockFlow.steps[0]);
      
      const progress = tutorialEngine.getProgress('test-flow');
      expect(progress?.currentStepIndex).toBe(0);
    });

    it('should not go back from first step', () => {
      tutorialEngine.previousStep(); // Go back to first step
      
      const result = tutorialEngine.previousStep();
      
      expect(result).toBe(false);
      
      const progress = tutorialEngine.getProgress('test-flow');
      expect(progress?.currentStepIndex).toBe(0);
    });
  });

  describe('skipStep', () => {
    beforeEach(() => {
      tutorialEngine.registerTutorialFlow(mockFlow);
      tutorialEngine.startTutorial('test-flow');
    });

    it('should skip skippable step', () => {
      const result = tutorialEngine.skipStep();
      
      expect(result).toBe(true);
      
      const progress = tutorialEngine.getProgress('test-flow');
      expect(progress?.skippedSteps).toContain('step-1');
      expect(progress?.currentStepIndex).toBe(1);
    });

    it('should not skip non-skippable step', () => {
      tutorialEngine.nextStep(); // Move to non-skippable step
      
      const result = tutorialEngine.skipStep();
      
      expect(result).toBe(false);
      
      const progress = tutorialEngine.getProgress('test-flow');
      expect(progress?.skippedSteps).not.toContain('step-2');
    });
  });

  describe('recordInteraction', () => {
    beforeEach(() => {
      tutorialEngine.registerTutorialFlow(mockFlow);
      tutorialEngine.startTutorial('test-flow');
    });

    it('should record user interaction', () => {
      tutorialEngine.recordInteraction('step-1', 'click', true, 1000);
      
      const progress = tutorialEngine.getProgress('test-flow');
      expect(progress?.interactions).toHaveLength(1);
      expect(progress?.interactions[0]).toMatchObject({
        stepId: 'step-1',
        action: 'click',
        success: true,
        timeToComplete: 1000,
      });
    });
  });

  describe('pauseTutorial and resumeTutorial', () => {
    beforeEach(() => {
      tutorialEngine.registerTutorialFlow(mockFlow);
      tutorialEngine.startTutorial('test-flow');
    });

    it('should pause and resume tutorial', () => {
      tutorialEngine.pauseTutorial();
      
      let state = tutorialEngine.getCurrentState();
      expect(state.isActive).toBe(false);
      
      const result = tutorialEngine.resumeTutorial('test-flow');
      expect(result).toBe(true);
      
      state = tutorialEngine.getCurrentState();
      expect(state.isActive).toBe(true);
      expect(state.currentFlow).toEqual(mockFlow);
    });
  });

  describe('state persistence', () => {
    it('should save state to localStorage', () => {
      tutorialEngine.registerTutorialFlow(mockFlow);
      tutorialEngine.startTutorial('test-flow');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'neural-flow-tutorial-progress',
        expect.any(String)
      );
    });

    it('should load state from localStorage', () => {
      const savedState = {
        isActive: false,
        progress: {
          'test-flow': {
            userId: 'current-user',
            flowId: 'test-flow',
            currentStepIndex: 1,
            completedSteps: ['step-1'],
            startedAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
            skippedSteps: [],
            timeSpent: 30,
            interactions: [],
          },
        },
        availableFlows: [],
        completedFlows: [],
        unlockedRewards: [],
        showTooltips: true,
        contextualHelpEnabled: true,
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState));
      
      const newEngine = new TutorialEngine();
      const state = newEngine.getCurrentState();
      
      expect(state.progress['test-flow']).toBeDefined();
      expect(state.progress['test-flow'].currentStepIndex).toBe(1);
    });
  });
});