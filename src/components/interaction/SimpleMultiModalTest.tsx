import React, { useState } from 'react';
import { Mic, Hand, Keyboard } from 'lucide-react';

interface CommandIntent {
  action: string;
  entity?: string;
  confidence: number;
}

interface SimpleMultiModalTestProps {
  onCommand?: (intent: CommandIntent) => void;
  className?: string;
}

export const SimpleMultiModalTest: React.FC<SimpleMultiModalTestProps> = ({
  onCommand,
  className = ''
}) => {
  const [lastCommand, setLastCommand] = useState<CommandIntent | null>(null);
  const [commandCount, setCommandCount] = useState(0);

  const handleTestCommand = (action: string, entity?: string) => {
    const command: CommandIntent = {
      action,
      entity,
      confidence: 0.95
    };
    
    setLastCommand(command);
    setCommandCount(prev => prev + 1);
    onCommand?.(command);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Simple Multi-Modal Test
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          This is a minimal test version to verify the component renders correctly.
        </p>
      </div>

      {/* Status */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Keyboard className="w-4 h-4" />
            <span className="font-medium text-gray-900 dark:text-white">Current Mode</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Keyboard</p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-4 h-4 bg-green-500 rounded-full" />
            <span className="font-medium text-gray-900 dark:text-white">Status</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Active</p>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="space-y-3 mb-6">
        <button
          onClick={() => handleTestCommand('create_task', 'Test Task')}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Keyboard className="w-4 h-4" />
          <span>Test Keyboard Command</span>
        </button>

        <button
          onClick={() => handleTestCommand('voice_command', 'Hello World')}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <Mic className="w-4 h-4" />
          <span>Test Voice Command</span>
        </button>

        <button
          onClick={() => handleTestCommand('gesture_command', 'Thumbs Up')}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <Hand className="w-4 h-4" />
          <span>Test Gesture Command</span>
        </button>
      </div>

      {/* Last Command Display */}
      {lastCommand && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Last Command</h4>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p><strong>Action:</strong> {lastCommand.action}</p>
            {lastCommand.entity && <p><strong>Entity:</strong> {lastCommand.entity}</p>}
            <p><strong>Confidence:</strong> {(lastCommand.confidence * 100).toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="border-t pt-4">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <p>Commands processed: <span className="font-medium">{commandCount}</span></p>
        </div>
      </div>
    </div>
  );
};