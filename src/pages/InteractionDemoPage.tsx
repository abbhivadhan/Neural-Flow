import React, { useState, useCallback } from 'react';
import { Brain, Zap, MessageSquare, Hand, Mic, Eye } from 'lucide-react';
import { MultiModalInterface } from '../components/interaction/MultiModalInterface';
import { SimpleMultiModalTest } from '../components/interaction/SimpleMultiModalTest';
import { MinimalTest } from '../components/interaction/MinimalTest';
// Local type definition to avoid import issues
interface CommandIntent {
  action: string;
  entity?: string;
  parameters?: Record<string, any>;
  confidence: number;
}

interface CommandLog {
  id: string;
  intent: CommandIntent;
  timestamp: Date;
  executed: boolean;
}

export const InteractionDemoPage: React.FC = () => {
  const [commandLog, setCommandLog] = useState<CommandLog[]>([]);
  const [demoText, setDemoText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCommand = useCallback((intent: CommandIntent) => {
    const newCommand: CommandLog = {
      id: `cmd_${Date.now()}`,
      intent,
      timestamp: new Date(),
      executed: false
    };

    setCommandLog(prev => [newCommand, ...prev.slice(0, 9)]); // Keep last 10 commands
    
    // Simulate command execution
    setIsProcessing(true);
    setTimeout(() => {
      setCommandLog(prev => 
        prev.map(cmd => 
          cmd.id === newCommand.id ? { ...cmd, executed: true } : cmd
        )
      );
      setIsProcessing(false);
      
      // Execute the command based on intent
      executeCommand(intent);
    }, 500);
  }, []);

  const executeCommand = (intent: CommandIntent) => {
    switch (intent.action) {
      case 'create_task':
        setDemoText(prev => prev + `\n✓ Created task: ${intent.entity || 'New Task'}`);
        break;
      case 'search':
        setDemoText(prev => prev + `\n🔍 Searching for: ${intent.entity || 'items'}`);
        break;
      case 'open_item':
        setDemoText(prev => prev + `\n📂 Opening: ${intent.entity || 'item'}`);
        break;
      case 'save_file':
        setDemoText(prev => prev + `\n💾 Saving file...`);
        break;
      case 'help':
        setDemoText(prev => prev + `\n❓ Help requested`);
        break;
      case 'select':
        setDemoText(prev => prev + `\n👆 Item selected`);
        break;
      case 'navigate_back':
        setDemoText(prev => prev + `\n⬅️ Navigating back`);
        break;
      case 'navigate_forward':
        setDemoText(prev => prev + `\n➡️ Navigating forward`);
        break;
      case 'approve':
        setDemoText(prev => prev + `\n👍 Approved`);
        break;
      case 'reject':
        setDemoText(prev => prev + `\n👎 Rejected`);
        break;
      case 'zoom_in':
        setDemoText(prev => prev + `\n🔍+ Zooming in`);
        break;
      case 'zoom_out':
        setDemoText(prev => prev + `\n🔍- Zooming out`);
        break;
      default:
        setDemoText(prev => prev + `\n⚡ Executed: ${intent.action}`);
    }
  };

  const clearLog = () => {
    setCommandLog([]);
    setDemoText('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Brain className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Neural Flow Multi-Modal Interface
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Experience the future of human-computer interaction with voice commands, gesture recognition, 
            and intelligent context adaptation.
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center mb-4">
              <Mic className="w-8 h-8 text-green-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Voice Commands</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Natural language processing with 95% accuracy. Speak naturally and watch your commands come to life.
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Try saying:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>"Create a new task"</li>
                <li>"Search for documents"</li>
                <li>"Open project files"</li>
                <li>"Save this file"</li>
              </ul>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center mb-4">
              <Hand className="w-8 h-8 text-blue-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gesture Recognition</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              MediaPipe-powered hand tracking for intuitive gesture controls. No additional hardware required.
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Supported gestures:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>👆 Point to select</li>
                <li>👍 Thumbs up to approve</li>
                <li>✌️ Peace sign to toggle</li>
                <li>👌 OK sign to confirm</li>
              </ul>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center mb-4">
              <Eye className="w-8 h-8 text-purple-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Context Adaptation</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              AI-powered context awareness that adapts input methods based on your environment and work mode.
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Adapts to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Meeting mode (silent)</li>
                <li>Noise levels</li>
                <li>Lighting conditions</li>
                <li>Device type</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Demo Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Multi-Modal Interface */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Minimal Test */}
              <MinimalTest />
              
              {/* Simple Test Component */}
              <SimpleMultiModalTest 
                onCommand={handleCommand}
                className="w-full"
              />
              
              {/* Original Multi-Modal Interface */}
              <MultiModalInterface 
                onCommand={handleCommand}
                className="w-full"
              />
            </div>
          </div>
          
          {/* Demo Buttons for Testing */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Test Commands
            </h3>
            <div className="space-y-4">
              <button
                onClick={() => handleCommand({ action: 'create_task', entity: 'Demo Task', confidence: 0.95 })}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Create Task (Demo)
              </button>
              <button
                onClick={() => handleCommand({ action: 'search', entity: 'documents', confidence: 0.88 })}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Search Documents (Demo)
              </button>
              <button
                onClick={() => handleCommand({ action: 'open_item', entity: 'project files', confidence: 0.92 })}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Open Project (Demo)
              </button>
              <button
                onClick={() => handleCommand({ action: 'approve', confidence: 0.90 })}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                👍 Approve (Gesture Demo)
              </button>
              <button
                onClick={() => handleCommand({ action: 'help', confidence: 0.95 })}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Help (Voice Demo)
              </button>
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Use the actual multi-modal interface above, or these buttons for quick testing.
              </p>
            </div>
          </div>
        </div>

        {/* Command Log and Demo Output */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="space-y-6">
            {/* Command Log */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Command Log
                </h3>
                <button
                  onClick={clearLog}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  Clear
                </button>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {commandLog.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No commands yet. Try using voice or gestures!
                  </p>
                ) : (
                  commandLog.map((cmd) => (
                    <div
                      key={cmd.id}
                      className={`p-3 rounded-lg border-l-4 transition-all ${
                        cmd.executed
                          ? 'bg-green-50 border-green-400 dark:bg-green-900/20'
                          : 'bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {cmd.intent.action.replace('_', ' ').toUpperCase()}
                        </span>
                        <div className="flex items-center space-x-2">
                          {isProcessing && !cmd.executed && (
                            <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
                          )}
                          <span className="text-xs text-gray-500">
                            {cmd.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      {cmd.intent.entity && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Entity: {cmd.intent.entity}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          Confidence: {(cmd.intent.confidence * 100).toFixed(1)}%
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          cmd.executed
                            ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200'
                        }`}>
                          {cmd.executed ? 'Executed' : 'Processing'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Demo Output */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Demo Output
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 min-h-32">
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {demoText || 'Command outputs will appear here...'}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            How to Use the Multi-Modal Interface
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Voice Commands</h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Click "Start" next to Voice Recognition</li>
                <li>Allow microphone access when prompted</li>
                <li>Speak naturally using commands like:
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>"Create a new task called Project Review"</li>
                    <li>"Search for documents about AI"</li>
                    <li>"Open the main project file"</li>
                    <li>"Save this document"</li>
                    <li>"Help me with navigation"</li>
                  </ul>
                </li>
              </ol>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Gesture Recognition</h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Click "Start" next to Gesture Recognition</li>
                <li>Allow camera access when prompted</li>
                <li>Position your hand in front of the camera</li>
                <li>Use these gestures:
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>👆 Point with index finger to select</li>
                    <li>👍 Thumbs up to approve</li>
                    <li>👎 Thumbs down to reject</li>
                    <li>👌 OK sign to confirm</li>
                    <li>✌️ Peace sign to toggle modes</li>
                  </ul>
                </li>
              </ol>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-blue-800 dark:text-blue-200">
              <strong>Pro Tip:</strong> The system automatically adapts input methods based on your context. 
              Try changing work modes or environmental settings to see how it optimizes for your situation!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};