import React, { useState, useEffect } from 'react';
import { useAppStore, useWorkspaceActions, useAIActions, useCacheActions, useOfflineActions } from '../../store';
import { useOptimisticUpdates } from '../../hooks/useOptimisticUpdates';
import { Task, Project } from '../../types';

export const StateManagementDemo: React.FC = () => {
  const { workspace, ai, cache, offline } = useAppStore();
  const workspaceActions = useWorkspaceActions();
  const aiActions = useAIActions();
  const cacheActions = useCacheActions();
  const offlineActions = useOfflineActions();
  const { optimisticCreateTask, optimisticUpdateTask } = useOptimisticUpdates();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [cacheKey, setCacheKey] = useState('');
  const [cacheValue, setCacheValue] = useState('');

  // Demo data
  useEffect(() => {
    // Add some demo projects if none exist
    if (workspace.projects.length === 0) {
      const demoProject: Project = {
        id: 'demo-project-1',
        title: 'Neural Flow Demo Project',
        description: 'Showcasing advanced state management',
        status: 'active',
        priority: 'high',
        tags: ['demo', 'state-management'],
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerId: 'demo-user',
        collaborators: [],
        progress: 45,
      };
      
      workspaceActions.addProject(demoProject);
      workspaceActions.setCurrentProject(demoProject);
    }
  }, [workspace.projects.length, workspaceActions]);

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;

    const taskData = {
      title: newTaskTitle,
      description: 'Created with optimistic updates',
      status: 'todo' as const,
      priority: 'medium' as const,
      projectId: workspace.currentProject?.id,
      tags: ['demo'],
      dependencies: [],
      subtasks: [],
    };

    try {
      await optimisticCreateTask(
        taskData,
        // Simulate API call
        () => new Promise(resolve => setTimeout(() => resolve(taskData), 1000)),
        {
          onSuccess: (result) => {
            console.log('Task created successfully:', result);
          },
          onError: (error, rollback) => {
            console.error('Failed to create task:', error);
            rollback();
          },
        }
      );
      
      setNewTaskTitle('');
    } catch (error) {
      console.error('Task creation failed:', error);
    }
  };

  const handleUpdateTask = async (taskId: string) => {
    try {
      await optimisticUpdateTask(
        taskId,
        { 
          status: 'completed' as const,
          completedAt: new Date(),
        },
        // Simulate API call
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 800)),
        {
          onSuccess: () => {
            console.log('Task updated successfully');
          },
          onError: (error, rollback) => {
            console.error('Failed to update task:', error);
            rollback();
          },
        }
      );
    } catch (error) {
      console.error('Task update failed:', error);
    }
  };

  const handleCacheSet = () => {
    if (!cacheKey.trim() || !cacheValue.trim()) return;
    
    cacheActions.setCache(cacheKey, cacheValue, {
      ttl: 30000, // 30 seconds
      tags: ['demo'],
    });
    
    setCacheKey('');
    setCacheValue('');
  };

  const handleGenerateAIContent = async () => {
    try {
      await aiActions.generateContent({
        type: 'text',
        prompt: 'Generate a productivity tip for the Neural Flow app',
        metadata: { source: 'demo' },
      });
    } catch (error) {
      console.error('AI content generation failed:', error);
    }
  };

  const handleToggleOffline = () => {
    offlineActions.setOfflineStatus(!offline.isOffline);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Advanced State Management Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Showcasing Zustand, intelligent caching, offline-first architecture, and optimistic updates
        </p>
      </div>

      {/* Workspace State */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Workspace State Management
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Current Project</h3>
            {workspace.currentProject ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  {workspace.currentProject.title}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Progress: {workspace.currentProject.progress}%
                </p>
              </div>
            ) : (
              <p className="text-gray-500">No project selected</p>
            )}
          </div>

          <div>
            <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Statistics</h3>
            <div className="space-y-1 text-sm">
              <p>Projects: {workspace.projects.length}</p>
              <p>Tasks: {workspace.tasks.length}</p>
              <p>Completed: {workspace.tasks.filter(t => t.status === 'completed').length}</p>
              <p>Recent Projects: {workspace.recentProjects.length}</p>
            </div>
          </div>
        </div>

        {/* Task Creation with Optimistic Updates */}
        <div className="mt-6">
          <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">
            Create Task (Optimistic Updates)
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Enter task title..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              onClick={handleCreateTask}
              disabled={!newTaskTitle.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Task
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="mt-4">
          <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Tasks</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {workspace.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <div>
                  <span className={`${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                    {task.title}
                  </span>
                  <span className={`ml-2 px-2 py-1 text-xs rounded ${
                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status}
                  </span>
                </div>
                {task.status !== 'completed' && (
                  <button
                    onClick={() => handleUpdateTask(task.id)}
                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Complete
                  </button>
                )}
              </div>
            ))}
            {workspace.tasks.length === 0 && (
              <p className="text-gray-500 text-sm">No tasks yet. Create one above!</p>
            )}
          </div>
        </div>
      </div>

      {/* AI State */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          AI State Management
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Model Settings</h3>
            <div className="space-y-2 text-sm">
              <p>Temperature: {ai.modelSettings.temperature}</p>
              <p>Max Tokens: {ai.modelSettings.maxTokens}</p>
              <p>Model: {ai.modelSettings.model}</p>
              <p>Accuracy: {(ai.modelAccuracy * 100).toFixed(1)}%</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">AI Activity</h3>
            <div className="space-y-2 text-sm">
              <p>Predictions: {ai.predictions.length}</p>
              <p>Content Generations: {ai.contentGenerations.length}</p>
              <p>User Patterns: {ai.userPatterns.length}</p>
              <p>Processing: {ai.isProcessing ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={handleGenerateAIContent}
            disabled={ai.isProcessing}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            {ai.isProcessing ? 'Generating...' : 'Generate AI Content'}
          </button>
        </div>

        {/* Recent AI Content */}
        {ai.contentGenerations.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Recent AI Content</h3>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded max-h-32 overflow-y-auto">
              <p className="text-sm">{ai.contentGenerations[ai.contentGenerations.length - 1]?.result}</p>
            </div>
          </div>
        )}
      </div>

      {/* Cache Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Intelligent Cache Management
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Cache Statistics</h3>
            <div className="space-y-2 text-sm">
              <p>Entries: {cache.metadata.entryCount}</p>
              <p>Total Size: {formatBytes(cache.metadata.totalSize)}</p>
              <p>Hit Rate: {(cache.metadata.hitRate * 100).toFixed(1)}%</p>
              <p>Max Size: {formatBytes(cache.maxSize)}</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Cache Operations</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cacheKey}
                  onChange={(e) => setCacheKey(e.target.value)}
                  placeholder="Cache key"
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  value={cacheValue}
                  onChange={(e) => setCacheValue(e.target.value)}
                  placeholder="Cache value"
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <button
                onClick={handleCacheSet}
                disabled={!cacheKey.trim() || !cacheValue.trim()}
                className="w-full px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Set Cache
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => cacheActions.clearExpiredCache()}
            className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Clear Expired
          </button>
          <button
            onClick={() => cacheActions.clearAllCache()}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear All Cache
          </button>
        </div>
      </div>

      {/* Offline State */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Offline-First Architecture
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Network Status</h3>
            <div className="space-y-2 text-sm">
              <p>Status: <span className={`font-medium ${offline.isOffline ? 'text-red-600' : 'text-green-600'}`}>
                {offline.isOffline ? 'Offline' : 'Online'}
              </span></p>
              <p>Network: {offline.networkStatus}</p>
              <p>Pending Changes: {offline.pendingChanges}</p>
              <p>Sync in Progress: {offline.syncInProgress ? 'Yes' : 'No'}</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Sync Queue</h3>
            <div className="space-y-2 text-sm max-h-32 overflow-y-auto">
              {offline.syncQueue.map((operation) => (
                <div key={operation.id} className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <p className="font-medium">{operation.type} {operation.entity}</p>
                  <p className="text-xs text-gray-500">
                    Priority: {operation.priority} | Status: {operation.status}
                  </p>
                </div>
              ))}
              {offline.syncQueue.length === 0 && (
                <p className="text-gray-500">No pending operations</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleToggleOffline}
            className={`px-4 py-2 rounded text-white ${
              offline.isOffline ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {offline.isOffline ? 'Go Online' : 'Go Offline'}
          </button>
          
          {offline.syncQueue.length > 0 && (
            <button
              onClick={() => offlineActions.processSyncQueue()}
              disabled={offline.syncInProgress || offline.isOffline}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Process Sync Queue
            </button>
          )}
          
          <button
            onClick={() => offlineActions.clearSyncQueue()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear Queue
          </button>
        </div>
      </div>
    </div>
  );
};