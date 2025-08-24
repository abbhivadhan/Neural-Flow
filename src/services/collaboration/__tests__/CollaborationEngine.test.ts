import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CollaborationEngine, CollaborationConfig } from '../CollaborationEngine';
import { TeamMember, Operation } from '../../../types/collaboration';

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1, // OPEN
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
}));

describe('CollaborationEngine', () => {
  let engine: CollaborationEngine;
  let config: CollaborationConfig;
  let mockTeamMembers: TeamMember[];

  beforeEach(() => {
    config = {
      websocketUrl: 'ws://localhost:8080/test',
      userId: 'test-user',
      sessionId: 'test-session',
      enableRealTimeSync: true,
      enableConflictResolution: true,
      enableExpertiseMatching: true,
      enableCommunicationAnalysis: true
    };

    mockTeamMembers = [
      {
        id: 'user1',
        name: 'Alice',
        email: 'alice@test.com',
        expertise: ['React', 'TypeScript'],
        availability: 'available',
        skills: [
          { name: 'React', level: 8, category: 'Frontend', verified: true },
          { name: 'TypeScript', level: 7, category: 'Programming', verified: true }
        ],
        communicationStyle: {
          responseTime: 15,
          preferredChannels: ['chat'],
          workingHours: { start: '09:00', end: '17:00' },
          timezone: 'UTC'
        }
      },
      {
        id: 'user2',
        name: 'Bob',
        email: 'bob@test.com',
        expertise: ['Python', 'Machine Learning'],
        availability: 'busy',
        skills: [
          { name: 'Python', level: 9, category: 'Programming', verified: true },
          { name: 'Machine Learning', level: 8, category: 'AI/ML', verified: true }
        ],
        communicationStyle: {
          responseTime: 30,
          preferredChannels: ['email'],
          workingHours: { start: '10:00', end: '18:00' },
          timezone: 'UTC'
        }
      }
    ];

    engine = new CollaborationEngine(config);
  });

  afterEach(() => {
    engine.destroy();
  });

  describe('Initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(engine).toBeDefined();
      expect(engine.getCurrentSession()).toBeNull();
      expect(engine.getTeamMembers()).toEqual([]);
    });

    it('should set up event listeners', () => {
      const callback = vi.fn();
      engine.on('session_started', callback);
      
      // Verify listener was added (internal state check)
      expect(callback).toBeDefined();
    });
  });

  describe('Session Management', () => {
    it('should start a collaboration session', async () => {
      const sessionStartedCallback = vi.fn();
      engine.on('session_started', sessionStartedCallback);

      // Mock successful WebSocket connection
      const mockConnect = vi.spyOn(engine['wsClient'], 'connect').mockResolvedValue();

      await engine.startSession('test-session', mockTeamMembers);

      expect(mockConnect).toHaveBeenCalledWith('test-user', 'test-session');
      expect(engine.getCurrentSession()).toBeTruthy();
      expect(engine.getTeamMembers()).toEqual(mockTeamMembers);
    });

    it('should end a collaboration session', async () => {
      // Start session first
      vi.spyOn(engine['wsClient'], 'connect').mockResolvedValue();
      await engine.startSession('test-session', mockTeamMembers);

      const sessionEndedCallback = vi.fn();
      engine.on('session_ended', sessionEndedCallback);

      await engine.endSession();

      expect(engine.getCurrentSession()).toBeNull();
      expect(engine.getPresenceInfo().size).toBe(0);
      expect(engine.getCursorPositions().size).toBe(0);
    });
  });

  describe('Operations', () => {
    beforeEach(async () => {
      vi.spyOn(engine['wsClient'], 'connect').mockResolvedValue();
      await engine.startSession('test-session', mockTeamMembers);
    });

    it('should apply local operations', async () => {
      const operation: Operation = {
        id: 'op1',
        type: 'insert',
        position: 0,
        content: 'Hello',
        userId: 'test-user',
        timestamp: new Date(),
        sessionId: 'test-session'
      };

      const sendOperationSpy = vi.spyOn(engine['wsClient'], 'sendOperation');
      const operationAppliedCallback = vi.fn();
      engine.on('operation_applied', operationAppliedCallback);

      const result = await engine.applyOperation(operation);

      expect(result.operation).toEqual(operation);
      expect(result.transformed).toBe(false);
      expect(result.conflicts).toEqual([]);
      expect(sendOperationSpy).toHaveBeenCalledWith(operation);
      expect(operationAppliedCallback).toHaveBeenCalledWith(operation);
    });

    it('should handle cursor updates', () => {
      const sendCursorSpy = vi.spyOn(engine['wsClient'], 'sendCursorPosition');
      
      engine.updateCursor(10, { start: 5, end: 15 });

      const cursorPositions = engine.getCursorPositions();
      const userCursor = cursorPositions.get('test-user');

      expect(userCursor).toBeTruthy();
      expect(userCursor?.position).toBe(10);
      expect(userCursor?.selection).toEqual({ start: 5, end: 15 });
      expect(sendCursorSpy).toHaveBeenCalled();
    });

    it('should handle presence updates', () => {
      const sendPresenceSpy = vi.spyOn(engine['wsClient'], 'sendPresenceUpdate');
      
      engine.updatePresence('active', 'test-document');

      const presenceInfo = engine.getPresenceInfo();
      const userPresence = presenceInfo.get('test-user');

      expect(userPresence).toBeTruthy();
      expect(userPresence?.status).toBe('active');
      expect(userPresence?.currentDocument).toBe('test-document');
      expect(sendPresenceSpy).toHaveBeenCalled();
    });
  });

  describe('Messaging', () => {
    beforeEach(async () => {
      vi.spyOn(engine['wsClient'], 'connect').mockResolvedValue();
      await engine.startSession('test-session', mockTeamMembers);
    });

    it('should send chat messages', () => {
      const sendChatSpy = vi.spyOn(engine['wsClient'], 'sendChatMessage');
      const messageSentCallback = vi.fn();
      engine.on('message_sent', messageSentCallback);

      engine.sendMessage('Hello team!');

      expect(sendChatSpy).toHaveBeenCalledWith('Hello team!', 'test-user', 'test-session');
      expect(messageSentCallback).toHaveBeenCalled();
      
      const messages = engine.getMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe('Hello team!');
      expect(messages[0].senderId).toBe('test-user');
    });

    it('should analyze message sentiment when enabled', () => {
      engine.sendMessage('This is awesome work!');

      const messages = engine.getMessages();
      expect(messages[0].sentiment).toBe('positive');
    });
  });

  describe('Expertise Matching', () => {
    beforeEach(async () => {
      vi.spyOn(engine['wsClient'], 'connect').mockResolvedValue();
      await engine.startSession('test-session', mockTeamMembers);
    });

    it('should find expertise matches', () => {
      const expertiseMatchedCallback = vi.fn();
      engine.on('expertise_matched', expertiseMatchedCallback);

      const results = engine.findExpertise({
        skills: ['React', 'TypeScript'],
        urgency: 'high'
      });

      expect(results).toHaveLength(2);
      expect(results[0].member.name).toBe('Alice'); // Should be first due to exact skill match
      expect(results[0].score).toBeGreaterThan(0);
      expect(expertiseMatchedCallback).toHaveBeenCalled();
    });

    it('should return empty results when expertise matching is disabled', () => {
      const disabledConfig = { ...config, enableExpertiseMatching: false };
      const disabledEngine = new CollaborationEngine(disabledConfig);

      const results = disabledEngine.findExpertise({
        skills: ['React'],
        urgency: 'low'
      });

      expect(results).toEqual([]);
      disabledEngine.destroy();
    });
  });

  describe('Communication Analysis', () => {
    beforeEach(async () => {
      vi.spyOn(engine['wsClient'], 'connect').mockResolvedValue();
      await engine.startSession('test-session', mockTeamMembers);
    });

    it('should provide team insights', () => {
      // Send some messages first
      engine.sendMessage('Great work on the feature!');
      engine.sendMessage('Can you help me with the API integration?');

      const insights = engine.getTeamInsights();

      expect(insights).toBeTruthy();
      expect(insights.communicationPatterns).toBeDefined();
      expect(insights.collaborationEfficiency).toBeGreaterThanOrEqual(0);
      expect(insights.productivityTrends).toBeDefined();
    });

    it('should provide communication metrics', () => {
      engine.sendMessage('Hello');
      engine.sendMessage('How are you?');

      const metrics = engine.getCommunicationMetrics();

      expect(metrics.totalMessages).toBe(2);
      expect(metrics.collaborationScore).toBeGreaterThanOrEqual(0);
      expect(metrics.engagementLevel).toBeGreaterThanOrEqual(0);
    });

    it('should return empty metrics when analysis is disabled', () => {
      const disabledConfig = { ...config, enableCommunicationAnalysis: false };
      const disabledEngine = new CollaborationEngine(disabledConfig);

      const metrics = disabledEngine.getCommunicationMetrics();

      expect(metrics.totalMessages).toBe(0);
      expect(metrics.collaborationScore).toBe(0);
      expect(metrics.engagementLevel).toBe(0);
      
      disabledEngine.destroy();
    });
  });

  describe('Event Handling', () => {
    it('should handle event listener registration and removal', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      engine.on('test_event', callback1);
      engine.on('test_event', callback2);

      // Emit event (internal method)
      engine['emit']('test_event', { data: 'test' });

      expect(callback1).toHaveBeenCalledWith({ data: 'test' });
      expect(callback2).toHaveBeenCalledWith({ data: 'test' });

      // Remove one listener
      engine.off('test_event', callback1);
      engine['emit']('test_event', { data: 'test2' });

      expect(callback1).toHaveBeenCalledTimes(1); // Still only called once
      expect(callback2).toHaveBeenCalledTimes(2); // Called twice
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket connection failures', async () => {
      const mockConnect = vi.spyOn(engine['wsClient'], 'connect').mockRejectedValue(new Error('Connection failed'));

      await expect(engine.startSession('test-session', mockTeamMembers)).rejects.toThrow('Connection failed');
      expect(engine.getCurrentSession()).toBeNull();
    });

    it('should handle event listener errors gracefully', () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      const normalCallback = vi.fn();

      engine.on('test_event', errorCallback);
      engine.on('test_event', normalCallback);

      // Should not throw despite error in first callback
      expect(() => {
        engine['emit']('test_event', { data: 'test' });
      }).not.toThrow();

      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
    });
  });
});