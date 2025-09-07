import { describe, it, expect, beforeEach } from 'vitest';
import { ModeConfigurationService } from '../ModeConfigurationService';
import { ConfigurationValidator } from '../ConfigurationValidator';
import { 
  validateModeConfig, 
  mergeModeConfig, 
  getModeConfig,
  isValidMode,
  mergeUserPreferences
} from '../../../utils/dashboardModes';
import { MODE_CONFIGS, DEFAULT_USER_PREFERENCES } from '../../../config/dashboardModes';
import { DashboardMode, DashboardModeConfig, UserModePreferences } from '../../../types/dashboard';

describe('Dashboard Mode Configuration Integration', () => {
  let service: ModeConfigurationService;

  beforeEach(() => {
    // Reset singleton for each test
    (ModeConfigurationService as any).instance = undefined;
    service = ModeConfigurationService.getInstance();
  });

  describe('Service and Utility Integration', () => {
    it('should work seamlessly with existing utilities', () => {
      // Test that service works with utility functions
      const codingConfig = service.getModeConfig('coding');
      const utilityConfig = getModeConfig('coding');
      
      expect(codingConfig).toEqual(utilityConfig);
    });

    it('should validate configurations using both service and validator', () => {
      const config = service.getModeConfig('coding');
      
      // Validate using service method
      const serviceValidation = service.validateConfiguration(config);
      
      // Validate using standalone validator
      const validatorResult = ConfigurationValidator.validateModeConfig(config);
      
      // Validate using utility function
      const utilityValidation = validateModeConfig(config);
      
      expect(serviceValidation.isValid).toBe(true);
      expect(validatorResult).toHaveLength(0);
      expect(utilityValidation.isValid).toBe(true);
    });

    it('should handle mode updates consistently', () => {
      const updates = {
        name: 'Updated Coding Mode',
        styling: { accentColor: '#ff0000' }
      };

      // Update using service
      const serviceResult = service.updateModeConfig('coding', updates);
      expect(serviceResult.isValid).toBe(true);

      // Get updated config
      const updatedConfig = service.getModeConfig('coding');
      expect(updatedConfig.name).toBe('Updated Coding Mode');
      expect(updatedConfig.styling.accentColor).toBe('#ff0000');

      // Verify it can be merged with utility function
      const baseConfig = MODE_CONFIGS.coding;
      const mergedConfig = mergeModeConfig(baseConfig, updates);
      expect(mergedConfig.name).toBe('Updated Coding Mode');
      expect(mergedConfig.styling.accentColor).toBe('#ff0000');
    });
  });

  describe('Configuration Validation Workflow', () => {
    it('should validate complete workflow from creation to validation', () => {
      // 1. Create a custom configuration
      const customizations = {
        name: 'Custom Development Mode',
        description: 'Tailored for specific development needs',
        styling: {
          theme: 'dark' as const,
          accentColor: '#00ff00',
          compactMode: false
        },
        widgets: {
          visible: ['code-metrics', 'git-status', 'task-list'],
          hidden: ['team-calendar', 'meeting-notes'],
          priority: {
            'code-metrics': 1,
            'git-status': 2,
            'task-list': 3
          }
        }
      };

      // 2. Create custom config using service
      const createResult = service.createCustomConfig('coding', customizations, 'custom-dev');
      expect(createResult.isValid).toBe(true);

      // 3. Retrieve and validate the custom config
      const customConfig = service.getCustomConfig('custom-dev');
      expect(customConfig).toEqual(customizations);

      // 4. Merge with base config and validate
      const baseConfig = service.getModeConfig('coding');
      const mergedConfig = mergeModeConfig(baseConfig, customizations);
      
      const validation = ConfigurationValidator.validateModeConfig(mergedConfig);
      expect(validation).toHaveLength(0);

      // 5. Update mode with custom config
      const updateResult = service.updateModeConfig('coding', customizations);
      expect(updateResult.isValid).toBe(true);
    });

    it('should handle validation errors gracefully', () => {
      const invalidConfig = {
        name: '', // Invalid: empty name
        layout: {
          type: 'invalid' as any, // Invalid: bad layout type
          columns: -1, // Invalid: negative columns
          gap: -5 // Invalid: negative gap
        },
        widgets: {
          visible: 'not-an-array' as any, // Invalid: not an array
          hidden: [],
          priority: 'not-an-object' as any // Invalid: not an object
        },
        styling: {
          theme: 'invalid' as any, // Invalid: bad theme
          compactMode: 'true' as any // Invalid: not a boolean
        }
      };

      // Service validation should catch all errors
      const serviceValidation = service.validateConfiguration(invalidConfig);
      expect(serviceValidation.isValid).toBe(false);
      expect(serviceValidation.errors.length).toBeGreaterThan(0);

      // Validator should catch the same errors
      const validatorErrors = ConfigurationValidator.validateModeConfig(invalidConfig);
      expect(validatorErrors.length).toBeGreaterThan(0);

      // Should not be able to update with invalid config
      const updateResult = service.updateModeConfig('coding', invalidConfig);
      expect(updateResult.isValid).toBe(false);
    });
  });

  describe('User Preferences Integration', () => {
    it('should validate and merge user preferences correctly', () => {
      const customPreferences: Partial<UserModePreferences> = {
        defaultMode: 'meeting',
        transitionSpeed: 'fast',
        autoSwitchEnabled: true,
        autoSwitchRules: [
          {
            id: 'morning-coding',
            condition: 'time',
            parameters: { startTime: '09:00', endTime: '12:00' },
            targetMode: 'coding',
            enabled: true
          }
        ]
      };

      // Validate using service
      const serviceErrors = service.validatePreferences(customPreferences);
      expect(serviceErrors).toHaveLength(0);

      // Validate using validator
      const validatorErrors = ConfigurationValidator.validateUserPreferences(customPreferences);
      expect(validatorErrors).toHaveLength(0);

      // Merge with defaults using utility
      const mergedPreferences = mergeUserPreferences(customPreferences);
      expect(mergedPreferences.defaultMode).toBe('meeting');
      expect(mergedPreferences.transitionSpeed).toBe('fast');
      expect(mergedPreferences.lastUsedMode).toBe(DEFAULT_USER_PREFERENCES.lastUsedMode);
    });

    it('should reject invalid preferences consistently', () => {
      const invalidPreferences = {
        defaultMode: 'invalid' as DashboardMode,
        transitionSpeed: 'invalid' as any,
        autoSwitchEnabled: 'true' as any,
        autoSwitchRules: 'not-an-array' as any
      };

      // Both service and validator should reject
      const serviceErrors = service.validatePreferences(invalidPreferences);
      const validatorErrors = ConfigurationValidator.validateUserPreferences(invalidPreferences);

      expect(serviceErrors.length).toBeGreaterThan(0);
      expect(validatorErrors.length).toBeGreaterThan(0);

      // Should have similar error counts
      expect(serviceErrors.length).toBe(validatorErrors.length);
    });
  });

  describe('Mode Availability and Validation', () => {
    it('should consistently validate mode availability', () => {
      const validModes = ['coding', 'meeting'];
      const invalidModes = ['invalid', '', 'custom'];

      validModes.forEach(mode => {
        expect(service.isModeAvailable(mode)).toBe(true);
        expect(isValidMode(mode)).toBe(true);
      });

      invalidModes.forEach(mode => {
        expect(service.isModeAvailable(mode)).toBe(false);
        expect(isValidMode(mode)).toBe(false);
      });
    });

    it('should provide consistent available modes list', () => {
      const serviceModes = service.getAvailableModes();
      const configModes = Object.keys(MODE_CONFIGS) as DashboardMode[];

      expect(serviceModes).toEqual(configModes);
      expect(serviceModes).toContain('coding');
      expect(serviceModes).toContain('meeting');
    });
  });

  describe('Configuration Reset and Defaults', () => {
    it('should reset configurations to original defaults', () => {
      // Modify a configuration
      const updates = { name: 'Modified Mode' };
      service.updateModeConfig('coding', updates);
      
      expect(service.getModeConfig('coding').name).toBe('Modified Mode');

      // Reset to defaults
      const resetConfig = service.resetModeConfig('coding');
      expect(resetConfig.name).toBe(MODE_CONFIGS.coding.name);

      // Should match original config
      const originalConfig = getModeConfig('coding');
      expect(resetConfig).toEqual(originalConfig);
    });

    it('should provide consistent default preferences', () => {
      const serviceDefaults = service.getDefaultPreferences();
      const configDefaults = DEFAULT_USER_PREFERENCES;
      const utilityDefaults = mergeUserPreferences({});

      expect(serviceDefaults).toEqual(configDefaults);
      expect(serviceDefaults).toEqual(utilityDefaults);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle edge cases gracefully', () => {
      // Empty configuration
      const emptyConfig = {};
      const validation = service.validateConfiguration(emptyConfig);
      expect(validation.isValid).toBe(false);

      // Null/undefined values
      expect(() => service.getModeConfig(null as any)).toThrow();
      expect(() => service.getModeConfig(undefined as any)).toThrow();

      // Invalid mode operations
      expect(service.updateModeConfig('invalid' as DashboardMode, {}).isValid).toBe(false);
      expect(() => service.resetModeConfig('invalid' as DashboardMode)).toThrow();
    });

    it('should maintain data integrity during operations', () => {
      const originalConfig = service.getModeConfig('coding');
      
      // Multiple operations should not affect original
      service.updateModeConfig('coding', { name: 'Test 1' });
      service.updateModeConfig('coding', { name: 'Test 2' });
      service.resetModeConfig('coding');
      
      const finalConfig = service.getModeConfig('coding');
      expect(finalConfig).toEqual(originalConfig);
    });
  });

  describe('Configuration Summary and Debugging', () => {
    it('should provide useful configuration summary', () => {
      // Add some custom configurations
      service.createCustomConfig('coding', { name: 'Custom 1' }, 'custom1');
      service.createCustomConfig('meeting', { name: 'Custom 2' }, 'custom2');

      const summary = service.getConfigSummary();
      
      expect(summary.availableModes).toHaveLength(2);
      expect(summary.modeConfigs.coding).toBeDefined();
      expect(summary.modeConfigs.meeting).toBeDefined();
      expect(summary.customConfigs).toContain('custom1');
      expect(summary.customConfigs).toContain('custom2');
      
      // Verify structure
      expect(summary.modeConfigs.coding.name).toBe('Coding Mode');
      expect(summary.modeConfigs.coding.layoutType).toBe('grid');
      expect(typeof summary.modeConfigs.coding.widgetCount).toBe('number');
    });
  });
});