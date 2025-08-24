import { useCallback } from 'react';
import { useAppStore } from '../store';

interface OptimisticUpdateOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: Error, rollback: () => void) => void;
  timeout?: number;
  retries?: number;
}

interface OptimisticOperation<T = any> {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  entityId: string;
  optimisticData: T;
  originalData?: T;
  timestamp: number;
}

export function useOptimisticUpdates() {
  const { 
    addToSyncQueue, 
    isOffline, 
    optimisticUpdate, 
    revertOptimisticUpdate 
  } = useAppStore();

  const performOptimisticUpdate = useCallback(
    async <T>(
      operation: Omit<OptimisticOperation<T>, 'id' | 'timestamp'>,
      apiCall: () => Promise<T>,
      options: OptimisticUpdateOptions = {}
    ): Promise<T> => {
      const operationId = crypto.randomUUID();
      const timestamp = Date.now();
      
      const fullOperation: OptimisticOperation<T> = {
        ...operation,
        id: operationId,
        timestamp,
      };

      try {
        // Apply optimistic update immediately
        applyOptimisticUpdate(fullOperation);

        // If offline, queue for later sync
        if (isOffline) {
          addToSyncQueue({
            type: operation.type,
            entity: operation.entity,
            entityId: operation.entityId,
            data: operation.optimisticData,
            priority: 'medium',
            maxRetries: options.retries || 3,
          });

          // Return optimistic data
          options.onSuccess?.(operation.optimisticData);
          return operation.optimisticData;
        }

        // If online, perform actual API call
        const result = await Promise.race([
          apiCall(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), options.timeout || 10000)
          ),
        ]);

        // Success - keep optimistic update or replace with server data
        options.onSuccess?.(result);
        return result;

      } catch (error) {
        // Revert optimistic update on error
        revertOptimisticUpdate(operationId);
        
        const rollback = () => {
          // Additional rollback logic if needed
          console.log('Rolling back operation:', operationId);
        };

        options.onError?.(error as Error, rollback);
        throw error;
      }
    },
    [addToSyncQueue, isOffline, optimisticUpdate, revertOptimisticUpdate]
  );

  const applyOptimisticUpdate = useCallback(
    <T>(operation: OptimisticOperation<T>) => {
      const { workspace, updateTask, createTask, deleteTask, updateProject, addProject, deleteProject } = useAppStore.getState();

      switch (operation.entity) {
        case 'task':
          switch (operation.type) {
            case 'create':
              createTask(operation.optimisticData as any);
              break;
            case 'update':
              updateTask(operation.entityId, operation.optimisticData as any);
              break;
            case 'delete':
              deleteTask(operation.entityId);
              break;
          }
          break;

        case 'project':
          switch (operation.type) {
            case 'create':
              addProject(operation.optimisticData as any);
              break;
            case 'update':
              updateProject(operation.entityId, operation.optimisticData as any);
              break;
            case 'delete':
              deleteProject(operation.entityId);
              break;
          }
          break;

        default:
          console.warn('Unknown entity type for optimistic update:', operation.entity);
      }
    },
    []
  );

  // Convenience methods for common operations
  const optimisticCreateTask = useCallback(
    (taskData: any, apiCall: () => Promise<any>, options?: OptimisticUpdateOptions) => {
      return performOptimisticUpdate(
        {
          type: 'create',
          entity: 'task',
          entityId: taskData.id || crypto.randomUUID(),
          optimisticData: {
            ...taskData,
            id: taskData.id || crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        apiCall,
        options
      );
    },
    [performOptimisticUpdate]
  );

  const optimisticUpdateTask = useCallback(
    (taskId: string, updates: any, apiCall: () => Promise<any>, options?: OptimisticUpdateOptions) => {
      const currentTask = useAppStore.getState().workspace.tasks.find(t => t.id === taskId);
      
      return performOptimisticUpdate(
        {
          type: 'update',
          entity: 'task',
          entityId: taskId,
          optimisticData: updates,
          originalData: currentTask,
        },
        apiCall,
        options
      );
    },
    [performOptimisticUpdate]
  );

  const optimisticDeleteTask = useCallback(
    (taskId: string, apiCall: () => Promise<any>, options?: OptimisticUpdateOptions) => {
      const currentTask = useAppStore.getState().workspace.tasks.find(t => t.id === taskId);
      
      return performOptimisticUpdate(
        {
          type: 'delete',
          entity: 'task',
          entityId: taskId,
          optimisticData: null,
          originalData: currentTask,
        },
        apiCall,
        options
      );
    },
    [performOptimisticUpdate]
  );

  const optimisticCreateProject = useCallback(
    (projectData: any, apiCall: () => Promise<any>, options?: OptimisticUpdateOptions) => {
      return performOptimisticUpdate(
        {
          type: 'create',
          entity: 'project',
          entityId: projectData.id || crypto.randomUUID(),
          optimisticData: {
            ...projectData,
            id: projectData.id || crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        apiCall,
        options
      );
    },
    [performOptimisticUpdate]
  );

  const optimisticUpdateProject = useCallback(
    (projectId: string, updates: any, apiCall: () => Promise<any>, options?: OptimisticUpdateOptions) => {
      const currentProject = useAppStore.getState().workspace.projects.find(p => p.id === projectId);
      
      return performOptimisticUpdate(
        {
          type: 'update',
          entity: 'project',
          entityId: projectId,
          optimisticData: updates,
          originalData: currentProject,
        },
        apiCall,
        options
      );
    },
    [performOptimisticUpdate]
  );

  const optimisticDeleteProject = useCallback(
    (projectId: string, apiCall: () => Promise<any>, options?: OptimisticUpdateOptions) => {
      const currentProject = useAppStore.getState().workspace.projects.find(p => p.id === projectId);
      
      return performOptimisticUpdate(
        {
          type: 'delete',
          entity: 'project',
          entityId: projectId,
          optimisticData: null,
          originalData: currentProject,
        },
        apiCall,
        options
      );
    },
    [performOptimisticUpdate]
  );

  return {
    performOptimisticUpdate,
    optimisticCreateTask,
    optimisticUpdateTask,
    optimisticDeleteTask,
    optimisticCreateProject,
    optimisticUpdateProject,
    optimisticDeleteProject,
  };
}

// Hook for batch optimistic updates
export function useBatchOptimisticUpdates() {
  const { performOptimisticUpdate } = useOptimisticUpdates();

  const performBatchUpdate = useCallback(
    async <T>(
      operations: Array<{
        operation: Omit<OptimisticOperation<T>, 'id' | 'timestamp'>;
        apiCall: () => Promise<T>;
        options?: OptimisticUpdateOptions;
      }>
    ): Promise<T[]> => {
      const results: T[] = [];
      const errors: Error[] = [];

      // Apply all optimistic updates first
      const operationIds = operations.map(() => crypto.randomUUID());
      
      operations.forEach((op, index) => {
        try {
          // Apply optimistic update with generated ID
          const fullOperation = {
            ...op.operation,
            id: operationIds[index],
            timestamp: Date.now(),
          };
          
          // This would need to be implemented in the store
          // applyOptimisticUpdate(fullOperation);
        } catch (error) {
          errors.push(error as Error);
        }
      });

      // If offline, queue all operations
      if (useAppStore.getState().offline.isOffline) {
        operations.forEach((op) => {
          useAppStore.getState().addToSyncQueue({
            type: op.operation.type,
            entity: op.operation.entity,
            entityId: op.operation.entityId,
            data: op.operation.optimisticData,
            priority: 'medium',
            maxRetries: 3,
          });
        });

        return operations.map(op => op.operation.optimisticData);
      }

      // If online, perform all API calls
      const promises = operations.map(async (op, index) => {
        try {
          const result = await op.apiCall();
          results[index] = result;
          op.options?.onSuccess?.(result);
          return result;
        } catch (error) {
          errors.push(error as Error);
          
          // Revert optimistic update
          useAppStore.getState().revertOptimisticUpdate(operationIds[index]);
          
          const rollback = () => {
            console.log('Rolling back batch operation:', operationIds[index]);
          };
          
          op.options?.onError?.(error as Error, rollback);
          throw error;
        }
      });

      try {
        const allResults = await Promise.allSettled(promises);
        return allResults
          .filter((result): result is PromiseFulfilledResult<T> => result.status === 'fulfilled')
          .map(result => result.value);
      } catch (error) {
        // Handle batch failure
        throw new Error(`Batch update failed: ${errors.length} operations failed`);
      }
    },
    [performOptimisticUpdate]
  );

  return {
    performBatchUpdate,
  };
}