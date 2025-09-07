/**
 * Haptic Feedback System for Neural Flow
 * Provides tactile feedback for enhanced user experience on supported devices
 */

export interface HapticPattern {
  duration: number;
  intensity?: number;
  delay?: number;
}

export interface HapticConfig {
  pattern?: HapticPattern[];
  intensity?: number;
  duration?: number;
}

export class HapticFeedbackManager {
  private isSupported: boolean = false;
  private isEnabled: boolean = true;

  constructor() {
    this.checkSupport();
  }

  private checkSupport() {
    // Check for Vibration API support
    this.isSupported = 'vibrate' in navigator;
  }

  public isHapticSupported(): boolean {
    return this.isSupported;
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public isHapticEnabled(): boolean {
    return this.isEnabled && this.isSupported;
  }

  private vibrate(pattern: number | number[]) {
    if (!this.isHapticEnabled()) return;

    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('Haptic feedback error:', error);
    }
  }

  // Predefined haptic patterns
  public light() {
    this.vibrate(10);
  }

  public medium() {
    this.vibrate(25);
  }

  public heavy() {
    this.vibrate(50);
  }

  public click() {
    this.vibrate([10, 10, 10]);
  }

  public doubleClick() {
    this.vibrate([15, 50, 15]);
  }

  public success() {
    this.vibrate([25, 50, 25, 50, 50]);
  }

  public error() {
    this.vibrate([100, 50, 100, 50, 100]);
  }

  public notification() {
    this.vibrate([50, 100, 50]);
  }

  public heartbeat() {
    this.vibrate([25, 25, 25, 100, 50, 25, 25, 25]);
  }

  public pulse() {
    this.vibrate([30, 70, 30, 70, 30]);
  }

  public wave() {
    this.vibrate([10, 20, 30, 40, 50, 40, 30, 20, 10]);
  }

  public neural() {
    // Simulate neural activity with rapid, varied pulses
    this.vibrate([5, 10, 8, 15, 12, 20, 15, 10, 8, 5]);
  }

  public processing() {
    // Continuous processing feedback
    this.vibrate([20, 30, 20, 30, 20, 30]);
  }

  public transition() {
    // Smooth transition feedback
    this.vibrate([15, 25, 35, 25, 15]);
  }

  public customPattern(config: HapticConfig) {
    if (!this.isHapticEnabled()) return;

    if (config.pattern) {
      const vibratePattern: number[] = [];
      
      config.pattern.forEach((haptic, index) => {
        if (index > 0 && haptic.delay) {
          vibratePattern.push(haptic.delay);
        }
        vibratePattern.push(haptic.duration);
      });

      this.vibrate(vibratePattern);
    } else if (config.duration) {
      this.vibrate(config.duration);
    }
  }

  // Advanced haptic patterns for specific UI interactions
  public buttonPress() {
    this.vibrate(15);
  }

  public buttonRelease() {
    this.vibrate(8);
  }

  public swipeStart() {
    this.vibrate(12);
  }

  public swipeEnd() {
    this.vibrate(20);
  }

  public dragStart() {
    this.vibrate([10, 5, 10]);
  }

  public dragEnd() {
    this.vibrate([20, 10, 5]);
  }

  public selectionStart() {
    this.vibrate(18);
  }

  public selectionEnd() {
    this.vibrate([25, 15]);
  }

  public menuOpen() {
    this.vibrate([15, 10, 20]);
  }

  public menuClose() {
    this.vibrate([20, 10, 15]);
  }

  public tabSwitch() {
    this.vibrate([12, 8, 12]);
  }

  public modalOpen() {
    this.vibrate([20, 15, 25]);
  }

  public modalClose() {
    this.vibrate([25, 15, 20]);
  }

  public aiThinking() {
    // Simulate AI processing with rhythmic pulses
    const pattern = [];
    for (let i = 0; i < 5; i++) {
      pattern.push(8, 12, 15, 12, 8, 50);
    }
    this.vibrate(pattern);
  }

