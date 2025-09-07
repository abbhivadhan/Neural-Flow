import {
  DashboardModeConfig,
  ValidationError,
  WidgetConfig,
  LayoutConfig,
  StylingConfig,
  UserModePreferences
} from '../../types/dashboard';
import { AVAILABLE_MODES } from '../../config/dashboardModes';
import { GRID_SYSTEM, WIDGET_CONSTRAINTS } from '../../constants/dashboardModes';

/**
 * Comprehensive validation utilities for dashboard mode configurations
 */
export class ConfigurationValidator {
  /**
   * Validate layout configuration
   */
  static validateLayout(layout: Partial<LayoutConfig>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!layout.type) {
      errors.push({
        field: 'layout.type',
        message: 'Layout type is required',
        code: 'REQUIRED_FIELD'
      });
    } else if (!['grid', 'flex'].includes(layout.type)) {
      errors.push({
        field: 'layout.type',
        message: 'Layout type must be "grid" or "flex"',
        code: 'INVALID_VALUE'
      });
    }

    if (layout.columns !== undefined) {
      if (typeof layout.columns !== 'number') {
        errors.push({
          field: 'layout.columns',
          message: 'Columns must be a number',
          code: 'INVALID_TYPE'
        });
      } else if (layout.columns < GRID_SYSTEM.MIN_COLUMNS || layout.columns > GRID_SYSTEM.MAX_COLUMNS) {
        errors.push({
          field: 'layout.columns',
          message: `Columns must be between ${GRID_SYSTEM.MIN_COLUMNS} and ${GRID_SYSTEM.MAX_COLUMNS}`,
          code: 'INVALID_RANGE'
        });
      }
    }

    if (layout.gap !== undefined) {
      if (typeof layout.gap !== 'number') {
        errors.push({
          field: 'layout.gap',
          message: 'Gap must be a number',
          code: 'INVALID_TYPE'
        });
      } else if (layout.gap < GRID_SYSTEM.MIN_GAP || layout.gap > GRID_SYSTEM.MAX_GAP) {
        errors.push({
          field: 'layout.gap',
          message: `Gap must be between ${GRID_SYSTEM.MIN_GAP} and ${GRID_SYSTEM.MAX_GAP}`,
          code: 'INVALID_RANGE'
        });
      }
    }

    if (layout.spacing !== undefined) {
      if (typeof layout.spacing !== 'number') {
        errors.push({
          field: 'layout.spacing',
          message: 'Spacing must be a number',
          code: 'INVALID_TYPE'
        });
      } else if (layout.spacing < 0) {
        errors.push({
          field: 'layout.spacing',
          message: 'Spacing must be non-negative',
          code: 'INVALID_VALUE'
        });
      }
    }

    if (layout.widgetSizes) {
      Object.entries(layout.widgetSizes).forEach(([widgetId, size]) => {
        const sizeErrors = this.validateWidgetSize(size, `layout.widgetSizes.${widgetId}`);
        errors.push(...sizeErrors);
      });
    }

    if (layout.responsive) {
      const responsiveErrors = this.validateResponsiveConfig(layout.responsive);
      errors.push(...responsiveErrors);
    }

