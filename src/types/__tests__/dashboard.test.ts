import { describe, it, expect } from 'vitest';
import {
  DashboardMode,
  DashboardModeConfig,
  UserModePreferences,
  WidgetInstance,
  ModeSwitchProps,
  DashboardModeContextType
} from '../dashboard';
import { CODING_MODE_CONFIG, MEETING_MODE_CONFIG } from '../../config/dashboardModes';
import { isValidMode, getModeConfig, validateModeConfig } from '../../utils/dashboardModes';

describe('Dashboard Types', () => {
  describe('DashboardMode type', () => {
    it('should accept valid mode values', () => {
      const codingMode: DashboardMode = 'coding';
      const meetingMode: DashboardMode = 'meeting';
      
      expect(codingMode).toBe('coding');
      expect(meetingMode).toBe('meeting');
    });
  });

  describe('DashboardModeConfig interface', () => {
    it('should validate coding mode config structure', () => {
      const config: DashboardModeConfig = CODING_MODE_CONFIG;
      
      expect(config.id).toBe('coding');
      expect(config.name).toBe('Coding Mode');
      expect(config.layout).toBeDefined();
      expect(config.widgets).toBeDefined();
      expect(config.styling).toBeDefined();
      expect(Array.isArray(config.widgets.visible)).toBe(true);
      expect(Array.isArray(config.widgets.hidden)).toBe(true);
      expect(typeof config.widgets.priority).toBe('object');
    });

    it('should validate meeting mode config structure', () => {
      const config: DashboardModeConfig = MEETING_MODE_CONFIG;
      
      expect(config.id).toBe('meeting');
      expect(config.name).toBe('Meeting Mode');
      expect(config.layout).toBeDefined();
      expect(config.widgets).toBeDefined();
      expect(config.styling).toBeDefined();
    });
  });

  describe('UserModePreferences interface', () => {
    it('should create valid user preferences', () => {
      const preferences: UserModePreferences = {
        defaultMode: 'coding',
        lastUsedMode: 'meeting',
        transitionSpeed: 'normal',
        autoSwitchEnabled: false,
        autoSwitchRules: []
      };
      
      expect(preferences.defaultMode).toBe('coding');
      expect(preferences.lastUsedMode).toBe('meeting');
      expect(preferences.transitionSpeed).toBe('normal');
    });
  });

  describe('WidgetInstance interface', () => {
    it('should create valid widget instance', () => {
      const widget: WidgetInstance = {
        id: 'widget-1',
        widgetId: 'code-metrics',
        position: { gridArea: 'main', order: 1 },
        size: { width: '100%', height: '200px' },
        config: { theme: 'dark' },
        visible: true,
        mode: 'coding'
      };
      
      expect(widget.id).toBe('widget-1');
      expect(widget.mode).toBe('coding');
      expect(widget.visible).toBe(true);
    });
  });

  describe('ModeSwitchProps interface', () => {
    it('should create valid mode switch props', () => {
      const props: ModeSwitchProps = {
        currentMode: 'coding',
        onModeChange: (mode: DashboardMode) => console.log(mode),
        className: 'mode-switcher',
        disabled: false,
        showTooltip: true,
        variant: 'dropdown',
        size: 'medium'
      };
      
      expect(props.currentMode).toBe('coding');
      expect(props.variant).toBe('dropdown');
      expect(props.size).toBe('medium');
    });
  });

  describe('Utility functions with types', () => {
    it('should validate modes correctly', () => {
      expect(isValidMode('coding')).toBe(true);
      expect(isValidMode('meeting')).toBe(true);
      expect(isValidMode('invalid')).toBe(false);
    });

    it('should get mode configs correctly', () => {
      const codingConfig = getModeConfig('coding');
      const meetingConfig = getModeConfig('meeting');
      
      expect(codingConfig.id).toBe('coding');
      expect(meetingConfig.id).toBe('meeting');
    });

    it('should validate mode configurations', () => {
      const validConfig = CODING_MODE_CONFIG;
      const validation = validateModeConfig(validConfig);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid mode configurations', () => {
      const invalidConfig = {
        id: 'invalid' as DashboardMode,
        name: '',
        // Missing required fields
      };
      
      const validation = validateModeConfig(invalidConfig);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });
});