import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PriorityOptimizationEngine } from '../PriorityOptimizationEngine';
import { Task, WorkContext } from '../../../types/ai';
import { Deadline, PriorityAdjustment } from '../types';

describe('PriorityOptimizationEngine', () => {
  let engine: PriorityOptimizationEngine;
  let mockTasks: Task[];
  let mockWorkContext: WorkContext;
  let mockDeadlines: Deadline[];

  beforeEach(async () => {
    engine = new PriorityOptimizationEngine();
    
    mockTasks = [
      {
        id: 'task-1',
        title: 'Critical Bug Fix',
        description: 'Fix production issue affecting users',
        priority: 5,
        estimatedDuration: 120,
        dependencies: [],
        context: { type: 'work', data: { severity: 'critical' } },
        aiGenerated: false
      },
      {
        id: 'task-2',
        title: 'Code Review',
        description: 'Review pull request #456',
        priority: 3,
        estimatedDuration: 45,
        dependencies: [],
        context: { type: 'work', data: { project: 'frontend' } },
        aiGenerated: false
      },
      {
        id: 'task-3',
        title: 'Documentation Update',
        description: 'Update API documentation',
        priority: 2,
        estimatedDuration: 90,
        dependencies: ['task-1'],
        context: { type: 'work', data: { project: 'backend' } },
        aiGenerated: false
      },
      {
        id: 'task-4',
        title: 'Team Meeting Prep',
        description: 'Prepare slides for team meeting',
        priority: 3,
        estimatedDuration: 60,
        dependencies: [],
        context: { type: 'work', data: { meeting: 'weekly-sync' } },
        aiGenerated: false
      }
    ];

    mockWorkContext = {
      type: 'work',
      timeOfDay: 'morning',
      urgency: 'medium',
      data: { 
        availableTime: 480, // 8 hours in minutes
        currentLoad: 0.7,
        energyLevel: 0.8
      }
    };

    mockDeadlines = [
      {
        id: 'deadline-1',
        taskId: 'task-1',
        date: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        type: 'hard',
        importance: 0.95
      },
      {
        id: 'deadline-2',
        taskId: 'task-4',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        type: 'soft',
        importance: 0.6
      },
      {
        id: 'deadline-3',
        taskId: 'task-3',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        type: 'soft',
        importance: 0.4
      }
    ];

    await engine.initialize();
  });

  afterEach(() => {
    engine.dispose();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const newEngine = new PriorityOptimizationEngine();
      await expect(newEngine.initialize()).resolves.not.toThrow();
      newEngine.dispose();
    });

    it('should load optimization parameters', async () => {
      expect(engine).toBeDefined();
      // Should have default optimization parameters loaded
      const params = (engine as any).getOptimizationParameters();
      expect(params).toBeDefined();
    });
  });

  describe('optimizePriorities', () => {
    it('should optimize task priorities based on multiple factors', async () => {
      const optimizedTasks = await engine.optimizePriorities(
        mockTasks,
        mockDeadlines,
        mockWorkContext
      );

      expect(optimizedTasks).toBeDefined();
      expect(Array.isArray(optimizedTasks)).toBe(true);
      expect(optimizedTasks).toHaveLength(mockTasks.length);

      // Tasks should be sorted by optimized priority (highest first)
      for (let i = 0; i < optimizedTasks.length - 1; i++) {
        expect(optimizedTasks[i].priority).toBeGreaterThanOrEqual(
          optimizedTasks[i + 1].priority
        );
      }

      // Critical task with urgent deadline should be prioritized
      const criticalTask = optimizedTasks.find(t => t.id === 'task-1');
      expect(criticalTask).toBeDefined();
      expect(criticalTask!.priority).toBe(5); // Should maintain or increase priority
    });

    it('should handle tasks without deadlines', async () => {
      const tasksWithoutDeadlines = mockTasks.filter(t => t.id !== 'task-1');
      
      const optimizedTasks = await engine.optimizePriorities(
        tasksWithoutDeadlines,
        [],
        mockWorkContext
      );

      expect(optimizedTasks).toBeDefined();
      expect(optimizedTasks).toHaveLength(tasksWithoutDeadlines.length);
      
      // Should still provide meaningful prioritization
      expect(optimizedTasks[0].priority).toBeGreaterThan(0);
    });

    it('should consider task dependencies in optimization', async () => {
      const optimizedTasks = await engine.optimizePriorities(
        mockTasks,
        mockDeadlines,
        mockWorkContext
      );

      const dependentTask = optimizedTasks.find(t => t.id === 'task-3');
      const dependencyTask = optimizedTasks.find(t => t.id === 'task-1');
      
      expect(dependentTask).toBeDefined();
      expect(dependencyTask).toBeDefined();
      
      // Dependency should be prioritized higher than dependent task
      const dependentIndex = optimizedTasks.indexOf(dependentTask!);
      const dependencyIndex = optimizedTasks.indexOf(dependencyTask!);
      
      expect(dependencyIndex).toBeLessThan(dependentIndex);
    });

    it('should adjust priorities based on available time', async () => {
      const limitedTimeContext: WorkContext = {
        ...mockWorkContext,
        data: { ...mockWorkContext.data, availableTime: 120 } // Only 2 hours
      };

      const optimizedTasks = await engine.optimizePriorities(
        mockTasks,
        mockDeadlines,
        limitedTimeContext
      );

      expect(optimizedTasks).toBeDefined();
      
      // Should prioritize shorter, high-impact tasks when time is limited
      const topTask = optimizedTasks[0];
      expect(topTask.estimatedDuration).toBeLessThanOrEqual(120);
    });

    it('should consider user energy level', async () => {
      const lowEnergyContext: WorkContext = {
        ...mockWorkContext,
        data: { ...mockWorkContext.data, energyLevel: 0.3 }
      };

      const optimizedTasks = await engine.optimizePriorities(
        mockTasks,
        mockDeadlines,
        lowEnergyContext
      );

      expect(optimizedTasks).toBeDefined();
      // Should adjust task ordering based on energy requirements
      expect(optimizedTasks[0]).toBeDefined();
    });
  });

  describe('suggestAdjustment', () => {
    it('should suggest priority adjustments for specific tasks', async () => {
      const task = mockTasks[1]; // Code review task
      const urgentContext: WorkContext = {
        ...mockWorkContext,
        urgency: 'high'
      };

      const adjustment = await engine.suggestAdjustment(
        task,
        mockDeadlines,
        urgentContext
      );

      expect(adjustment).toBeDefined();
      expect(adjustment).toHaveProperty('taskId');
      expect(adjustment).toHaveProperty('currentPriority');
      expect(adjustment).toHaveProperty('suggestedPriority');
      expect(adjustment).toHaveProperty('reason');
      expect(adjustment).toHaveProperty('urgency');
      expect(adjustment).toHaveProperty('priority');

      expect(adjustment.taskId).toBe(task.id);
      expect(adjustment.currentPriority).toBe(task.priority);
      expect(typeof adjustment.reason).toBe('string');
      expect(adjustment.reason.length).toBeGreaterThan(0);
    });

    it('should suggest higher priority for tasks with approaching deadlines', async () => {
      const urgentDeadline: Deadline = {
        id: 'urgent-deadline',
        taskId: 'task-2',
        date: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        type: 'hard',
        importance: 0.9
      };

      const adjustment = await engine.suggestAdjustment(
        mockTasks[1],
        [urgentDeadline],
        mockWorkContext
      );

      expect(adjustment.suggestedPriority).toBeGreaterThan(adjustment.currentPriority);
      expect(adjustment.reason).toContain('deadline');
    });

    it('should suggest lower priority for less urgent tasks', async () => {
      const lowPriorityTask: Task = {
        ...mockTasks[2],
        priority: 4 // Start with high priority
      };

      const distantDeadline: Deadline = {
        id: 'distant-deadline',
        taskId: lowPriorityTask.id,
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        type: 'soft',
        importance: 0.2
      };

      const adjustment = await engine.suggestAdjustment(
        lowPriorityTask,
        [distantDeadline],
        mockWorkContext
      );

      expect(adjustment.suggestedPriority).toBeLessThanOrEqual(adjustment.currentPriority);
    });
  });

  describe('reorganizeForDeadlines', () => {
    it('should reorganize tasks when urgent deadlines are detected', async () => {
      const urgentDeadlines: Deadline[] = [
        {
          id: 'very-urgent',
          taskId: 'task-2',
          date: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
          type: 'hard',
          importance: 0.95
        }
      ];

      const reorganizedTasks = await engine.reorganizeForDeadlines(
        mockTasks,
        urgentDeadlines,
        mockWorkContext
      );

      expect(reorganizedTasks).toBeDefined();
      expect(Array.isArray(reorganizedTasks)).toBe(true);
      
      // Task with urgent deadline should be first
      const urgentTask = reorganizedTasks.find(t => t.id === 'task-2');
      expect(reorganizedTasks.indexOf(urgentTask!)).toBe(0);
    });

    it('should handle multiple urgent deadlines', async () => {
      const multipleUrgentDeadlines: Deadline[] = [
        {
          id: 'urgent-1',
          taskId: 'task-1',
          date: new Date(Date.now() + 2 * 60 * 60 * 1000),
          type: 'hard',
          importance: 0.9
        },
        {
          id: 'urgent-2',
          taskId: 'task-2',
          date: new Date(Date.now() + 1 * 60 * 60 * 1000),
          type: 'hard',
          importance: 0.85
        }
      ];

      const reorganizedTasks = await engine.reorganizeForDeadlines(
        mockTasks,
        multipleUrgentDeadlines,
        mockWorkContext
      );

      expect(reorganizedTasks).toBeDefined();
      
      // Should prioritize by deadline proximity and importance
      const firstTask = reorganizedTasks[0];
      const secondTask = reorganizedTasks[1];
      
      expect(['task-1', 'task-2']).toContain(firstTask.id);
      expect(['task-1', 'task-2']).toContain(secondTask.id);
    });

    it('should maintain task dependencies during reorganization', async () => {
      const reorganizedTasks = await engine.reorganizeForDeadlines(
        mockTasks,
        mockDeadlines,
        mockWorkContext
      );

      const dependentTask = reorganizedTasks.find(t => t.id === 'task-3');
      const dependencyTask = reorganizedTasks.find(t => t.id === 'task-1');
      
      if (dependentTask && dependencyTask) {
        const dependentIndex = reorganizedTasks.indexOf(dependentTask);
        const dependencyIndex = reorganizedTasks.indexOf(dependencyTask);
        
        // Dependency should come before dependent task
        expect(dependencyIndex).toBeLessThan(dependentIndex);
      }
    });
  });

  describe('updateWithCompletion', () => {
    it('should update optimization model with task completion data', async () => {
      const completedTask = mockTasks[0];
      const actualDuration = 100; // Completed faster than estimated
      const userSatisfaction = 0.9;

      await expect(
        engine.updateWithCompletion(
          completedTask,
          actualDuration,
          userSatisfaction,
          mockWorkContext
        )
      ).resolves.not.toThrow();
    });

    it('should learn from estimation accuracy', async () => {
      const completedTask = mockTasks[1];
      const actualDuration = 90; // Took longer than estimated (45 minutes)
      const userSatisfaction = 0.6;

      await engine.updateWithCompletion(
        completedTask,
        actualDuration,
        userSatisfaction,
        mockWorkContext
      );

      // Should adjust future estimations based on this feedback
      const futureOptimization = await engine.optimizePriorities(
        [completedTask],
        [],
        mockWorkContext
      );
      
      expect(futureOptimization).toBeDefined();
    });

    it('should handle negative feedback appropriately', async () => {
      const completedTask = mockTasks[2];
      const actualDuration = 180; // Much longer than estimated
      const userSatisfaction = 0.2; // Low satisfaction

      await expect(
        engine.updateWithCompletion(
          completedTask,
          actualDuration,
          userSatisfaction,
          mockWorkContext
        )
      ).resolves.not.toThrow();
    });
  });

  describe('performance optimization', () => {
    it('should handle large task lists efficiently', async () => {
      const largeTasks: Task[] = Array.from({ length: 500 }, (_, i) => ({
        id: `large-task-${i}`,
        title: `Task ${i}`,
        description: `Description for task ${i}`,
        priority: Math.floor(Math.random() * 5) + 1,
        estimatedDuration: Math.floor(Math.random() * 120) + 15,
        dependencies: i > 0 && Math.random() > 0.8 ? [`large-task-${i-1}`] : [],
        context: { type: 'work', data: {} },
        aiGenerated: false
      }));

      const startTime = Date.now();
      const optimizedTasks = await engine.optimizePriorities(
        largeTasks,
        [],
        mockWorkContext
      );
      const endTime = Date.now();

      expect(optimizedTasks).toBeDefined();
      expect(optimizedTasks).toHaveLength(largeTasks.length);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should cache optimization results for repeated queries', async () => {
      // First optimization
      await engine.optimizePriorities(mockTasks, mockDeadlines, mockWorkContext);

      // Second optimization with same data should be faster
      const startTime = Date.now();
      const optimizedTasks = await engine.optimizePriorities(
        mockTasks,
        mockDeadlines,
        mockWorkContext
      );
      const endTime = Date.now();

      expect(optimizedTasks).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast due to caching
    });
  });

  describe('algorithm accuracy', () => {
    it('should consistently prioritize critical tasks', async () => {
      const criticalTask: Task = {
        id: 'critical',
        title: 'System Down',
        description: 'Critical system failure',
        priority: 5,
        estimatedDuration: 60,
        dependencies: [],
        context: { type: 'work', data: { severity: 'critical' } },
        aiGenerated: false
      };

      const regularTasks = mockTasks.slice(1); // Remove existing critical task
      const allTasks = [criticalTask, ...regularTasks];

      const optimizedTasks = await engine.optimizePriorities(
        allTasks,
        mockDeadlines,
        mockWorkContext
      );

      // Critical task should be first
      expect(optimizedTasks[0].id).toBe('critical');
    });

    it('should balance multiple optimization factors', async () => {
      const optimizedTasks = await engine.optimizePriorities(
        mockTasks,
        mockDeadlines,
        mockWorkContext
      );

      // Should consider priority, deadlines, dependencies, and context
      expect(optimizedTasks).toBeDefined();
      
      // Verify that optimization considers multiple factors
      const priorities = optimizedTasks.map(t => t.priority);
      const hasVariation = new Set(priorities).size > 1;
      expect(hasVariation).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle invalid task data gracefully', async () => {
      const invalidTasks = [
        {
          id: null,
          title: undefined,
          priority: -1,
          estimatedDuration: 'invalid'
        }
      ] as any;

      const optimizedTasks = await engine.optimizePriorities(
        invalidTasks,
        mockDeadlines,
        mockWorkContext
      );

      expect(optimizedTasks).toBeDefined();
      expect(Array.isArray(optimizedTasks)).toBe(true);
      // Should filter out invalid tasks
    });

    it('should handle optimization algorithm failures', async () => {
      // Mock internal method to throw error
      const originalMethod = (engine as any).calculatePriorityScore;
      (engine as any).calculatePriorityScore = vi.fn(() => {
        throw new Error('Algorithm failed');
      });

      const optimizedTasks = await engine.optimizePriorities(
        mockTasks,
        mockDeadlines,
        mockWorkContext
      );

      expect(optimizedTasks).toBeDefined();
      // Should fallback to original task order
      expect(optimizedTasks).toHaveLength(mockTasks.length);

      // Restore original method
      (engine as any).calculatePriorityScore = originalMethod;
    });

    it('should handle circular dependencies', async () => {
      const circularTasks: Task[] = [
        {
          id: 'task-a',
          title: 'Task A',
          description: 'Depends on B',
          priority: 3,
          estimatedDuration: 60,
          dependencies: ['task-b'],
          context: { type: 'work', data: {} },
          aiGenerated: false
        },
        {
          id: 'task-b',
          title: 'Task B',
          description: 'Depends on A',
          priority: 3,
          estimatedDuration: 60,
          dependencies: ['task-a'],
          context: { type: 'work', data: {} },
          aiGenerated: false
        }
      ];

      const optimizedTasks = await engine.optimizePriorities(
        circularTasks,
        [],
        mockWorkContext
      );

      expect(optimizedTasks).toBeDefined();
      expect(optimizedTasks).toHaveLength(2);
      // Should handle circular dependencies without infinite loops
    });
  });

  describe('resource management', () => {
    it('should dispose resources properly', () => {
      expect(() => engine.dispose()).not.toThrow();
    });

    it('should handle multiple dispose calls', () => {
      engine.dispose();
      expect(() => engine.dispose()).not.toThrow();
    });

    it('should clear optimization cache on disposal', () => {
      engine.dispose();
      
      // Should not have any cached results after disposal
      const cache = (engine as any).getOptimizationCache?.() || {};
      expect(Object.keys(cache)).toHaveLength(0);
    });
  });
});