  public aiComplete() {
    this.vibrate([30, 20, 40, 20, 50]);
  }

  public workspaceChange() {
    this.vibrate([25, 15, 25, 15, 35]);
  }

  public taskComplete() {
    this.vibrate([40, 30, 40, 30, 60]);
  }

  public focusMode() {
    this.vibrate([50, 100, 50]);
  }

  public breakTime() {
    this.vibrate([30, 50, 30, 50, 30, 50]);
  }

  // Contextual haptic feedback based on user actions
  public contextualFeedback(action: string, intensity: 'light' | 'medium' | 'heavy' = 'medium') {
    const intensityMap = {
      light: 0.5,
      medium: 1.0,
      heavy: 1.5
    };

    const multiplier = intensityMap[intensity];

    switch (action) {
      case 'hover':
        this.vibrate(Math.round(8 * multiplier));
        break;
      case 'click':
        this.vibrate(Math.round(15 * multiplier));
        break;
      case 'longPress':
        this.vibrate(Math.round(40 * multiplier));
        break;
      case 'swipe':
        this.vibrate([
          Math.round(12 * multiplier),
          Math.round(8 * multiplier),
          Math.round(20 * multiplier)
        ]);
        break;
      case 'pinch':
        this.vibrate([
          Math.round(10 * multiplier),
          Math.round(5 * multiplier),
          Math.round(10 * multiplier),
          Math.round(5 * multiplier),
          Math.round(15 * multiplier)
        ]);
        break;
      case 'rotate':
        this.vibrate([
          Math.round(8 * multiplier),
          Math.round(12 * multiplier),
          Math.round(16 * multiplier),
          Math.round(12 * multiplier),
          Math.round(8 * multiplier)
        ]);
        break;
      default:
        this.vibrate(Math.round(15 * multiplier));
    }
  }
}

// Global haptic feedback manager instance
export const hapticFeedback = new HapticFeedbackManager();

// React hook for haptic feedback
export const useHapticFeedback = () => {
  return {
    isSupported: hapticFeedback.isHapticSupported(),
    isEnabled: hapticFeedback.isHapticEnabled(),
    setEnabled: hapticFeedback.setEnabled.bind(hapticFeedback),
    
    // Basic patterns
    light: hapticFeedback.light.bind(hapticFeedback),
    medium: hapticFeedback.medium.bind(hapticFeedback),
    heavy: hapticFeedback.heavy.bind(hapticFeedback),
    
    // Interaction patterns
    click: hapticFeedback.click.bind(hapticFeedback),
    doubleClick: hapticFeedback.doubleClick.bind(hapticFeedback),
    success: hapticFeedback.success.bind(hapticFeedback),
    error: hapticFeedback.error.bind(hapticFeedback),
    notification: hapticFeedback.notification.bind(hapticFeedback),
    
    // Neural Flow specific patterns
    neural: hapticFeedback.neural.bind(hapticFeedback),
    processing: hapticFeedback.processing.bind(hapticFeedback),
    transition: hapticFeedback.transition.bind(hapticFeedback),
    aiThinking: hapticFeedback.aiThinking.bind(hapticFeedback),
    aiComplete: hapticFeedback.aiComplete.bind(hapticFeedback),
    
    // UI interaction patterns
    buttonPress: hapticFeedback.buttonPress.bind(hapticFeedback),
    buttonRelease: hapticFeedback.buttonRelease.bind(hapticFeedback),
    menuOpen: hapticFeedback.menuOpen.bind(hapticFeedback),
    menuClose: hapticFeedback.menuClose.bind(hapticFeedback),
    modalOpen: hapticFeedback.modalOpen.bind(hapticFeedback),
    modalClose: hapticFeedback.modalClose.bind(hapticFeedback),
    
    // Contextual feedback
    contextualFeedback: hapticFeedback.contextualFeedback.bind(hapticFeedback),
    customPattern: hapticFeedback.customPattern.bind(hapticFeedback)
  };
};