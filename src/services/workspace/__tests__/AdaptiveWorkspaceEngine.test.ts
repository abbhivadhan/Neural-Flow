// Tests for Adaptive Workspace Engine
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adaptiveWorkspaceEngine } from '../AdaptiveWorkspaceEngine';
import { behaviorTracker } from '../BehaviorTracker';
import { contextAnalyzer } from '../ContextAnalyzer';

// Mock storage
vi.mock('../../utils/storage', () => ({
  storage: {
    set: vi.fn().mockResolvedValue({ success: true }),
    get: vi.fn().mockResolvedValue({ success: false }),
    remove: vi.fn().mockReturnValue(true),
    exists: vi.fn().mockReturnValue(false),
    clear: vi.fn().mockReturnValue(true)
  },
  StorageKeys: {
    USER_PREFERENCES: 'user_preferences',
    USER_BEHAVIOR_PATTERN: 'user_behavior_pattern'
  },
  storageUtils: {
    saveUserPreferences: vi.fn().mockResolvedValue(true),
    getUserPreferences: vi.fn().mockResolvedValue(null)
  }
}));

describe('AdaptiveWorkspaceEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize without errors', () => {
    expect(adaptiveWorkspaceEngine).toBeDefined();
  });

  it('should track user interactions', async () => {
    const interaction = {
      type: 'click' as const,
      target: 'button',
      timestamp: Date.now()
    };

    await adaptiveWorkspaceEngine.trackInteraction(interaction);
    
    // Should not throw errors
    expect(true).toBe(true);
  });

  it('should analyze workspace and return state', async () => {
    const result = await adaptiveWorkspaceEngine.analyzeWorkspace();
    
    expect(result).toBeDefined();
    expect(result.state).toBeDefined();
    expect(result.insights).toBeDefined();
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('should get current workspace state', async () => {
    const state = await adaptiveWorkspaceEngine.getCurrentState();
    
    expect(state).toBeDefined();
    expect(state.context).toBeDefined();
    expect(state.layout).toBeDefined();
    expect(state.preferences).toBeDefined();
    expect(state.behaviorAnalysis).toBeDefined();
  });

  it('should generate workspace insights', async () => {
    const insights = await adaptiveWorkspaceEngine.getWorkspaceInsights();
    
    expect(Array.isArray(insights)).toBe(true);
  });

  it('should predict workspace changes', async () => {
    const predictions = await adaptiveWorkspaceEngine.predictWorkspaceChanges();
    
    expect(Array.isArray(predictions)).toBe(true);
  });

  it('should handle feedback learning', async () => {
    await adaptiveWorkspaceEngine.learnFromFeedback(
      'test-adaptation',
      'positive',
      'This worked well'
    );
    
    // Should not throw errors
    expect(true).toBe(true);
  });

  it('should export and import workspace config', async () => {
    const config = await adaptiveWorkspaceEngine.exportWorkspaceConfig();
    expect(config).toBeDefined();
    
    const imported = await adaptiveWorkspaceEngine.importWorkspaceConfig(config);
    expect(imported).toBe(true);
  });
});

describe('BehaviorTracker', () => {
  it('should track interactions', () => {
    const interaction = {
      type: 'keyboard' as const,
      target: 'input',
      timestamp: Date.now()
    };

    behaviorTracker.trackInteraction(interaction);
    
    // Should not throw errors
    expect(true).toBe(true);
  });

  it('should analyze behavior patterns', () => {
    const analysis = behaviorTracker.analyzeBehavior();
    
    expect(analysis).toBeDefined();
    expect(analysis.patterns).toBeDefined();
    expect(analysis.insights).toBeDefined();
    expect(analysis.predictions).toBeDefined();
    expect(analysis.confidence).toBeGreaterThanOrEqual(0);
  });

  it('should get task sequences', () => {
    const sequences = behaviorTracker.getTaskSequences();
    expect(Array.isArray(sequences)).toBe(true);
  });

  it('should get time patterns', () => {
    const patterns = behaviorTracker.getTimePatterns();
    expect(Array.isArray(patterns)).toBe(true);
  });
});

describe('ContextAnalyzer', () => {
  it('should analyze current context', async () => {
    const context = await contextAnalyzer.analyzeCurrentContext();
    
    expect(context).toBeDefined();
    expect(context.type).toBeDefined();
    expect(context.confidence).toBeGreaterThanOrEqual(0);
    expect(context.confidence).toBeLessThanOrEqual(1);
    expect(context.environment).toBeDefined();
    expect(context.timeContext).toBeDefined();
  });

  it('should predict next context', () => {
    const prediction = contextAnalyzer.predictNextContext();
    
    expect(prediction).toBeDefined();
    expect(prediction.nextContext).toBeDefined();
    expect(prediction.confidence).toBeGreaterThanOrEqual(0);
    expect(prediction.confidence).toBeLessThanOrEqual(1);
  });

  it('should detect context changes', () => {
    const hasChanged = contextAnalyzer.hasContextChanged();
    expect(typeof hasChanged).toBe('boolean');
  });
});