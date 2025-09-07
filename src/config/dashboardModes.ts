import { DashboardModeConfig, DashboardMode } from '../types/dashboard';

// Default configuration for Coding Mode
export const CODING_MODE_CONFIG: DashboardModeConfig = {
  id: 'coding' as DashboardMode,
  name: 'Coding Mode',
  description: 'Optimized layout for development workflows with coding-focused widgets',
  icon: 'code',
  layout: {
    type: 'grid',
    columns: 12,
    gap: 16,
    gridTemplate: `
      "header header header header header header header header header header header header"
      "sidebar main main main main main main main main main main analytics"
      "sidebar main main main main main main main main main main analytics"
      "sidebar main main main main main main main main main main analytics"
      "sidebar main main main main main main main main main main analytics"
      "footer footer footer footer footer footer footer footer footer footer footer footer"
    `,
    widgetSizes: {
      'code-metrics': { width: '100%', height: '200px' },
      'git-status': { width: '100%', height: '150px' },
      'active-branches': { width: '100%', height: '120px' },
      'recent-commits': { width: '100%', height: '180px' },
      'task-list': { width: '100%', height: '300px' },
      'performance-monitor': { width: '100%', height: '160px' },
      'error-tracker': { width: '100%', height: '140px' },
      'build-status': { width: '100%', height: '100px' }
    },
    spacing: 16,
    responsive: {
      breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1440
      },
      layouts: {
        mobile: {
          columns: 1,
          gridTemplate: `
            "header"
            "main"
            "sidebar"
            "footer"
          `
        },
        tablet: {
          columns: 8,
          gridTemplate: `
            "header header header header header header header header"
            "sidebar sidebar main main main main main main"
            "sidebar sidebar main main main main main main"
            "footer footer footer footer footer footer footer footer"
          `
        }
      }
    }
  },
  widgets: {
    visible: [
      'code-metrics',
      'git-status',
      'active-branches',
      'recent-commits',
      'task-list',
      'performance-monitor',
      'error-tracker',
      'build-status'
    ],
    hidden: [
      'team-calendar',
      'meeting-notes',
      'shared-documents',
      'team-status',
      'presentation-mode'
    ],
    priority: {
      'code-metrics': 1,
      'git-status': 2,
      'task-list': 3,
      'active-branches': 4,
      'recent-commits': 5,
      'performance-monitor': 6,
      'error-tracker': 7,
      'build-status': 8
    },
    positions: {
      'code-metrics': { gridArea: 'analytics', order: 1 },
      'git-status': { gridArea: 'sidebar', order: 1 },
      'task-list': { gridArea: 'main', order: 1 },
      'active-branches': { gridArea: 'sidebar', order: 2 },
      'recent-commits': { gridArea: 'sidebar', order: 3 },
      'performance-monitor': { gridArea: 'analytics', order: 2 },
      'error-tracker': { gridArea: 'analytics', order: 3 },
      'build-status': { gridArea: 'footer', order: 1 }
    }
  },
  styling: {
    theme: 'dark',
    accentColor: '#00d4ff',
    compactMode: true,
    customStyles: {
      '--coding-primary': '#00d4ff',
      '--coding-secondary': '#1a1a1a',
      '--coding-accent': '#ff6b6b'
    }
  }
};

