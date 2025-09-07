// Dashboard mode types and interfaces
import * as React from 'react';

export type DashboardMode = 'coding' | 'meeting';

export interface DashboardModeConfig {
  id: DashboardMode;
  name: string;
  description: string;
  icon: string;
  layout: LayoutConfig;
  widgets: WidgetConfig;
  styling: StylingConfig;
}

export interface LayoutConfig {
  type: 'grid' | 'flex';
  columns: number;
  gap: number;
  areas?: string[];
  gridTemplate?: string;
  widgetSizes: Record<string, WidgetSize>;
  spacing: number;
  responsive: ResponsiveConfig;
}

export interface WidgetSize {
  width: string;
  height: string;
  minWidth?: string;
  minHeight?: string;
  maxWidth?: string;
  maxHeight?: string;
}

export interface ResponsiveConfig {
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  layouts: Record<string, Partial<LayoutConfig>>;
}

export interface WidgetConfig {
  visible: string[];
  hidden: string[];
  priority: Record<string, number>;
  positions?: Record<string, WidgetPosition>;
}

export interface WidgetPosition {
  gridArea?: string;
  order?: number;
  x?: number;
  y?: number;
}

export interface StylingConfig {
  theme: 'light' | 'dark' | 'auto';
  accentColor?: string;
  compactMode: boolean;
  customStyles?: Record<string, any>;
}

export interface AnimationConfig {
  duration: number;
  easing: string;
  stagger?: number;
  type: 'fade' | 'slide' | 'scale' | 'none';
}

export interface UserModePreferences {
  defaultMode: DashboardMode;
  lastUsedMode: DashboardMode;
  customConfigs?: Record<string, Partial<DashboardModeConfig>>;
  transitionSpeed: 'fast' | 'normal' | 'slow';
  autoSwitchEnabled?: boolean;
  autoSwitchRules?: AutoSwitchRule[];
}

export interface AutoSwitchRule {
  id: string;
  condition: 'time' | 'calendar' | 'activity';
  parameters: Record<string, any>;
  targetMode: DashboardMode;
  enabled: boolean;
}

// Context and Provider types
export interface DashboardModeContextType {
  currentMode: DashboardMode;
  setMode: (mode: DashboardMode) => void;
  isTransitioning: boolean;
  modeConfig: DashboardModeConfig;
  userPreferences: UserModePreferences;
  availableModes: DashboardMode[];
  updatePreferences: (preferences: Partial<UserModePreferences>) => void;
}

export interface DashboardModeProviderProps {
  children: React.ReactNode;
  initialMode?: DashboardMode;
  onModeChange?: (mode: DashboardMode) => void;
}

// Component prop interfaces
export interface ModeSwitchProps {
  currentMode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
  className?: string;
  disabled?: boolean;
  showTooltip?: boolean;
  variant?: 'dropdown' | 'toggle' | 'tabs';
  size?: 'small' | 'medium' | 'large';
}

export interface ModeLayoutProps {
  mode: DashboardMode;
  config: DashboardModeConfig;
  children?: React.ReactNode;
  className?: string;
}

export interface ModeTransitionProps {
  isTransitioning: boolean;
  fromMode?: DashboardMode;
  toMode?: DashboardMode;
  animationConfig: AnimationConfig;
  children: React.ReactNode;
}

// Widget-related types
export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  component: React.ComponentType<any>;
  defaultSize: WidgetSize;
  minSize?: WidgetSize;
  maxSize?: WidgetSize;
  resizable?: boolean;
  movable?: boolean;
  configurable?: boolean;
  supportedModes: DashboardMode[];
}

export interface WidgetInstance {
  id: string;
  widgetId: string;
  position: WidgetPosition;
  size: WidgetSize;
  config: Record<string, any>;
  visible: boolean;
  mode: DashboardMode;
}

// State management types
export interface DashboardModeState {
  currentMode: DashboardMode;
  isTransitioning: boolean;
  transitionProgress: number;
  modeConfigs: Record<DashboardMode, DashboardModeConfig>;
  userPreferences: UserModePreferences;
  widgetInstances: WidgetInstance[];
  error?: string;
}

export interface DashboardModeActions {
  setMode: (mode: DashboardMode) => void;
  setTransitioning: (isTransitioning: boolean) => void;
  updateModeConfig: (mode: DashboardMode, config: Partial<DashboardModeConfig>) => void;
  updateUserPreferences: (preferences: Partial<UserModePreferences>) => void;
  addWidgetInstance: (widget: WidgetInstance) => void;
  removeWidgetInstance: (widgetId: string) => void;
  updateWidgetInstance: (widgetId: string, updates: Partial<WidgetInstance>) => void;
  resetToDefaults: () => void;
  setError: (error: string | null) => void;
}

// Storage and persistence types
export interface DashboardModeStorage {
  preferences: UserModePreferences;
  customConfigs: Record<string, Partial<DashboardModeConfig>>;
  widgetLayouts: Record<DashboardMode, WidgetInstance[]>;
  lastUpdated: string;
  version: string;
}

// Event types
export interface ModeChangeEvent {
  fromMode: DashboardMode;
  toMode: DashboardMode;
  timestamp: Date;
  userId?: string;
  trigger: 'user' | 'auto' | 'system';
}

export interface WidgetEvent {
  type: 'add' | 'remove' | 'update' | 'resize' | 'move';
  widgetId: string;
  mode: DashboardMode;
  timestamp: Date;
  data?: any;
}

// Validation and error types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ModeConfigValidation extends ValidationResult {
  config: DashboardModeConfig;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type ModeConfigUpdate = DeepPartial<DashboardModeConfig>;
export type PreferencesUpdate = DeepPartial<UserModePreferences>;