import { 
  InputMode, 
  InteractionContext, 
  // EnvironmentalFactors, 
  AccessibilityRequirement,
  NoiseLevel,
  LightingCondition,
  DeviceType,
  WorkMode
} from '../../types/interaction';

interface InputMethodCapability {
  mode: InputMode;
  isAvailable: boolean;
  reliability: number;
  efficiency: number;
  accessibility: number;
  environmentalSuitability: number;
}

interface InputMethodPreferences {
  preferredModes: InputMode[];
  fallbackModes: InputMode[];
  disabledModes: InputMode[];
  adaptiveEnabled: boolean;
  accessibilityRequirements: AccessibilityRequirement[];
}

interface ContextualRule {
  condition: (context: InteractionContext) => boolean;
  recommendedModes: InputMode[];
  priority: number;
  reason: string;
}

export class InputMethodManager {
  private currentMode: InputMode = InputMode.KEYBOARD;
  private availableModes: InputMode[] = [];
  private preferences: InputMethodPreferences;
  private contextualRules: ContextualRule[] = [];
  private onModeChangeCallback?: (mode: InputMode, reason: string) => void;
  private adaptationHistory: Array<{
    context: InteractionContext;
    selectedMode: InputMode;
    timestamp: Date;
    effectiveness: number;
  }> = [];

  constructor(preferences?: Partial<InputMethodPreferences>) {
    this.preferences = {
      preferredModes: [InputMode.KEYBOARD, InputMode.MOUSE, InputMode.VOICE],
      fallbackModes: [InputMode.KEYBOARD, InputMode.MOUSE],
      disabledModes: [],
      adaptiveEnabled: true,
      accessibilityRequirements: [],
      ...preferences
    };

    this.initializeContextualRules();
    this.detectAvailableModes();
  }

  private initializeContextualRules(): void {
    this.contextualRules = [
      // Meeting/Call Context
      {
        condition: (ctx) => ctx.environmentalFactors.isInMeeting,
        recommendedModes: [InputMode.GESTURE, InputMode.TOUCH, InputMode.KEYBOARD],
        priority: 10,
        reason: 'In meeting - avoiding voice to prevent disruption'
      },

      // High Noise Environment
      {
        condition: (ctx) => ctx.environmentalFactors.noiseLevel === NoiseLevel.LOUD || 
                           ctx.environmentalFactors.noiseLevel === NoiseLevel.VERY_LOUD,
        recommendedModes: [InputMode.KEYBOARD, InputMode.MOUSE, InputMode.TOUCH, InputMode.GESTURE],
        priority: 8,
        reason: 'High noise environment - voice recognition may be unreliable'
      },

      // Low Light Conditions
      {
        condition: (ctx) => ctx.environmentalFactors.lightingCondition === LightingCondition.DIM ||
                           ctx.environmentalFactors.lightingCondition === LightingCondition.DARK,
        recommendedModes: [InputMode.VOICE, InputMode.KEYBOARD],
        priority: 6,
        reason: 'Low light conditions - gesture recognition may be impaired'
      },

      // Mobile Device
      {
        condition: (ctx) => ctx.environmentalFactors.deviceType === DeviceType.MOBILE ||
                           ctx.environmentalFactors.deviceType === DeviceType.TABLET,
        recommendedModes: [InputMode.TOUCH, InputMode.VOICE, InputMode.GESTURE],
        priority: 7,
        reason: 'Mobile device - touch and voice are more suitable'
      },

      // Focus Work Mode
      {
        condition: (ctx) => ctx.workContext.workMode === WorkMode.FOCUS,
        recommendedModes: [InputMode.KEYBOARD, InputMode.MOUSE],
        priority: 5,
        reason: 'Focus mode - traditional input methods for minimal distraction'
      },

      // Creative Work Mode
      {
        condition: (ctx) => ctx.workContext.workMode === WorkMode.CREATIVE,
        recommendedModes: [InputMode.GESTURE, InputMode.VOICE, InputMode.TOUCH],
        priority: 5,
        reason: 'Creative mode - natural input methods for better flow'
      },

      // Collaboration Mode
      {
        condition: (ctx) => ctx.workContext.workMode === WorkMode.COLLABORATION,
        recommendedModes: [InputMode.VOICE, InputMode.GESTURE, InputMode.TOUCH],
        priority: 6,
        reason: 'Collaboration mode - natural interaction methods'
      },

      // Accessibility Requirements
      {
        condition: (_ctx) => this.preferences.accessibilityRequirements.includes(AccessibilityRequirement.VOICE_ONLY),
        recommendedModes: [InputMode.VOICE],
        priority: 15,
        reason: 'Voice-only accessibility requirement'
      },
      {
        condition: (_ctx) => this.preferences.accessibilityRequirements.includes(AccessibilityRequirement.GESTURE_ONLY),
        recommendedModes: [InputMode.GESTURE],
        priority: 15,
        reason: 'Gesture-only accessibility requirement'
      },
      {
        condition: (_ctx) => this.preferences.accessibilityRequirements.includes(AccessibilityRequirement.KEYBOARD_ONLY),
        recommendedModes: [InputMode.KEYBOARD],
        priority: 15,
        reason: 'Keyboard-only accessibility requirement'
      }
    ];
  }

