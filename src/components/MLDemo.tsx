import { useState, useEffect } from 'react';
import { useMLServices } from '../hooks/useMLServices';
import { UserInteraction, Task } from '../types/ai';

/**
 * ML Demo Component
 * Demonstrates the machine learning capabilities
 */
export function MLDemo() {
  const {
    isInitialized,
    isLoading,
    error,
    predictBehaviorPattern,
    predictNextTasks,
    trainWithInteractions,
    getTrainingStatus,
    getTensorFlowInfo
  } = useMLServices();

  const [behaviorPrediction, setBehaviorPrediction] = useState<any>(null);
  const [taskPredictions, setTaskPredictions] = useState<any[]>([]);
  const [trainingStatus, setTrainingStatus] = useState<any>(null);
  const [tfInfo, setTfInfo] = useState<any>(null);

  // Generate sample interactions for demo
  const generateSampleInteractions = (): UserInteraction[] => {
    const actions = ['click', 'type', 'scroll', 'navigate', 'create', 'edit'];
    const contexts = ['coding', 'writing', 'research', 'meeting'];
    
    return Array.from({ length: 20 }, (_, i) => ({
      id: `interaction_${i}`,
      action: actions[Math.floor(Math.random() * actions.length)] || 'click',
      context: contexts[Math.floor(Math.random() * contexts.length)] || 'coding',
      timestamp: Date.now() - (i * 60000), // 1 minute intervals
      duration: Math.random() * 30000 + 5000, // 5-35 seconds
      metadata: {}
    }));
  };

  // Generate sample task history
  const generateSampleTaskHistory = () => {
    const sampleTasks: Task[] = [
      {
        id: 'task_1',
        title: 'Code Review',
        description: 'Review pull request #123',
        priority: 3,
        estimatedDuration: 30,
        dependencies: [],
        context: { type: 'development', data: {} },
        aiGenerated: false
      },
      {
        id: 'task_2',
        title: 'Write Documentation',
        description: 'Update API documentation',
        priority: 2,
        estimatedDuration: 60,
        dependencies: [],
        context: { type: 'documentation', data: {} },
        aiGenerated: false
      }
    ];

    return {
      completedTasks: sampleTasks,
      patterns: [],
      preferences: {}
    };
  };

  // Demo behavior prediction
  const demoeBehaviorPrediction = async () => {
    const sampleInteractions = generateSampleInteractions();
    const prediction = await predictBehaviorPattern(sampleInteractions);
    setBehaviorPrediction(prediction);
  };

  // Demo task prediction
  const demoTaskPrediction = async () => {
    const sampleHistory = generateSampleTaskHistory();
    const predictions = await predictNextTasks(sampleHistory, 3);
    setTaskPredictions(predictions || []);
  };

  // Demo training
  const demoTraining = () => {
    const sampleInteractions = generateSampleInteractions();
    trainWithInteractions(sampleInteractions, 'focused_work');
  };

  // Update status and info
  useEffect(() => {
    if (isInitialized) {
      setTrainingStatus(getTrainingStatus());
      setTfInfo(getTensorFlowInfo());
    }
  }, [isInitialized, getTrainingStatus, getTensorFlowInfo]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Initializing ML services...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">ML Initialization Error</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-yellow-800 font-medium">ML Services Not Ready</h3>
        <p className="text-yellow-600 text-sm mt-1">Please wait for initialization to complete.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow-lg">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Neural Flow ML Demo</h2>
        <p className="text-gray-600 mt-1">Demonstrating client-side machine learning capabilities</p>
      </div>

      {/* TensorFlow Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">TensorFlow.js Environment</h3>
        {tfInfo && (
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Backend:</strong> {tfInfo.backend}</p>
            <p><strong>Version:</strong> {tfInfo.version}</p>
            <p><strong>Memory:</strong> {JSON.stringify(tfInfo.memory)}</p>
          </div>
        )}
      </div>

      {/* Demo Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={demoeBehaviorPrediction}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Demo Behavior Prediction
        </button>
        
        <button
          onClick={demoTaskPrediction}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Demo Task Prediction
        </button>
        
        <button
          onClick={demoTraining}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Demo Training
        </button>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Behavior Prediction Results */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Behavior Prediction</h3>
          {behaviorPrediction ? (
            <div className="text-sm space-y-2">
              <p><strong>Pattern:</strong> {behaviorPrediction.type}</p>
              <p><strong>Confidence:</strong> {(behaviorPrediction.confidence * 100).toFixed(1)}%</p>
              <p><strong>Features:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>Interaction Frequency: {(behaviorPrediction.features.interactionFrequency * 100).toFixed(1)}%</li>
                <li>Focus Duration: {(behaviorPrediction.features.focusDuration * 100).toFixed(1)}%</li>
                <li>Productivity Score: {(behaviorPrediction.features.productivityScore * 100).toFixed(1)}%</li>
              </ul>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Click "Demo Behavior Prediction" to see results</p>
          )}
        </div>

        {/* Task Prediction Results */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Task Predictions</h3>
          {taskPredictions.length > 0 ? (
            <div className="space-y-3">
              {taskPredictions.map((prediction, index) => (
                <div key={index} className="bg-white rounded p-3 text-sm">
                  <p><strong>Task ID:</strong> {prediction.taskId}</p>
                  <p><strong>Confidence:</strong> {(prediction.confidence * 100).toFixed(1)}%</p>
                  <p><strong>Priority:</strong> {prediction.priority}/5</p>
                  <p><strong>Duration:</strong> {prediction.estimatedDuration} min</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Click "Demo Task Prediction" to see results</p>
          )}
        </div>
      </div>

      {/* Training Status */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Training Status</h3>
        {trainingStatus ? (
          <div className="text-sm space-y-2">
            <p><strong>Is Training:</strong> {trainingStatus.isTraining ? 'Yes' : 'No'}</p>
            <p><strong>Queue Size:</strong> {trainingStatus.queueSize}</p>
            <p><strong>Min Training Data:</strong> {trainingStatus.minTrainingDataSize}</p>
            <p><strong>Models Initialized:</strong> 
              Behavioral: {trainingStatus.models.behavioral.initialized ? '✓' : '✗'}, 
              Task Prediction: {trainingStatus.models.taskPrediction.initialized ? '✓' : '✗'}
            </p>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Training status not available</p>
        )}
      </div>
    </div>
  );
}