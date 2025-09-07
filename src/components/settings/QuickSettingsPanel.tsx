import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Palette,
  Monitor,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Zap,
  Brain,
  X,
  ExternalLink
} from 'lucide-react';
import { useSettings } from '../../providers/SettingsProvider';
import { Button } from '../ui/Button';

interface QuickSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickSettingsPanel: React.FC<QuickSettingsPanelProps> = ({
  isOpen,
  onClose
}) => {
  const { settings, updateSetting } = useSettings();

  const quickSettings = [
    {
      id: 'theme',
      label: 'Theme',
      icon: settings.theme === 'dark' ? Moon : settings.theme === 'light' ? Sun : Monitor,
      value: settings.theme,
      options: [
        { label: 'System', value: 'system', icon: Monitor },
        { label: 'Light', value: 'light', icon: Sun },
        { label: 'Dark', value: 'dark', icon: Moon }
      ]
    },
    {
      id: 'soundEnabled',
      label: 'Sound',
      icon: settings.soundEnabled ? Volume2 : VolumeX,
      value: settings.soundEnabled,
      type: 'toggle'
    },
    {
      id: 'animations',
      label: 'Animations',
      icon: Zap,
      value: settings.animations,
      type: 'toggle'
    },
    {
      id: 'aiAssistant',
      label: 'AI Assistant',
      icon: Brain,
      value: settings.aiAssistant,
      type: 'toggle'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-4 right-4 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Quick Settings
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Settings */}
            <div className="p-4 space-y-4">
              {quickSettings.map((setting) => {
                const Icon = setting.icon;
                
                return (
                  <div key={setting.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {setting.label}
                      </span>
                    </div>

                    {setting.type === 'toggle' ? (
                      <button
                        onClick={() => updateSetting(setting.id as any, !setting.value)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          setting.value ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            setting.value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    ) : setting.options ? (
                      <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                        {setting.options.map((option) => {
                          const OptionIcon = option.icon;
                          const isActive = setting.value === option.value;
                          
                          return (
                            <button
                              key={option.value}
                              onClick={() => updateSetting(setting.id as any, option.value)}
                              className={`p-1.5 rounded-md transition-colors ${
                                isActive
                                  ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                              }`}
                              title={option.label}
                            >
                              <OptionIcon className="w-4 h-4" />
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                onClick={() => {
                  window.location.href = '/settings';
                  onClose();
                }}
                variant="outline"
                className="w-full"
              >
                <Settings className="w-4 h-4 mr-2" />
                All Settings
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QuickSettingsPanel;