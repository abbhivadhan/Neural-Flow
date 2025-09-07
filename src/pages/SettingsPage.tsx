import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Brain,
  Zap,
  Monitor,
  Keyboard,
  Database,
  Cloud,
  Download,
  Upload,
  Trash2,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Settings as SettingsIcon,
  ChevronRight,
  Check,
  X,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { useSettings } from '../providers/SettingsProvider';

interface SettingsSection {
  id: string;
  label: string;
  icon: any;
  description: string;
}

interface SettingItem {
  id: string;
  label: string;
  description: string;
  type: 'toggle' | 'select' | 'input' | 'slider' | 'button' | 'color';
  value?: any;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
  danger?: boolean;
  premium?: boolean;
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Add error boundary for settings hook
  let settingsData;
  try {
    settingsData = useSettings();
  } catch (error) {
    console.error('Settings provider error:', error);
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Settings Unavailable
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            There was an error loading the settings. Please try refreshing the page.
          </p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  const {
    settings,
    updateSetting,
    resetSettings,
    exportSettings,
    hasUnsavedChanges,
    saveSettings
  } = settingsData;

  const sections: SettingsSection[] = [
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      description: 'Manage your personal information and account details'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Configure how and when you receive notifications'
    },
    {
      id: 'privacy',
      label: 'Privacy & Security',
      icon: Shield,
      description: 'Control your privacy settings and security preferences'
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: Palette,
      description: 'Customize the look and feel of your workspace'
    },
    {
      id: 'ai',
      label: 'AI & Automation',
      icon: Brain,
      description: 'Configure AI assistant and automation features'
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: Zap,
      description: 'Optimize performance and resource usage'
    },
    {
      id: 'advanced',
      label: 'Advanced',
      icon: Settings,
      description: 'Developer tools and experimental features'
    }
  ];

