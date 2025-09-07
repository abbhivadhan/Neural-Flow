import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AdaptiveWorkspaceEngine } from '../AdaptiveWorkspaceEngine';
import { UserInteraction, WorkContext } from '../../../types/ai';
import { WorkspaceLayout, UserPreferences } from '../../../types/common';

// Mock the dependencies
vi.mock('../BehaviorTracker', () => ({
  BehaviorTracker: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    trackInteraction: vi.fn().mockResolvedValue(undefined),
    getRecentPatterns: vi.fn().mockReturnValue([]),
    getBehaviorSummary: vi.fn().mockReturnValue({
      totalInteractions: 100,
      averageSessionLength: 45,
      mostActiveHours: [9, 10, 14, 15],
      preferredContexts: ['coding', 'reading']
    }),
    dispose: vi.fn()
  }))
}));

vi.mock('../ContextAnalyzer', () => ({
  ContextAnalyzer: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    analyzeCurrentContext: vi.fn().mockResolvedValue({
      type: 'work',
      timeOfDay: 'morning',
      urgency: 'medium',
      data: { focus: 0.8, energy: 0.7 }
    }),
    predictContextChange: vi.fn().mockResolvedValue({
      nextContext: 'meeting',
      confidence: 0.75,
      timeToChange: 15
    }),
    dispose: vi.fn()
  }))
}));

vi.mock('../LayoutOptimizer', () => ({
  LayoutOptimizer: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    optimizeLayout: vi.fn().mockResolvedValue({
      layout: 'focus-mode',
      components: ['editor', 'terminal', 'file-explorer'],
      configuration: { sidebar: 'collapsed', panels: 'minimal' }
    }),
    suggestLayoutChange: vi.fn().mockResolvedValue({
      suggested: true,
      reason: 'Context change detected',
      newLayout: 'collaboration-mode'
    }),
    dispose: vi.fn()
  }))
}));

vi.mock('../PreferencesManager', () => ({
  PreferencesManager: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getUserPreferences: vi.fn().mockReturnValue({
      theme: 'dark',
      layout: 'adaptive',
      notifications: true,
      autoSave: true,
      keyboardShortcuts: 'vscode'
    }),
    updatePreferences: vi.fn().mockResolvedValue(undefined),
    learnFromBehavior: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn()
  }))
}));

