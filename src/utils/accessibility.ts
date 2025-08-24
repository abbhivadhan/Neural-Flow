/**
 * Accessibility utilities for Neural Flow
 * Provides comprehensive WCAG 2.1 AA compliance helpers
 */

export interface AccessibilityOptions {
  announceToScreenReader?: boolean;
  focusManagement?: boolean;
  keyboardNavigation?: boolean;
  highContrast?: boolean;
  reducedMotion?: boolean;
}

/**
 * Screen reader announcement utility
 */
export class ScreenReaderAnnouncer {
  private static instance: ScreenReaderAnnouncer;
  private announceElement: HTMLElement | null = null;

  static getInstance(): ScreenReaderAnnouncer {
    if (!ScreenReaderAnnouncer.instance) {
      ScreenReaderAnnouncer.instance = new ScreenReaderAnnouncer();
    }
    return ScreenReaderAnnouncer.instance;
  }

  private constructor() {
    this.createAnnounceElement();
  }

  private createAnnounceElement(): void {
    if (typeof window === 'undefined') return;

    this.announceElement = document.createElement('div');
    this.announceElement.setAttribute('aria-live', 'polite');
    this.announceElement.setAttribute('aria-atomic', 'true');
    this.announceElement.className = 'sr-only';
    this.announceElement.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    document.body.appendChild(this.announceElement);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.announceElement) return;

    this.announceElement.setAttribute('aria-live', priority);
    this.announceElement.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (this.announceElement) {
        this.announceElement.textContent = '';
      }
    }, 1000);
  }
}

/**
 * Focus management utilities
 */
export class FocusManager {
  private static focusStack: HTMLElement[] = [];

  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  static saveFocus(): void {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      this.focusStack.push(activeElement);
    }
  }

  static restoreFocus(): void {
    const element = this.focusStack.pop();
    if (element && element.focus) {
      element.focus();
    }
  }

  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
  }
}

/**
 * Keyboard navigation utilities
 */
export class KeyboardNavigation {
  static handleArrowNavigation(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    onNavigate: (index: number) => void
  ): void {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        newIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
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

    onNavigate(newIndex);
    items[newIndex]?.focus();
  }

  static handleEscapeKey(event: KeyboardEvent, onEscape: () => void): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      onEscape();
    }
  }
}

/**
 * Color contrast utilities
 */
export class ColorContrast {
  static getContrastRatio(color1: string, color2: string): number {
    const luminance1 = this.getLuminance(color1);
    const luminance2 = this.getLuminance(color2);
    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  static meetsWCAGAA(foreground: string, background: string): boolean {
    return this.getContrastRatio(foreground, background) >= 4.5;
  }

  static meetsWCAGAAA(foreground: string, background: string): boolean {
    return this.getContrastRatio(foreground, background) >= 7;
  }

  private static getLuminance(color: string): number {
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;

    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * (r || 0) + 0.7152 * (g || 0) + 0.0722 * (b || 0);
  }

  private static hexToRgb(hex: string): [number, number, number] | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1] || '0', 16),
          parseInt(result[2] || '0', 16),
          parseInt(result[3] || '0', 16)
        ]
      : null;
  }
}

/**
 * Motion preferences utilities
 */
export class MotionPreferences {
  static prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  static respectMotionPreferences(element: HTMLElement): void {
    if (this.prefersReducedMotion()) {
      element.style.animation = 'none';
      element.style.transition = 'none';
    }
  }
}

/**
 * Touch gesture utilities for mobile accessibility
 */
export class TouchGestures {
  static addSwipeGesture(
    element: HTMLElement,
    onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void,
    threshold: number = 50
  ): () => void {
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches[0]) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches[0]) {
        endX = e.changedTouches[0].clientX;
        endY = e.changedTouches[0].clientY;
      }

      const deltaX = endX - startX;
      const deltaY = endY - startY;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > threshold) {
          onSwipe(deltaX > 0 ? 'right' : 'left');
        }
      } else {
        if (Math.abs(deltaY) > threshold) {
          onSwipe(deltaY > 0 ? 'down' : 'up');
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }
}

/**
 * ARIA utilities
 */
export class AriaUtils {
  static generateId(prefix: string = 'neural'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static setAriaExpanded(element: HTMLElement, expanded: boolean): void {
    element.setAttribute('aria-expanded', expanded.toString());
  }

  static setAriaSelected(element: HTMLElement, selected: boolean): void {
    element.setAttribute('aria-selected', selected.toString());
  }

  static setAriaPressed(element: HTMLElement, pressed: boolean): void {
    element.setAttribute('aria-pressed', pressed.toString());
  }

  static setAriaChecked(element: HTMLElement, checked: boolean | 'mixed'): void {
    element.setAttribute('aria-checked', checked.toString());
  }

  static setAriaHidden(element: HTMLElement, hidden: boolean): void {
    element.setAttribute('aria-hidden', hidden.toString());
  }

  static setAriaLabel(element: HTMLElement, label: string): void {
    element.setAttribute('aria-label', label);
  }

  static setAriaDescribedBy(element: HTMLElement, describedBy: string): void {
    element.setAttribute('aria-describedby', describedBy);
  }

  static setAriaLabelledBy(element: HTMLElement, labelledBy: string): void {
    element.setAttribute('aria-labelledby', labelledBy);
  }
}

/**
 * High contrast mode detection
 */
export class HighContrastMode {
  static isHighContrastMode(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Check for Windows high contrast mode
    const testElement = document.createElement('div');
    testElement.style.cssText = `
      position: absolute;
      top: -9999px;
      background-color: canvas;
      color: canvasText;
    `;
    document.body.appendChild(testElement);
    
    const computedStyle = window.getComputedStyle(testElement);
    const isHighContrast = computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
                          computedStyle.backgroundColor !== 'transparent';
    
    document.body.removeChild(testElement);
    return isHighContrast;
  }

  static addHighContrastStyles(): void {
    if (!this.isHighContrastMode()) return;

    const style = document.createElement('style');
    style.textContent = `
      .neural-card {
        border: 2px solid !important;
      }
      
      .neural-button {
        border: 2px solid !important;
      }
      
      .neural-input {
        border: 2px solid !important;
      }
      
      :focus {
        outline: 3px solid !important;
        outline-offset: 2px !important;
      }
    `;
    document.head.appendChild(style);
  }
}