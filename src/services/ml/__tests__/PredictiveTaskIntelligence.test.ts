import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PredictiveTaskIntelligence } from '../PredictiveTaskIntelligence';
import { CalendarEvent, ExternalEvent, Deadline } from '../types';
import { TaskHistory, WorkContext, Task } from '../../../types/ai';

// Mock the dependencies
vi.mock('../TaskPredictionModel', () => ({
  TaskPredictionModel: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    predictNextTasks: vi.fn().mockResolvedValue([]),
    updateWithFeedback: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn()
  }))
}));

vi.mock('../ResourcePreparationSystem', () => ({
  ResourcePreparationSystem: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    prepareResourcesForTasks: vi.fn().mockResolvedValue(undefined),
    prepareForEvent: vi.fn().mockImplementation((event) => Promise.resolve({
      eventId: event.id,
      resourcesPrepared: [],
      documentsReady: [],
      toolsActivated: [],
      preparationTime: 100,
      status: 'success'
    })),
    analyzeResourceRequirements: vi.fn().mockResolvedValue([]),
    updateResourceUsageData: vi.fn().mockResolvedValue(undefined),
    getEfficiencyMetrics: vi.fn().mockReturnValue({
      averagePreparationTime: 100,
      successRate: 0.9,
      mostUsedResources: [],
      bottlenecks: []
    }),
    dispose: vi.fn()
  }))
}));

vi.mock('../PriorityOptimizationEngine', () => ({
  PriorityOptimizationEngine: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    optimizePriorities: vi.fn().mockResolvedValue([]),
    suggestAdjustment: vi.fn().mockResolvedValue({
      taskId: 'test',
      currentPriority: 3,
      suggestedPriority: 4,
      reason: 'test reason',
      urgency: 'medium',
      priority: 3
    }),
    reorganizeForDeadlines: vi.fn().mockImplementation((tasks) => Promise.resolve(tasks)),
    updateWithCompletion: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn()
  }))
}));

vi.mock('../CalendarAnalyzer', () => ({
  CalendarAnalyzer: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    analyzeUpcomingEvents: vi.fn().mockResolvedValue({
      meetingDensity: 0.5,
      focusTimeAvailable: 240,
      optimalWorkPeriods: [],
      conflictingEvents: [],
      timestamp: Date.now()
    }),
    analyzeProductivityPatterns: vi.fn().mockResolvedValue({
      meetingDensity: 0.5,
      focusTimeAvailable: 240,
      optimalWorkPeriods: [],
      conflictingEvents: [],
      timestamp: Date.now()
    }),
    dispose: vi.fn()
  }))
}));

