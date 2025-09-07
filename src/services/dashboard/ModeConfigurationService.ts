import {
  DashboardMode,
  DashboardModeConfig,
  ModeConfigValidation,
  ValidationError,
  UserModePreferences,
  WidgetInstance
} from '../../types/dashboard';
import {
  MODE_CONFIGS,
  DEFAULT_USER_PREFERENCES,
  AVAILABLE_MODES,
  MODE_CONFIG_SCHEMA
} from '../../config/dashboardModes';
import {
  validateModeConfig,
  mergeModeConfig,
  cloneModeConfig,
  isValidMode
} from '../../utils/dashboardModes';

/**
 * Service for managing dashboard mode configurations
 */
export class ModeConfigurationService {
  private static instance: ModeConfigurationService;
  private modeConfigs: Record<DashboardMode, DashboardModeConfig>;
  private customConfigs: Record<string, Partial<DashboardModeConfig>>;

  private constructor() {
    this.modeConfigs = { ...MODE_CONFIGS };
    this.customConfigs = {};
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ModeConfigurationService {
    if (!ModeConfigurationService.instance) {
      ModeConfigurationService.instance = new ModeConfigurationService();
    }
    return ModeConfigurationService.instance;
  }

  /**
   * Get configuration for a specific mode
   */
  public getModeConfig(mode: DashboardMode): DashboardModeConfig {
    if (!isValidMode(mode)) {
      throw new Error(`Invalid mode: ${mode}`);
    }
    return cloneModeConfig(this.modeConfigs[mode]);
  }

  /**
   * Get all available mode configurations
   */
  public getAllModeConfigs(): Record<DashboardMode, DashboardModeConfig> {
    const configs: Record<DashboardMode, DashboardModeConfig> = {} as Record<DashboardMode, DashboardModeConfig>;
    AVAILABLE_MODES.forEach(mode => {
      configs[mode] = cloneModeConfig(this.modeConfigs[mode]);
    });
    return configs;
  }

  /**
   * Validate a mode configuration
   */
  public validateConfiguration(config: Partial<DashboardModeConfig>): ModeConfigValidation {
    return validateModeConfig(config);
  }

  /**
   * Validate multiple configurations
   */
  public validateConfigurations(configs: Record<string, Partial<DashboardModeConfig>>): Record<string, ModeConfigValidation> {
    const results: Record<string, ModeConfigValidation> = {};
    
    Object.entries(configs).forEach(([key, config]) => {
      results[key] = this.validateConfiguration(config);
    });
    
    return results;
  }

  /**
   * Update a mode configuration with validation
   */
  public updateModeConfig(
    mode: DashboardMode, 
    updates: Partial<DashboardModeConfig>
  ): ModeConfigValidation {
    if (!isValidMode(mode)) {
      return {
        isValid: false,
        errors: [{ field: 'mode', message: `Invalid mode: ${mode}`, code: 'INVALID_VALUE' }],
        config: updates as DashboardModeConfig
      };
    }

    const currentConfig = this.modeConfigs[mode];
    const mergedConfig = mergeModeConfig(currentConfig, updates);
    const validation = this.validateConfiguration(mergedConfig);

    if (validation.isValid) {
      this.modeConfigs[mode] = mergedConfig;
    }

    return validation;
  }

  /**
   * Reset a mode configuration to defaults
   */
  public resetModeConfig(mode: DashboardMode): DashboardModeConfig {
    if (!isValidMode(mode)) {
      throw new Error(`Invalid mode: ${mode}`);
    }

    this.modeConfigs[mode] = cloneModeConfig(MODE_CONFIGS[mode]);
    return this.getModeConfig(mode);
  }

  /**
   * Reset all mode configurations to defaults
   */
  public resetAllModeConfigs(): Record<DashboardMode, DashboardModeConfig> {
    AVAILABLE_MODES.forEach(mode => {
      this.modeConfigs[mode] = cloneModeConfig(MODE_CONFIGS[mode]);
    });
    return this.getAllModeConfigs();
  }

  /**
   * Create a custom configuration based on an existing mode
   */
  public createCustomConfig(
    baseMode: DashboardMode,
    customizations: Partial<DashboardModeConfig>,
    configId: string
  ): ModeConfigValidation {
    if (!isValidMode(baseMode)) {
      return {
        isValid: false,
        errors: [{ field: 'baseMode', message: `Invalid base mode: ${baseMode}`, code: 'INVALID_VALUE' }],
        config: customizations as DashboardModeConfig
      };
    }

    const baseConfig = this.getModeConfig(baseMode);
    const customConfig = mergeModeConfig(baseConfig, customizations);
    const validation = this.validateConfiguration(customConfig);

    if (validation.isValid) {
      this.customConfigs[configId] = customizations;
    }

    return validation;
  }

  /**
   * Get a custom configuration
   */
  public getCustomConfig(configId: string): Partial<DashboardModeConfig> | null {
    return this.customConfigs[configId] ? { ...this.customConfigs[configId] } : null;
  }

  /**
   * Delete a custom configuration
   */
  public deleteCustomConfig(configId: string): boolean {
    if (this.customConfigs[configId]) {
      delete this.customConfigs[configId];
      return true;
    }
    return false;
  }

  /**
   * Get default user preferences
   */
  public getDefaultPreferences(): UserModePreferences {
    return { ...DEFAULT_USER_PREFERENCES };
  }

  /**
   * Validate user preferences
   */
  public validatePreferences(preferences: Partial<UserModePreferences>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (preferences.defaultMode && !isValidMode(preferences.defaultMode)) {
      errors.push({
        field: 'defaultMode',
        message: `Invalid default mode: ${preferences.defaultMode}`,
        code: 'INVALID_VALUE'
      });
    }

    if (preferences.lastUsedMode && !isValidMode(preferences.lastUsedMode)) {
      errors.push({
        field: 'lastUsedMode',
        message: `Invalid last used mode: ${preferences.lastUsedMode}`,
        code: 'INVALID_VALUE'
      });
    }

    if (preferences.transitionSpeed && !['fast', 'normal', 'slow'].includes(preferences.transitionSpeed)) {
      errors.push({
        field: 'transitionSpeed',
        message: 'Transition speed must be "fast", "normal", or "slow"',
        code: 'INVALID_VALUE'
      });
    }

    if (preferences.autoSwitchEnabled !== undefined && typeof preferences.autoSwitchEnabled !== 'boolean') {
      errors.push({
        field: 'autoSwitchEnabled',
        message: 'Auto switch enabled must be a boolean',
        code: 'INVALID_TYPE'
      });
    }

    if (preferences.autoSwitchRules && !Array.isArray(preferences.autoSwitchRules)) {
      errors.push({
        field: 'autoSwitchRules',
        message: 'Auto switch rules must be an array',
        code: 'INVALID_TYPE'
      });
    }

    return errors;
  }

  /**
   * Get available modes
   */
  public getAvailableModes(): DashboardMode[] {
    return [...AVAILABLE_MODES];
  }

  /**
   * Check if a mode is available
   */
  public isModeAvailable(mode: string): mode is DashboardMode {
    return isValidMode(mode);
  }

  /**
   * Get mode configuration schema for validation
   */
  public getConfigSchema(): typeof MODE_CONFIG_SCHEMA {
    return { ...MODE_CONFIG_SCHEMA };
  }

  /**
   * Validate widget configuration for a mode
   */
  public validateWidgetConfig(
    mode: DashboardMode,
    widgets: WidgetInstance[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const config = this.getModeConfig(mode);

    // Check for duplicate widget IDs
    const widgetIds = widgets.map(w => w.id);
    const duplicates = widgetIds.filter((id, index) => widgetIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      errors.push({
        field: 'widgets',
        message: `Duplicate widget IDs found: ${duplicates.join(', ')}`,
        code: 'DUPLICATE_ID'
      });
    }

    // Validate widget visibility against mode configuration
    widgets.forEach(widget => {
      const isVisible = config.widgets.visible.includes(widget.widgetId);
      const isHidden = config.widgets.hidden.includes(widget.widgetId);

      if (widget.visible && isHidden) {
        errors.push({
          field: `widget.${widget.id}.visible`,
          message: `Widget ${widget.widgetId} is marked as visible but configured as hidden in ${mode} mode`,
          code: 'INVALID_VALUE'
        });
      }

      if (!widget.visible && isVisible) {
        errors.push({
          field: `widget.${widget.id}.visible`,
          message: `Widget ${widget.widgetId} is marked as hidden but configured as visible in ${mode} mode`,
          code: 'INVALID_VALUE'
        });
      }
    });

    return errors;
  }

  /**
   * Get configuration summary for debugging
   */
  public getConfigSummary(): {
    availableModes: DashboardMode[];
    modeConfigs: Record<DashboardMode, { name: string; widgetCount: number; layoutType: string }>;
    customConfigs: string[];
  } {
    const summary = {
      availableModes: this.getAvailableModes(),
      modeConfigs: {} as Record<DashboardMode, { name: string; widgetCount: number; layoutType: string }>,
      customConfigs: Object.keys(this.customConfigs)
    };

    AVAILABLE_MODES.forEach(mode => {
      const config = this.modeConfigs[mode];
      summary.modeConfigs[mode] = {
        name: config.name,
        widgetCount: config.widgets.visible.length,
        layoutType: config.layout.type
      };
    });

    return summary;
  }
}

// Export singleton instance
export const modeConfigurationService = ModeConfigurationService.getInstance();