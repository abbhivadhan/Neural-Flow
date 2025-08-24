import { useEffect, useRef, useCallback } from 'react';
import {
  ScreenReaderAnnouncer,
  FocusManager,
  KeyboardNavigation,
  MotionPreferences,
  TouchGestures,
  AriaUtils,
  HighContrastMode,
} from '../utils/accessibility';

export interface UseAccessibilityOptions {
  announceChanges?: boolean;
  manageFocus?: boolean;
  trapFocus?: boolean;
  keyboardNavigation?: boolean;
  touchGestures?: boolean;
  respectMotionPreferences?: boolean;
}

export function useAccessibility(options: UseAccessibilityOptions = {}) {
  const elementRef = useRef<HTMLElement>(null);
  const announcer = ScreenReaderAnnouncer.getInstance();

  // Screen reader announcements
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (options.announceChanges !== false) {
      announcer.announce(message, priority);
    }
  }, [options.announceChanges, announcer]);

  // Focus management
  const saveFocus = useCallback(() => {
    if (options.manageFocus !== false) {
      FocusManager.saveFocus();
    }
  }, [options.manageFocus]);

  const restoreFocus = useCallback(() => {
    if (options.manageFocus !== false) {
      FocusManager.restoreFocus();
    }
  }, [options.manageFocus]);

  const trapFocus = useCallback(() => {
    if (options.trapFocus && elementRef.current) {
      return FocusManager.trapFocus(elementRef.current);
    }
    return () => {};
  }, [options.trapFocus]);

  // Keyboard navigation
  const handleArrowNavigation = useCallback((
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    onNavigate: (index: number) => void
  ) => {
    if (options.keyboardNavigation !== false) {
      KeyboardNavigation.handleArrowNavigation(event, items, currentIndex, onNavigate);
    }
  }, [options.keyboardNavigation]);

  const handleEscapeKey = useCallback((event: KeyboardEvent, onEscape: () => void) => {
    if (options.keyboardNavigation !== false) {
      KeyboardNavigation.handleEscapeKey(event, onEscape);
    }
  }, [options.keyboardNavigation]);

  // Touch gestures
  const addSwipeGesture = useCallback((
    element: HTMLElement,
    onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void,
    threshold?: number
  ) => {
    if (options.touchGestures !== false) {
      return TouchGestures.addSwipeGesture(element, onSwipe, threshold);
    }
    return () => {};
  }, [options.touchGestures]);

  // Motion preferences
  useEffect(() => {
    if (options.respectMotionPreferences !== false && elementRef.current) {
      MotionPreferences.respectMotionPreferences(elementRef.current);
    }
  }, [options.respectMotionPreferences]);

  // High contrast mode
  useEffect(() => {
    HighContrastMode.addHighContrastStyles();
  }, []);

  return {
    elementRef,
    announce,
    saveFocus,
    restoreFocus,
    trapFocus,
    handleArrowNavigation,
    handleEscapeKey,
    addSwipeGesture,
    generateId: AriaUtils.generateId,
    setAriaExpanded: AriaUtils.setAriaExpanded,
    setAriaSelected: AriaUtils.setAriaSelected,
    setAriaPressed: AriaUtils.setAriaPressed,
    setAriaChecked: AriaUtils.setAriaChecked,
    setAriaHidden: AriaUtils.setAriaHidden,
    setAriaLabel: AriaUtils.setAriaLabel,
    setAriaDescribedBy: AriaUtils.setAriaDescribedBy,
    setAriaLabelledBy: AriaUtils.setAriaLabelledBy,
  };
}

export function useKeyboardNavigation(
  items: HTMLElement[],
  initialIndex: number = 0,
  options: {
    loop?: boolean;
    orientation?: 'horizontal' | 'vertical' | 'both';
    onNavigate?: (index: number) => void;
  } = {}
) {
  const { loop = true, orientation = 'both', onNavigate } = options;
  const currentIndexRef = useRef(initialIndex);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (items.length === 0) return;

    let newIndex = currentIndexRef.current;
    const isHorizontal = orientation === 'horizontal' || orientation === 'both';
    const isVertical = orientation === 'vertical' || orientation === 'both';

    switch (event.key) {
      case 'ArrowRight':
        if (isHorizontal) {
          event.preventDefault();
          newIndex = loop ? (currentIndexRef.current + 1) % items.length 
                          : Math.min(currentIndexRef.current + 1, items.length - 1);
        }
        break;
      case 'ArrowLeft':
        if (isHorizontal) {
          event.preventDefault();
          newIndex = loop ? (currentIndexRef.current - 1 + items.length) % items.length 
                          : Math.max(currentIndexRef.current - 1, 0);
        }
        break;
      case 'ArrowDown':
        if (isVertical) {
          event.preventDefault();
          newIndex = loop ? (currentIndexRef.current + 1) % items.length 
                          : Math.min(currentIndexRef.current + 1, items.length - 1);
        }
        break;
      case 'ArrowUp':
        if (isVertical) {
          event.preventDefault();
          newIndex = loop ? (currentIndexRef.current - 1 + items.length) % items.length 
                          : Math.max(currentIndexRef.current - 1, 0);
        }
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;
      default:
        return;
    }

    if (newIndex !== currentIndexRef.current) {
      currentIndexRef.current = newIndex;
      items[newIndex]?.focus();
      onNavigate?.(newIndex);
    }
  }, [items, loop, orientation, onNavigate]);

  return {
    currentIndex: currentIndexRef.current,
    handleKeyDown,
    setCurrentIndex: (index: number) => {
      currentIndexRef.current = index;
      items[index]?.focus();
      onNavigate?.(index);
    },
  };
}

export function useFocusTrap(active: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const cleanup = FocusManager.trapFocus(containerRef.current);
    return cleanup;
  }, [active]);

  return containerRef;
}

export function useAnnouncements() {
  const announcer = ScreenReaderAnnouncer.getInstance();

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announcer.announce(message, priority);
  }, [announcer]);

  const announceNavigation = useCallback((destination: string) => {
    announce(`Navigated to ${destination}`, 'polite');
  }, [announce]);

  const announceAction = useCallback((action: string) => {
    announce(`${action} completed`, 'polite');
  }, [announce]);

  const announceError = useCallback((error: string) => {
    announce(`Error: ${error}`, 'assertive');
  }, [announce]);

  const announceSuccess = useCallback((message: string) => {
    announce(`Success: ${message}`, 'polite');
  }, [announce]);

  return {
    announce,
    announceNavigation,
    announceAction,
    announceError,
    announceSuccess,
  };
}