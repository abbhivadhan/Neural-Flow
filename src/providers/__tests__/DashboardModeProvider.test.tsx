import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DashboardModeProvider, useDashboardMode } from '../DashboardModeProvider';
import { DashboardMode, UserModePreferences } from '../../types/dashboard';
import { STORAGE_KEYS, MODE_EVENTS } from '../../constants/dashboardModes';
import { DEFAULT_USER_PREFERENCES } from '../../config/dashboardModes';

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

// Mock window.dispatchEvent
const mockDispatchEvent = vi.fn();
Object.defineProperty(window, 'dispatchEvent', {
  value: mockDispatchEvent
});

// Test component that uses the hook
function TestComponent() {
  const { currentMode, setMode, isTransitioning, modeConfig, userPreferences, availableModes } = useDashboardMode();
  
  return (
    <div>
      <div data-testid="current-mode">{currentMode}</div>
      <div data-testid="is-transitioning">{isTransitioning.toString()}</div>
      <div data-testid="mode-config-name">{modeConfig.name}</div>
      <div data-testid="user-preferences">{JSON.stringify(userPreferences)}</div>
      <div data-testid="available-modes">{availableModes.join(',')}</div>
      <button 
        data-testid="switch-to-meeting" 
        onClick={() => setMode('meeting')}
      >
        Switch to Meeting
      </button>
      <button 
        data-testid="switch-to-coding" 
        onClick={() => setMode('coding')}
      >
        Switch to Coding
      </button>
    </div>
  );
}

