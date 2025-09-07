// Dashboard mode constants
export const DASHBOARD_MODES = {
  CODING: 'coding',
  MEETING: 'meeting'
} as const;

export type DashboardMode = typeof DASHBOARD_MODES[keyof typeof DASHBOARD_MODES];

// Mode display names
export const MODE_DISPLAY_NAMES: Record<DashboardMode, string> = {
  [DASHBOARD_MODES.CODING]: 'Coding Mode',
  [DASHBOARD_MODES.MEETING]: 'Meeting Mode'
};

// Mode descriptions
export const MODE_DESCRIPTIONS: Record<DashboardMode, string> = {
  [DASHBOARD_MODES.CODING]: 'Optimized for development workflows with coding-focused widgets and tools',
  [DASHBOARD_MODES.MEETING]: 'Optimized for collaboration and presentation with team-focused widgets'
};

// Mode icons
export const MODE_ICONS: Record<DashboardMode, string> = {
  [DASHBOARD_MODES.CODING]: 'code',
  [DASHBOARD_MODES.MEETING]: 'users'
};

// Widget categories for different modes
export const CODING_MODE_WIDGETS = [
  'code-metrics',
  'git-status',
  'active-branches',
  'recent-commits',
  'task-list',
  'performance-monitor',
  'error-tracker',
  'build-status',
  'test-results',
  'code-coverage',
  'dependency-tracker',
  'api-monitor'
] as const;

export const MEETING_MODE_WIDGETS = [
  'team-calendar',
  'meeting-notes',
  'shared-documents',
  'team-status',
  'collaboration-tools',
  'presentation-mode',
  'chat-panel',
  'screen-share',
  'whiteboard',
  'participant-list',
  'agenda-tracker',
  'action-items'
] as const;

// Common widgets that appear in both modes
export const COMMON_WIDGETS = [
  'notifications',
  'quick-actions',
  'search',
  'user-profile',
  'settings'
] as const;

// Storage keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'dashboard-mode-preferences',
  CUSTOM_CONFIGS: 'dashboard-mode-custom-configs',
  WIDGET_LAYOUTS: 'dashboard-mode-widget-layouts',
  LAST_MODE: 'dashboard-mode-last-used'
} as const;

// Event names for mode switching
export const MODE_EVENTS = {
  MODE_CHANGE_START: 'dashboard:mode:change:start',
  MODE_CHANGE_COMPLETE: 'dashboard:mode:change:complete',
  MODE_CHANGE_ERROR: 'dashboard:mode:change:error',
  WIDGET_VISIBILITY_CHANGE: 'dashboard:widget:visibility:change',
  LAYOUT_UPDATE: 'dashboard:layout:update',
  PREFERENCES_UPDATE: 'dashboard:preferences:update'
} as const;

// CSS class names
export const CSS_CLASSES = {
  DASHBOARD_CONTAINER: 'dashboard-container',
  MODE_SWITCHER: 'dashboard-mode-switcher',
  MODE_TRANSITION: 'dashboard-mode-transition',
  CODING_MODE: 'dashboard-mode-coding',
  MEETING_MODE: 'dashboard-mode-meeting',
  WIDGET_CONTAINER: 'dashboard-widget-container',
  WIDGET_VISIBLE: 'dashboard-widget-visible',
  WIDGET_HIDDEN: 'dashboard-widget-hidden',
  LAYOUT_GRID: 'dashboard-layout-grid',
  LAYOUT_FLEX: 'dashboard-layout-flex',
  COMPACT_MODE: 'dashboard-compact-mode',
  TRANSITIONING: 'dashboard-transitioning'
} as const;

// Animation durations (in milliseconds)
export const ANIMATION_DURATIONS = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  WIDGET_FADE: 150,
  LAYOUT_TRANSITION: 400,
  MODE_SWITCH: 350
} as const;

// Breakpoints for responsive design
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1440,
  LARGE_DESKTOP: 1920
} as const;

// Grid system constants
export const GRID_SYSTEM = {
  MAX_COLUMNS: 24,
  MIN_COLUMNS: 1,
  DEFAULT_COLUMNS: 12,
  MIN_GAP: 0,
  MAX_GAP: 64,
  DEFAULT_GAP: 16
} as const;

// Widget size constraints
export const WIDGET_CONSTRAINTS = {
  MIN_WIDTH: 200,
  MIN_HEIGHT: 100,
  MAX_WIDTH: 1200,
  MAX_HEIGHT: 800,
  DEFAULT_WIDTH: 300,
  DEFAULT_HEIGHT: 200
} as const;

// Validation error codes
export const VALIDATION_ERRORS = {
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_TYPE: 'INVALID_TYPE',
  INVALID_VALUE: 'INVALID_VALUE',
  INVALID_RANGE: 'INVALID_RANGE',
  DUPLICATE_ID: 'DUPLICATE_ID',
  MISSING_DEPENDENCY: 'MISSING_DEPENDENCY',
  CIRCULAR_DEPENDENCY: 'CIRCULAR_DEPENDENCY'
} as const;

// Default transition speeds
export const TRANSITION_SPEEDS = {
  FAST: 'fast',
  NORMAL: 'normal',
  SLOW: 'slow'
} as const;

// Auto-switch conditions
export const AUTO_SWITCH_CONDITIONS = {
  TIME: 'time',
  CALENDAR: 'calendar',
  ACTIVITY: 'activity'
} as const;

// Theme variants
export const THEME_VARIANTS = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
} as const;

// Layout types
export const LAYOUT_TYPES = {
  GRID: 'grid',
  FLEX: 'flex'
} as const;

// Mode switcher variants
export const MODE_SWITCHER_VARIANTS = {
  DROPDOWN: 'dropdown',
  TOGGLE: 'toggle',
  TABS: 'tabs'
} as const;

// Component sizes
export const COMPONENT_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
} as const;

// Error messages
export const ERROR_MESSAGES = {
  INVALID_MODE: 'Invalid dashboard mode specified',
  MODE_SWITCH_FAILED: 'Failed to switch dashboard mode',
  CONFIG_VALIDATION_FAILED: 'Mode configuration validation failed',
  STORAGE_UNAVAILABLE: 'Local storage is not available',
  PREFERENCES_LOAD_FAILED: 'Failed to load user preferences',
  PREFERENCES_SAVE_FAILED: 'Failed to save user preferences',
  WIDGET_LOAD_FAILED: 'Failed to load widget configuration',
  LAYOUT_RENDER_FAILED: 'Failed to render dashboard layout'
} as const;