import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CalendarAnalyzer } from '../CalendarAnalyzer';
import { CalendarEvent, CalendarInsights, ProductivityPattern } from '../types';
import { WorkContext } from '../../../types/ai';

describe('CalendarAnalyzer', () => {
  let analyzer: CalendarAnalyzer;
  let mockCalendarEvents: CalendarEvent[];
  let mockWorkContext: WorkContext;

  beforeEach(async () => {
    analyzer = new CalendarAnalyzer();
    
    const now = new Date();
    mockCalendarEvents = [
      {
        id: 'meeting-1',
        title: 'Daily Standup',
        description: 'Team sync meeting',
        startTime: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
        endTime: new Date(now.getTime() + 90 * 60 * 1000), // 1.5 hours from now
        attendees: ['user1', 'user2', 'user3'],
        type: 'meeting'
      },
      {
        id: 'meeting-2',
        title: 'Project Review',
        description: 'Quarterly project review',
        startTime: new Date(now.getTime() + 3 * 60 * 60 * 1000), // 3 hours from now
        endTime: new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4 hours from now
        attendees: ['user1', 'manager', 'stakeholder'],
        type: 'meeting'
      },
      {
        id: 'focus-block',
        title: 'Deep Work Session',
        description: 'Focused coding time',
        startTime: new Date(now.getTime() + 5 * 60 * 60 * 1000), // 5 hours from now
        endTime: new Date(now.getTime() + 7 * 60 * 60 * 1000), // 7 hours from now
        attendees: ['user1'],
        type: 'focus'
      }
    ];

    mockWorkContext = {
      type: 'work',
      timeOfDay: 'morning',
      urgency: 'medium',
      data: { timezone: 'UTC' }
    };

    await analyzer.initialize();
  });

  afterEach(() => {
    analyzer.dispose();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const newAnalyzer = new CalendarAnalyzer();
      await expect(newAnalyzer.initialize()).resolves.not.toThrow();
      newAnalyzer.dispose();
    });

    it('should load historical patterns if available', async () => {
      // Mock localStorage with historical data
      const mockPatterns = [
        {
          timeSlot: '09:00-10:00',
          productivity: 0.8,
          meetingDensity: 0.2,
          focusQuality: 0.9
        }
      ];
      
      const localStorageMock = {
        getItem: vi.fn().mockReturnValue(JSON.stringify(mockPatterns)),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      };
      
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      
      const newAnalyzer = new CalendarAnalyzer();
      await newAnalyzer.initialize();
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('calendar-patterns');
      newAnalyzer.dispose();
    });
  });

  describe('analyzeUpcomingEvents', () => {
    it('should analyze upcoming events and provide insights', async () => {
      const insights = await analyzer.analyzeUpcomingEvents(
        mockCalendarEvents,
        mockWorkContext
      );

      expect(insights).toBeDefined();
      expect(insights).toHaveProperty('meetingDensity');
      expect(insights).toHaveProperty('focusTimeAvailable');
      expect(insights).toHaveProperty('optimalWorkPeriods');
      expect(insights).toHaveProperty('conflictingEvents');
      expect(insights).toHaveProperty('timestamp');

      expect(typeof insights.meetingDensity).toBe('number');
      expect(insights.meetingDensity).toBeGreaterThanOrEqual(0);
      expect(insights.meetingDensity).toBeLessThanOrEqual(1);

      expect(typeof insights.focusTimeAvailable).toBe('number');
      expect(insights.focusTimeAvailable).toBeGreaterThanOrEqual(0);

      expect(Array.isArray(insights.optimalWorkPeriods)).toBe(true);
      expect(Array.isArray(insights.conflictingEvents)).toBe(true);
    });

    it('should handle empty calendar', async () => {
      const insights = await analyzer.analyzeUpcomingEvents([], mockWorkContext);

      expect(insights.meetingDensity).toBe(0);
      expect(insights.focusTimeAvailable).toBeGreaterThan(0);
      expect(insights.optimalWorkPeriods.length).toBeGreaterThan(0);
      expect(insights.conflictingEvents).toHaveLength(0);
    });

    it('should detect conflicting events', async () => {
      const conflictingEvents: CalendarEvent[] = [
        {
          id: 'conflict-1',
          title: 'Meeting A',
          description: 'First meeting',
          startTime: new Date('2024-01-15T10:00:00'),
          endTime: new Date('2024-01-15T11:00:00'),
          attendees: ['user1'],
          type: 'meeting'
        },
        {
          id: 'conflict-2',
          title: 'Meeting B',
          description: 'Overlapping meeting',
          startTime: new Date('2024-01-15T10:30:00'),
          endTime: new Date('2024-01-15T11:30:00'),
          attendees: ['user1'],
          type: 'meeting'
        }
      ];

      const insights = await analyzer.analyzeUpcomingEvents(
        conflictingEvents,
        mockWorkContext
      );

      expect(insights.conflictingEvents.length).toBeGreaterThan(0);
    });

    it('should identify optimal work periods', async () => {
      const sparseCalendar: CalendarEvent[] = [
        {
          id: 'morning-meeting',
          title: 'Brief Check-in',
          description: 'Quick sync',
          startTime: new Date('2024-01-15T09:00:00'),
          endTime: new Date('2024-01-15T09:15:00'),
          attendees: ['user1', 'user2'],
          type: 'meeting'
        }
      ];

      const insights = await analyzer.analyzeUpcomingEvents(
        sparseCalendar,
        mockWorkContext
      );

      expect(insights.optimalWorkPeriods.length).toBeGreaterThan(0);
      
      if (insights.optimalWorkPeriods.length > 0) {
        const period = insights.optimalWorkPeriods[0];
        expect(period).toHaveProperty('startTime');
        expect(period).toHaveProperty('endTime');
        expect(period).toHaveProperty('duration');
        expect(period).toHaveProperty('quality');
        expect(period.quality).toBeGreaterThan(0);
        expect(period.quality).toBeLessThanOrEqual(1);
      }
    });

    it('should calculate meeting density correctly', async () => {
      const busyCalendar: CalendarEvent[] = Array.from({ length: 8 }, (_, i) => ({
        id: `meeting-${i}`,
        title: `Meeting ${i}`,
        description: 'Busy day meeting',
        startTime: new Date(`2024-01-15T${9 + i}:00:00`),
        endTime: new Date(`2024-01-15T${9 + i}:30:00`),
        attendees: ['user1'],
        type: 'meeting'
      }));

      const insights = await analyzer.analyzeUpcomingEvents(
        busyCalendar,
        mockWorkContext
      );

      expect(insights.meetingDensity).toBeGreaterThan(0.5); // Should be high for busy day
    });
  });

  describe('analyzeProductivityPatterns', () => {
    it('should analyze historical productivity patterns', async () => {
      const historicalEvents: CalendarEvent[] = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(9 + (i % 8), 0, 0, 0);
        
        return {
          id: `historical-${i}`,
          title: `Past Meeting ${i}`,
          description: 'Historical meeting data',
          startTime: date,
          endTime: new Date(date.getTime() + 60 * 60 * 1000),
          attendees: ['user1'],
          type: 'meeting'
        };
      });

      const patterns = await analyzer.analyzeProductivityPatterns(
        historicalEvents,
        mockWorkContext
      );

      expect(patterns).toBeDefined();
      expect(patterns).toHaveProperty('meetingDensity');
      expect(patterns).toHaveProperty('focusTimeAvailable');
      expect(patterns).toHaveProperty('optimalWorkPeriods');
      expect(patterns).toHaveProperty('timestamp');

      // Should identify patterns from historical data
      expect(patterns.optimalWorkPeriods.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle insufficient historical data', async () => {
      const limitedEvents: CalendarEvent[] = [
        {
          id: 'single-event',
          title: 'Only Meeting',
          description: 'Single historical event',
          startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - 23 * 60 * 60 * 1000),
          attendees: ['user1'],
          type: 'meeting'
        }
      ];

      const patterns = await analyzer.analyzeProductivityPatterns(
        limitedEvents,
        mockWorkContext
      );

      expect(patterns).toBeDefined();
      // Should still provide basic analysis even with limited data
      expect(patterns.meetingDensity).toBeGreaterThanOrEqual(0);
    });
  });

  describe('time zone handling', () => {
    it('should handle different time zones correctly', async () => {
      const contextWithTimezone: WorkContext = {
        ...mockWorkContext,
        data: { timezone: 'America/New_York' }
      };

      const insights = await analyzer.analyzeUpcomingEvents(
        mockCalendarEvents,
        contextWithTimezone
      );

      expect(insights).toBeDefined();
      // Should handle timezone conversion without errors
      expect(insights.focusTimeAvailable).toBeGreaterThanOrEqual(0);
    });

    it('should default to UTC for missing timezone', async () => {
      const contextWithoutTimezone: WorkContext = {
        ...mockWorkContext,
        data: {}
      };

      const insights = await analyzer.analyzeUpcomingEvents(
        mockCalendarEvents,
        contextWithoutTimezone
      );

      expect(insights).toBeDefined();
      expect(insights.focusTimeAvailable).toBeGreaterThanOrEqual(0);
    });
  });

  describe('performance optimization', () => {
    it('should handle large calendar datasets efficiently', async () => {
      const largeCalendar: CalendarEvent[] = Array.from({ length: 1000 }, (_, i) => {
        const startTime = new Date();
        startTime.setHours(9 + (i % 8), (i % 4) * 15, 0, 0);
        
        return {
          id: `large-event-${i}`,
          title: `Event ${i}`,
          description: `Large dataset event ${i}`,
          startTime,
          endTime: new Date(startTime.getTime() + 30 * 60 * 1000),
          attendees: [`user${i % 10}`],
          type: i % 3 === 0 ? 'meeting' : 'focus'
        };
      });

      const startTime = Date.now();
      const insights = await analyzer.analyzeUpcomingEvents(largeCalendar, mockWorkContext);
      const endTime = Date.now();

      expect(insights).toBeDefined();
      expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds
    });

    it('should cache analysis results for repeated queries', async () => {
      // First analysis
      const insights1 = await analyzer.analyzeUpcomingEvents(
        mockCalendarEvents,
        mockWorkContext
      );

      // Second analysis with same data should be faster
      const startTime = Date.now();
      const insights2 = await analyzer.analyzeUpcomingEvents(
        mockCalendarEvents,
        mockWorkContext
      );
      const endTime = Date.now();

      expect(insights1).toBeDefined();
      expect(insights2).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast due to caching
    });
  });

  describe('pattern learning', () => {
    it('should learn from user behavior patterns', async () => {
      // Simulate multiple analyses to build patterns
      for (let i = 0; i < 5; i++) {
        await analyzer.analyzeUpcomingEvents(mockCalendarEvents, mockWorkContext);
      }

      // Should have learned some patterns
      const patterns = (analyzer as any).getLearnedPatterns();
      expect(patterns).toBeDefined();
    });

    it('should update patterns based on feedback', async () => {
      const feedback = {
        eventId: 'meeting-1',
        actualProductivity: 0.7,
        actualFocusQuality: 0.6,
        userRating: 4
      };

      await expect(
        (analyzer as any).updatePatternsWithFeedback(feedback)
      ).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle invalid calendar events gracefully', async () => {
      const invalidEvents = [
        {
          id: 'invalid-1',
          title: null,
          description: undefined,
          startTime: 'invalid-date',
          endTime: new Date(),
          attendees: null,
          type: 'meeting'
        }
      ] as any;

      const insights = await analyzer.analyzeUpcomingEvents(
        invalidEvents,
        mockWorkContext
      );

      expect(insights).toBeDefined();
      // Should filter out invalid events and continue
      expect(insights.meetingDensity).toBeGreaterThanOrEqual(0);
    });

    it('should handle analysis errors gracefully', async () => {
      // Mock internal method to throw error
      const originalMethod = (analyzer as any).calculateMeetingDensity;
      (analyzer as any).calculateMeetingDensity = vi.fn(() => {
        throw new Error('Analysis failed');
      });

      const insights = await analyzer.analyzeUpcomingEvents(
        mockCalendarEvents,
        mockWorkContext
      );

      expect(insights).toBeDefined();
      // Should provide fallback values
      expect(typeof insights.meetingDensity).toBe('number');

      // Restore original method
      (analyzer as any).calculateMeetingDensity = originalMethod;
    });
  });

  describe('insights quality', () => {
    it('should provide actionable insights', async () => {
      const insights = await analyzer.analyzeUpcomingEvents(
        mockCalendarEvents,
        mockWorkContext
      );

      // Insights should be actionable and meaningful
      expect(insights.focusTimeAvailable).toBeGreaterThan(0);
      
      if (insights.optimalWorkPeriods.length > 0) {
        const period = insights.optimalWorkPeriods[0];
        expect(period.duration).toBeGreaterThan(0);
        expect(period.quality).toBeGreaterThan(0);
      }
    });

    it('should provide consistent results for same input', async () => {
      const insights1 = await analyzer.analyzeUpcomingEvents(
        mockCalendarEvents,
        mockWorkContext
      );
      
      const insights2 = await analyzer.analyzeUpcomingEvents(
        mockCalendarEvents,
        mockWorkContext
      );

      expect(insights1.meetingDensity).toBe(insights2.meetingDensity);
      expect(insights1.focusTimeAvailable).toBe(insights2.focusTimeAvailable);
    });
  });

  describe('resource management', () => {
    it('should dispose resources properly', () => {
      expect(() => analyzer.dispose()).not.toThrow();
    });

    it('should handle multiple dispose calls', () => {
      analyzer.dispose();
      expect(() => analyzer.dispose()).not.toThrow();
    });

    it('should clear cached data on disposal', () => {
      analyzer.dispose();
      
      // Should not have any cached patterns after disposal
      const patterns = (analyzer as any).getLearnedPatterns?.() || [];
      expect(patterns).toHaveLength(0);
    });
  });
});