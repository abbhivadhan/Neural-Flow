import { TaskHistory, WorkContext } from '../../types/ai';
import { CalendarEvent, CalendarInsights, TimeBlock } from './types';

/**
 * Calendar Analyzer
 * Analyzes calendar events and deadlines to provide intelligent scheduling insights
 */
export class CalendarAnalyzer {
  private calendarData: CalendarEvent[] = [];
  private analysisCache: Map<string, any> = new Map();

  /**
   * Initialize the calendar analyzer
   */
  async initialize(): Promise<void> {
    console.log('Initializing Calendar Analyzer...');
    console.log('Calendar Analyzer initialized');
  }

  /**
   * Analyze upcoming events for task prediction context
   */
  async analyzeUpcomingEvents(
    calendarEvents: CalendarEvent[],
    _context: WorkContext
  ): Promise<CalendarInsights> {
    this.calendarData = calendarEvents;

    const meetingDensity = this.calculateMeetingDensity(calendarEvents);
    const focusTimeAvailable = this.calculateFocusTimeAvailable(calendarEvents);
    const optimalWorkPeriods = this.identifyOptimalWorkPeriods();
    const conflictingEvents = this.identifyConflictingEvents(calendarEvents);

    return {
      meetingDensity,
      focusTimeAvailable,
      optimalWorkPeriods,
      conflictingEvents,
      timestamp: Date.now()
    };
  }

  /**
   * Analyze productivity patterns from task history and calendar
   */
  async analyzeProductivityPatterns(
    _taskHistory: TaskHistory,
    context: WorkContext
  ): Promise<CalendarInsights> {
    return this.analyzeUpcomingEvents(this.calendarData, context);
  }

  private calculateMeetingDensity(events: CalendarEvent[]): number {
    const workingHours = 8 * 60; // 8 hours in minutes
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysMeetings = events.filter(event => 
      event.type === 'meeting' &&
      event.startTime >= today &&
      event.startTime < tomorrow
    );

    const totalMeetingTime = todaysMeetings.reduce((total, meeting) => {
      const duration = meeting.endTime.getTime() - meeting.startTime.getTime();
      return total + (duration / (1000 * 60)); // Convert to minutes
    }, 0);

    return Math.min(totalMeetingTime / workingHours, 1);
  }

  private calculateFocusTimeAvailable(events: CalendarEvent[]): number {
    const workingHours = 8 * 60; // 8 hours in minutes
    const busyTime = events.reduce((total, event) => {
      const duration = event.endTime.getTime() - event.startTime.getTime();
      return total + (duration / (1000 * 60));
    }, 0);

    return Math.max(workingHours - busyTime, 0);
  }

  private identifyOptimalWorkPeriods(): TimeBlock[] {
    const periods: TimeBlock[] = [];
    
    // Morning focus period (9-11 AM)
    const morningStart = new Date();
    morningStart.setHours(9, 0, 0, 0);
    const morningEnd = new Date();
    morningEnd.setHours(11, 0, 0, 0);

    periods.push({
      taskId: 'morning-focus',
      startTime: morningStart,
      endTime: morningEnd,
      type: 'focused_work',
      priority: 5
    });

    // Afternoon focus period (2-4 PM)
    const afternoonStart = new Date();
    afternoonStart.setHours(14, 0, 0, 0);
    const afternoonEnd = new Date();
    afternoonEnd.setHours(16, 0, 0, 0);

    periods.push({
      taskId: 'afternoon-focus',
      startTime: afternoonStart,
      endTime: afternoonEnd,
      type: 'focused_work',
      priority: 4
    });

    return periods;
  }

  private identifyConflictingEvents(events: CalendarEvent[]): CalendarEvent[] {
    const conflicts: CalendarEvent[] = [];
    
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const eventI = events[i];
        const eventJ = events[j];
        if (eventI && eventJ && this.eventsOverlap(eventI, eventJ)) {
          if (!conflicts.includes(eventI)) conflicts.push(eventI);
          if (!conflicts.includes(eventJ)) conflicts.push(eventJ);
        }
      }
    }

    return conflicts;
  }

  private eventsOverlap(event1: CalendarEvent, event2: CalendarEvent): boolean {
    return event1.startTime < event2.endTime && event2.startTime < event1.endTime;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.calendarData = [];
    this.analysisCache.clear();
  }
}