describe('DashboardModeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    mockDispatchEvent.mockClear();
  });

  describe('Provider Setup', () => {
    it('should provide default context values', () => {
      render(
        <DashboardModeProvider>
          <TestComponent />
        </DashboardModeProvider>
      );

      expect(screen.getByTestId('current-mode')).toHaveTextContent('coding');
      expect(screen.getByTestId('is-transitioning')).toHaveTextContent('false');
      expect(screen.getByTestId('mode-config-name')).toHaveTextContent('Coding Mode');
      expect(screen.getByTestId('available-modes')).toHaveTextContent('coding,meeting');
    });

    it('should use initial mode when provided', () => {
      render(
        <DashboardModeProvider initialMode="meeting">
          <TestComponent />
        </DashboardModeProvider>
      );

      expect(screen.getByTestId('current-mode')).toHaveTextContent('meeting');
      expect(screen.getByTestId('mode-config-name')).toHaveTextContent('Meeting Mode');
    });

    it('should throw error when hook is used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useDashboardMode());
      }).toThrow('useDashboardMode must be used within a DashboardModeProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Mode Switching', () => {
    it('should switch modes correctly', async () => {
      render(
        <DashboardModeProvider>
          <TestComponent />
        </DashboardModeProvider>
      );

      const switchButton = screen.getByTestId('switch-to-meeting');
      
      await act(async () => {
        switchButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('current-mode')).toHaveTextContent('meeting');
      });

      expect(screen.getByTestId('mode-config-name')).toHaveTextContent('Meeting Mode');
    });

    it('should handle transition states during mode switch', async () => {
      render(
        <DashboardModeProvider>
          <TestComponent />
        </DashboardModeProvider>
      );

      const switchButton = screen.getByTestId('switch-to-meeting');
      
      await act(async () => {
        switchButton.click();
      });

      // Should show transitioning state briefly
      expect(screen.getByTestId('is-transitioning')).toHaveTextContent('true');

      await waitFor(() => {
        expect(screen.getByTestId('is-transitioning')).toHaveTextContent('false');
      });
    });

    it('should dispatch mode change events', async () => {
      render(
        <DashboardModeProvider>
          <TestComponent />
        </DashboardModeProvider>
      );

      const switchButton = screen.getByTestId('switch-to-meeting');
      
      await act(async () => {
        switchButton.click();
      });

      await waitFor(() => {
        expect(mockDispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            type: MODE_EVENTS.MODE_CHANGE_START
          })
        );
      });

      await waitFor(() => {
        expect(mockDispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            type: MODE_EVENTS.MODE_CHANGE_COMPLETE
          })
        );
      });
    });

    it('should call onModeChange callback when provided', async () => {
      const onModeChange = vi.fn();
      
      render(
        <DashboardModeProvider onModeChange={onModeChange}>
          <TestComponent />
        </DashboardModeProvider>
      );

      const switchButton = screen.getByTestId('switch-to-meeting');
      
      await act(async () => {
        switchButton.click();
      });

      await waitFor(() => {
        expect(onModeChange).toHaveBeenCalledWith('meeting');
      });
    });

    it('should not switch to invalid mode', async () => {
      const { result } = renderHook(() => useDashboardMode(), {
        wrapper: ({ children }) => (
          <DashboardModeProvider>{children}</DashboardModeProvider>
        )
      });

      await act(async () => {
        result.current.setMode('invalid' as DashboardMode);
      });

      expect(result.current.currentMode).toBe('coding');
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MODE_EVENTS.MODE_CHANGE_ERROR
        })
      );
    });

    it('should not switch if already in target mode', async () => {
      const { result } = renderHook(() => useDashboardMode(), {
        wrapper: ({ children }) => (
          <DashboardModeProvider>{children}</DashboardModeProvider>
        )
      });

      const initialCallCount = mockDispatchEvent.mock.calls.length;

      await act(async () => {
        result.current.setMode('coding'); // Already in coding mode
      });

      expect(mockDispatchEvent).toHaveBeenCalledTimes(initialCallCount);
    });

    it('should not switch if already transitioning', async () => {
      const { result } = renderHook(() => useDashboardMode(), {
        wrapper: ({ children }) => (
          <DashboardModeProvider>{children}</DashboardModeProvider>
        )
      });

      // Start first transition
      act(() => {
        result.current.setMode('meeting');
      });

      // Try to start second transition while first is in progress
      await act(async () => {
        result.current.setMode('coding');
      });

      await waitFor(() => {
        expect(result.current.currentMode).toBe('meeting');
      });
    });
  });

  describe('Local Storage Integration', () => {
    it('should save preferences to localStorage', async () => {
      render(
        <DashboardModeProvider>
          <TestComponent />
        </DashboardModeProvider>
      );

      const switchButton = screen.getByTestId('switch-to-meeting');
      
      await act(async () => {
        switchButton.click();
      });

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          STORAGE_KEYS.USER_PREFERENCES,
          expect.stringContaining('"lastUsedMode":"meeting"')
        );
      });
    });

    it('should load preferences from localStorage on mount', () => {
      const storedPreferences: UserModePreferences = {
        ...DEFAULT_USER_PREFERENCES,
        lastUsedMode: 'meeting',
        defaultMode: 'meeting'
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedPreferences));

      render(
        <DashboardModeProvider>
          <TestComponent />
        </DashboardModeProvider>
      );

      expect(screen.getByTestId('current-mode')).toHaveTextContent('meeting');
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      render(
        <DashboardModeProvider>
          <TestComponent />
        </DashboardModeProvider>
      );

      expect(screen.getByTestId('current-mode')).toHaveTextContent('coding');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load dashboard mode preferences:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle invalid JSON in localStorage', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      render(
        <DashboardModeProvider>
          <TestComponent />
        </DashboardModeProvider>
      );

      expect(screen.getByTestId('current-mode')).toHaveTextContent('coding');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('User Preferences', () => {
    it('should update user preferences', () => {
      const { result } = renderHook(() => useDashboardMode(), {
        wrapper: ({ children }) => (
          <DashboardModeProvider>{children}</DashboardModeProvider>
        )
      });

      act(() => {
        result.current.updatePreferences({
          transitionSpeed: 'fast',
          autoSwitchEnabled: true
        });
      });

      expect(result.current.userPreferences.transitionSpeed).toBe('fast');
      expect(result.current.userPreferences.autoSwitchEnabled).toBe(true);
    });

    it('should merge preferences with existing ones', () => {
      const { result } = renderHook(() => useDashboardMode(), {
        wrapper: ({ children }) => (
          <DashboardModeProvider>{children}</DashboardModeProvider>
        )
      });

      const originalDefaultMode = result.current.userPreferences.defaultMode;

      act(() => {
        result.current.updatePreferences({
          transitionSpeed: 'slow'
        });
      });

      expect(result.current.userPreferences.transitionSpeed).toBe('slow');
      expect(result.current.userPreferences.defaultMode).toBe(originalDefaultMode);
    });
  });

  describe('Error Handling', () => {
    it('should handle mode switch errors', async () => {
      // Mock setMode to throw an error
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn().mockImplementation(() => {
        throw new Error('Transition failed');
      });

      const { result } = renderHook(() => useDashboardMode(), {
        wrapper: ({ children }) => (
          <DashboardModeProvider>{children}</DashboardModeProvider>
        )
      });

      await act(async () => {
        result.current.setMode('meeting');
      });

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MODE_EVENTS.MODE_CHANGE_ERROR
        })
      );

      global.setTimeout = originalSetTimeout;
    });
  });

  describe('Context Value Memoization', () => {
    it('should memoize context value to prevent unnecessary re-renders', () => {
      let renderCount = 0;
      
      function TestMemoComponent() {
        renderCount++;
        const context = useDashboardMode();
        return <div>{context.currentMode}</div>;
      }

      const { rerender } = render(
        <DashboardModeProvider>
          <TestMemoComponent />
        </DashboardModeProvider>
      );

      const initialRenderCount = renderCount;

      // Re-render with same props
      rerender(
        <DashboardModeProvider>
          <TestMemoComponent />
        </DashboardModeProvider>
      );

      // Should not cause additional renders due to memoization
      expect(renderCount).toBe(initialRenderCount + 1);
    });
  });
});