    return errors;
  }

  /**
   * Validate widget configuration
   */
  static validateWidgets(widgets: Partial<WidgetConfig>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!widgets.visible) {
      errors.push({
        field: 'widgets.visible',
        message: 'Visible widgets array is required',
        code: 'REQUIRED_FIELD'
      });
    } else if (!Array.isArray(widgets.visible)) {
      errors.push({
        field: 'widgets.visible',
        message: 'Visible widgets must be an array',
        code: 'INVALID_TYPE'
      });
    }

    if (!widgets.hidden) {
      errors.push({
        field: 'widgets.hidden',
        message: 'Hidden widgets array is required',
        code: 'REQUIRED_FIELD'
      });
    } else if (!Array.isArray(widgets.hidden)) {
      errors.push({
        field: 'widgets.hidden',
        message: 'Hidden widgets must be an array',
        code: 'INVALID_TYPE'
      });
    }

    if (!widgets.priority) {
      errors.push({
        field: 'widgets.priority',
        message: 'Widget priority object is required',
        code: 'REQUIRED_FIELD'
      });
    } else if (typeof widgets.priority !== 'object' || Array.isArray(widgets.priority)) {
      errors.push({
        field: 'widgets.priority',
        message: 'Widget priority must be an object',
        code: 'INVALID_TYPE'
      });
    }

    // Check for conflicts between visible and hidden widgets
    if (widgets.visible && widgets.hidden && Array.isArray(widgets.visible) && Array.isArray(widgets.hidden)) {
      const conflicts = widgets.visible.filter(id => widgets.hidden!.includes(id));
      if (conflicts.length > 0) {
        errors.push({
          field: 'widgets',
          message: `Widgets cannot be both visible and hidden: ${conflicts.join(', ')}`,
          code: 'INVALID_VALUE'
        });
      }
    }

    // Validate priority values
    if (widgets.priority && typeof widgets.priority === 'object') {
      Object.entries(widgets.priority).forEach(([widgetId, priority]) => {
        if (typeof priority !== 'number') {
          errors.push({
            field: `widgets.priority.${widgetId}`,
            message: 'Priority must be a number',
            code: 'INVALID_TYPE'
          });
        } else if (priority < 0) {
          errors.push({
            field: `widgets.priority.${widgetId}`,
            message: 'Priority must be non-negative',
            code: 'INVALID_VALUE'
          });
        }
      });
    }

    return errors;
  }

  /**
   * Validate styling configuration
   */
  static validateStyling(styling: Partial<StylingConfig>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!styling.theme) {
      errors.push({
        field: 'styling.theme',
        message: 'Theme is required',
        code: 'REQUIRED_FIELD'
      });
    } else if (!['light', 'dark', 'auto'].includes(styling.theme)) {
      errors.push({
        field: 'styling.theme',
        message: 'Theme must be "light", "dark", or "auto"',
        code: 'INVALID_VALUE'
      });
    }

    if (styling.compactMode === undefined) {
      errors.push({
        field: 'styling.compactMode',
        message: 'Compact mode is required',
        code: 'REQUIRED_FIELD'
      });
    } else if (typeof styling.compactMode !== 'boolean') {
      errors.push({
        field: 'styling.compactMode',
        message: 'Compact mode must be a boolean',
        code: 'INVALID_TYPE'
      });
    }

    if (styling.accentColor && typeof styling.accentColor !== 'string') {
      errors.push({
        field: 'styling.accentColor',
        message: 'Accent color must be a string',
        code: 'INVALID_TYPE'
      });
    }

    if (styling.accentColor && !this.isValidColor(styling.accentColor)) {
      errors.push({
        field: 'styling.accentColor',
        message: 'Accent color must be a valid CSS color',
        code: 'INVALID_VALUE'
      });
    }

    return errors;
  }

  /**
   * Validate user preferences
   */
  static validateUserPreferences(preferences: Partial<UserModePreferences>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (preferences.defaultMode && !AVAILABLE_MODES.includes(preferences.defaultMode)) {
      errors.push({
        field: 'defaultMode',
        message: `Default mode must be one of: ${AVAILABLE_MODES.join(', ')}`,
        code: 'INVALID_VALUE'
      });
    }

    if (preferences.lastUsedMode && !AVAILABLE_MODES.includes(preferences.lastUsedMode)) {
      errors.push({
        field: 'lastUsedMode',
        message: `Last used mode must be one of: ${AVAILABLE_MODES.join(', ')}`,
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

    if (preferences.autoSwitchRules && Array.isArray(preferences.autoSwitchRules)) {
      preferences.autoSwitchRules.forEach((rule, index) => {
        if (!rule.id || typeof rule.id !== 'string') {
          errors.push({
            field: `autoSwitchRules[${index}].id`,
            message: 'Auto switch rule ID is required and must be a string',
            code: 'REQUIRED_FIELD'
          });
        }

        if (!rule.condition || !['time', 'calendar', 'activity'].includes(rule.condition)) {
          errors.push({
            field: `autoSwitchRules[${index}].condition`,
            message: 'Auto switch rule condition must be "time", "calendar", or "activity"',
            code: 'INVALID_VALUE'
          });
        }

        if (!rule.targetMode || !AVAILABLE_MODES.includes(rule.targetMode)) {
          errors.push({
            field: `autoSwitchRules[${index}].targetMode`,
            message: `Target mode must be one of: ${AVAILABLE_MODES.join(', ')}`,
            code: 'INVALID_VALUE'
          });
        }

        if (typeof rule.enabled !== 'boolean') {
          errors.push({
            field: `autoSwitchRules[${index}].enabled`,
            message: 'Auto switch rule enabled must be a boolean',
            code: 'INVALID_TYPE'
          });
        }
      });
    }

    return errors;
  }

  /**
   * Validate complete mode configuration
   */
  static validateModeConfig(config: Partial<DashboardModeConfig>): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate required top-level fields
    if (!config.id) {
      errors.push({
        field: 'id',
        message: 'Mode ID is required',
        code: 'REQUIRED_FIELD'
      });
    } else if (!AVAILABLE_MODES.includes(config.id)) {
      errors.push({
        field: 'id',
        message: `Mode ID must be one of: ${AVAILABLE_MODES.join(', ')}`,
        code: 'INVALID_VALUE'
      });
    }

    if (!config.name || config.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Mode name is required',
        code: 'REQUIRED_FIELD'
      });
    }

    if (config.description !== undefined && typeof config.description !== 'string') {
      errors.push({
        field: 'description',
        message: 'Description must be a string',
        code: 'INVALID_TYPE'
      });
    }

    if (config.icon !== undefined && typeof config.icon !== 'string') {
      errors.push({
        field: 'icon',
        message: 'Icon must be a string',
        code: 'INVALID_TYPE'
      });
    }

    // Validate nested configurations
    if (config.layout) {
      errors.push(...this.validateLayout(config.layout));
    } else {
      errors.push({
        field: 'layout',
        message: 'Layout configuration is required',
        code: 'REQUIRED_FIELD'
      });
    }

    if (config.widgets) {
      errors.push(...this.validateWidgets(config.widgets));
    } else {
      errors.push({
        field: 'widgets',
        message: 'Widget configuration is required',
        code: 'REQUIRED_FIELD'
      });
    }

    if (config.styling) {
      errors.push(...this.validateStyling(config.styling));
    } else {
      errors.push({
        field: 'styling',
        message: 'Styling configuration is required',
        code: 'REQUIRED_FIELD'
      });
    }

    return errors;
  }

  /**
   * Validate widget size configuration
   */
  private static validateWidgetSize(size: any, fieldPrefix: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!size.width) {
      errors.push({
        field: `${fieldPrefix}.width`,
        message: 'Widget width is required',
        code: 'REQUIRED_FIELD'
      });
    } else if (typeof size.width !== 'string') {
      errors.push({
        field: `${fieldPrefix}.width`,
        message: 'Widget width must be a string',
        code: 'INVALID_TYPE'
      });
    }

    if (!size.height) {
      errors.push({
        field: `${fieldPrefix}.height`,
        message: 'Widget height is required',
        code: 'REQUIRED_FIELD'
      });
    } else if (typeof size.height !== 'string') {
      errors.push({
        field: `${fieldPrefix}.height`,
        message: 'Widget height must be a string',
        code: 'INVALID_TYPE'
      });
    }

    // Validate optional size constraints
    ['minWidth', 'minHeight', 'maxWidth', 'maxHeight'].forEach(prop => {
      if (size[prop] !== undefined && typeof size[prop] !== 'string') {
        errors.push({
          field: `${fieldPrefix}.${prop}`,
          message: `${prop} must be a string`,
          code: 'INVALID_TYPE'
        });
      }
    });

    return errors;
  }

  /**
   * Validate responsive configuration
   */
  private static validateResponsiveConfig(responsive: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!responsive.breakpoints) {
      errors.push({
        field: 'layout.responsive.breakpoints',
        message: 'Responsive breakpoints are required',
        code: 'REQUIRED_FIELD'
      });
    } else {
      ['mobile', 'tablet', 'desktop'].forEach(breakpoint => {
        if (typeof responsive.breakpoints[breakpoint] !== 'number') {
          errors.push({
            field: `layout.responsive.breakpoints.${breakpoint}`,
            message: `${breakpoint} breakpoint must be a number`,
            code: 'INVALID_TYPE'
          });
        }
      });
    }

    if (responsive.layouts && typeof responsive.layouts !== 'object') {
      errors.push({
        field: 'layout.responsive.layouts',
        message: 'Responsive layouts must be an object',
        code: 'INVALID_TYPE'
      });
    }

    return errors;
  }

  /**
   * Check if a string is a valid CSS color
   */
  private static isValidColor(color: string): boolean {
    // Basic validation for common CSS color formats
    const colorRegex = /^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})|rgb\(|rgba\(|hsl\(|hsla\(|[a-zA-Z]+).*$/;
    return colorRegex.test(color);
  }

  /**
   * Get validation summary
   */
  static getValidationSummary(errors: ValidationError[]): {
    isValid: boolean;
    errorCount: number;
    warningCount: number;
    fieldErrors: Record<string, ValidationError[]>;
  } {
    const fieldErrors: Record<string, ValidationError[]> = {};
    
    errors.forEach(error => {
      if (!fieldErrors[error.field]) {
        fieldErrors[error.field] = [];
      }
      fieldErrors[error.field].push(error);
    });

    return {
      isValid: errors.length === 0,
      errorCount: errors.length,
      warningCount: 0, // Could be extended to support warnings
      fieldErrors
    };
  }
}