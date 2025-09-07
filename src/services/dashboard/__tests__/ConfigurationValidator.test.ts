import { describe, it, expect } from 'vitest';
import { ConfigurationValidator } from '../ConfigurationValidator';
import { LayoutConfig, WidgetConfig, StylingConfig, UserModePreferences } from '../../../types/dashboard';

describe('ConfigurationValidator', () => {
  describe('validateLayout', () => {
    it('should validate valid layout configuration', () => {
      const layout: LayoutConfig = {
        type: 'grid',
        columns: 12,
        gap: 16,
        spacing: 16,
        widgetSizes: {
          'test-widget': { width: '100%', height: '200px' }
        },
        responsive: {
          breakpoints: { mobile: 768, tablet: 1024, desktop: 1440 },
          layouts: {}
        }
      };
      
      const errors = ConfigurationValidator.validateLayout(layout);
      expect(errors).toHaveLength(0);
    });

    it('should reject layout without type', () => {
      const layout = { columns: 12, gap: 16 } as any;
      const errors = ConfigurationValidator.validateLayout(layout);
      expect(errors.some(e => e.field === 'layout.type' && e.code === 'REQUIRED_FIELD')).toBe(true);
    });

    it('should reject invalid layout type', () => {
      const layout = { type: 'invalid', columns: 12, gap: 16 } as any;
      const errors = ConfigurationValidator.validateLayout(layout);
      expect(errors.some(e => e.field === 'layout.type' && e.code === 'INVALID_VALUE')).toBe(true);
    });

    it('should reject invalid column count', () => {
      const layout = { type: 'grid', columns: 0, gap: 16 } as any;
      const errors = ConfigurationValidator.validateLayout(layout);
      expect(errors.some(e => e.field === 'layout.columns' && e.code === 'INVALID_RANGE')).toBe(true);
    });

    it('should reject negative gap', () => {
      const layout = { type: 'grid', columns: 12, gap: -5 } as any;
      const errors = ConfigurationValidator.validateLayout(layout);
      expect(errors.some(e => e.field === 'layout.gap' && e.code === 'INVALID_RANGE')).toBe(true);
    });

    it('should reject invalid widget size', () => {
      const layout = {
        type: 'grid',
        columns: 12,
        gap: 16,
        widgetSizes: {
          'test-widget': { width: 123 } // Invalid type
        }
      } as any;
      
      const errors = ConfigurationValidator.validateLayout(layout);
      expect(errors.some(e => e.field.includes('widgetSizes') && e.code === 'INVALID_TYPE')).toBe(true);
    });
  });

  describe('validateWidgets', () => {
    it('should validate valid widget configuration', () => {
      const widgets: WidgetConfig = {
        visible: ['widget1', 'widget2'],
        hidden: ['widget3', 'widget4'],
        priority: { widget1: 1, widget2: 2 }
      };
      
      const errors = ConfigurationValidator.validateWidgets(widgets);
      expect(errors).toHaveLength(0);
    });

    it('should reject missing visible widgets', () => {
      const widgets = { hidden: [], priority: {} } as any;
      const errors = ConfigurationValidator.validateWidgets(widgets);
      expect(errors.some(e => e.field === 'widgets.visible' && e.code === 'REQUIRED_FIELD')).toBe(true);
    });

    it('should reject non-array visible widgets', () => {
      const widgets = { visible: 'invalid', hidden: [], priority: {} } as any;
      const errors = ConfigurationValidator.validateWidgets(widgets);
      expect(errors.some(e => e.field === 'widgets.visible' && e.code === 'INVALID_TYPE')).toBe(true);
    });

    it('should detect conflicts between visible and hidden widgets', () => {
      const widgets = {
        visible: ['widget1', 'widget2'],
        hidden: ['widget2', 'widget3'], // widget2 is in both
        priority: {}
      };
      
      const errors = ConfigurationValidator.validateWidgets(widgets);
      expect(errors.some(e => e.field === 'widgets' && e.code === 'INVALID_VALUE')).toBe(true);
    });

    it('should reject invalid priority values', () => {
      const widgets = {
        visible: ['widget1'],
        hidden: [],
        priority: { widget1: 'invalid' } // Should be number
      } as any;
      
      const errors = ConfigurationValidator.validateWidgets(widgets);
      expect(errors.some(e => e.field.includes('priority') && e.code === 'INVALID_TYPE')).toBe(true);
    });

    it('should reject negative priority values', () => {
      const widgets = {
        visible: ['widget1'],
        hidden: [],
        priority: { widget1: -1 }
      };
      
      const errors = ConfigurationValidator.validateWidgets(widgets);
      expect(errors.some(e => e.field.includes('priority') && e.code === 'INVALID_VALUE')).toBe(true);
    });
  });

  describe('validateStyling', () => {
    it('should validate valid styling configuration', () => {
      const styling: StylingConfig = {
        theme: 'dark',
        compactMode: true,
        accentColor: '#ff0000'
      };
      
      const errors = ConfigurationValidator.validateStyling(styling);
      expect(errors).toHaveLength(0);
    });

    it('should reject missing theme', () => {
      const styling = { compactMode: true } as any;
      const errors = ConfigurationValidator.validateStyling(styling);
      expect(errors.some(e => e.field === 'styling.theme' && e.code === 'REQUIRED_FIELD')).toBe(true);
    });

    it('should reject invalid theme', () => {
      const styling = { theme: 'invalid', compactMode: true } as any;
      const errors = ConfigurationValidator.validateStyling(styling);
      expect(errors.some(e => e.field === 'styling.theme' && e.code === 'INVALID_VALUE')).toBe(true);
    });

    it('should reject missing compact mode', () => {
      const styling = { theme: 'light' } as any;
      const errors = ConfigurationValidator.validateStyling(styling);
      expect(errors.some(e => e.field === 'styling.compactMode' && e.code === 'REQUIRED_FIELD')).toBe(true);
    });

    it('should reject invalid compact mode type', () => {
      const styling = { theme: 'light', compactMode: 'true' } as any;
      const errors = ConfigurationValidator.validateStyling(styling);
      expect(errors.some(e => e.field === 'styling.compactMode' && e.code === 'INVALID_TYPE')).toBe(true);
    });

    it('should accept valid CSS colors', () => {
      const validColors = ['#ff0000', '#f00', 'rgb(255,0,0)', 'rgba(255,0,0,0.5)', 'red', 'hsl(0,100%,50%)'];
      
      validColors.forEach(color => {
        const styling = { theme: 'light' as const, compactMode: true, accentColor: color };
        const errors = ConfigurationValidator.validateStyling(styling);
        expect(errors.filter(e => e.field === 'styling.accentColor')).toHaveLength(0);
      });
    });
  });

  describe('validateUserPreferences', () => {
    it('should validate valid user preferences', () => {
      const preferences: UserModePreferences = {
        defaultMode: 'coding',
        lastUsedMode: 'meeting',
        transitionSpeed: 'normal',
        autoSwitchEnabled: true,
        autoSwitchRules: [
          {
            id: 'rule1',
            condition: 'time',
            parameters: {},
            targetMode: 'coding',
            enabled: true
          }
        ]
      };
      
      const errors = ConfigurationValidator.validateUserPreferences(preferences);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid default mode', () => {
      const preferences = { defaultMode: 'invalid' } as any;
      const errors = ConfigurationValidator.validateUserPreferences(preferences);
      expect(errors.some(e => e.field === 'defaultMode' && e.code === 'INVALID_VALUE')).toBe(true);
    });

    it('should reject invalid transition speed', () => {
      const preferences = { transitionSpeed: 'invalid' } as any;
      const errors = ConfigurationValidator.validateUserPreferences(preferences);
      expect(errors.some(e => e.field === 'transitionSpeed' && e.code === 'INVALID_VALUE')).toBe(true);
    });

    it('should reject invalid auto switch enabled type', () => {
      const preferences = { autoSwitchEnabled: 'true' } as any;
      const errors = ConfigurationValidator.validateUserPreferences(preferences);
      expect(errors.some(e => e.field === 'autoSwitchEnabled' && e.code === 'INVALID_TYPE')).toBe(true);
    });

    it('should validate auto switch rules', () => {
      const preferences = {
        autoSwitchRules: [
          {
            // Missing required fields
            condition: 'invalid',
            targetMode: 'invalid',
            enabled: 'true'
          }
        ]
      } as any;
      
      const errors = ConfigurationValidator.validateUserPreferences(preferences);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.field.includes('autoSwitchRules[0].id'))).toBe(true);
      expect(errors.some(e => e.field.includes('autoSwitchRules[0].condition'))).toBe(true);
      expect(errors.some(e => e.field.includes('autoSwitchRules[0].targetMode'))).toBe(true);
      expect(errors.some(e => e.field.includes('autoSwitchRules[0].enabled'))).toBe(true);
    });
  });

  describe('validateModeConfig', () => {
    it('should validate complete valid mode configuration', () => {
      const config = {
        id: 'coding' as const,
        name: 'Coding Mode',
        description: 'For development',
        icon: 'code',
        layout: {
          type: 'grid' as const,
          columns: 12,
          gap: 16,
          spacing: 16,
          widgetSizes: {},
          responsive: {
            breakpoints: { mobile: 768, tablet: 1024, desktop: 1440 },
            layouts: {}
          }
        },
        widgets: {
          visible: ['widget1'],
          hidden: ['widget2'],
          priority: { widget1: 1 }
        },
        styling: {
          theme: 'dark' as const,
          compactMode: true
        }
      };
      
      const errors = ConfigurationValidator.validateModeConfig(config);
      expect(errors).toHaveLength(0);
    });

    it('should reject configuration without required fields', () => {
      const config = { name: 'Test' } as any;
      const errors = ConfigurationValidator.validateModeConfig(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.field === 'id')).toBe(true);
      expect(errors.some(e => e.field === 'layout')).toBe(true);
      expect(errors.some(e => e.field === 'widgets')).toBe(true);
      expect(errors.some(e => e.field === 'styling')).toBe(true);
    });

    it('should reject invalid mode ID', () => {
      const config = {
        id: 'invalid',
        name: 'Test',
        layout: {},
        widgets: {},
        styling: {}
      } as any;
      
      const errors = ConfigurationValidator.validateModeConfig(config);
      expect(errors.some(e => e.field === 'id' && e.code === 'INVALID_VALUE')).toBe(true);
    });

    it('should reject empty name', () => {
      const config = {
        id: 'coding',
        name: '   ', // Empty after trim
        layout: {},
        widgets: {},
        styling: {}
      } as any;
      
      const errors = ConfigurationValidator.validateModeConfig(config);
      expect(errors.some(e => e.field === 'name' && e.code === 'REQUIRED_FIELD')).toBe(true);
    });
  });

  describe('getValidationSummary', () => {
    it('should provide validation summary', () => {
      const errors = [
        { field: 'field1', message: 'Error 1', code: 'ERROR1' },
        { field: 'field1', message: 'Error 2', code: 'ERROR2' },
        { field: 'field2', message: 'Error 3', code: 'ERROR3' }
      ];
      
      const summary = ConfigurationValidator.getValidationSummary(errors);
      expect(summary.isValid).toBe(false);
      expect(summary.errorCount).toBe(3);
      expect(summary.fieldErrors.field1).toHaveLength(2);
      expect(summary.fieldErrors.field2).toHaveLength(1);
    });

    it('should indicate valid configuration when no errors', () => {
      const summary = ConfigurationValidator.getValidationSummary([]);
      expect(summary.isValid).toBe(true);
      expect(summary.errorCount).toBe(0);
      expect(Object.keys(summary.fieldErrors)).toHaveLength(0);
    });
  });
});