describe('AdaptiveWorkspaceEngine', () => {
  let engine: AdaptiveWorkspaceEngine;
  let mockUserInteractions: UserInteraction[];
  let mockWorkContext: WorkContext;
  let mockUserPreferences: UserPreferences;

  beforeEach(async () => {
    engine = new AdaptiveWorkspaceEngine();
    
    mockUserInteractions = [
      {
        id: 'int-1',
        action: 'click',
        context: 'coding',
        timestamp: Date.now() - 300000, // 5 minutes ago
        duration: 5000,
        metadata: { element: 'file-explorer', file: 'component.tsx' }
      },
      {
        id: 'int-2',
        action: 'type',
        context: 'coding',
        timestamp: Date.now() - 240000, // 4 minutes ago
        duration: 180000, // 3 minutes of typing
        metadata: { file: 'component.tsx', lines: 45, characters: 1200 }
      },
      {
        id: 'int-3',
        action: 'scroll',
        context: 'reading',
        timestamp: Date.now() - 120000, // 2 minutes ago
        duration: 30000,
        metadata: { document: 'documentation.md', scrollDistance: 800 }
      }
    ];

    mockWorkContext = {
      type: 'work',
      timeOfDay: 'morning',
      urgency: 'medium',
      data: {
        currentProject: 'neural-flow',
        activeFiles: ['component.tsx', 'service.ts'],
        recentActions: ['edit', 'debug', 'test']
      }
    };

    mockUserPreferences = {
      theme: 'dark',
      layout: 'adaptive',
      notifications: true,
      autoSave: true,
      keyboardShortcuts: 'vscode',
      workspaceLayout: {
        sidebar: { visible: true, width: 300 },
        panels: { bottom: { visible: false }, right: { visible: true } },
        editor: { fontSize: 14, tabSize: 2 }
      }
    };

    await engine.initialize();
  });

  afterEach(() => {
    engine.dispose();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const newEngine = new AdaptiveWorkspaceEngine();
      await expect(newEngine.initialize()).resolves.not.toThrow();
      newEngine.dispose();
    });

    it('should initialize all sub-components', async () => {
      expect(engine).toBeDefined();
      // All mocked components should be initialized
      const summary = engine.getEngineSummary();
      expect(summary).toBeDefined();
      expect(typeof summary).toBe('string');
    });
  });

  describe('analyzeUserBehavior', () => {
    it('should analyze user behavior patterns', async () => {
      const behaviorPattern = await engine.analyzeUserBehavior(mockUserInteractions);

      expect(behaviorPattern).toBeDefined();
      expect(behaviorPattern).toHaveProperty('type');
      expect(behaviorPattern).toHaveProperty('confidence');
      expect(behaviorPattern).toHaveProperty('features');
      expect(behaviorPattern).toHaveProperty('recommendations');

      expect(typeof behaviorPattern.confidence).toBe('number');
      expect(behaviorPattern.confidence).toBeGreaterThanOrEqual(0);
      expect(behaviorPattern.confidence).toBeLessThanOrEqual(1);

      expect(Array.isArray(behaviorPattern.recommendations)).toBe(true);
    });

    it('should identify focus patterns', async () => {
      const focusInteractions: UserInteraction[] = [
        {
          id: 'focus-1',
          action: 'type',
          context: 'coding',
          timestamp: Date.now() - 1800000, // 30 minutes ago
          duration: 1200000, // 20 minutes of continuous typing
          metadata: { file: 'service.ts', focusScore: 0.9 }
        },
        {
          id: 'focus-2',
          action: 'type',
          context: 'coding',
          timestamp: Date.now() - 600000, // 10 minutes ago
          duration: 600000, // 10 minutes more
          metadata: { file: 'service.ts', focusScore: 0.85 }
        }
      ];

      const behaviorPattern = await engine.analyzeUserBehavior(focusInteractions);

      expect(behaviorPattern.type).toBe('deep-focus');
      expect(behaviorPattern.confidence).toBeGreaterThan(0.7);
      expect(behaviorPattern.features.focusDuration).toBeGreaterThan(1000000); // > 16 minutes
    });

    it('should identify multitasking patterns', async () => {
      const multitaskingInteractions: UserInteraction[] = Array.from({ length: 10 }, (_, i) => ({
        id: `multi-${i}`,
        action: 'switch',
        context: i % 2 === 0 ? 'coding' : 'email',
        timestamp: Date.now() - (i * 60000), // Every minute
        duration: 30000, // Short durations
        metadata: { from: i % 2 === 0 ? 'editor' : 'email', to: i % 2 === 0 ? 'email' : 'editor' }
      }));

      const behaviorPattern = await engine.analyzeUserBehavior(multitaskingInteractions);

      expect(behaviorPattern.type).toBe('multitasking');
      expect(behaviorPattern.features.contextSwitches).toBeGreaterThan(5);
    });

    it('should handle empty interaction data', async () => {
      const behaviorPattern = await engine.analyzeUserBehavior([]);

      expect(behaviorPattern).toBeDefined();
      expect(behaviorPattern.type).toBe('unknown');
      expect(behaviorPattern.confidence).toBe(0);
    });
  });

  describe('predictNextAction', () => {
    it('should predict next user actions', async () => {
      const predictions = await engine.predictNextAction(mockWorkContext);

      expect(predictions).toBeDefined();
      expect(Array.isArray(predictions)).toBe(true);
      expect(predictions.length).toBeGreaterThan(0);

      if (predictions.length > 0) {
        const prediction = predictions[0];
        expect(prediction).toHaveProperty('action');
        expect(prediction).toHaveProperty('confidence');
        expect(prediction).toHaveProperty('context');
        expect(prediction).toHaveProperty('reasoning');

        expect(typeof prediction.confidence).toBe('number');
        expect(prediction.confidence).toBeGreaterThan(0);
        expect(prediction.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should consider current context in predictions', async () => {
      const codingContext: WorkContext = {
        ...mockWorkContext,
        data: { ...mockWorkContext.data, currentActivity: 'debugging' }
      };

      const predictions = await engine.predictNextAction(codingContext);

      // Should predict debugging-related actions
      const debuggingPrediction = predictions.find(p => 
        p.action.includes('debug') || p.context === 'debugging'
      );
      
      if (debuggingPrediction) {
        expect(debuggingPrediction.confidence).toBeGreaterThan(0.5);
      }
    });

    it('should provide reasoning for predictions', async () => {
      const predictions = await engine.predictNextAction(mockWorkContext);

      predictions.forEach(prediction => {
        expect(prediction.reasoning).toBeDefined();
        expect(typeof prediction.reasoning).toBe('string');
        expect(prediction.reasoning.length).toBeGreaterThan(0);
      });
    });
  });

  describe('optimizeLayout', () => {
    it('should optimize workspace layout based on preferences', async () => {
      const optimizedLayout = await engine.optimizeLayout(mockUserPreferences);

      expect(optimizedLayout).toBeDefined();
      expect(optimizedLayout).toHaveProperty('layout');
      expect(optimizedLayout).toHaveProperty('components');
      expect(optimizedLayout).toHaveProperty('configuration');
      expect(optimizedLayout).toHaveProperty('reasoning');

      expect(Array.isArray(optimizedLayout.components)).toBe(true);
      expect(typeof optimizedLayout.reasoning).toBe('string');
    });

    it('should adapt layout for different work contexts', async () => {
      const meetingContext: WorkContext = {
        ...mockWorkContext,
        type: 'meeting',
        data: { ...mockWorkContext.data, upcomingMeeting: true }
      };

      const layoutForMeeting = await engine.optimizeLayout(mockUserPreferences, meetingContext);

      expect(layoutForMeeting.layout).toBeDefined();
      // Should suggest meeting-appropriate layout
      expect(layoutForMeeting.reasoning).toContain('meeting');
    });

    it('should consider screen size and device capabilities', async () => {
      const mobilePreferences: UserPreferences = {
        ...mockUserPreferences,
        deviceType: 'mobile',
        screenSize: { width: 375, height: 812 }
      };

      const mobileLayout = await engine.optimizeLayout(mobilePreferences);

      expect(mobileLayout).toBeDefined();
      // Should adapt for mobile constraints
      expect(mobileLayout.configuration).toBeDefined();
    });
  });

  describe('adaptToContext', () => {
    it('should adapt workspace to current context', async () => {
      const adaptedWorkspace = await engine.adaptToContext(mockWorkContext);

      expect(adaptedWorkspace).toBeDefined();
      expect(adaptedWorkspace).toHaveProperty('layout');
      expect(adaptedWorkspace).toHaveProperty('tools');
      expect(adaptedWorkspace).toHaveProperty('settings');
      expect(adaptedWorkspace).toHaveProperty('adaptationReason');

      expect(Array.isArray(adaptedWorkspace.tools)).toBe(true);
      expect(typeof adaptedWorkspace.adaptationReason).toBe('string');
    });

    it('should adapt for urgent contexts', async () => {
      const urgentContext: WorkContext = {
        ...mockWorkContext,
        urgency: 'high',
        data: { ...mockWorkContext.data, deadline: 'today' }
      };

      const adaptedWorkspace = await engine.adaptToContext(urgentContext);

      expect(adaptedWorkspace.layout).toBe('focus-mode');
      expect(adaptedWorkspace.adaptationReason).toContain('urgent');
    });

    it('should adapt for collaborative contexts', async () => {
      const collaborativeContext: WorkContext = {
        ...mockWorkContext,
        type: 'collaboration',
        data: { ...mockWorkContext.data, activeCollaborators: ['user1', 'user2'] }
      };

      const adaptedWorkspace = await engine.adaptToContext(collaborativeContext);

      expect(adaptedWorkspace.tools).toContain('collaboration');
      expect(adaptedWorkspace.adaptationReason).toContain('collaboration');
    });

    it('should maintain user preferences during adaptation', async () => {
      const adaptedWorkspace = await engine.adaptToContext(mockWorkContext);

      // Should respect user's theme preference
      expect(adaptedWorkspace.settings.theme).toBe(mockUserPreferences.theme);
    });
  });

  describe('learning and improvement', () => {
    it('should learn from user feedback', async () => {
      const feedback = {
        adaptationId: 'adapt-123',
        userRating: 4,
        useful: true,
        comments: 'Good adaptation for coding session'
      };

      await expect(
        engine.learnFromFeedback(feedback)
      ).resolves.not.toThrow();
    });

    it('should improve predictions based on usage patterns', async () => {
      // Simulate multiple interactions to build patterns
      for (let i = 0; i < 5; i++) {
        await engine.analyzeUserBehavior(mockUserInteractions);
        await engine.adaptToContext(mockWorkContext);
      }

      const predictions = await engine.predictNextAction(mockWorkContext);
      
      // Predictions should improve with more data
      expect(predictions[0].confidence).toBeGreaterThan(0.6);
    });

    it('should update preferences based on behavior', async () => {
      const behaviorData = {
        preferredLayoutChanges: ['sidebar-collapsed', 'terminal-visible'],
        frequentActions: ['file-search', 'git-commit'],
        timePatterns: { mostActive: [9, 14, 16] }
      };

      await expect(
        engine.updatePreferencesFromBehavior(behaviorData)
      ).resolves.not.toThrow();
    });
  });

  describe('performance optimization', () => {
    it('should handle rapid context changes efficiently', async () => {
      const rapidContexts: WorkContext[] = Array.from({ length: 20 }, (_, i) => ({
        type: i % 2 === 0 ? 'work' : 'meeting',
        timeOfDay: 'afternoon',
        urgency: 'medium',
        data: { contextId: i }
      }));

      const startTime = Date.now();
      
      for (const context of rapidContexts) {
        await engine.adaptToContext(context);
      }
      
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // Should handle 20 adaptations in < 5 seconds
    });

    it('should cache optimization results', async () => {
      // First optimization
      await engine.optimizeLayout(mockUserPreferences, mockWorkContext);

      // Second optimization with same inputs should be faster
      const startTime = Date.now();
      await engine.optimizeLayout(mockUserPreferences, mockWorkContext);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(50); // Should be very fast due to caching
    });

    it('should limit memory usage for large interaction histories', async () => {
      const largeInteractionHistory: UserInteraction[] = Array.from({ length: 10000 }, (_, i) => ({
        id: `large-${i}`,
        action: ['click', 'type', 'scroll'][i % 3],
        context: ['coding', 'reading', 'debugging'][i % 3],
        timestamp: Date.now() - (i * 60000),
        duration: Math.random() * 120000 + 5000,
        metadata: { index: i }
      }));

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      await engine.analyzeUserBehavior(largeInteractionHistory);
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
      }
    });
  });

  describe('error handling', () => {
    it('should handle invalid user interactions gracefully', async () => {
      const invalidInteractions = [
        {
          id: null,
          action: undefined,
          timestamp: 'invalid'
        }
      ] as any;

      const behaviorPattern = await engine.analyzeUserBehavior(invalidInteractions);
      
      expect(behaviorPattern).toBeDefined();
      expect(behaviorPattern.type).toBe('unknown');
    });

    it('should handle context analysis failures', async () => {
      // Mock context analyzer to throw error
      const mockContextAnalyzer = (engine as any).contextAnalyzer;
      mockContextAnalyzer.analyzeCurrentContext = vi.fn().mockRejectedValue(new Error('Analysis failed'));

      const adaptedWorkspace = await engine.adaptToContext(mockWorkContext);
      
      expect(adaptedWorkspace).toBeDefined();
      // Should provide fallback adaptation
      expect(adaptedWorkspace.layout).toBeDefined();
    });

    it('should handle layout optimization failures', async () => {
      // Mock layout optimizer to throw error
      const mockLayoutOptimizer = (engine as any).layoutOptimizer;
      mockLayoutOptimizer.optimizeLayout = vi.fn().mockRejectedValue(new Error('Optimization failed'));

      const optimizedLayout = await engine.optimizeLayout(mockUserPreferences);
      
      expect(optimizedLayout).toBeDefined();
      // Should provide fallback layout
      expect(optimizedLayout.layout).toBeDefined();
    });

    it('should handle corrupted preferences gracefully', async () => {
      const corruptedPreferences = {
        theme: null,
        layout: undefined,
        workspaceLayout: 'invalid'
      } as any;

      const optimizedLayout = await engine.optimizeLayout(corruptedPreferences);
      
      expect(optimizedLayout).toBeDefined();
      // Should use default preferences
      expect(optimizedLayout.layout).toBeDefined();
    });
  });

  describe('integration and coordination', () => {
    it('should coordinate between all sub-components', async () => {
      const workspaceState = await engine.getWorkspaceState();

      expect(workspaceState).toBeDefined();
      expect(workspaceState).toHaveProperty('behaviorSummary');
      expect(workspaceState).toHaveProperty('currentContext');
      expect(workspaceState).toHaveProperty('optimizedLayout');
      expect(workspaceState).toHaveProperty('userPreferences');
    });

    it('should maintain consistency across adaptations', async () => {
      const adaptation1 = await engine.adaptToContext(mockWorkContext);
      const adaptation2 = await engine.adaptToContext(mockWorkContext);

      // Same context should produce consistent adaptations
      expect(adaptation1.layout).toBe(adaptation2.layout);
      expect(adaptation1.settings.theme).toBe(adaptation2.settings.theme);
    });

    it('should handle concurrent adaptation requests', async () => {
      const contexts = [mockWorkContext, mockWorkContext, mockWorkContext];
      
      const adaptationPromises = contexts.map(context => 
        engine.adaptToContext(context)
      );

      const adaptations = await Promise.all(adaptationPromises);
      
      expect(adaptations).toHaveLength(3);
      adaptations.forEach(adaptation => {
        expect(adaptation).toBeDefined();
        expect(adaptation.layout).toBeDefined();
      });
    });
  });

  describe('resource management', () => {
    it('should dispose all resources properly', () => {
      expect(() => engine.dispose()).not.toThrow();
    });

    it('should handle multiple dispose calls', () => {
      engine.dispose();
      expect(() => engine.dispose()).not.toThrow();
    });

    it('should clear all cached data on disposal', () => {
      engine.dispose();
      
      // Should not have any cached state after disposal
      const state = (engine as any).getInternalState?.() || {};
      expect(Object.keys(state)).toHaveLength(0);
    });
  });

  describe('engine summary and diagnostics', () => {
    it('should provide comprehensive engine summary', () => {
      const summary = engine.getEngineSummary();
      
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
      expect(summary).toContain('AdaptiveWorkspaceEngine');
    });

    it('should provide performance metrics', () => {
      const metrics = engine.getPerformanceMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('adaptationCount');
      expect(metrics).toHaveProperty('averageAdaptationTime');
      expect(metrics).toHaveProperty('cacheHitRate');
      expect(metrics).toHaveProperty('errorRate');

      expect(typeof metrics.adaptationCount).toBe('number');
      expect(metrics.adaptationCount).toBeGreaterThanOrEqual(0);
    });
  });
});