  private detectAvailableModes(): void {
    this.availableModes = [];

    // Always available
    this.availableModes.push(InputMode.KEYBOARD, InputMode.MOUSE);

    // Touch support
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      this.availableModes.push(InputMode.TOUCH);
    }

    // Voice support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      this.availableModes.push(InputMode.VOICE);
    }

    // Gesture support (requires camera)
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      this.availableModes.push(InputMode.GESTURE);
    }

    // Eye tracking (experimental)
    if ('EyeDropper' in window) { // Using this as a proxy for advanced browser features
      this.availableModes.push(InputMode.EYE_TRACKING);
    }
  }

  public adaptInputMethod(context: InteractionContext): InputMode {
    if (!this.preferences.adaptiveEnabled) {
      return this.currentMode;
    }

    const capabilities = this.evaluateInputCapabilities(context);
    const recommendedMode = this.selectOptimalMode(capabilities, context);

    if (recommendedMode !== this.currentMode) {
      const reason = this.getAdaptationReason(context, recommendedMode);
      this.switchToMode(recommendedMode, reason);
    }

    return recommendedMode;
  }

  private evaluateInputCapabilities(context: InteractionContext): InputMethodCapability[] {
    return this.availableModes.map(mode => ({
      mode,
      isAvailable: this.isModeAvailable(mode),
      reliability: this.calculateReliability(mode, context),
      efficiency: this.calculateEfficiency(mode, context),
      accessibility: this.calculateAccessibility(mode, context),
      environmentalSuitability: this.calculateEnvironmentalSuitability(mode, context)
    }));
  }

  private isModeAvailable(mode: InputMode): boolean {
    return this.availableModes.includes(mode) && 
           !this.preferences.disabledModes.includes(mode);
  }

  private calculateReliability(mode: InputMode, context: InteractionContext): number {
    const factors = context.environmentalFactors;
    
    switch (mode) {
      case InputMode.VOICE:
        if (factors.noiseLevel === NoiseLevel.LOUD || factors.noiseLevel === NoiseLevel.VERY_LOUD) {
          return 0.3;
        }
        if (factors.isInMeeting) return 0.1;
        return 0.85;

      case InputMode.GESTURE:
        if (factors.lightingCondition === LightingCondition.DIM || 
            factors.lightingCondition === LightingCondition.DARK) {
          return 0.4;
        }
        return 0.75;

      case InputMode.TOUCH:
        if (factors.deviceType === DeviceType.DESKTOP) return 0.3;
        return 0.9;

      case InputMode.KEYBOARD:
      case InputMode.MOUSE:
        return 0.95;

      default:
        return 0.5;
    }
  }

  private calculateEfficiency(mode: InputMode, context: InteractionContext): number {
    const workMode = context.workContext.workMode;
    
    const efficiencyMatrix = {
      [WorkMode.FOCUS]: {
        [InputMode.KEYBOARD]: 0.9,
        [InputMode.MOUSE]: 0.85,
        [InputMode.VOICE]: 0.6,
        [InputMode.GESTURE]: 0.5,
        [InputMode.TOUCH]: 0.7,
        [InputMode.EYE_TRACKING]: 0.4
      },
      [WorkMode.CREATIVE]: {
        [InputMode.GESTURE]: 0.9,
        [InputMode.VOICE]: 0.85,
        [InputMode.TOUCH]: 0.8,
        [InputMode.KEYBOARD]: 0.7,
        [InputMode.MOUSE]: 0.6,
        [InputMode.EYE_TRACKING]: 0.5
      },
      [WorkMode.COLLABORATION]: {
        [InputMode.VOICE]: 0.9,
        [InputMode.GESTURE]: 0.85,
        [InputMode.TOUCH]: 0.75,
        [InputMode.KEYBOARD]: 0.6,
        [InputMode.MOUSE]: 0.5,
        [InputMode.EYE_TRACKING]: 0.3
      },
      [WorkMode.RESEARCH]: {
        [InputMode.KEYBOARD]: 0.85,
        [InputMode.MOUSE]: 0.9,
        [InputMode.VOICE]: 0.7,
        [InputMode.TOUCH]: 0.6,
        [InputMode.GESTURE]: 0.5,
        [InputMode.EYE_TRACKING]: 0.6
      },
      [WorkMode.ADMINISTRATIVE]: {
        [InputMode.KEYBOARD]: 0.9,
        [InputMode.MOUSE]: 0.85,
        [InputMode.VOICE]: 0.75,
        [InputMode.TOUCH]: 0.6,
        [InputMode.GESTURE]: 0.4,
        [InputMode.EYE_TRACKING]: 0.3
      }
    };

    return efficiencyMatrix[workMode]?.[mode] || 0.5;
  }

  private calculateAccessibility(mode: InputMode, _context: InteractionContext): number {
    const requirements = this.preferences.accessibilityRequirements;
    
    if (requirements.includes(AccessibilityRequirement.VOICE_ONLY)) {
      return mode === InputMode.VOICE ? 1.0 : 0.0;
    }
    
    if (requirements.includes(AccessibilityRequirement.GESTURE_ONLY)) {
      return mode === InputMode.GESTURE ? 1.0 : 0.0;
    }
    
    if (requirements.includes(AccessibilityRequirement.KEYBOARD_ONLY)) {
      return mode === InputMode.KEYBOARD ? 1.0 : 0.0;
    }

    // Default accessibility scores
    const accessibilityScores = {
      [InputMode.KEYBOARD]: 0.9,
      [InputMode.VOICE]: 0.85,
      [InputMode.MOUSE]: 0.8,
      [InputMode.TOUCH]: 0.75,
      [InputMode.GESTURE]: 0.7,
      [InputMode.EYE_TRACKING]: 0.6
    };

    return accessibilityScores[mode] || 0.5;
  }

  private calculateEnvironmentalSuitability(mode: InputMode, context: InteractionContext): number {
    const factors = context.environmentalFactors;
    let score = 1.0;

    // Adjust based on environmental factors
    if (mode === InputMode.VOICE && factors.isInMeeting) score *= 0.1;
    if (mode === InputMode.VOICE && factors.noiseLevel === NoiseLevel.LOUD) score *= 0.3;
    if (mode === InputMode.GESTURE && factors.lightingCondition === LightingCondition.DARK) score *= 0.2;
    if (mode === InputMode.TOUCH && factors.deviceType === DeviceType.DESKTOP) score *= 0.3;

    return Math.max(score, 0.1);
  }

  private selectOptimalMode(capabilities: InputMethodCapability[], context: InteractionContext): InputMode {
    // Apply contextual rules first
    const applicableRules = this.contextualRules
      .filter(rule => rule.condition(context))
      .sort((a, b) => b.priority - a.priority);

    if (applicableRules.length > 0) {
      const topRule = applicableRules[0];
      if (topRule) {
        const availableFromRule = topRule.recommendedModes.filter(mode => 
          capabilities.find(cap => cap.mode === mode && cap.isAvailable)
        );
        
        if (availableFromRule.length > 0) {
          return availableFromRule[0];
        }
      }
    }

    // Calculate overall scores for available modes
    const scoredModes = capabilities
      .filter(cap => cap.isAvailable)
      .map(cap => ({
        mode: cap.mode,
        score: this.calculateOverallScore(cap, context)
      }))
      .sort((a, b) => b.score - a.score);

    // Consider user preferences
    const preferredAvailable = scoredModes.filter(sm => 
      this.preferences.preferredModes.includes(sm.mode)
    );

    if (preferredAvailable.length > 0 && preferredAvailable[0]) {
      return preferredAvailable[0].mode;
    }

    return scoredModes.length > 0 && scoredModes[0] ? scoredModes[0].mode : InputMode.KEYBOARD;
  }

  private calculateOverallScore(capability: InputMethodCapability, _context: InteractionContext): number {
    const weights = {
      reliability: 0.3,
      efficiency: 0.25,
      accessibility: 0.25,
      environmentalSuitability: 0.2
    };

    return (
      capability.reliability * weights.reliability +
      capability.efficiency * weights.efficiency +
      capability.accessibility * weights.accessibility +
      capability.environmentalSuitability * weights.environmentalSuitability
    );
  }

  private getAdaptationReason(context: InteractionContext, selectedMode: InputMode): string {
    const applicableRules = this.contextualRules
      .filter(rule => rule.condition(context) && rule.recommendedModes.includes(selectedMode))
      .sort((a, b) => b.priority - a.priority);

    if (applicableRules.length > 0 && applicableRules[0]) {
      return applicableRules[0].reason;
    }

    return `Optimal mode based on current context and preferences`;
  }

  private switchToMode(mode: InputMode, reason: string): void {
    const previousMode = this.currentMode;
    this.currentMode = mode;
    
    // Record adaptation for learning
    this.recordAdaptation(mode, reason);
    
    // Notify listeners
    this.onModeChangeCallback?.(mode, reason);
    
    console.log(`Input method switched from ${previousMode} to ${mode}: ${reason}`);
  }

  private recordAdaptation(mode: InputMode, _reason: string): void {
    // This would be enhanced with actual effectiveness measurement
    this.adaptationHistory.push({
      context: {} as InteractionContext, // Would store actual context
      selectedMode: mode,
      timestamp: new Date(),
      effectiveness: 0.8 // Placeholder - would be measured based on user interaction
    });

    // Keep history manageable
    if (this.adaptationHistory.length > 100) {
      this.adaptationHistory.shift();
    }
  }

  // Public API methods
  public getCurrentMode(): InputMode {
    return this.currentMode;
  }

  public getAvailableModes(): InputMode[] {
    return [...this.availableModes];
  }

  public setPreferences(preferences: Partial<InputMethodPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
  }

  public getPreferences(): InputMethodPreferences {
    return { ...this.preferences };
  }

  public onModeChange(callback: (mode: InputMode, reason: string) => void): void {
    this.onModeChangeCallback = callback;
  }

  public forceMode(mode: InputMode, reason?: string): boolean {
    if (!this.isModeAvailable(mode)) {
      return false;
    }

    this.switchToMode(mode, reason || 'Manually forced');
    return true;
  }

  public addContextualRule(rule: ContextualRule): void {
    this.contextualRules.push(rule);
    this.contextualRules.sort((a, b) => b.priority - a.priority);
  }

  public removeContextualRule(condition: (context: InteractionContext) => boolean): void {
    this.contextualRules = this.contextualRules.filter(rule => rule.condition !== condition);
  }

  public getAdaptationHistory(): Array<{
    context: InteractionContext;
    selectedMode: InputMode;
    timestamp: Date;
    effectiveness: number;
  }> {
    return [...this.adaptationHistory];
  }

  public getRecommendedMode(context: InteractionContext): {
    mode: InputMode;
    reason: string;
    confidence: number;
  } {
    const capabilities = this.evaluateInputCapabilities(context);
    const recommendedMode = this.selectOptimalMode(capabilities, context);
    const reason = this.getAdaptationReason(context, recommendedMode);
    
    const capability = capabilities.find(cap => cap.mode === recommendedMode);
    const confidence = capability ? this.calculateOverallScore(capability, context) : 0.5;

    return {
      mode: recommendedMode,
      reason,
      confidence
    };
  }
}