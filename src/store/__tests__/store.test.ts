import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '../index';
import { Task, Project } from '../../types';

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
  },
});

describe('App Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState({
      workspace: {
        currentProject: null,
        projects: [],
        tasks: [],
        recentProjects: [],
        userPreferences: {
          theme: 'system',
          language: 'en',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          workingHours: { start: '09:00', end: '17:00' },
          notifications: {
            email: true,
            push: true,
            desktop: true,
          },
          privacy: {
            analytics: true,
            personalization: true,
            dataSharing: false,
          },
        },
        isLoading: false,
        error: null,
      },
      ai: {
        modelSettings: {
          temperature: 0.7,
          maxTokens: 2048,
          topP: 0.9,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0,
          model: 'gpt-3.5-turbo',
          enableLocalInference: true,
        },
        predictions: [],
        userPatterns: [],
        contentGenerations: [],
        isProcessing: false,
        lastModelUpdate: null,
        modelAccuracy: 0.85,
      },
      collaboration: {
        isConnected: false,
        currentRoom: null,
        collaborators: [],
        pendingOperations: [],
        sharedDocuments: [],
        connectionStatus: 'disconnected',
        lastSync: null,
      },
      cache: {
        entries: new Map(),
        metadata: {
          totalSize: 0,
          entryCount: 0,
          hitRate: 0,
          missRate: 0,
          lastCleanup: Date.now(),
        },
        maxSize: 50 * 1024 * 1024,
        defaultTTL: 30 * 60 * 1000,
        cleanupInterval: 5 * 60 * 1000,
        isCleanupRunning: false,
      },
      offline: {
        isOffline: false,
        syncQueue: [],
        lastSync: null,
        syncInProgress: false,
        conflictResolution: 'client',
        networkStatus: 'online',
        dataVersion: 1,
        pendingChanges: 0,
      },
    });
  });

  describe('Workspace Slice', () => {
    it('should create a new task', () => {
      const store = useAppStore.getState();
      
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        status: 'todo' as const,
        priority: 'medium' as const,
        tags: ['test'],
        dependencies: [],
        subtasks: [],
      };

      store.createTask(taskData);

      const tasks = useAppStore.getState().workspace.tasks;
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Test Task');
      expect(tasks[0].id).toBeDefined();
      expect(tasks[0].createdAt).toBeInstanceOf(Date);
    });

    it('should update a task', () => {
      const store = useAppStore.getState();
      
      // Create a task first
      store.createTask({
        title: 'Original Task',
        description: 'Original Description',
        status: 'todo',
        priority: 'medium',
        tags: [],
        dependencies: [],
        subtasks: [],
      });

      const taskId = useAppStore.getState().workspace.tasks[0].id;
      
      // Update the task
      store.updateTask(taskId, {
        title: 'Updated Task',
        status: 'in-progress',
      });

      const updatedTask = useAppStore.getState().workspace.tasks[0];
      expect(updatedTask.title).toBe('Updated Task');
      expect(updatedTask.status).toBe('in-progress');
      expect(updatedTask.updatedAt).toBeInstanceOf(Date);
    });

    it('should delete a task', () => {
      const store = useAppStore.getState();
      
      // Create a task first
      store.createTask({
        title: 'Task to Delete',
        description: 'Will be deleted',
        status: 'todo',
        priority: 'medium',
        tags: [],
        dependencies: [],
        subtasks: [],
      });

      const taskId = useAppStore.getState().workspace.tasks[0].id;
      expect(useAppStore.getState().workspace.tasks).toHaveLength(1);
      
      // Delete the task
      store.deleteTask(taskId);
      
      expect(useAppStore.getState().workspace.tasks).toHaveLength(0);
    });

    it('should manage recent projects', () => {
      const store = useAppStore.getState();
      
      const project: Project = {
        id: 'project-1',
        title: 'Test Project',
        description: 'Test Description',
        status: 'active',
        priority: 'medium',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerId: 'user-1',
        collaborators: [],
        progress: 0,
      };

      store.addRecentProject(project);
      
      const recentProjects = useAppStore.getState().workspace.recentProjects;
      expect(recentProjects).toHaveLength(1);
      expect(recentProjects[0].id).toBe('project-1');
    });

    it('should limit recent projects to 10', () => {
      const store = useAppStore.getState();
      
      // Add 12 projects
      for (let i = 0; i < 12; i++) {
        const project: Project = {
          id: `project-${i}`,
          title: `Project ${i}`,
          description: 'Test Description',
          status: 'active',
          priority: 'medium',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          ownerId: 'user-1',
          collaborators: [],
          progress: 0,
        };
        store.addRecentProject(project);
      }
      
      const recentProjects = useAppStore.getState().workspace.recentProjects;
      expect(recentProjects).toHaveLength(10);
      expect(recentProjects[0].id).toBe('project-11'); // Most recent first
    });
  });

  describe('AI Slice', () => {
    it('should update model settings', () => {
      const store = useAppStore.getState();
      
      store.updateModelSettings({
        temperature: 0.5,
        maxTokens: 1024,
      });

      const settings = useAppStore.getState().ai.modelSettings;
      expect(settings.temperature).toBe(0.5);
      expect(settings.maxTokens).toBe(1024);
      expect(useAppStore.getState().ai.lastModelUpdate).toBeInstanceOf(Date);
    });

    it('should add predictions', () => {
      const store = useAppStore.getState();
      
      store.addPrediction({
        taskId: 'task-1',
        predictedDuration: 120,
        confidence: 0.85,
        suggestedPriority: 'high',
        optimalStartTime: new Date(),
        requiredResources: ['laptop', 'internet'],
      });

      const predictions = useAppStore.getState().ai.predictions;
      expect(predictions).toHaveLength(1);
      expect(predictions[0].taskId).toBe('task-1');
      expect(predictions[0].confidence).toBe(0.85);
    });

    it('should limit predictions to 100', () => {
      const store = useAppStore.getState();
      
      // Add 105 predictions
      for (let i = 0; i < 105; i++) {
        store.addPrediction({
          taskId: `task-${i}`,
          predictedDuration: 60,
          confidence: 0.8,
          suggestedPriority: 'medium',
          optimalStartTime: new Date(),
          requiredResources: [],
        });
      }
      
      const predictions = useAppStore.getState().ai.predictions;
      expect(predictions).toHaveLength(100);
    });
  });

  describe('Cache Slice', () => {
    it('should set and get cache entries', () => {
      const store = useAppStore.getState();
      
      const testData = { message: 'Hello, World!' };
      store.setCache('test-key', testData);

      const cachedData = store.getCache('test-key');
      expect(cachedData).toEqual(testData);
      
      const metadata = useAppStore.getState().cache.metadata;
      expect(metadata.entryCount).toBe(1);
      expect(metadata.totalSize).toBeGreaterThan(0);
    });

    it('should handle cache expiration', async () => {
      const store = useAppStore.getState();
      
      // Set cache with very short TTL
      store.setCache('expire-key', 'test-data', { ttl: 1 });

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const cachedData = store.getCache('expire-key');
      expect(cachedData).toBeNull();
    });

    it('should invalidate cache by tag', () => {
      const store = useAppStore.getState();
      
      store.setCache('key1', 'data1', { tags: ['tag1', 'tag2'] });
      store.setCache('key2', 'data2', { tags: ['tag2', 'tag3'] });
      store.setCache('key3', 'data3', { tags: ['tag3'] });

      expect(store.getCache('key1')).toBe('data1');
      expect(store.getCache('key2')).toBe('data2');
      expect(store.getCache('key3')).toBe('data3');

      store.invalidateByTag('tag2');

      expect(store.getCache('key1')).toBeNull();
      expect(store.getCache('key2')).toBeNull();
      expect(store.getCache('key3')).toBe('data3');
    });

    it('should clear expired cache', async () => {
      const store = useAppStore.getState();
      
      // Set some cache entries with different TTLs
      store.setCache('short-lived', 'data1', { ttl: 1 });
      store.setCache('long-lived', 'data2', { ttl: 10000 });

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));
      
      store.clearExpiredCache();
      
      expect(store.getCache('short-lived')).toBeNull();
      expect(store.getCache('long-lived')).toBe('data2');
    });
  });

  describe('Offline Slice', () => {
    it('should add operations to sync queue', () => {
      const store = useAppStore.getState();
      
      store.addToSyncQueue({
        type: 'create',
        entity: 'task',
        entityId: 'task-1',
        data: { title: 'New Task' },
        priority: 'medium',
        maxRetries: 3,
      });

      const syncQueue = useAppStore.getState().offline.syncQueue;
      expect(syncQueue).toHaveLength(1);
      expect(syncQueue[0].type).toBe('create');
      expect(syncQueue[0].entity).toBe('task');
      expect(useAppStore.getState().offline.pendingChanges).toBe(1);
    });

    it('should sort sync queue by priority', () => {
      const store = useAppStore.getState();
      
      store.addToSyncQueue({
        type: 'create',
        entity: 'task',
        entityId: 'task-1',
        data: { title: 'Low Priority' },
        priority: 'low',
        maxRetries: 3,
      });

      store.addToSyncQueue({
        type: 'create',
        entity: 'task',
        entityId: 'task-2',
        data: { title: 'High Priority' },
        priority: 'high',
        maxRetries: 3,
      });

      store.addToSyncQueue({
        type: 'create',
        entity: 'task',
        entityId: 'task-3',
        data: { title: 'Medium Priority' },
        priority: 'medium',
        maxRetries: 3,
      });

      const syncQueue = useAppStore.getState().offline.syncQueue;
      expect(syncQueue[0].priority).toBe('high');
      expect(syncQueue[1].priority).toBe('medium');
      expect(syncQueue[2].priority).toBe('low');
    });

    it('should handle duplicate operations', () => {
      const store = useAppStore.getState();
      
      const operation = {
        type: 'update' as const,
        entity: 'task',
        entityId: 'task-1',
        data: { title: 'First Update' },
        priority: 'medium' as const,
        maxRetries: 3,
      };

      store.addToSyncQueue(operation);
      
      // Add duplicate operation with different data
      store.addToSyncQueue({
        ...operation,
        data: { title: 'Second Update' },
      });

      const syncQueue = useAppStore.getState().offline.syncQueue;
      expect(syncQueue).toHaveLength(1);
      expect(syncQueue[0].data.title).toBe('Second Update');
    });

    it('should clear sync queue', () => {
      const store = useAppStore.getState();
      
      store.addToSyncQueue({
        type: 'create',
        entity: 'task',
        entityId: 'task-1',
        data: { title: 'Task 1' },
        priority: 'medium',
        maxRetries: 3,
      });

      expect(useAppStore.getState().offline.syncQueue).toHaveLength(1);
      
      store.clearSyncQueue();
      
      expect(useAppStore.getState().offline.syncQueue).toHaveLength(0);
      expect(useAppStore.getState().offline.pendingChanges).toBe(0);
    });
  });

  describe('Collaboration Slice', () => {
    it('should connect to a room', () => {
      const store = useAppStore.getState();
      
      store.connect('room-123');
      
      expect(useAppStore.getState().collaboration.currentRoom).toBe('room-123');
      expect(useAppStore.getState().collaboration.connectionStatus).toBe('connecting');
    });

    it('should add and remove collaborators', () => {
      const store = useAppStore.getState();
      
      const collaborator = {
        userId: 'user-1',
        username: 'testuser',
        lastSeen: new Date(),
        isActive: true,
      };

      store.addCollaborator(collaborator);
      
      expect(useAppStore.getState().collaboration.collaborators).toHaveLength(1);
      expect(useAppStore.getState().collaboration.collaborators[0].userId).toBe('user-1');
      
      store.removeCollaborator('user-1');
      
      expect(useAppStore.getState().collaboration.collaborators).toHaveLength(0);
    });

    it('should handle operations', () => {
      const store = useAppStore.getState();
      
      store.addOperation({
        type: 'insert',
        position: 0,
        content: 'Hello',
        userId: 'user-1',
      });

      const operations = useAppStore.getState().collaboration.pendingOperations;
      expect(operations).toHaveLength(1);
      expect(operations[0].type).toBe('insert');
      expect(operations[0].content).toBe('Hello');
    });
  });
});