import React from 'react';
import { DashboardModeProvider, useDashboardMode } from '../providers/DashboardModeProvider';

// Example component that uses the dashboard mode context
function DashboardModeExample() {
  const {
    currentMode,
    setMode,
    isTransitioning,
    modeConfig,
    userPreferences,
    availableModes,
    updatePreferences
  } = useDashboardMode();

  return (
    <div className="dashboard-mode-example p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Dashboard Mode Example</h2>
      
      {/* Current Mode Display */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Current Mode</h3>
        <div className="bg-gray-100 p-4 rounded">
          <p><strong>Mode:</strong> {modeConfig.name}</p>
          <p><strong>Description:</strong> {modeConfig.description}</p>
          <p><strong>Theme:</strong> {modeConfig.styling.theme}</p>
          <p><strong>Compact:</strong> {modeConfig.styling.compactMode ? 'Yes' : 'No'}</p>
          <p><strong>Transitioning:</strong> {isTransitioning ? 'Yes' : 'No'}</p>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Switch Mode</h3>
        <div className="flex gap-2">
          {availableModes.map((mode) => (
            <button
              key={mode}
              onClick={() => setMode(mode)}
              disabled={isTransitioning || currentMode === mode}
              className={`px-4 py-2 rounded ${
                currentMode === mode
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              } ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {mode === 'coding' ? 'Coding Mode' : 'Meeting Mode'}
            </button>
          ))}
        </div>
      </div>

      {/* Widget Configuration */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Widget Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-green-600 mb-1">Visible Widgets</h4>
            <ul className="text-sm bg-green-50 p-3 rounded">
              {modeConfig.widgets.visible.map((widget) => (
                <li key={widget} className="mb-1">• {widget}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-red-600 mb-1">Hidden Widgets</h4>
            <ul className="text-sm bg-red-50 p-3 rounded">
              {modeConfig.widgets.hidden.map((widget) => (
                <li key={widget} className="mb-1">• {widget}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Layout Information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Layout Configuration</h3>
        <div className="bg-gray-100 p-4 rounded">
          <p><strong>Type:</strong> {modeConfig.layout.type}</p>
          <p><strong>Columns:</strong> {modeConfig.layout.columns}</p>
          <p><strong>Gap:</strong> {modeConfig.layout.gap}px</p>
          <p><strong>Spacing:</strong> {modeConfig.layout.spacing}px</p>
        </div>
      </div>

      {/* User Preferences */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">User Preferences</h3>
        <div className="bg-gray-100 p-4 rounded">
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">
              Transition Speed: {userPreferences.transitionSpeed}
            </label>
            <select
              value={userPreferences.transitionSpeed}
              onChange={(e) => updatePreferences({ 
                transitionSpeed: e.target.value as 'fast' | 'normal' | 'slow' 
              })}
              className="border rounded px-2 py-1"
            >
              <option value="fast">Fast</option>
              <option value="normal">Normal</option>
              <option value="slow">Slow</option>
            </select>
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">
              Default Mode: {userPreferences.defaultMode}
            </label>
            <select
              value={userPreferences.defaultMode}
              onChange={(e) => updatePreferences({ 
                defaultMode: e.target.value as 'coding' | 'meeting' 
              })}
              className="border rounded px-2 py-1"
            >
              <option value="coding">Coding</option>
              <option value="meeting">Meeting</option>
            </select>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={userPreferences.autoSwitchEnabled || false}
                onChange={(e) => updatePreferences({ 
                  autoSwitchEnabled: e.target.checked 
                })}
                className="mr-2"
              />
              Enable Auto-Switch
            </label>
          </div>
        </div>
      </div>

      {/* Transition Status */}
      {isTransitioning && (
        <div className="mb-6">
          <div className="bg-blue-100 border border-blue-300 rounded p-4">
            <p className="text-blue-800">
              🔄 Switching modes... Please wait.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Example app that wraps the component with the provider
export function DashboardModeApp() {
  const handleModeChange = (mode: 'coding' | 'meeting') => {
    console.log(`Mode changed to: ${mode}`);
  };

  return (
    <DashboardModeProvider 
      initialMode="coding"
      onModeChange={handleModeChange}
    >
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <DashboardModeExample />
        </div>
      </div>
    </DashboardModeProvider>
  );
}

export default DashboardModeApp;