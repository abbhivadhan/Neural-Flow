import React from 'react';
import { useSettings } from '../providers/SettingsProvider';
import { Button } from '../components/ui/Button';

export default function SimpleSettingsPage() {
  try {
    const { settings, updateSetting } = useSettings();
    
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Simple Settings Test</h1>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <select 
              value={settings.theme}
              onChange={(e) => updateSetting('theme', e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">AI Assistant</label>
            <input
              type="checkbox"
              checked={settings.aiAssistant}
              onChange={(e) => updateSetting('aiAssistant', e.target.checked)}
            />
          </div>
          
          <Button onClick={() => console.log('Settings:', settings)}>
            Log Settings
          </Button>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Settings Error</h1>
        <p>Error: {error.message}</p>
        <Button onClick={() => window.location.reload()}>Reload</Button>
      </div>
    );
  }
}