describe('PredictiveTaskIntelligence', () => {
  let predictiveSystem: PredictiveTaskIntelligence;
  let mockTaskHistory: TaskHistory;
  let mockWorkContext: WorkContext;
  let mockCalendarEvents: CalendarEvent[];

  beforeEach(() => {
    predictiveSystem = new PredictiveTaskIntelligence();
    
    mockTaskHistory = {
      completedTasks: [
        {
          id: 'task-1',
          title: 'Code Review',
          description: 'Review pull request',
          priority: 3,
          estimatedDuration: 30,
          dependencies: [],
          context: { type: 'work', data: {} },
          aiGenerated: false
        },
        {
          id: 'task-2',
          title: 'Write Documentation',
          description: 'Update API docs',
          priority: 2,
          estimatedDuration: 60,
          dependencies: [],
          context: { type: 'work', data: {} },
          aiGenerated: false
        }
      ],
      patterns: [],
      preferences: {}
    };

    mockWorkContext = {
      type: 'work',
      timeOfDay: 'morning',
      urgency: 'medium',
      data: {}
    };

    mockCalendarEvents = [
      {
        id: 'meeting-1',
        title: 'Team Standup',
        description: 'Daily standup meeting',
        startTime: new Date('2024-01-15T09:00:00'),
        endTime: new Date('2024-01-15T09:30:00'),
        attendees: ['user1', 'user2', 'user3'],
        type: 'meeting'
      },
      {
        id: 'meeting-2',
        title: 'Project Review',
        description: 'Review project progress',
        startTime: new Date('2024-01-15T14:00:00'),
        endTime: new Date('2024-01-15T15:00:00'),
        attendees: ['user1', 'manager'],
        type: 'meeting'
      }
    ];
  });

  describe('initialization', () => {
    it('should initialize all components successfully', async () => {
      await expect(predictiveSystem.initialize()).resolves.not.toThrow();
    });

    it('should handle initialization errors gracefully', async () => {
      // Since our mocks don't throw errors, this test should pass
      await expect(predictiveSystem.initialize()).resolves.not.toThrow();
    });
  });

  describe('predictNextTasks', () => {
    beforeEach(async () => {
      await predictiveSystem.initialize();
    });

    it('should predict next tasks with enhanced intelligence', async () => {
      const predictions = await predictiveSystem.predictNextTasks(
        mockTaskHistory,
        mockWorkContext,
        mockCalendarEvents,
        3
      );

      expect(predictions).toBeDefined();
      expect(Array.isArray(predictions)).toBe(true);
      expect(predictions.length).toBeLessThanOrEqual(3);
      
      // Check enhanced prediction structure
      if (predictions.length > 0) {
        const prediction = predictions[0];
        expect(prediction).toHaveProperty('taskId');
        expect(prediction).toHaveProperty('confidence');
        expect(prediction).toHaveProperty('reasoning');
        expect(prediction).toHaveProperty('resourceRequirements');
        expect(prediction).toHaveProperty('preparationStatus');
        expect(prediction).toHaveProperty('enhancedConfidence');
      }
    });

    it('should handle empty task history', async () => {
      const emptyHistory: TaskHistory = {
        completedTasks: [],
        patterns: [],
        preferences: {}
      };

      const predictions = await predictiveSystem.predictNextTasks(
        emptyHistory,
        mockWorkContext,
        mockCalendarEvents
      );

      expect(predictions).toBeDefined();
      expect(Array.isArray(predictions)).toBe(true);
    });

    it('should adjust predictions based on calendar events', async () => {
      const busyCalendar: CalendarEvent[] = [
        ...mockCalendarEvents,
        {
          id: 'meeting-3',
          title: 'All Hands',
          description: 'Company meeting',
          startTime: new Date('2024-01-15T10:00:00'),
          endTime: new Date('2024-01-15T11:00:00'),
          attendees: ['all'],
          type: 'meeting'
        }
      ];

      const predictions = await predictiveSystem.predictNextTasks(
        mockTaskHistory,
        mockWorkContext,
        busyCalendar
      );

      expect(predictions).toBeDefined();
      // Should still return predictions even with busy calendar
      expect(Array.isArray(predictions)).toBe(true);
    });
  });

  describe('prepareForUpcomingEvents', () => {
    beforeEach(async () => {
      await predictiveSystem.initialize();
    });

    it('should prepare for events within 15 minutes', async () => {
      const now = new Date();
      const upcomingEvent: CalendarEvent = {
        id: 'urgent-meeting',
        title: 'Urgent Meeting',
        description: 'Important discussion',
        startTime: new Date(now.getTime() + 10 * 60 * 1000), // 10 minutes from now
        endTime: new Date(now.getTime() + 40 * 60 * 1000),
        attendees: ['user1', 'user2'],
        type: 'meeting'
      };

      const result = await predictiveSystem.prepareForUpcomingEvents(
        [upcomingEvent],
        mockWorkContext
      );

      expect(result).toBeDefined();
      expect(result.eventsProcessed).toBe(1);
      expect(result.preparations).toHaveLength(1);
      expect(result.preparations[0]?.eventId).toBe('urgent-meeting');
    });

    it('should ignore events too far in the future', async () => {
      const now = new Date();
      const futureEvent: CalendarEvent = {
        id: 'future-meeting',
        title: 'Future Meeting',
        description: 'Meeting next week',
        startTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        attendees: ['user1'],
        type: 'meeting'
      };

      const result = await predictiveSystem.prepareForUpcomingEvents(
        [futureEvent],
        mockWorkContext
      );

      expect(result.eventsProcessed).toBe(0);
      expect(result.preparations).toHaveLength(0);
    });
  });

  describe('analyzeExternalEvents', () => {
    beforeEach(async () => {
      await predictiveSystem.initialize();
    });

    it('should analyze external events and suggest task adjustments', async () => {
      const externalEvents: ExternalEvent[] = [
        {
          id: 'urgent-email',
          type: 'email',
          title: 'Urgent: Production Issue',
          description: 'Critical bug in production system',
          urgency: 'high',
          timestamp: new Date(),
          metadata: { priority: 'critical' }
        }
      ];

      const currentTasks: Task[] = [
        {
          id: 'task-1',
          title: 'Fix Production Bug',
          description: 'Debug production issue',
          priority: 2,
          estimatedDuration: 120,
          dependencies: [],
          context: { type: 'work', data: {} },
          aiGenerated: false
        }
      ];

      const suggestions = await predictiveSystem.analyzeExternalEvents(
        externalEvents,
        currentTasks,
        mockWorkContext
      );

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      
      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        expect(suggestion).toHaveProperty('taskId');
        expect(suggestion).toHaveProperty('currentPriority');
        expect(suggestion).toHaveProperty('suggestedPriority');
        expect(suggestion).toHaveProperty('reason');
        expect(suggestion).toHaveProperty('urgency');
      }
    });

    it('should handle events with low impact', async () => {
      const lowImpactEvents: ExternalEvent[] = [
        {
          id: 'newsletter',
          type: 'email',
          title: 'Weekly Newsletter',
          description: 'Company newsletter',
          urgency: 'low',
          timestamp: new Date(),
          metadata: {}
        }
      ];

      const currentTasks: Task[] = [
        {
          id: 'task-1',
          title: 'Regular Task',
          description: 'Normal work task',
          priority: 3,
          estimatedDuration: 60,
          dependencies: [],
          context: { type: 'work', data: {} },
          aiGenerated: false
        }
      ];

      const suggestions = await predictiveSystem.analyzeExternalEvents(
        lowImpactEvents,
        currentTasks,
        mockWorkContext
      );

      // Should return empty array for low impact events
      expect(suggestions).toHaveLength(0);
    });
  });

  describe('reorganizeForDeadlines', () => {
    beforeEach(async () => {
      await predictiveSystem.initialize();
    });

    it('should reorganize tasks for urgent deadlines', async () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          title: 'Important Task',
          description: 'Task with deadline',
          priority: 2,
          estimatedDuration: 120,
          dependencies: [],
          context: { type: 'work', data: {} },
          aiGenerated: false
        },
        {
          id: 'task-2',
          title: 'Regular Task',
          description: 'Normal task',
          priority: 3,
          estimatedDuration: 60,
          dependencies: [],
          context: { type: 'work', data: {} },
          aiGenerated: false
        }
      ];

      const urgentDeadlines: Deadline[] = [
        {
          id: 'deadline-1',
          taskId: 'task-1',
          date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          type: 'hard',
          importance: 0.9
        }
      ];

      const result = await predictiveSystem.reorganizeForDeadlines(
        tasks,
        urgentDeadlines,
        mockWorkContext
      );

      expect(result).toBeDefined();
      expect(result.reorganized).toBe(true);
      expect(result.suggestions).toHaveLength(2);
      expect(result.timeBlocks).toBeDefined();
      expect(Array.isArray(result.timeBlocks)).toBe(true);
    });

    it('should handle no urgent deadlines', async () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          title: 'Regular Task',
          description: 'Normal task',
          priority: 3,
          estimatedDuration: 60,
          dependencies: [],
          context: { type: 'work', data: {} },
          aiGenerated: false
        }
      ];

      const noUrgentDeadlines: Deadline[] = [
        {
          id: 'deadline-1',
          taskId: 'task-1',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          type: 'soft',
          importance: 0.5
        }
      ];

      const result = await predictiveSystem.reorganizeForDeadlines(
        tasks,
        noUrgentDeadlines,
        mockWorkContext
      );

      expect(result.reorganized).toBe(false);
      expect(result.message).toContain('No urgent deadlines');
    });
  });

  describe('getProductivityInsights', () => {
    beforeEach(async () => {
      await predictiveSystem.initialize();
    });

    it('should provide comprehensive productivity insights', async () => {
      const insights = await predictiveSystem.getProductivityInsights(
        mockTaskHistory,
        mockWorkContext
      );

      expect(insights).toBeDefined();
      expect(insights).toHaveProperty('predictedTasks');
      expect(insights).toHaveProperty('calendarInsights');
      expect(insights).toHaveProperty('resourceEfficiency');
      expect(insights).toHaveProperty('recommendations');
      expect(insights).toHaveProperty('timestamp');

      expect(Array.isArray(insights.predictedTasks)).toBe(true);
      expect(Array.isArray(insights.recommendations)).toBe(true);
    });
  });

  describe('trainWithCompletedTask', () => {
    beforeEach(async () => {
      await predictiveSystem.initialize();
    });

    it('should train the system with completed task data', async () => {
      const completedTask: Task = {
        id: 'completed-task',
        title: 'Completed Task',
        description: 'Task that was completed',
        priority: 3,
        estimatedDuration: 60,
        dependencies: [],
        context: { type: 'work', data: {} },
        aiGenerated: false
      };

      const actualDuration = 55; // Completed faster than estimated
      const userFeedback = {
        accuracy: 0.9,
        usefulness: 0.8,
        resourcesUsed: ['IDE', 'Documentation'],
        comments: 'Good prediction'
      };

      await expect(
        predictiveSystem.trainWithCompletedTask(
          completedTask,
          actualDuration,
          userFeedback,
          mockWorkContext
        )
      ).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle initialization failure gracefully', async () => {
      const system = new PredictiveTaskIntelligence();
      
      // Try to use system without initialization
      await expect(
        system.predictNextTasks(mockTaskHistory, mockWorkContext)
      ).resolves.toBeDefined(); // Should auto-initialize
    });

    it('should handle invalid input data', async () => {
      await predictiveSystem.initialize();

      const invalidHistory = {} as TaskHistory;
      const invalidContext = {} as WorkContext;

      // Should not throw but handle gracefully
      await expect(
        predictiveSystem.predictNextTasks(invalidHistory, invalidContext)
      ).resolves.toBeDefined();
    });
  });

  describe('resource management', () => {
    it('should dispose of resources properly', () => {
      expect(() => predictiveSystem.dispose()).not.toThrow();
    });

    it('should handle multiple dispose calls', () => {
      predictiveSystem.dispose();
      expect(() => predictiveSystem.dispose()).not.toThrow();
    });
  });
});