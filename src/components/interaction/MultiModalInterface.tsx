import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MultiModalInteractionSystem } from '../../services/interaction/MultiModalInteractionSystem';
import {
  InputMode,
  WorkMode,
  InteractionContext,
  CommandIntent,
  NoiseLevel,
  LightingCondition
} from '../../types/interaction';
import { Mic, MicOff, Video, VideoOff, Hand, Keyboard, Mouse, Settings } from 'lucide-react';

interface MultiModalInterfaceProps {
  onCommand?: (intent: CommandIntent) => void;
  className?: string;
}

interface SystemStatus {
  isActive: boolean;
  currentMode: InputMode;
  voiceActive: boolean;
  gestureActive: boolean;
  contextualAdaptation: boolean;
}

export const MultiModalInterface: React.FC<MultiModalInterfaceProps> = ({
  onCommand,
  className = ''
}) => {
  const [system, setSystem] = useState<MultiModalInteractionSystem | null>(null);
  const [status, setStatus] = useState<SystemStatus>({
    isActive: false,
    currentMode: InputMode.KEYBOARD,
    voiceActive: false,
    gestureActive: false,
    contextualAdaptation: true
  });
  const [context, setContext] = useState<InteractionContext | null>(null);
  const [lastCommand, setLastCommand] = useState<CommandIntent | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    commandsProcessed: 0,
    averageResponseTime: 0,
    errorRate: 0,
    adaptationCount: 0
  });
  const [showSettings, setShowSettings] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize the multi-modal system
  useEffect(() => {
    const initializeSystem = async () => {
      try {
        const multiModalSystem = new MultiModalInteractionSystem({
          preferredInputMethods: [InputMode.KEYBOARD, InputMode.VOICE, InputMode.GESTURE],
          voiceLanguage: 'en-US',
          gestureEnabled: true,
          accessibilityNeeds: []
        });

        // Set up event listeners
        multiModalSystem.addEventListener('command', (event) => {
          const command = event.data as any;
          setLastCommand(command.intent);
          onCommand?.(command.intent);
        });

        multiModalSystem.addEventListener('mode_change', (event) => {
          const { mode } = event.data;
          setStatus(prev => ({ ...prev, currentMode: mode }));
        });

        multiModalSystem.addEventListener('context_update', (event) => {
          const { current } = event.data;
          setContext(current);
        });

        multiModalSystem.addEventListener('error', (event) => {
          console.error('MultiModal System Error:', event.data);
        });

        await multiModalSystem.initialize();
        setSystem(multiModalSystem);
        setStatus(prev => ({ ...prev, isActive: true }));
        setContext(multiModalSystem.getCurrentContext());

        // Update performance metrics periodically
        const metricsInterval = setInterval(() => {
          setPerformanceMetrics(multiModalSystem.getPerformanceMetrics());
        }, 2000);

        return () => {
          clearInterval(metricsInterval);
          multiModalSystem.shutdown();
        };
      } catch (error) {
        console.error('Failed to initialize MultiModal system:', error);
      }
    };

    initializeSystem();
  }, [onCommand]);

  const toggleVoiceRecognition = useCallback(async () => {
    if (!system) return;

    try {
      if (status.voiceActive) {
        system.stopVoiceRecognition();
        setStatus(prev => ({ ...prev, voiceActive: false }));
      } else {
        await system.startVoiceRecognition();
        setStatus(prev => ({ ...prev, voiceActive: true }));
      }
    } catch (error) {
      console.error('Voice recognition error:', error);
    }
  }, [system, status.voiceActive]);

  const toggleGestureRecognition = useCallback(async () => {
    if (!system) return;

    try {
      if (status.gestureActive) {
        system.stopGestureRecognition();
        setStatus(prev => ({ ...prev, gestureActive: false }));
      } else {
        if (videoRef.current && canvasRef.current) {
          await system.startGestureRecognition(videoRef.current, canvasRef.current);
          setStatus(prev => ({ ...prev, gestureActive: true }));
        }
      }
    } catch (error) {
      console.error('Gesture recognition error:', error);
    }
  }, [system, status.gestureActive]);

  const setWorkMode = useCallback((mode: WorkMode) => {
    if (!system) return;
    system.setWorkMode(mode);
  }, [system]);

  const forceInputMode = useCallback((mode: InputMode) => {
    if (!system) return;
    system.forceInputMode(mode, 'User selection');
  }, [system]);

  const toggleContextualAdaptation = useCallback(() => {
    if (!system) return;
    const newState = !status.contextualAdaptation;
    system.enableContextualAdaptation(newState);
    setStatus(prev => ({ ...prev, contextualAdaptation: newState }));
  }, [system, status.contextualAdaptation]);

  const getInputModeIcon = (mode: InputMode) => {
    switch (mode) {
      case InputMode.VOICE: return <Mic className="w-4 h-4" />;
      case InputMode.GESTURE: return <Hand className="w-4 h-4" />;
      case InputMode.KEYBOARD: return <Keyboard className="w-4 h-4" />;
      case InputMode.MOUSE: return <Mouse className="w-4 h-4" />;
      default: return <Keyboard className="w-4 h-4" />;
    }
  };

  const getStatusColor = (active: boolean) => active ? 'text-green-500' : 'text-gray-400';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Multi-Modal Interface
        </h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${status.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {status.isActive ? 'Active' : 'Inactive'}
          </span>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            {getInputModeIcon(status.currentMode)}
            <span className="font-medium text-gray-900 dark:text-white">Current Mode</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">
            {status.currentMode.replace('_', ' ')}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span className="font-medium text-gray-900 dark:text-white">Work Mode</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">
            {context?.workContext.workMode.replace('_', ' ') || 'Focus'}
          </p>
        </div>
      </div>

      {/* Input Method Controls */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mic className={`w-5 h-5 ${getStatusColor(status.voiceActive)}`} />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Voice Recognition</span>
          </div>
          <button
            onClick={toggleVoiceRecognition}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              status.voiceActive
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {status.voiceActive ? 'Stop' : 'Start'}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Hand className={`w-5 h-5 ${getStatusColor(status.gestureActive)}`} />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Gesture Recognition</span>
          </div>
          <button
            onClick={toggleGestureRecognition}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              status.gestureActive
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {status.gestureActive ? 'Stop' : 'Start'}
          </button>
        </div>
      </div>

      {/* Video and Canvas for Gesture Recognition */}
      {status.gestureActive && (
        <div className="mb-6">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-48 object-cover"
              autoPlay
              muted
              playsInline
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Last Command */}
      {lastCommand && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Last Command</h4>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p><strong>Action:</strong> {lastCommand.action}</p>
            {lastCommand.entity && <p><strong>Entity:</strong> {lastCommand.entity}</p>}
            <p><strong>Confidence:</strong> {(lastCommand.confidence * 100).toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-t pt-6 space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Settings</h4>
          
          {/* Work Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Work Mode
            </label>
            <select
              value={context?.workContext.workMode || WorkMode.FOCUS}
              onChange={(e) => setWorkMode(e.target.value as WorkMode)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {Object.values(WorkMode).map(mode => (
                <option key={mode} value={mode}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Input Mode Override */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Force Input Mode
            </label>
            <div className="flex space-x-2">
              {Object.values(InputMode).map(mode => (
                <button
                  key={mode}
                  onClick={() => forceInputMode(mode)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    status.currentMode === mode
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Contextual Adaptation Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Contextual Adaptation
            </span>
            <button
              onClick={toggleContextualAdaptation}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                status.contextualAdaptation
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {status.contextualAdaptation ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      <div className="border-t pt-4 mt-6">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Performance</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Commands:</span>
            <span className="ml-2 font-medium">{performanceMetrics.commandsProcessed}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Avg Response:</span>
            <span className="ml-2 font-medium">{performanceMetrics.averageResponseTime.toFixed(0)}ms</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Error Rate:</span>
            <span className="ml-2 font-medium">{(performanceMetrics.errorRate * 100).toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Adaptations:</span>
            <span className="ml-2 font-medium">{performanceMetrics.adaptationCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};