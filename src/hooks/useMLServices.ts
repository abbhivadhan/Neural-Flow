import { useState, useEffect, useCallback } from 'react';
import { tensorflowConfig, ModelTrainingPipeline } from '../services/ml';
import { UserInteraction, Task, TaskHistory, BehaviorPattern } from '../types/ai';

/**
 * React hook for ML services integration
 * Provides easy access to machine learning capabilities
 */
export function useMLServices() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trainingPipeline, setTrainingPipeline] = useState<ModelTrainingPipeline | null>(null);

  // Initialize ML services
  useEffect(() => {
    const initializeML = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize TensorFlow.js
        await tensorflowConfig.initialize();
        
        // Initialize training pipeline
        const pipeline = new ModelTrainingPipeline();
        await pipeline.initialize();
        
        setTrainingPipeline(pipeline);
        setIsInitialized(true);
        
        console.log('ML services initialized successfully');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize ML services';
        setError(errorMessage);
        console.error('ML initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeML();

    // Cleanup on unmount
    return () => {
      if (trainingPipeline) {
        trainingPipeline.dispose();
      }
      tensorflowConfig.dispose();
    };
  }, []);

  // Predict behavior pattern
  const predictBehaviorPattern = useCallback(async (
    interactions: UserInteraction[]
  ): Promise<BehaviorPattern | null> => {
    if (!trainingPipeline || !isInitialized) {
      console.warn('ML services not initialized');
      return null;
    }

    try {
      const predictions = await trainingPipeline.getModelPredictions(interactions, {
        completedTasks: [],
        patterns: [],
        preferences: {}
      });
      return predictions.behaviorPattern;
    } catch (err) {
      console.error('Behavior prediction error:', err);
      return null;
    }
  }, [trainingPipeline, isInitialized]);

  // Predict next tasks
  const predictNextTasks = useCallback(async (
    taskHistory: TaskHistory,
    topK: number = 3
  ): Promise<any[] | null> => {
    if (!trainingPipeline || !isInitialized) {
      console.warn('ML services not initialized');
      return null;
    }

    try {
      const predictions = await trainingPipeline.getModelPredictions([], taskHistory);
      return predictions.taskPredictions.slice(0, topK);
    } catch (err) {
      console.error('Task prediction error:', err);
      return null;
    }
  }, [trainingPipeline, isInitialized]);

  // Train models with user interactions
  const trainWithInteractions = useCallback((
    interactions: UserInteraction[],
    behaviorLabel: string
  ) => {
    if (!trainingPipeline || !isInitialized) {
      console.warn('ML services not initialized');
      return;
    }

    trainingPipeline.processUserInteractions(interactions, behaviorLabel);
  }, [trainingPipeline, isInitialized]);

  // Train models with task completion
  const trainWithTaskCompletion = useCallback((
    taskHistory: TaskHistory,
    completedTask: Task
  ) => {
    if (!trainingPipeline || !isInitialized) {
      console.warn('ML services not initialized');
      return;
    }

    trainingPipeline.processTaskCompletion(taskHistory, completedTask);
  }, [trainingPipeline, isInitialized]);

  // Force model training
  const forceTraining = useCallback(async () => {
    if (!trainingPipeline || !isInitialized) {
      console.warn('ML services not initialized');
      return;
    }

    try {
      await trainingPipeline.forceTraining();
      console.log('Model training completed');
    } catch (err) {
      console.error('Training error:', err);
    }
  }, [trainingPipeline, isInitialized]);

  // Get training status
  const getTrainingStatus = useCallback(() => {
    if (!trainingPipeline || !isInitialized) {
      return null;
    }

    return trainingPipeline.getStatus();
  }, [trainingPipeline, isInitialized]);

  // Get TensorFlow environment info
  const getTensorFlowInfo = useCallback(() => {
    if (!isInitialized) {
      return null;
    }

    return tensorflowConfig.getEnvironmentInfo();
  }, [isInitialized]);

  return {
    // State
    isInitialized,
    isLoading,
    error,
    
    // Prediction functions
    predictBehaviorPattern,
    predictNextTasks,
    
    // Training functions
    trainWithInteractions,
    trainWithTaskCompletion,
    forceTraining,
    
    // Status functions
    getTrainingStatus,
    getTensorFlowInfo
  };
}