  const getSettingsForSection = (sectionId: string): SettingItem[] => {
    switch (sectionId) {
      case 'profile':
        return [
          {
            id: 'displayName',
            label: 'Display Name',
            description: 'Your name as it appears to others',
            type: 'input',
            value: settings.displayName
          },
          {
            id: 'email',
            label: 'Email Address',
            description: 'Your primary email for account notifications',
            type: 'input',
            value: settings.email
          },
          {
            id: 'timezone',
            label: 'Timezone',
            description: 'Your local timezone for scheduling',
            type: 'select',
            value: settings.timezone,
            options: [
              { label: 'UTC-8 (Pacific)', value: 'UTC-8' },
              { label: 'UTC-5 (Eastern)', value: 'UTC-5' },
              { label: 'UTC+0 (GMT)', value: 'UTC+0' },
              { label: 'UTC+1 (CET)', value: 'UTC+1' },
            ]
          },
          {
            id: 'language',
            label: 'Language',
            description: 'Interface language',
            type: 'select',
            value: settings.language,
            options: [
              { label: 'English', value: 'en' },
              { label: 'Spanish', value: 'es' },
              { label: 'French', value: 'fr' },
              { label: 'German', value: 'de' },
            ]
          }
        ];
      
      case 'notifications':
        return [
          {
            id: 'emailNotifications',
            label: 'Email Notifications',
            description: 'Receive notifications via email',
            type: 'toggle',
            value: settings.emailNotifications
          },
          {
            id: 'pushNotifications',
            label: 'Push Notifications',
            description: 'Receive browser push notifications',
            type: 'toggle',
            value: settings.pushNotifications
          },
          {
            id: 'soundEnabled',
            label: 'Sound Effects',
            description: 'Play sounds for notifications and interactions',
            type: 'toggle',
            value: settings.soundEnabled
          },
          {
            id: 'notificationFrequency',
            label: 'Notification Frequency',
            description: 'How often to receive notifications',
            type: 'select',
            value: settings.notificationFrequency,
            options: [
              { label: 'Immediate', value: 'immediate' },
              { label: 'Every 15 minutes', value: '15min' },
              { label: 'Hourly', value: 'hourly' },
              { label: 'Daily digest', value: 'daily' },
            ]
          }
        ];
      
      case 'privacy':
        return [
          {
            id: 'twoFactorAuth',
            label: 'Two-Factor Authentication',
            description: 'Add an extra layer of security to your account',
            type: 'toggle',
            value: settings.twoFactorAuth
          },
          {
            id: 'dataEncryption',
            label: 'Data Encryption',
            description: 'Encrypt sensitive data stored locally',
            type: 'toggle',
            value: settings.dataEncryption
          },
          {
            id: 'analyticsOptOut',
            label: 'Opt-out of Analytics',
            description: 'Disable usage analytics and telemetry',
            type: 'toggle',
            value: settings.analyticsOptOut
          },
          {
            id: 'sessionTimeout',
            label: 'Session Timeout (minutes)',
            description: 'Automatically log out after inactivity',
            type: 'slider',
            value: settings.sessionTimeout,
            min: 5,
            max: 120,
            step: 5
          }
        ];
      
      case 'appearance':
        return [
          {
            id: 'theme',
            label: 'Theme',
            description: 'Choose your preferred color scheme',
            type: 'select',
            value: settings.theme,
            options: [
              { label: 'System', value: 'system' },
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
            ]
          },
          {
            id: 'accentColor',
            label: 'Accent Color',
            description: 'Primary color for buttons and highlights',
            type: 'color',
            value: settings.accentColor
          },
          {
            id: 'fontSize',
            label: 'Font Size',
            description: 'Text size throughout the interface',
            type: 'select',
            value: settings.fontSize,
            options: [
              { label: 'Small', value: 'small' },
              { label: 'Medium', value: 'medium' },
              { label: 'Large', value: 'large' },
            ]
          },
          {
            id: 'compactMode',
            label: 'Compact Mode',
            description: 'Reduce spacing for more content on screen',
            type: 'toggle',
            value: settings.compactMode
          },
          {
            id: 'animations',
            label: 'Animations',
            description: 'Enable smooth transitions and animations',
            type: 'toggle',
            value: settings.animations
          }
        ];
      
      case 'ai':
        return [
          {
            id: 'aiAssistant',
            label: 'AI Assistant',
            description: 'Enable the AI assistant for help and suggestions',
            type: 'toggle',
            value: settings.aiAssistant
          },
          {
            id: 'autoComplete',
            label: 'Auto-completion',
            description: 'AI-powered code and text completion',
            type: 'toggle',
            value: settings.autoComplete
          },
          {
            id: 'smartSuggestions',
            label: 'Smart Suggestions',
            description: 'Context-aware suggestions and recommendations',
            type: 'toggle',
            value: settings.smartSuggestions
          },
          {
            id: 'learningMode',
            label: 'Learning Mode',
            description: 'Allow AI to learn from your patterns and preferences',
            type: 'toggle',
            value: settings.learningMode
          },
          {
            id: 'aiConfidence',
            label: 'AI Confidence Threshold',
            description: 'Minimum confidence level for AI suggestions',
            type: 'slider',
            value: settings.aiConfidence,
            min: 0.1,
            max: 1.0,
            step: 0.1
          }
        ];
      
      case 'performance':
        return [
          {
            id: 'hardwareAcceleration',
            label: 'Hardware Acceleration',
            description: 'Use GPU for better performance',
            type: 'toggle',
            value: settings.hardwareAcceleration
          },
          {
            id: 'cacheSize',
            label: 'Cache Size (MB)',
            description: 'Amount of storage for caching',
            type: 'slider',
            value: settings.cacheSize,
            min: 100,
            max: 2000,
            step: 100
          },
          {
            id: 'backgroundSync',
            label: 'Background Sync',
            description: 'Sync data in the background',
            type: 'toggle',
            value: settings.backgroundSync
          },
          {
            id: 'preloadContent',
            label: 'Preload Content',
            description: 'Load content ahead of time for faster access',
            type: 'toggle',
            value: settings.preloadContent
          }
        ];
      
      case 'advanced':
        return [
          {
            id: 'developerMode',
            label: 'Developer Mode',
            description: 'Enable developer tools and debugging features',
            type: 'toggle',
            value: settings.developerMode
          },
          {
            id: 'debugMode',
            label: 'Debug Mode',
            description: 'Show detailed error messages and logs',
            type: 'toggle',
            value: settings.debugMode
          },
          {
            id: 'experimentalFeatures',
            label: 'Experimental Features',
            description: 'Enable beta features (may be unstable)',
            type: 'toggle',
            value: settings.experimentalFeatures
          },
          {
            id: 'apiRateLimit',
            label: 'API Rate Limit (requests/min)',
            description: 'Maximum API requests per minute',
            type: 'slider',
            value: settings.apiRateLimit,
            min: 10,
            max: 1000,
            step: 10
          }
        ];
      
      default:
        return [];
    }
  };