// Default configuration for Meeting Mode
export const MEETING_MODE_CONFIG: DashboardModeConfig = {
  id: 'meeting' as DashboardMode,
  name: 'Meeting Mode',
  description: 'Optimized layout for collaboration and presentation with team-focused widgets',
  icon: 'users',
  layout: {
    type: 'grid',
    columns: 12,
    gap: 24,
    gridTemplate: `
      "header header header header header header header header header header header header"
      "main main main main main main main main sidebar sidebar sidebar sidebar"
      "main main main main main main main main sidebar sidebar sidebar sidebar"
      "main main main main main main main main sidebar sidebar sidebar sidebar"
      "main main main main main main main main sidebar sidebar sidebar sidebar"
      "footer footer footer footer footer footer footer footer footer footer footer footer"
    `,
    widgetSizes: {
      'team-calendar': { width: '100%', height: '300px' },
      'meeting-notes': { width: '100%', height: '400px' },
      'shared-documents': { width: '100%', height: '250px' },
      'team-status': { width: '100%', height: '200px' },
      'collaboration-tools': { width: '100%', height: '180px' },
      'presentation-mode': { width: '100%', height: '500px' },
      'chat-panel': { width: '100%', height: '300px' },
      'screen-share': { width: '100%', height: '400px' }
    },
    spacing: 24,
    responsive: {
      breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1440
      },
      layouts: {
        mobile: {
          columns: 1,
          gridTemplate: `
            "header"
            "main"
            "sidebar"
            "footer"
          `
        },
        tablet: {
          columns: 8,
          gridTemplate: `
            "header header header header header header header header"
            "main main main main main sidebar sidebar sidebar"
            "main main main main main sidebar sidebar sidebar"
            "footer footer footer footer footer footer footer footer"
          `
        }
      }
    }
  },
  widgets: {
    visible: [
      'team-calendar',
      'meeting-notes',
      'shared-documents',
      'team-status',
      'collaboration-tools',
      'presentation-mode',
      'chat-panel'
    ],
    hidden: [
      'code-metrics',
      'git-status',
      'active-branches',
      'recent-commits',
      'performance-monitor',
      'error-tracker',
      'build-status'
    ],
    priority: {
      'presentation-mode': 1,
      'team-calendar': 2,
      'meeting-notes': 3,
      'shared-documents': 4,
      'team-status': 5,
      'collaboration-tools': 6,
      'chat-panel': 7
    },
    positions: {
      'presentation-mode': { gridArea: 'main', order: 1 },
      'team-calendar': { gridArea: 'sidebar', order: 1 },
      'meeting-notes': { gridArea: 'sidebar', order: 2 },
      'shared-documents': { gridArea: 'sidebar', order: 3 },
      'team-status': { gridArea: 'sidebar', order: 4 },
      'collaboration-tools': { gridArea: 'footer', order: 1 },
      'chat-panel': { gridArea: 'sidebar', order: 5 }
    }
  },
  styling: {
    theme: 'light',
    accentColor: '#4f46e5',
    compactMode: false,
    customStyles: {
      '--meeting-primary': '#4f46e5',
      '--meeting-secondary': '#f8fafc',
      '--meeting-accent': '#10b981'
    }
  }
};

// Default user preferences
export const DEFAULT_USER_PREFERENCES = {
  defaultMode: 'coding' as DashboardMode,
  lastUsedMode: 'coding' as DashboardMode,
  transitionSpeed: 'normal' as const,
  autoSwitchEnabled: false,
  autoSwitchRules: []
};

// Available dashboard modes
export const AVAILABLE_MODES: DashboardMode[] = ['coding', 'meeting'];

// Mode configurations map
export const MODE_CONFIGS: Record<DashboardMode, DashboardModeConfig> = {
  coding: CODING_MODE_CONFIG,
  meeting: MEETING_MODE_CONFIG
};

// Animation configurations for different transition speeds
export const ANIMATION_CONFIGS = {
  fast: {
    duration: 200,
    easing: 'ease-out',
    type: 'fade' as const
  },
  normal: {
    duration: 300,
    easing: 'ease-in-out',
    type: 'slide' as const
  },
  slow: {
    duration: 500,
    easing: 'ease-in-out',
    type: 'scale' as const,
    stagger: 50
  }
};

// Validation schemas for mode configurations
export const MODE_CONFIG_SCHEMA = {
  required: ['id', 'name', 'layout', 'widgets', 'styling'],
  properties: {
    id: { type: 'string', enum: AVAILABLE_MODES },
    name: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    icon: { type: 'string' },
    layout: {
      type: 'object',
      required: ['type', 'columns', 'gap'],
      properties: {
        type: { type: 'string', enum: ['grid', 'flex'] },
        columns: { type: 'number', minimum: 1, maximum: 24 },
        gap: { type: 'number', minimum: 0 }
      }
    },
    widgets: {
      type: 'object',
      required: ['visible', 'hidden', 'priority'],
      properties: {
        visible: { type: 'array', items: { type: 'string' } },
        hidden: { type: 'array', items: { type: 'string' } },
        priority: { type: 'object' }
      }
    },
    styling: {
      type: 'object',
      required: ['theme', 'compactMode'],
      properties: {
        theme: { type: 'string', enum: ['light', 'dark', 'auto'] },
        compactMode: { type: 'boolean' }
      }
    }
  }
};