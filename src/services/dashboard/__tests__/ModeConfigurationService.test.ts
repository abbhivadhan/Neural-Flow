import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ModeConfigurationService } from '../ModeConfigurationService';
import { DashboardMode, DashboardModeConfig, UserModePreferences, WidgetInstance } from '../../../types/dashboard';
import { MODE_CONFIGS } from '../../../config/dashboardModes';

describe('ModeConfigurationService', () => {
  let service: ModeConfigurationService;

  beforeEach(() => {
    // Reset singleton instance for each test
    (ModeConfigurationService as any).instance = undefined;
    service = ModeConfigurationService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ModeConfigurationService.getInstance();
      const instance2 = ModeConfigurationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getModeConfig', () => {
    it('should return valid configuration for coding mode', () => {
      const config = service.getModeConfig('coding');
      expect(config).toBeDefined();
      expect(config.id).toBe('coding');
      expect(config.name).toBe('Coding Mode');
      expect(config.layout).toBeDefined();
      expect(config.widgets).toBeDefined();
      expect(config.styling).toBeDefined();
    });

    it('should return valid configuration for meeting mode', () => {
      const config = service.getModeConfig('meeting');
      expect(config).toBeDefined();
      expect(config.id).toBe('meeting');
      expect(config.name).toBe('Meeting Mode');
      expect(config.layout).toBeDefined();
      expect(config.widgets).toBeDefined();
      expect(config.styling).toBeDefined();
    });

    it('should throw error for invalid mode', () => {
      expect(() => service.getModeConfig('invalid' as DashboardMode)).toThrow('Invalid mode: invalid');
    });

    it('should return a deep copy of the configuration', () => {
      const config1 = service.getModeConfig('coding');
      const config2 = service.getModeConfig('coding');
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('getAllModeConfigs', () => {
    it('should return all available mode configurations', () => {
      const configs = service.getAllModeConfigs();
      expect(Object.keys(configs)).toHaveLength(2);
      expect(configs.coding).toBeDefined();
      expect(configs.meeting).toBeDefined();
    });

    it('should return deep copies of configurations', () => {
      const configs1 = service.getAllModeConfigs();
      const configs2 = service.getAllModeConfigs();
      expect(configs1).not.toBe(configs2);
      expect(configs1.coding).not.toBe(configs2.coding);
      expect(configs1).toEqual(configs2);
    });
  });

  describe('validateConfiguration', () => {
    it('should validate a complete valid configuration', () => {
      const config = MODE_CONFIGS.coding;
      const result = service.validateConfiguration(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject configuration without required fields', () => {
      const config = {
        name: 'Test Mode'
        // Missing required fields
      };
      const result = service.validateConfiguration(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'id')).toBe(true);
    });

    it('should reject configuration with invalid mode ID', () => {
      const config = {
        id: 'invalid' as DashboardMode,
        name: 'Test Mode',
        layout: { type: 'grid' as const, columns: 12, gap: 16 },
        widgets: { visible: [], hidden: [], priority: {} },
        styling: { theme: 'light' as const, compactMode: false }
      };
      const result = service.validateConfiguration(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'id' && e.code === 'INVALID_VALUE')).toBe(true);
    });

    it('should reject configuration with invalid layout type', () => {
      const config = {
        id: 'coding' as DashboardMode,
        name: 'Test Mode',
        layout: { type: 'invalid' as any, columns: 12, gap: 16 },
        widgets: { visible: [], hidden: [], priority: {} },
        styling: { theme: 'light' as const, compactMode: false }
      };
      const result = service.validateConfiguration(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'layout.type')).toBe(true);
    });

    it('should reject configuration with invalid column count', () => {
      const config = {
        id: 'coding' as DashboardMode,
        name: 'Test Mode',
        layout: { type: 'grid' as const, columns: 0, gap: 16 },
        widgets: { visible: [], hidden: [], priority: {} },
        styling: { theme: 'light' as const, compactMode: false }
      };
      const result = service.validateConfiguration(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'layout.columns')).toBe(true);
    });

    it('should reject configuration with negative gap', () => {
      const config = {
        id: 'coding' as DashboardMode,
        name: 'Test Mode',
        layout: { type: 'grid' as const, columns: 12, gap: -5 },
        widgets: { visible: [], hidden: [], priority: {} },
        styling: { theme: 'light' as const, compactMode: false }
      };
      const result = service.validateConfiguration(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'layout.gap')).toBe(true);
    });

    it('should reject configuration with invalid theme', () => {
      const config = {
        id: 'coding' as DashboardMode,
        name: 'Test Mode',
        layout: { type: 'grid' as const, columns: 12, gap: 16 },
        widgets: { visible: [], hidden: [], priority: {} },
        styling: { theme: 'invalid' as any, compactMode: false }
      };
      const result = service.validateConfiguration(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'styling.theme')).toBe(true);
    });
  });

  describe('updateModeConfig', () => {
    it('should update mode configuration with valid changes', () => {
      const updates = {
        name: 'Updated Coding Mode',
        styling: { accentColor: '#ff0000' }
      };
      const result = service.updateModeConfig('coding', updates);
      expect(result.isValid).toBe(true);
      
      const updatedConfig = service.getModeConfig('coding');
      expect(updatedConfig.name).toBe('Updated Coding Mode');
      expect(updatedConfig.styling.accentColor).toBe('#ff0000');
    });

    it('should reject update with invalid mode', () => {
      const updates = { name: 'Test' };
      const result = service.updateModeConfig('invalid' as DashboardMode, updates);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'mode')).toBe(true);
    });

    it('should reject update that makes configuration invalid', () => {
      const updates = {
        layout: { columns: -1 }
      };
      const result = service.updateModeConfig('coding', updates);
      expect(result.isValid).toBe(false);
    });
  });

  describe('resetModeConfig', () => {
    it('should reset mode configuration to defaults', () => {
      // First modify the configuration
      service.updateModeConfig('coding', { name: 'Modified' });
      expect(service.getModeConfig('coding').name).toBe('Modified');
      
      // Then reset it
      const resetConfig = service.resetModeConfig('coding');
      expect(resetConfig.name).toBe(MODE_CONFIGS.coding.name);
    });

    it('should throw error for invalid mode', () => {
      expect(() => service.resetModeConfig('invalid' as DashboardMode)).toThrow('Invalid mode: invalid');
    });
  });

  describe('resetAllModeConfigs', () => {
    it('should reset all mode configurations to defaults', () => {
      // Modify both configurations
      service.updateModeConfig('coding', { name: 'Modified Coding' });
      service.updateModeConfig('meeting', { name: 'Modified Meeting' });
      
      // Reset all
      const resetConfigs = service.resetAllModeConfigs();
      expect(resetConfigs.coding.name).toBe(MODE_CONFIGS.coding.name);
      expect(resetConfigs.meeting.name).toBe(MODE_CONFIGS.meeting.name);
    });
  });

  describe('createCustomConfig', () => {
    it('should create valid custom configuration', () => {
      const customizations = {
        name: 'Custom Coding Mode',
        styling: { accentColor: '#custom' }
      };
      const result = service.createCustomConfig('coding', customizations, 'custom1');
      expect(result.isValid).toBe(true);
      
      const customConfig = service.getCustomConfig('custom1');
      expect(customConfig).toEqual(customizations);
    });

    it('should reject custom configuration with invalid base mode', () => {
      const customizations = { name: 'Custom' };
      const result = service.createCustomConfig('invalid' as DashboardMode, customizations, 'custom1');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'baseMode')).toBe(true);
    });
  });

  describe('validatePreferences', () => {
    it('should validate valid preferences', () => {
      const preferences: Partial<UserModePreferences> = {
        defaultMode: 'coding',
        lastUsedMode: 'meeting',
        transitionSpeed: 'normal',
        autoSwitchEnabled: true
      };
      const errors = service.validatePreferences(preferences);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid default mode', () => {
      const preferences = {
        defaultMode: 'invalid' as DashboardMode
      };
      const errors = service.validatePreferences(preferences);
      expect(errors.some(e => e.field === 'defaultMode')).toBe(true);
    });

    it('should reject invalid transition speed', () => {
      const preferences = {
        transitionSpeed: 'invalid' as any
      };
      const errors = service.validatePreferences(preferences);
      expect(errors.some(e => e.field === 'transitionSpeed')).toBe(true);
    });

    it('should reject invalid auto switch enabled type', () => {
      const preferences = {
        autoSwitchEnabled: 'true' as any
      };
      const errors = service.validatePreferences(preferences);
      expect(errors.some(e => e.field === 'autoSwitchEnabled')).toBe(true);
    });
  });

  describe('validateWidgetConfig', () => {
    it('should validate widgets without errors for correct configuration', () => {
      const widgets: WidgetInstance[] = [
        {
          id: 'widget1',
          widgetId: 'code-metrics',
          position: { order: 1 },
          size: { width: '100%', height: '200px' },
          config: {},
          visible: true,
          mode: 'coding'
        }
      ];
      const errors = service.validateWidgetConfig('coding', widgets);
      expect(errors).toHaveLength(0);
    });

    it('should detect duplicate widget IDs', () => {
      const widgets: WidgetInstance[] = [
        {
          id: 'widget1',
          widgetId: 'code-metrics',
          position: { order: 1 },
          size: { width: '100%', height: '200px' },
          config: {},
          visible: true,
          mode: 'coding'
        },
        {
          id: 'widget1', // Duplicate ID
          widgetId: 'git-status',
          position: { order: 2 },
          size: { width: '100%', height: '150px' },
          config: {},
          visible: true,
          mode: 'coding'
        }
      ];
      const errors = service.validateWidgetConfig('coding', widgets);
      expect(errors.some(e => e.code === 'DUPLICATE_ID')).toBe(true);
    });

    it('should detect visibility conflicts', () => {
      const widgets: WidgetInstance[] = [
        {
          id: 'widget1',
          widgetId: 'team-calendar', // This is hidden in coding mode
          position: { order: 1 },
          size: { width: '100%', height: '200px' },
          config: {},
          visible: true, // But marked as visible
          mode: 'coding'
        }
      ];
      const errors = service.validateWidgetConfig('coding', widgets);
      expect(errors.some(e => e.field.includes('visible'))).toBe(true);
    });
  });

  describe('getAvailableModes', () => {
    it('should return all available modes', () => {
      const modes = service.getAvailableModes();
      expect(modes).toContain('coding');
      expect(modes).toContain('meeting');
      expect(modes).toHaveLength(2);
    });
  });

  describe('isModeAvailable', () => {
    it('should return true for valid modes', () => {
      expect(service.isModeAvailable('coding')).toBe(true);
      expect(service.isModeAvailable('meeting')).toBe(true);
    });

    it('should return false for invalid modes', () => {
      expect(service.isModeAvailable('invalid')).toBe(false);
      expect(service.isModeAvailable('')).toBe(false);
    });
  });

  describe('getConfigSummary', () => {
    it('should return configuration summary', () => {
      const summary = service.getConfigSummary();
      expect(summary.availableModes).toHaveLength(2);
      expect(summary.modeConfigs.coding).toBeDefined();
      expect(summary.modeConfigs.meeting).toBeDefined();
      expect(summary.customConfigs).toEqual([]);
    });

    it('should include custom configurations in summary', () => {
      service.createCustomConfig('coding', { name: 'Custom' }, 'custom1');
      const summary = service.getConfigSummary();
      expect(summary.customConfigs).toContain('custom1');
    });
  });

  describe('getDefaultPreferences', () => {
    it('should return default preferences', () => {
      const preferences = service.getDefaultPreferences();
      expect(preferences.defaultMode).toBe('coding');
      expect(preferences.lastUsedMode).toBe('coding');
      expect(preferences.transitionSpeed).toBe('normal');
      expect(preferences.autoSwitchEnabled).toBe(false);
    });
  });

  describe('Custom Configuration Management', () => {
    it('should manage custom configurations', () => {
      const customizations = { name: 'Custom Mode' };
      
      // Create
      service.createCustomConfig('coding', customizations, 'test');
      expect(service.getCustomConfig('test')).toEqual(customizations);
      
      // Delete
      expect(service.deleteCustomConfig('test')).toBe(true);
      expect(service.getCustomConfig('test')).toBeNull();
      
      // Delete non-existent
      expect(service.deleteCustomConfig('nonexistent')).toBe(false);
    });
  });
});