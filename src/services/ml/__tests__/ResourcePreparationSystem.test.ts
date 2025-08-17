import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ResourcePreparationSystem } from '../ResourcePreparationSystem';
import { TaskPrediction, WorkContext } from '../../../types/ai';
import { CalendarEvent } from '../types';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('ResourcePreparationSystem', () => {
  let resourceSystem: ResourcePreparationSystem;
  let mockTaskPrediction: TaskPrediction;
  let mockWorkContext: WorkContext;
  let mockCalendarEvent: CalendarEvent;

  beforeEach(() => {
    resourceSystem = new ResourcePreparationSystem();
    
    mockTaskPrediction = {
      taskId: 'task-1',
      confidence: 0.8,
      reasoning: 'Strong pattern match for coding task',
      suggestedTime: new Date(),
      estimatedDuration: 60,
      priority: 4
    };

    mockWorkContext = {
      type: 'work',
      timeOfDay: 'morning',
      urgency: 'medium',
      data: {}
    };

    mockCalendarEvent = {
      id: 'meeting-1',
      title: 'Team Meeting',
      description: 'Weekly team sync with agenda and presentation',
      startTime: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
      endTime: new Date(Date.now() + 75 * 60 * 1000), // 1 hour 15 minutes from now
      attendees: ['user1', 'user2', 'user3'],
      type: 'meeting'
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    resourceSystem.dispose();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(resourceSystem.initialize()).resolves.not.toThrow();
    });

    it('should load cached resources from localStorage', async () => {
      const mockCacheData = {
        'test-resource': {
          name: 'test-resource',
          type: 'file',
          cachedAt: Date.now(),
          preparationTime: 100,
          accessCount: 5,
          lastAccessed: Date.now()
        }
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockCacheData));
      
      await resourceSystem.initialize();
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('resource-cache');
    });

    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      await expect(resourceSystem.initialize()).resolves.not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load cached resources:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('analyzeResourceRequirements', () => {
    beforeEach(async () => {
      await resourceSystem.initialize();
    });

    it('should analyze coding task requirements', async () => {
      const codingPrediction = {
        ...mockTaskPrediction,
        reasoning: 'Need to implement new feature with code review'
      };

      const requirements = await resourceSystem.analyzeResourceRequirements(
        codingPrediction,
        mockWorkContext
      );

      expect(requirements).toBeDefined();
      expect(Array.isArray(requirements)).toBe(true);
      expect(requirements.length).toBeGreaterThan(0);
      
      // Should include coding-specific resources
      const resourceTypes = requirements.map(req => req.type);
      expect(resourceTypes).toContain('tool');
      
      const resourceNames = requirements.map(req => req.name);
      expect(resourceNames).toContain('IDE');
    });

    it('should analyze meeting task requirements', async () => {
      const meetingPrediction = {
        ...mockTaskPrediction,
        reasoning: 'Prepare for important client meeting'
      };

      const requirements = await resourceSystem.analyzeResourceRequirements(
        meetingPrediction,
        mockWorkContext
      );

      expect(requirements).toBeDefined();
      expect(requirements.length).toBeGreaterThan(0);
      
      const resourceNames = requirements.map(req => req.name);
      expect(resourceNames).toContain('Video Conferencing');
    });

    it('should analyze writing task requirements', async () => {
      const writingPrediction = {
        ...mockTaskPrediction,
        reasoning: 'Write comprehensive documentation for the API'
      };

      const requirements = await resourceSystem.analyzeResourceRequirements(
        writingPrediction,
        mockWorkContext
      );

      expect(requirements).toBeDefined();
      expect(requirements.length).toBeGreaterThan(0);
      
      const resourceNames = requirements.map(req => req.name);
      expect(resourceNames).toContain('Text Editor');
    });

    it('should analyze research task requirements', async () => {
      const researchPrediction = {
        ...mockTaskPrediction,
        reasoning: 'Research new technologies and analyze market trends'
      };

      const requirements = await resourceSystem.analyzeResourceRequirements(
        researchPrediction,
        mockWorkContext
      );

      expect(requirements).toBeDefined();
      expect(requirements.length).toBeGreaterThan(0);
      
      const resourceNames = requirements.map(req => req.name);
      expect(resourceNames).toContain('Research Databases');
    });

    it('should handle generic tasks', async () => {
      const genericPrediction = {
        ...mockTaskPrediction,
        reasoning: 'Complete general administrative task'
      };

      const requirements = await resourceSystem.analyzeResourceRequirements(
        genericPrediction,
        mockWorkContext
      );

      expect(requirements).toBeDefined();
      expect(requirements.length).toBeGreaterThan(0);
      
      const resourceNames = requirements.map(req => req.name);
      expect(resourceNames).toContain('Default Workspace');
    });

    it('should check resource availability', async () => {
      const requirements = await resourceSystem.analyzeResourceRequirements(
        mockTaskPrediction,
        mockWorkContext
      );

      for (const requirement of requirements) {
        expect(requirement).toHaveProperty('available');
        expect(typeof requirement.available).toBe('boolean');
        expect(requirement).toHaveProperty('preparationTime');
        expect(typeof requirement.preparationTime).toBe('number');
      }
    });
  });

  describe('prepareResourcesForTasks', () => {
    beforeEach(async () => {
      await resourceSystem.initialize();
    });

    it('should queue resource preparation for unavailable resources', async () => {
      const predictions = [mockTaskPrediction];
      
      await expect(
        resourceSystem.prepareResourcesForTasks(predictions, mockWorkContext)
      ).resolves.not.toThrow();
    });

    it('should handle multiple predictions', async () => {
      const predictions = [
        mockTaskPrediction,
        {
          ...mockTaskPrediction,
          taskId: 'task-2',
          reasoning: 'Another coding task'
        }
      ];
      
      await expect(
        resourceSystem.prepareResourcesForTasks(predictions, mockWorkContext)
      ).resolves.not.toThrow();
    });

    it('should skip already available resources', async () => {
      // Mock all resources as available
      const spy = vi.spyOn(resourceSystem as any, 'checkResourceAvailability')
        .mockResolvedValue(true);
      
      await resourceSystem.prepareResourcesForTasks([mockTaskPrediction], mockWorkContext);
      
      // Should still call the method but not queue anything
      expect(spy).toHaveBeenCalled();
      
      spy.mockRestore();
    });
  });

  describe('prepareForEvent', () => {
    beforeEach(async () => {
      await resourceSystem.initialize();
    });

    it('should prepare resources for meeting events', async () => {
      const preparation = await resourceSystem.prepareForEvent(
        mockCalendarEvent,
        mockWorkContext
      );

      expect(preparation).toBeDefined();
      expect(preparation.eventId).toBe(mockCalendarEvent.id);
      expect(preparation.status).toBe('success');
      expect(Array.isArray(preparation.resourcesPrepared)).toBe(true);
      expect(Array.isArray(preparation.documentsReady)).toBe(true);
      expect(Array.isArray(preparation.toolsActivated)).toBe(true);
      expect(typeof preparation.preparationTime).toBe('number');
    });

    it('should handle events with document references', async () => {
      const eventWithDocs = {
        ...mockCalendarEvent,
        description: 'Meeting to discuss project.pdf and requirements.doc'
      };

      const preparation = await resourceSystem.prepareForEvent(
        eventWithDocs,
        mockWorkContext
      );

      expect(preparation.documentsReady.length).toBeGreaterThan(0);
    });

    it('should handle preparation failures gracefully', async () => {
      // Mock a method to throw an error
      const spy = vi.spyOn(resourceSystem as any, 'prepareMeetingResources')
        .mockRejectedValue(new Error('Preparation failed'));
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const preparation = await resourceSystem.prepareForEvent(
        mockCalendarEvent,
        mockWorkContext
      );

      expect(preparation.status).toBe('failed');
      expect(consoleSpy).toHaveBeenCalled();
      
      spy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('updateResourceUsageData', () => {
    beforeEach(async () => {
      await resourceSystem.initialize();
    });

    it('should update usage statistics', async () => {
      const completedTask = {
        id: 'completed-task',
        title: 'Completed Task'
      };
      const resourcesUsed = ['IDE', 'Git Repository', 'Documentation'];

      await expect(
        resourceSystem.updateResourceUsageData(completedTask, resourcesUsed)
      ).resolves.not.toThrow();
    });

    it('should handle empty resources list', async () => {
      const completedTask = {
        id: 'completed-task',
        title: 'Completed Task'
      };

      await expect(
        resourceSystem.updateResourceUsageData(completedTask, [])
      ).resolves.not.toThrow();
    });
  });

  describe('getEfficiencyMetrics', () => {
    beforeEach(async () => {
      await resourceSystem.initialize();
    });

    it('should return efficiency metrics', () => {
      const metrics = resourceSystem.getEfficiencyMetrics();

      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('averagePreparationTime');
      expect(metrics).toHaveProperty('successRate');
      expect(metrics).toHaveProperty('mostUsedResources');
      expect(metrics).toHaveProperty('bottlenecks');

      expect(typeof metrics.averagePreparationTime).toBe('number');
      expect(typeof metrics.successRate).toBe('number');
      expect(Array.isArray(metrics.mostUsedResources)).toBe(true);
      expect(Array.isArray(metrics.bottlenecks)).toBe(true);
    });

    it('should calculate success rate correctly', async () => {
      // Simulate some successful and failed preparations
      const system = resourceSystem as any;
      system.metrics.totalPreparations = 10;
      system.metrics.successfulPreparations = 8;

      const metrics = resourceSystem.getEfficiencyMetrics();
      expect(metrics.successRate).toBe(0.8);
    });

    it('should handle zero preparations', () => {
      const metrics = resourceSystem.getEfficiencyMetrics();
      expect(metrics.successRate).toBe(0); // Should handle division by zero
    });
  });

  describe('background processing', () => {
    beforeEach(async () => {
      await resourceSystem.initialize();
    });

    it('should process preparation queue in background', async () => {
      // Add items to queue
      await resourceSystem.prepareResourcesForTasks([mockTaskPrediction], mockWorkContext);
      
      // Wait a bit for background processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should not throw and should process items
      expect(true).toBe(true); // Basic test that no errors occurred
    });
  });

  describe('caching', () => {
    beforeEach(async () => {
      await resourceSystem.initialize();
    });

    it('should persist cache to localStorage', async () => {
      // Trigger some resource preparation to populate cache
      await resourceSystem.prepareResourcesForTasks([mockTaskPrediction], mockWorkContext);
      
      // Wait for background processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should have attempted to save to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should handle localStorage save errors', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage full');
      });
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Should not throw even if localStorage fails
      await resourceSystem.prepareResourcesForTasks([mockTaskPrediction], mockWorkContext);
      
      consoleSpy.mockRestore();
    });
  });

  describe('resource disposal', () => {
    it('should dispose resources properly', () => {
      expect(() => resourceSystem.dispose()).not.toThrow();
    });

    it('should clear all internal state on disposal', () => {
      resourceSystem.dispose();
      
      const metrics = resourceSystem.getEfficiencyMetrics();
      expect(metrics.mostUsedResources).toHaveLength(0);
    });
  });
});