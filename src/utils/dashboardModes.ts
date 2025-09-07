import { 
  DashboardMode, 
  DashboardModeConfig, 
  UserModePreferences, 
  ModeConfigValidation,
  WidgetInstance,
  DashboardModeStorage
} from '../types/dashboard';
import { 
  MODE_CONFIGS, 
  DEFAULT_USER_PREFERENCES, 
  AVAILABLE_MODES
} from '../config/dashboardModes';

/**
 * Validates if a mode is supported
 */
export function isValidMode(mode: string): mode is DashboardMode {
  return AVAILABLE_MODES.includes(mode as DashboardMode);
}

/**
 * Gets the configuration for a specific mode
 */
export function getModeConfig(mode: DashboardMode): DashboardModeConfig {
  return MODE_CONFIGS[mode];
}

/**
 * Gets all available mode configurations
 */
export function getAllModeConfigs(): Record<DashboardMode, DashboardModeConfig> {
  return MODE_CONFIGS;
}

/**
 * Validates a mode configuration against the schema
 */
export function validateModeConfig(config: Partial<DashboardModeConfig>): ModeConfigValidation {
  const errors: Array<{ field: string; message: string; code?: string }> = [];

  // Check required fields
  if (!config.id) {
    errors.push({ field: 'id', message: 'Mode ID is required', code: 'REQUIRED' });
  } else if (!isValidMode(config.id)) {
    errors.push({ field: 'id', message: 'Invalid mode ID', code: 'INVALID_VALUE' });
  }

  if (!config.name || config.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Mode name is required', code: 'REQUIRED' });
  }

  if (!config.layout) {
    errors.push({ field: 'layout', message: 'Layout configuration is required', code: 'REQUIRED' });
  } else {
    if (!config.layout.type || !['grid', 'flex'].includes(config.layout.type)) {
      errors.push({ field: 'layout.type', message: 'Layout type must be "grid" or "flex"', code: 'INVALID_VALUE' });
    }
    if (typeof config.layout.columns !== 'number' || config.layout.columns < 1 || config.layout.columns > 24) {
      errors.push({ field: 'layout.columns', message: 'Columns must be a number between 1 and 24', code: 'INVALID_RANGE' });
    }
    if (typeof config.layout.gap !== 'number' || config.layout.gap < 0) {
      errors.push({ field: 'layout.gap', message: 'Gap must be a non-negative number', code: 'INVALID_VALUE' });
    }
  }

  if (!config.widgets) {
    errors.push({ field: 'widgets', message: 'Widget configuration is required', code: 'REQUIRED' });
  } else {
    if (!Array.isArray(config.widgets.visible)) {
      errors.push({ field: 'widgets.visible', message: 'Visible widgets must be an array', code: 'INVALID_TYPE' });
    }
    if (!Array.isArray(config.widgets.hidden)) {
      errors.push({ field: 'widgets.hidden', message: 'Hidden widgets must be an array', code: 'INVALID_TYPE' });
    }
    if (!config.widgets.priority || typeof config.widgets.priority !== 'object') {
      errors.push({ field: 'widgets.priority', message: 'Widget priority must be an object', code: 'INVALID_TYPE' });
    }
  }

  if (!config.styling) {
    errors.push({ field: 'styling', message: 'Styling configuration is required', code: 'REQUIRED' });
  } else {
    if (!config.styling.theme || !['light', 'dark', 'auto'].includes(config.styling.theme)) {
      errors.push({ field: 'styling.theme', message: 'Theme must be "light", "dark", or "auto"', code: 'INVALID_VALUE' });
    }
    if (typeof config.styling.compactMode !== 'boolean') {
      errors.push({ field: 'styling.compactMode', message: 'Compact mode must be a boolean', code: 'INVALID_TYPE' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    config: config as DashboardModeConfig
  };
}

/**
 * Merges user preferences with defaults
 */
export function mergeUserPreferences(userPrefs: Partial<UserModePreferences>): UserModePreferences {
  return {
    ...DEFAULT_USER_PREFERENCES,
    ...userPrefs
  };
}

/**
 * Gets the default mode based on user preferences
 */
export function getDefaultMode(preferences?: Partial<UserModePreferences>): DashboardMode {
  const mergedPrefs = mergeUserPreferences(preferences || {});
  return mergedPrefs.defaultMode;
}

/**
 * Gets the last used mode from preferences
 */
export function getLastUsedMode(preferences?: Partial<UserModePreferences>): DashboardMode {
  const mergedPrefs = mergeUserPreferences(preferences || {});
  return mergedPrefs.lastUsedMode;
}

/**
 * Filters widgets based on mode configuration
 */
export function getVisibleWidgets(mode: DashboardMode, allWidgets: WidgetInstance[]): WidgetInstance[] {
  const config = getModeConfig(mode);
  return allWidgets.filter(widget => 
    config.widgets.visible.includes(widget.widgetId) && 
    widget.mode === mode
  );
}

/**
 * Gets widget priority for a specific mode
 */
export function getWidgetPriority(mode: DashboardMode, widgetId: string): number {
  const config = getModeConfig(mode);
  return config.widgets.priority[widgetId] || 999;
}

/**
 * Sorts widgets by priority for a specific mode
 */
export function sortWidgetsByPriority(mode: DashboardMode, widgets: WidgetInstance[]): WidgetInstance[] {
  return [...widgets].sort((a, b) => {
    const priorityA = getWidgetPriority(mode, a.widgetId);
    const priorityB = getWidgetPriority(mode, b.widgetId);
    return priorityA - priorityB;
  });
}

/**
 * Creates a deep copy of a mode configuration
 */
export function cloneModeConfig(config: DashboardModeConfig): DashboardModeConfig {
  return JSON.parse(JSON.stringify(config));
}

/**
 * Merges a partial configuration with an existing one
 */
export function mergeModeConfig(
  baseConfig: DashboardModeConfig, 
  updates: Partial<DashboardModeConfig>
): DashboardModeConfig {
  const cloned = cloneModeConfig(baseConfig);
  
  // Deep merge logic for nested objects
  if (updates.layout) {
    cloned.layout = { ...cloned.layout, ...updates.layout };
    if (updates.layout.widgetSizes) {
      cloned.layout.widgetSizes = { ...cloned.layout.widgetSizes, ...updates.layout.widgetSizes };
    }
    if (updates.layout.responsive) {
      cloned.layout.responsive = { ...cloned.layout.responsive, ...updates.layout.responsive };
    }
  }
  
  if (updates.widgets) {
    cloned.widgets = { ...cloned.widgets, ...updates.widgets };
    if (updates.widgets.priority) {
      cloned.widgets.priority = { ...cloned.widgets.priority, ...updates.widgets.priority };
    }
    if (updates.widgets.positions) {
      cloned.widgets.positions = { ...cloned.widgets.positions, ...updates.widgets.positions };
    }
  }
  
  if (updates.styling) {
    cloned.styling = { ...cloned.styling, ...updates.styling };
    if (updates.styling.customStyles) {
      cloned.styling.customStyles = { ...cloned.styling.customStyles, ...updates.styling.customStyles };
    }
  }
  
  // Simple properties
  if (updates.name !== undefined) cloned.name = updates.name;
  if (updates.description !== undefined) cloned.description = updates.description;
  if (updates.icon !== undefined) cloned.icon = updates.icon;
  
  return cloned;
}

/**
 * Generates CSS custom properties from mode styling
 */
export function generateModeCSS(config: DashboardModeConfig): Record<string, string> {
  const cssVars: Record<string, string> = {};
  
  // Add custom styles if they exist
  if (config.styling.customStyles) {
    Object.entries(config.styling.customStyles).forEach(([key, value]) => {
      cssVars[key] = value;
    });
  }
  
  // Add layout-based CSS variables
  cssVars['--dashboard-columns'] = config.layout.columns.toString();
  cssVars['--dashboard-gap'] = `${config.layout.gap}px`;
  cssVars['--dashboard-spacing'] = `${config.layout.spacing}px`;
  
  // Add accent color if specified
  if (config.styling.accentColor) {
    cssVars['--dashboard-accent'] = config.styling.accentColor;
  }
  
  return cssVars;
}

/**
 * Checks if a mode switch is valid
 */
export function canSwitchToMode(
  fromMode: DashboardMode, 
  toMode: DashboardMode, 
  _preferences: UserModePreferences
): boolean {
  // Basic validation
  if (!isValidMode(toMode)) return false;
  if (fromMode === toMode) return false;
  
  // Check if mode is available
  if (!AVAILABLE_MODES.includes(toMode)) return false;
  
  // Additional business logic can be added here
  // For example, checking user permissions, time-based restrictions, etc.
  
  return true;
}

/**
 * Storage utilities for dashboard mode data
 */
export const storage = {
  /**
   * Saves dashboard mode data to localStorage
   */
  save(key: string, data: DashboardModeStorage): boolean {
    try {
      const serialized = JSON.stringify({
        ...data,
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      });
      localStorage.setItem(`dashboard-mode-${key}`, serialized);
      return true;
    } catch (error) {
      console.error('Failed to save dashboard mode data:', error);
      return false;
    }
  },

  /**
   * Loads dashboard mode data from localStorage
   */
  load(key: string): DashboardModeStorage | null {
    try {
      const serialized = localStorage.getItem(`dashboard-mode-${key}`);
      if (!serialized) return null;
      
      const data = JSON.parse(serialized);
      
      // Validate data structure
      if (!data.preferences || !data.version) {
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Failed to load dashboard mode data:', error);
      return null;
    }
  },

  /**
   * Removes dashboard mode data from localStorage
   */
  remove(key: string): boolean {
    try {
      localStorage.removeItem(`dashboard-mode-${key}`);
      return true;
    } catch (error) {
      console.error('Failed to remove dashboard mode data:', error);
      return false;
    }
  },

  /**
   * Checks if localStorage is available
   */
  isAvailable(): boolean {
    try {
      const test = '__dashboard_mode_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
};