import React, { useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardModeProvider } from '../providers/DashboardModeProvider';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Brain, 
  Save,
  Settings as SettingsIcon
} from 'lucide-react';

function SimpleSettingsContent() {
  const [activeSection, setActiveSection] = useState('profile');
  const [settings, setSettings] = useState({
    theme: 'system',
    notifications: true,
    aiAssistant: true,
    displayName: 'John Doe',
    email: 'john@example.com'
  });

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'ai', label: 'AI Settings', icon: Brain }
  ];

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Customize your Neural Flow experience
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-80 flex-shrink-0">
          <Card className="p-0 overflow-hidden">
            <div className="space-y-1 p-2">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all
                      ${isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="mt-6">
            <Button className="w-full" variant="primary">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {sections.find(s => s.id === activeSection)?.label}
              </h2>
            </div>

            <div className="space-y-6">
              {activeSection === 'profile' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={settings.displayName}
                      onChange={(e) => handleSettingChange('displayName', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => handleSettingChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </>
              )}

              {activeSection === 'notifications' && (
                <div>
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Email Notifications
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Receive notifications via email
                      </p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('notifications', !settings.notifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.notifications ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.notifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {activeSection === 'appearance' && (
                <div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Theme
                      </label>
                      <select
                        value={settings.theme}
                        onChange={(e) => handleSettingChange('theme', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      >
                        <option value="system">System</option>
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'ai' && (
                <div>
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        AI Assistant
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Enable AI-powered assistance
                      </p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('aiAssistant', !settings.aiAssistant)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.aiAssistant ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.aiAssistant ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {activeSection === 'privacy' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                      Privacy Settings
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Your privacy is important to us. All data is encrypted and stored securely.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function SimpleSettingsLayoutPage() {
  return (
    <DashboardModeProvider>
      <AppLayout currentContext="coding">
        <SimpleSettingsContent />
      </AppLayout>
    </DashboardModeProvider>
  );
}