  const handleSettingChange = (settingId: string, value: any) => {
    updateSetting(settingId as keyof typeof settings, value);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings();
      // Show success message (you could add a toast notification here)
    } catch (error) {
      // Show error message
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setShowResetModal(true);
  };

  const confirmReset = () => {
    resetSettings();
    setShowResetModal(false);
  };

  const handleExport = () => {
    const dataStr = exportSettings();
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'neural-flow-settings.json';
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const renderSettingItem = (item: SettingItem) => {
    const value = settings[item.id];

    return (
      <div key={item.id} className="flex items-center justify-between py-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {item.label}
            </h4>
            {item.premium && (
              <span className="px-2 py-1 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                Pro
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {item.description}
          </p>
        </div>

        <div className="flex-shrink-0">
          {item.type === 'toggle' && (
            <button
              onClick={() => handleSettingChange(item.id, !value)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                value ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          )}

          {item.type === 'select' && (
            <select
              value={value}
              onChange={(e) => handleSettingChange(item.id, e.target.value)}
              className="w-40 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              {item.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {item.type === 'input' && (
            <Input
              value={value}
              onChange={(e) => handleSettingChange(item.id, e.target.value)}
              className="w-40"
            />
          )}

          {item.type === 'slider' && (
            <div className="w-32">
              <input
                type="range"
                min={item.min}
                max={item.max}
                step={item.step}
                value={value}
                onChange={(e) => handleSettingChange(item.id, parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
              />
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                {value}{item.id === 'aiConfidence' ? '' : item.id.includes('timeout') || item.id.includes('Limit') ? '' : ''}
              </div>
            </div>
          )}

          {item.type === 'color' && (
            <input
              type="color"
              value={value}
              onChange={(e) => handleSettingChange(item.id, e.target.value)}
              className="w-12 h-8 rounded border border-slate-300 dark:border-slate-600"
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
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
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{section.label}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {section.description}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <Button
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isSaving}
                className="w-full"
                variant="primary"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              
              <Button
                onClick={() => setShowExportModal(true)}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Settings
              </Button>
              
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full text-red-600 hover:text-red-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset to Defaults
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
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  {sections.find(s => s.id === activeSection)?.description}
                </p>
              </div>

              <div className="space-y-0">
                {getSettingsForSection(activeSection).map(renderSettingItem)}
              </div>
            </Card>
          </div>
        </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Settings"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-slate-900 dark:text-slate-100">
                Are you sure you want to reset all settings to their default values?
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                This action cannot be undone. All your customizations will be lost.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={() => setShowResetModal(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReset}
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
            >
              Reset Settings
            </Button>
          </div>
        </div>
      </Modal>

      {/* Export Confirmation Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Settings"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Info className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-slate-900 dark:text-slate-100">
                Export your current settings as a JSON file.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                You can use this file to backup your settings or import them on another device.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={() => setShowExportModal(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              variant="primary"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}