import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { UserAdaptationService, AdaptationConfig } from '../../services/ml/UserAdaptationService';
import { UserInteraction, ModelVersion } from '../../services/ml/ModelFineTuningPipeline';

interface ModelFineTuningDemoProps {
  userId: string;
  className?: string;
}

export const ModelFineTuningDemo: React.FC<ModelFineTuningDemoProps> = ({
  userId,
  className = ''
}) => {
  const [adaptationService] = useState(() => new UserAdaptationService());
  const [isInitialized, setIsInitialized] = useState(false);
  const [config, setConfig] = useState<AdaptationConfig>({
    enableIncrementalLearning: true,
    enableFederatedLearning: true,
    privacyLevel: 'medium',
    adaptationFrequency: 'realtime',
    rollbackThreshold: 0.1
  });
  const [metrics, setMetrics] = useState<any>(null);
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    return () => {
      adaptationService.dispose();
    };
  }, [adaptationService]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const initializeAdaptation = async () => {
    try {
      setIsProcessing(true);
      addLog('Initializing user adaptation...');
      
      await adaptationService.initializeUserAdaptation(userId, config);
      setIsInitialized(true);
      
      updateMetrics();
      updateVersions();
      
      addLog('User adaptation initialized successfully');
    } catch (error) {
      addLog(`Initialization failed: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateUserInteraction = async (type: string) => {
    if (!isInitialized) return;
    
    try {
      setIsProcessing(true);
      addLog(`Simulating ${type} interaction...`);
      
      const interaction: UserInteraction = {
        type: type as any,
        data: {
          taskId: `task_${Date.now()}`,
          success: Math.random() > 0.3,
          duration: Math.random() * 3600
        },
        context: {
          timeOfDay: getCurrentTimeOfDay(),
          workType: Math.random() > 0.5 ? 'focused' : 'casual',
          deviceType: Math.random() > 0.7 ? 'mobile' : 'desktop',
          environmentFactors: {
            lighting: Math.random() > 0.5 ? 'bright' : 'dim',
            noise: Math.random() > 0.5 ? 'quiet' : 'noisy'
          }
        },
        timestamp: new Date(),
        feedback: Math.random() * 0.4 + 0.6 // 0.6-1.0 range
      };
      
      await adaptationService.processUserInteraction(userId, interaction);
      
      updateMetrics();
      updateVersions();
      
      addLog(`${type} interaction processed successfully`);
    } catch (error) {
      addLog(`Interaction processing failed: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const rollbackModel = async (targetVersion?: number) => {
    if (!isInitialized) return;
    
    try {
      setIsProcessing(true);
      addLog(`Rolling back to version ${targetVersion || 'previous'}...`);
      
      await adaptationService.rollbackUserModel(userId, targetVersion);
      
      updateMetrics();
      updateVersions();
      
      addLog('Model rollback completed');
    } catch (error) {
      addLog(`Rollback failed: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateConfig = (updates: Partial<AdaptationConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    
    if (isInitialized) {
      adaptationService.updateAdaptationConfig(userId, updates);
      updateMetrics();
      addLog('Configuration updated');
    }
  };

  const updateMetrics = () => {
    const userMetrics = adaptationService.getUserMetrics(userId);
    setMetrics(userMetrics);
  };

  const updateVersions = () => {
    const modelVersions = adaptationService.getModelVersions(userId);
    setVersions(modelVersions);
  };

  const getCurrentTimeOfDay = (): string => {
    const hour = new Date().getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  const getPrivacyLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'realtime': return 'bg-blue-100 text-blue-800';
      case 'hourly': return 'bg-purple-100 text-purple-800';
      case 'daily': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Model Fine-Tuning Pipeline Demo
        </h2>
        <p className="text-gray-600">
          Experience privacy-first AI adaptation with transfer learning and federated updates
        </p>
      </div>

      {/* Configuration Panel */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Adaptation Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Privacy Level
            </label>
            <select
              value={config.privacyLevel}
              onChange={(e) => updateConfig({ privacyLevel: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isProcessing}
            >
              <option value="low">Low - Minimal protection</option>
              <option value="medium">Medium - Balanced approach</option>
              <option value="high">High - Maximum privacy</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adaptation Frequency
            </label>
            <select
              value={config.adaptationFrequency}
              onChange={(e) => updateConfig({ adaptationFrequency: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isProcessing}
            >
              <option value="realtime">Real-time</option>
              <option value="hourly">Hourly batches</option>
              <option value="daily">Daily batches</option>
            </select>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.enableIncrementalLearning}
              onChange={(e) => updateConfig({ enableIncrementalLearning: e.target.checked })}
              className="mr-2"
              disabled={isProcessing}
            />
            <span className="text-sm">Enable Incremental Learning</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.enableFederatedLearning}
              onChange={(e) => updateConfig({ enableFederatedLearning: e.target.checked })}
              className="mr-2"
              disabled={isProcessing}
            />
            <span className="text-sm">Enable Federated Learning</span>
          </label>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={initializeAdaptation}
            disabled={isInitialized || isProcessing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? 'Initializing...' : 'Initialize Adaptation'}
          </Button>
          
          {isInitialized && (
            <Badge className={getPrivacyLevelColor(config.privacyLevel)}>
              Privacy: {config.privacyLevel}
            </Badge>
          )}
        </div>
      </Card>

      {/* Metrics Dashboard */}
      {isInitialized && metrics && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Model Performance Metrics</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {(metrics.accuracy * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {metrics.adaptationCount}
              </div>
              <div className="text-sm text-gray-600">Adaptations</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(metrics.performanceScore * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Performance</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {(metrics.privacyScore * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Privacy Score</div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
          </div>
        </Card>
      )}

      {/* Interaction Simulation */}
      {isInitialized && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Simulate User Interactions</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              onClick={() => simulateUserInteraction('task_completion')}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              Task Completion
            </Button>
            
            <Button
              onClick={() => simulateUserInteraction('preference_change')}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Preference Change
            </Button>
            
            <Button
              onClick={() => simulateUserInteraction('workflow_pattern')}
              disabled={isProcessing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Workflow Pattern
            </Button>
            
            <Button
              onClick={() => simulateUserInteraction('content_generation')}
              disabled={isProcessing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Content Generation
            </Button>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Badge className={getFrequencyColor(config.adaptationFrequency)}>
              {config.adaptationFrequency} adaptation
            </Badge>
            
            {config.enableIncrementalLearning && (
              <Badge className="bg-green-100 text-green-800">
                Incremental Learning
              </Badge>
            )}
            
            {config.enableFederatedLearning && (
              <Badge className="bg-blue-100 text-blue-800">
                Federated Learning
              </Badge>
            )}
          </div>
        </Card>
      )}

      {/* Model Versions */}
      {isInitialized && versions.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Model Versions</h3>
          
          <div className="space-y-2">
            {versions.slice(-5).reverse().map((version) => (
              <div
                key={version.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  version.isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Badge className={version.isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                    v{version.version}
                  </Badge>
                  
                  <div className="text-sm">
                    <div>Accuracy: {(version.accuracy * 100).toFixed(1)}%</div>
                    <div className="text-gray-600">
                      {version.metadata.dataPoints} data points
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {new Date(version.createdAt).toLocaleString()}
                  </div>
                </div>
                
                {!version.isActive && (
                  <Button
                    onClick={() => rollbackModel(version.version)}
                    disabled={isProcessing}
                    className="bg-gray-600 hover:bg-gray-700 text-xs px-2 py-1"
                  >
                    Rollback
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          {versions.length > 5 && (
            <div className="text-sm text-gray-600 mt-2">
              Showing latest 5 versions ({versions.length} total)
            </div>
          )}
        </Card>
      )}

      {/* Activity Log */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Activity Log</h3>
        
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">No activity yet...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Privacy Information */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold mb-2 text-blue-900">Privacy-First Architecture</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            • <strong>Local Processing:</strong> All model training happens in your browser using WebAssembly
          </p>
          <p>
            • <strong>Differential Privacy:</strong> Noise is added to protect individual data points
          </p>
          <p>
            • <strong>Federated Learning:</strong> Only encrypted model updates are shared, never raw data
          </p>
          <p>
            • <strong>User Control:</strong> You can rollback, export, or delete your model at any time
          </p>
        </div>
      </Card>
    </div>
  );
};