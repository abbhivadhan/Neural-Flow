import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AppSettings {
  // Profile settings
  displayName: string;
  email: string;
  avatar: string;
  timezone: string;
  language: string;
  
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  notificationFrequency: string;
  
  // Privacy & Security
  twoFactorAuth: boolean;
  dataEncryption: boolean;
  analyticsOptOut: boolean;
  sessionTimeout: number;
  
  // Appearance
  theme: 'system' | 'light' | 'dark';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  animations: boolean;
  
  // AI & Automation
  aiAssistant: boolean;
  autoComplete: boolean;
  smartSuggestions: boolean;
  learningMode: boolean;
  aiConfidence: number;
  
  // Performance
  hardwareAcceleration: boolean;
  cacheSize: number;
  backgroundSync: boolean;
  preloadContent: boolean;
  
  // Advanced
  developerMode: boolean;
  debugMode: boolean;
  experimentalFeatures: boolean;
  apiRateLimit: number;
}

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
  hasUnsavedChanges: boolean;
  saveSettings: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  // Profile settings
  displayName: '',
  email: '',
  avatar: '',
  timezone: 'UTC-8',
  language: 'en',
  
  // Notifications
  emailNotifications: true,
  pushNotifications: true,
  soundEnabled: true,
  notificationFrequency: 'immediate',
  
  // Privacy & Security
  twoFactorAuth: false,
  dataEncryption: true,
  analyticsOptOut: false,
  sessionTimeout: 30,
  
  // Appearance
  theme: 'system',
  accentColor: '#3b82f6',
  fontSize: 'medium',
  compactMode: false,
  animations: true,
  
  // AI & Automation
  aiAssistant: true,
  autoComplete: true,
  smartSuggestions: true,
  learningMode: true,
  aiConfidence: 0.8,
  
  // Performance
  hardwareAcceleration: true,
  cacheSize: 500,
  backgroundSync: true,
  preloadContent: true,
  
  // Advanced
  developerMode: false,
  debugMode: false,
  experimentalFeatures: false,
  apiRateLimit: 100,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [savedSettings, setSavedSettings] = useState<AppSettings>(defaultSettings);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettingsJson = localStorage.getItem('neural-flow-settings');
    if (savedSettingsJson) {
      try {
        const parsed = JSON.parse(savedSettingsJson);
        const mergedSettings = { ...defaultSettings, ...parsed };
        setSettings(mergedSettings);
        setSavedSettings(mergedSettings);
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings);
    setHasUnsavedChanges(hasChanges);
  }, [settings, savedSettings]);

  // Apply theme changes immediately
  useEffect(() => {
    const root = document.documentElement;
    
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    // Apply accent color
    root.style.setProperty('--accent-color', settings.accentColor);
    
    // Apply font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    root.style.setProperty('--base-font-size', fontSizeMap[settings.fontSize]);

    // Apply compact mode
    if (settings.compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }

    // Apply animations setting
    if (!settings.animations) {
      root.classList.add('no-animations');
    } else {
      root.classList.remove('no-animations');
    }
  }, [settings.theme, settings.accentColor, settings.fontSize, settings.compactMode, settings.animations]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const saveSettings = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Save to localStorage
      localStorage.setItem('neural-flow-settings', JSON.stringify(settings));
      setSavedSettings(settings);
      
      // You could also send to a backend API here
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  };

  const exportSettings = (): string => {
    return JSON.stringify(settings, null, 2);
  };

  const importSettings = (settingsJson: string): boolean => {
    try {
      const parsed = JSON.parse(settingsJson);
      const mergedSettings = { ...defaultSettings, ...parsed };
      setSettings(mergedSettings);
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  };

  const contextValue: SettingsContextType = {
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
    hasUnsavedChanges,
    saveSettings,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsProvider;