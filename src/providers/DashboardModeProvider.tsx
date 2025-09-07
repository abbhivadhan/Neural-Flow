import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import {
  DashboardMode,
  DashboardModeContextType,
  DashboardModeProviderProps,
  DashboardModeState,
  DashboardModeActions,
  UserModePreferences,
  DashboardModeConfig,
  ModeChangeEvent
} from '../types/dashboard';
import {
  MODE_CONFIGS,
  DEFAULT_USER_PREFERENCES,
  AVAILABLE_MODES,
  ANIMATION_CONFIGS
} from '../config/dashboardModes';
import { STORAGE_KEYS, MODE_EVENTS } from '../constants/dashboardModes';

// Initial state
const initialState: DashboardModeState = {
  currentMode: 'coding',
  isTransitioning: false,
  transitionProgress: 0,
  modeConfigs: MODE_CONFIGS,
  userPreferences: DEFAULT_USER_PREFERENCES,
  widgetInstances: [],
  error: undefined
};

// Action types
type DashboardModeAction =
  | { type: 'SET_MODE'; payload: DashboardMode }
  | { type: 'SET_TRANSITIONING'; payload: boolean }
  | { type: 'SET_TRANSITION_PROGRESS'; payload: number }
  | { type: 'UPDATE_USER_PREFERENCES'; payload: Partial<UserModePreferences> }
  | { type: 'UPDATE_MODE_CONFIG'; payload: { mode: DashboardMode; config: Partial<DashboardModeConfig> } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_TO_DEFAULTS' }
  | { type: 'LOAD_PREFERENCES'; payload: UserModePreferences };

// Reducer function
function dashboardModeReducer(state: DashboardModeState, action: DashboardModeAction): DashboardModeState {
  switch (action.type) {
    case 'SET_MODE':
      return {
        ...state,
        currentMode: action.payload,
        error: undefined
      };

    case 'SET_TRANSITIONING':
      return {
        ...state,
        isTransitioning: action.payload,
        transitionProgress: action.payload ? 0 : 100
      };

    case 'SET_TRANSITION_PROGRESS':
      return {
        ...state,
        transitionProgress: Math.max(0, Math.min(100, action.payload))
      };

    case 'UPDATE_USER_PREFERENCES':
      return {
        ...state,
        userPreferences: {
          ...state.userPreferences,
          ...action.payload
        }
      };

    case 'UPDATE_MODE_CONFIG':
      return {
        ...state,
        modeConfigs: {
          ...state.modeConfigs,
          [action.payload.mode]: {
            ...state.modeConfigs[action.payload.mode],
            ...action.payload.config
          }
        }
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload || undefined,
        isTransitioning: false
      };

    case 'RESET_TO_DEFAULTS':
      return {
        ...initialState,
        userPreferences: DEFAULT_USER_PREFERENCES
      };

    case 'LOAD_PREFERENCES':
      return {
        ...state,
        userPreferences: action.payload,
        currentMode: action.payload.lastUsedMode || action.payload.defaultMode
      };

    default:
      return state;
  }
}

// Create context
const DashboardModeContext = createContext<DashboardModeContextType | undefined>(undefined);

// Storage utilities
const storageUtils = {
  savePreferences: (preferences: UserModePreferences): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save dashboard mode preferences:', error);
    }
  },

  loadPreferences: (): UserModePreferences | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate and merge with defaults
        return {
          ...DEFAULT_USER_PREFERENCES,
          ...parsed
        };
      }
    } catch (error) {
      console.warn('Failed to load dashboard mode preferences:', error);
    }
    return null;
  },

  isStorageAvailable: (): boolean => {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
};

// Event utilities
const eventUtils = {
  dispatchModeChangeEvent: (fromMode: DashboardMode, toMode: DashboardMode): void => {
    const event: ModeChangeEvent = {
      fromMode,
      toMode,
      timestamp: new Date(),
      trigger: 'user'
    };

    window.dispatchEvent(new CustomEvent(MODE_EVENTS.MODE_CHANGE_START, { detail: event }));
  },

  dispatchModeChangeComplete: (mode: DashboardMode): void => {
    window.dispatchEvent(new CustomEvent(MODE_EVENTS.MODE_CHANGE_COMPLETE, { detail: { mode } }));
  },

  dispatchModeChangeError: (error: string): void => {
    window.dispatchEvent(new CustomEvent(MODE_EVENTS.MODE_CHANGE_ERROR, { detail: { error } }));
  }
};

// Provider component
export function DashboardModeProvider({ 
  children, 
  initialMode,
  onModeChange 
}: DashboardModeProviderProps) {
  const [state, dispatch] = useReducer(dashboardModeReducer, initialState);

  // Load preferences on mount
  useEffect(() => {
    const loadStoredPreferences = () => {
      const storedPreferences = storageUtils.loadPreferences();
      if (storedPreferences) {
        dispatch({ type: 'LOAD_PREFERENCES', payload: storedPreferences });
      } else if (initialMode && AVAILABLE_MODES.includes(initialMode)) {
        // Use initial mode if provided and valid
        dispatch({ type: 'SET_MODE', payload: initialMode });
      }
    };

    loadStoredPreferences();
  }, [initialMode]);

  // Save preferences when they change
  useEffect(() => {
    if (storageUtils.isStorageAvailable()) {
      storageUtils.savePreferences(state.userPreferences);
    }
  }, [state.userPreferences]);

  // Mode switching logic with transition states
  const setMode = useCallback(async (newMode: DashboardMode) => {
    if (!AVAILABLE_MODES.includes(newMode)) {
      const error = `Invalid mode: ${newMode}`;
      dispatch({ type: 'SET_ERROR', payload: error });
      eventUtils.dispatchModeChangeError(error);
      return;
    }

    if (state.currentMode === newMode || state.isTransitioning) {
      return;
    }

    const fromMode = state.currentMode;

    try {
      // Start transition
      dispatch({ type: 'SET_TRANSITIONING', payload: true });
      eventUtils.dispatchModeChangeEvent(fromMode, newMode);

      // Get animation config based on user preference
      const animationConfig = ANIMATION_CONFIGS[state.userPreferences.transitionSpeed];
      const transitionDuration = animationConfig.duration;

      // Simulate transition progress
      const progressInterval = setInterval(() => {
        dispatch({ type: 'SET_TRANSITION_PROGRESS', payload: Math.random() * 100 });
      }, transitionDuration / 10);

      // Wait for transition duration
      await new Promise(resolve => setTimeout(resolve, transitionDuration));

      // Clear progress interval
      clearInterval(progressInterval);

      // Update mode and preferences
      dispatch({ type: 'SET_MODE', payload: newMode });
      dispatch({ 
        type: 'UPDATE_USER_PREFERENCES', 
        payload: { lastUsedMode: newMode } 
      });

      // End transition
      dispatch({ type: 'SET_TRANSITIONING', payload: false });
      dispatch({ type: 'SET_TRANSITION_PROGRESS', payload: 100 });

      // Notify completion
      eventUtils.dispatchModeChangeComplete(newMode);
      onModeChange?.(newMode);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during mode switch';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_TRANSITIONING', payload: false });
      eventUtils.dispatchModeChangeError(errorMessage);
    }
  }, [state.currentMode, state.isTransitioning, state.userPreferences.transitionSpeed, onModeChange]);

  // Update user preferences
  const updatePreferences = useCallback((preferences: Partial<UserModePreferences>) => {
    dispatch({ type: 'UPDATE_USER_PREFERENCES', payload: preferences });
  }, []);

  // Get current mode configuration
  const modeConfig = useMemo(() => {
    return state.modeConfigs[state.currentMode];
  }, [state.currentMode, state.modeConfigs]);

  // Context value
  const contextValue: DashboardModeContextType = useMemo(() => ({
    currentMode: state.currentMode,
    setMode,
    isTransitioning: state.isTransitioning,
    modeConfig,
    userPreferences: state.userPreferences,
    availableModes: AVAILABLE_MODES,
    updatePreferences
  }), [
    state.currentMode,
    state.isTransitioning,
    modeConfig,
    state.userPreferences,
    setMode,
    updatePreferences
  ]);

  return (
    <DashboardModeContext.Provider value={contextValue}>
      {children}
    </DashboardModeContext.Provider>
  );
}

// Hook to use dashboard mode context
export function useDashboardMode(): DashboardModeContextType {
  const context = useContext(DashboardModeContext);
  if (context === undefined) {
    throw new Error('useDashboardMode must be used within a DashboardModeProvider');
  }
  return context;
}

// Export context for testing
export { DashboardModeContext };