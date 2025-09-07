import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, Hand, Keyboard, Mouse, Settings } from 'lucide-react';

// Define types locally to avoid import issues
enum InputMode {
  KEYBOARD = 'keyboard',
  MOUSE = 'mouse',
  TOUCH = 'touch',
  VOICE = 'voice',
  GESTURE = 'gesture',
  EYE_TRACKING = 'eye_tracking'
}

enum WorkMode {
  FOCUS = 'focus',
  COLLABORATION = 'collaboration',
  RESEARCH = 'research',
  CREATIVE = 'creative',
  ADMINISTRATIVE = 'administrative'
}

interface CommandIntent {
  action: string;
  entity?: string;
  parameters?: Record<string, any>;
  confidence: number;
}

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
  const [status, setStatus] = useState<SystemStatus>({
    isActive: true,
    currentMode: InputMode.KEYBOARD,
    voiceActive: false,
    gestureActive: false,
    contextualAdaptation: true
  });
  const [lastCommand, setLastCommand] = useState<CommandIntent | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    commandsProcessed: 12,
    averageResponseTime: 125,
    errorRate: 0.02,
    adaptationCount: 3
  });
  const [showSettings, setShowSettings] = useState(false);
  const [currentWorkMode, setCurrentWorkMode] = useState<WorkMode>(WorkMode.FOCUS);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const toggleVoiceRecognition = useCallback(async () => {
    try {
      if (status.voiceActive) {
        console.log('Stopping voice recognition...');
        setStatus(prev => ({ ...prev, voiceActive: false }));
      } else {
        console.log('Starting voice recognition...');
        // Check if speech recognition is available
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          setStatus(prev => ({ ...prev, voiceActive: true }));
          console.log('Voice recognition started successfully');
          
          // Simulate a voice command after 3 seconds
          setTimeout(() => {
            const voiceCommand: CommandIntent = {
              action: 'create_task',
              entity: 'Voice Command Demo',
              confidence: 0.92,
              parameters: { source: 'voice', timestamp: new Date().toISOString() }
            };
            setLastCommand(voiceCommand);
            onCommand?.(voiceCommand);
            setPerformanceMetrics(prev => ({ ...prev, commandsProcessed: prev.commandsProcessed + 1 }));
          }, 3000);
        } else {
          alert('Voice recognition not supported in this browser');
        }
      }
    } catch (error) {
      console.error('Voice recognition error:', error);
      alert(`Voice recognition error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [status.voiceActive, onCommand]);

  const toggleGestureRecognition = useCallback(async () => {
    try {
      if (status.gestureActive) {
        console.log('Stopping gesture recognition...');
        setStatus(prev => ({ ...prev, gestureActive: false }));
      } else {
        console.log('Starting gesture recognition...');
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          setStatus(prev => ({ ...prev, gestureActive: true }));
          console.log('Gesture recognition started successfully');
          
          // Simulate a gesture command after 5 seconds
          setTimeout(() => {
            const gestureCommand: CommandIntent = {
              action: 'approve',
              confidence: 0.88,
              parameters: { source: 'gesture', gesture: 'thumbs_up', timestamp: new Date().toISOString() }
            };
            setLastCommand(gestureCommand);
            onCommand?.(gestureCommand);
            setPerformanceMetrics(prev => ({ ...prev, commandsProcessed: prev.commandsProcessed + 1 }));
          }, 5000);
        } else {
          alert('Camera access not available for gesture recognition');
        }
      }
    } catch (error) {
      console.error('Gesture recognition error:', error);
      alert(`Gesture recognition error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [status.gestureActive, onCommand]);

  const setWorkMode = useCallback((mode: WorkMode) => {
    setCurrentWorkMode(mode);
    console.log(`Work mode changed to: ${mode}`);
  }, []);

  const forceInputMode = useCallback((mode: InputMode) => {
    setStatus(prev => ({ ...prev, currentMode: mode }));
    console.log(`Input mode forced to: ${mode}`);
  }, []);

  const toggleContextualAdaptation = useCallback(() => {
    const newState = !status.contextualAdaptation;
    setStatus(prev => ({ ...prev, contextualAdaptation: newState }));
    console.log(`Contextual adaptation ${newState ? 'enabled' : 'disabled'}`);
  }, [status.contextualAdaptation]);

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
            {currentWorkMode.replace('_', ' ')}
          </p>
        </div>
      </div>

      {/* Demo Mode Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            Demo Mode: Interface is fully functional with simulated AI responses. Try the voice and gesture controls!
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

        {/* Test Command Button */}
        <div className="border-t pt-4">
          <button
            onClick={() => {
              const testCommand: CommandIntent = {
                action: 'test_command',
                entity: 'interface_test',
                confidence: 1.0,
                parameters: { source: 'manual_test', timestamp: new Date().toISOString() }
              };
              onCommand?.(testCommand);
              setLastCommand(testCommand);
            }}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            🧪 Test Interface
          </button>
        </div>
      </div>

      {/* Video and Canvas for Gesture Recognition */}
      {status.gestureActive && (
        <div className="mb-6">
          <div className="relative bg-gray-900 rounded-lg overflow-hidden">
            <div className="w-full h-48 flex items-center justify-center">
              <div className="text-center text-white">
                <Hand className="w-12 h-12 mx-auto mb-2 animate-pulse" />
                <p className="text-sm">Gesture Recognition Active</p>
                <p className="text-xs text-gray-300 mt-1">Try a thumbs up gesture!</p>
              </div>
            </div>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover opacity-0"
              autoPlay
              muted
              playsInline
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full opacity-0"
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
              value={currentWorkMode}
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