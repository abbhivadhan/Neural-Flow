import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DashboardModeProvider, useDashboardMode } from '../DashboardModeProvider';
import { MODE_CONFIGS } from '../../config/dashboardModes';
import { STORAGE_KEYS } from '../../constants/dashboardModes';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Test component that demonstrates real usage
function DashboardModeDemo() {
  const { 
    currentMode, 
    setMode, 
    isTransitioning, 
    modeConfig, 
    userPreferences,
    updatePreferences 
  } = useDashboardMode();

  return (
    <div>
      <div data-testid="dashboard-mode-demo">
        <h2>Current Mode: {modeConfig.name}</h2>
        <p>Description: {modeConfig.description}</p>
        <p>Theme: {modeConfig.styling.theme}</p>
        <p>Compact Mode: {modeConfig.styling.compactMode.toString()}</p>
        <p>Transitioning: {isTransitioning.toString()}</p>
        <p>Transition Speed: {userPreferences.transitionSpeed}</p>
        
        <div data-testid="visible-widgets">
          Visible Widgets: {modeConfig.widgets.visible.join(', ')}
        </div>
        
        <div data-testid="layout-info">
          Layout: {modeConfig.layout.type} - {modeConfig.layout.columns} columns
        </div>
        
        <button 
          data-testid="switch-mode"
          onClick={() => setMode(currentMode === 'coding' ? 'meeting' : 'coding')}
          disabled={isTransitioning}
        >
          Switch to {currentMode === 'coding' ? 'Meeting' : 'Coding'} Mode
        </button>
        
        <button 
          data-testid="change-speed"
          onClick={() => updatePreferences({ 
            transitionSpeed: userPreferences.transitionSpeed === 'fast' ? 'slow' : 'fast' 
          })}
        >
          Change Speed
        </button>
      </div>
    </div>
  );
}

describe('DashboardModeProvider Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  it('should integrate with mode configurations correctly', () => {
    render(
      <DashboardModeProvider>
        <DashboardModeDemo />
      </DashboardModeProvider>
    );

    // Should start with coding mode
    expect(screen.getByText('Current Mode: Coding Mode')).toBeInTheDocument();
    expect(screen.getByText('Theme: dark')).toBeInTheDocument();
    expect(screen.getByText('Compact Mode: true')).toBeInTheDocument();
    
    // Should show coding mode widgets
    const visibleWidgets = screen.getByTestId('visible-widgets');
    expect(visibleWidgets).toHaveTextContent('code-metrics');
    expect(visibleWidgets).toHaveTextContent('git-status');
    expect(visibleWidgets).toHaveTextContent('task-list');
    
    // Should show layout info
    expect(screen.getByTestId('layout-info')).toHaveTextContent('Layout: grid - 12 columns');
  });

  it('should switch between modes with correct configurations', async () => {
    render(
      <DashboardModeProvider>
        <DashboardModeDemo />
      </DashboardModeProvider>
    );

    const switchButton = screen.getByTestId('switch-mode');
    
    // Switch to meeting mode
    await act(async () => {
      switchButton.click();
    });

    await waitFor(() => {
      expect(screen.getByText('Current Mode: Meeting Mode')).toBeInTheDocument();
    });

    // Should show meeting mode configuration
    expect(screen.getByText('Theme: light')).toBeInTheDocument();
    expect(screen.getByText('Compact Mode: false')).toBeInTheDocument();
    
    // Should show meeting mode widgets
    const visibleWidgets = screen.getByTestId('visible-widgets');
    expect(visibleWidgets).toHaveTextContent('team-calendar');
    expect(visibleWidgets).toHaveTextContent('meeting-notes');
    expect(visibleWidgets).toHaveTextContent('shared-documents');
    
    // Should not show coding widgets
    expect(visibleWidgets).not.toHaveTextContent('code-metrics');
    expect(visibleWidgets).not.toHaveTextContent('git-status');
  });

  it('should handle preference updates correctly', async () => {
    render(
      <DashboardModeProvider>
        <DashboardModeDemo />
      </DashboardModeProvider>
    );

    // Initial speed should be 'normal'
    expect(screen.getByText('Transition Speed: normal')).toBeInTheDocument();

    const changeSpeedButton = screen.getByTestId('change-speed');
    
    // Change speed
    act(() => {
      changeSpeedButton.click();
    });

    expect(screen.getByText('Transition Speed: fast')).toBeInTheDocument();
    
    // Change speed again
    act(() => {
      changeSpeedButton.click();
    });

    expect(screen.getByText('Transition Speed: slow')).toBeInTheDocument();
  });

  it('should persist preferences across provider remounts', async () => {
    const { unmount } = render(
      <DashboardModeProvider>
        <DashboardModeDemo />
      </DashboardModeProvider>
    );

    // Switch to meeting mode
    const switchButton = screen.getByTestId('switch-mode');
    await act(async () => {
      switchButton.click();
    });

    await waitFor(() => {
      expect(screen.getByText('Current Mode: Meeting Mode')).toBeInTheDocument();
    });

    // Unmount and remount
    unmount();

    render(
      <DashboardModeProvider>
        <DashboardModeDemo />
      </DashboardModeProvider>
    );

    // Should remember the meeting mode
    expect(screen.getByText('Current Mode: Meeting Mode')).toBeInTheDocument();
  });

  it('should validate mode configurations match expected structure', () => {
    // Verify that our configurations match the expected interface
    expect(MODE_CONFIGS.coding).toMatchObject({
      id: 'coding',
      name: expect.any(String),
      description: expect.any(String),
      layout: {
        type: expect.stringMatching(/^(grid|flex)$/),
        columns: expect.any(Number),
        gap: expect.any(Number)
      },
      widgets: {
        visible: expect.any(Array),
        hidden: expect.any(Array),
        priority: expect.any(Object)
      },
      styling: {
        theme: expect.stringMatching(/^(light|dark|auto)$/),
        compactMode: expect.any(Boolean)
      }
    });

    expect(MODE_CONFIGS.meeting).toMatchObject({
      id: 'meeting',
      name: expect.any(String),
      description: expect.any(String),
      layout: {
        type: expect.stringMatching(/^(grid|flex)$/),
        columns: expect.any(Number),
        gap: expect.any(Number)
      },
      widgets: {
        visible: expect.any(Array),
        hidden: expect.any(Array),
        priority: expect.any(Object)
      },
      styling: {
        theme: expect.stringMatching(/^(light|dark|auto)$/),
        compactMode: expect.any(Boolean)
      }
    });
  });

  it('should handle disabled state during transitions', async () => {
    render(
      <DashboardModeProvider>
        <DashboardModeDemo />
      </DashboardModeProvider>
    );

    const switchButton = screen.getByTestId('switch-mode');
    
    // Start transition
    act(() => {
      switchButton.click();
    });

    // Button should be disabled during transition
    expect(switchButton).toBeDisabled();
    expect(screen.getByText('Transitioning: true')).toBeInTheDocument();

    // Wait for transition to complete
    await waitFor(() => {
      expect(switchButton).not.toBeDisabled();
      expect(screen.getByText('Transitioning: false')).toBeInTheDocument();
    });
  });
});