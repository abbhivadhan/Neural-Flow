import { VoiceCommandService } from './VoiceCommandService';
import { GestureRecognitionService } from './GestureRecognitionService';
import { NaturalLanguageProcessor } from './NaturalLanguageProcessor';
import { InputMethodManager } from './InputMethodManager';
import {
  VoiceCommand,
  Gesture,
  CommandIntent,
  InteractionContext,
  InputMode,
  InteractionPreferences,
  EnvironmentalFactors,
  // WorkContext,
  WorkMode,
  NoiseLevel,
  LightingCondition,
  DeviceType,
  NetworkQuality
} from '../../types/interaction';

interface MultiModalCommand {
  id: string;
  source: 'voice' | 'gesture' | 'keyboard' | 'mouse' | 'touch';
  intent: CommandIntent;
  timestamp: Date;
  confidence: number;
  rawData?: VoiceCommand | Gesture;
}

interface SystemState {
  isActive: boolean;
  currentInputMode: InputMode;
  availableServices: string[];
  contextualAdaptation: boolean;
  learningEnabled: boolean;
  adaptationCount: number;
}

interface InteractionEvent {
  type: 'command' | 'mode_change' | 'error' | 'context_update';
  data: any;
  timestamp: Date;
}

export class MultiModalInteractionSystem {
  private voiceService: VoiceCommandService;
  private gestureService: GestureRecognitionService;
  private nlpProcessor: NaturalLanguageProcessor;
  private inputManager: InputMethodManager;
  
  private currentContext: InteractionContext;
  private systemState: SystemState;
  private eventListeners: Map<string, ((event: InteractionEvent) => void)[]> = new Map();
  private commandHistory: MultiModalCommand[] = [];
  private maxHistorySize = 100;
  
  // Performance monitoring
  private performanceMetrics = {
    commandsProcessed: 0,
    averageResponseTime: 0,
    errorRate: 0,
    adaptationCount: 0
  };

  constructor(preferences?: Partial<InteractionPreferences>) {
    // Initialize services
    this.voiceService = new VoiceCommandService();
    this.gestureService = new GestureRecognitionService();
    this.nlpProcessor = new NaturalLanguageProcessor();
    this.inputManager = new InputMethodManager({
      preferredModes: preferences?.preferredInputMethods || [InputMode.KEYBOARD, InputMode.VOICE],
      adaptiveEnabled: true
    });

    // Initialize context
    this.currentContext = this.createInitialContext(preferences);
    
    // Initialize system state
    this.systemState = {
      isActive: false,
      currentInputMode: InputMode.KEYBOARD,
      availableServices: this.detectAvailableServices(),
      contextualAdaptation: true,
      learningEnabled: true,
      adaptationCount: 0
    };

    this.setupServiceListeners();
    this.startContextMonitoring();
  }

  private createInitialContext(preferences?: Partial<InteractionPreferences>): InteractionContext {
    return {
      currentMode: InputMode.KEYBOARD,
      availableModes: this.inputManager.getAvailableModes(),
      workContext: {
        activeApplications: [],
        timeOfDay: new Date().toLocaleTimeString(),
        workMode: WorkMode.FOCUS
      },
      userPreferences: {
        preferredInputMethods: preferences?.preferredInputMethods || [InputMode.KEYBOARD, InputMode.VOICE],
        voiceLanguage: preferences?.voiceLanguage || 'en-US',
        gestureEnabled: preferences?.gestureEnabled ?? true,
        accessibilityNeeds: preferences?.accessibilityNeeds || []
      },
      environmentalFactors: this.detectEnvironmentalFactors()
    };
  }

  private detectAvailableServices(): string[] {
    const services: string[] = [];
    
    if (this.voiceService.isSupported()) services.push('voice');
    if (this.gestureService.isSupported()) services.push('gesture');
    services.push('keyboard', 'mouse'); // Always available
    
    if ('ontouchstart' in window) services.push('touch');
    
    return services;
  }

  private detectEnvironmentalFactors(): EnvironmentalFactors {
    // Detect device type
    const deviceType = this.detectDeviceType();
    
    // Detect network quality (simplified)
    const connection = (navigator as any).connection;
    const networkQuality = connection ? this.mapConnectionToQuality(connection.effectiveType) : NetworkQuality.GOOD;
    
    return {
      isInMeeting: false, // Would be detected through calendar integration
      noiseLevel: NoiseLevel.MODERATE, // Would be detected through microphone
      lightingCondition: LightingCondition.NORMAL, // Would be detected through camera
      deviceType,
      networkQuality
    };
  }

  private detectDeviceType(): DeviceType {
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.screen.width;
    
    if (/mobile|android|iphone/.test(userAgent)) return DeviceType.MOBILE;
    if (/tablet|ipad/.test(userAgent)) return DeviceType.TABLET;
    if (screenWidth < 1024) return DeviceType.LAPTOP;
    return DeviceType.DESKTOP;
  }

  private mapConnectionToQuality(effectiveType: string): NetworkQuality {
    switch (effectiveType) {
      case '4g': return NetworkQuality.EXCELLENT;
      case '3g': return NetworkQuality.GOOD;
      case '2g': return NetworkQuality.FAIR;
      default: return NetworkQuality.POOR;
    }
  }

  private setupServiceListeners(): void {
    // Voice command handling
    this.voiceService.onCommand(async (voiceCommand: VoiceCommand) => {
      try {
        const startTime = performance.now();
        const intent = await this.nlpProcessor.processVoiceCommand(voiceCommand, this.currentContext);
        
        if (intent) {
          const command: MultiModalCommand = {
            id: this.generateCommandId(),
            source: 'voice',
            intent,
            timestamp: new Date(),
            confidence: intent.confidence,
            rawData: voiceCommand
          };
          
          await this.processCommand(command);
          this.updatePerformanceMetrics(performance.now() - startTime, true);
        }
      } catch (error) {
        this.handleError('voice_processing', error as Error);
        this.updatePerformanceMetrics(0, false);
      }
    });

    this.voiceService.onError((error: Error) => {
      this.handleError('voice_service', error);
    });

    // Gesture recognition handling
    this.gestureService.onGesture(async (gesture: Gesture) => {
      try {
        const startTime = performance.now();
        const intent = this.mapGestureToIntent(gesture);
        
        if (intent) {
          const command: MultiModalCommand = {
            id: this.generateCommandId(),
            source: 'gesture',
            intent,
            timestamp: new Date(),
            confidence: gesture.confidence,
            rawData: gesture
          };
          
          await this.processCommand(command);
          this.updatePerformanceMetrics(performance.now() - startTime, true);
        }
      } catch (error) {
        this.handleError('gesture_processing', error as Error);
        this.updatePerformanceMetrics(0, false);
      }
    });

    this.gestureService.onError((error: Error) => {
      this.handleError('gesture_service', error);
    });

    // Input method changes
    this.inputManager.onModeChange((mode: InputMode, reason: string) => {
      this.currentContext.currentMode = mode;
      this.systemState.currentInputMode = mode;
      this.systemState.adaptationCount++;
      
      this.emitEvent({
        type: 'mode_change',
        data: { mode, reason, context: this.currentContext },
        timestamp: new Date()
      });
    });
  }

  private mapGestureToIntent(gesture: Gesture): CommandIntent | null {
    // Map gestures to command intents
    const gestureIntentMap = {
      'point': { action: 'select', confidence: 0.8 },
      'swipe_left': { action: 'navigate_back', confidence: 0.85 },
      'swipe_right': { action: 'navigate_forward', confidence: 0.85 },
      'swipe_up': { action: 'scroll_up', confidence: 0.8 },
      'swipe_down': { action: 'scroll_down', confidence: 0.8 },
      'grab': { action: 'drag_start', confidence: 0.75 },
      'release': { action: 'drag_end', confidence: 0.75 },
      'thumbs_up': { action: 'approve', confidence: 0.9 },
      'thumbs_down': { action: 'reject', confidence: 0.9 },
      'ok_sign': { action: 'confirm', confidence: 0.85 },
      'peace_sign': { action: 'toggle_mode', confidence: 0.7 },
      'pinch': { action: 'zoom_out', confidence: 0.8 },
      'spread': { action: 'zoom_in', confidence: 0.8 }
    };

    const mapping = gestureIntentMap[gesture.type as keyof typeof gestureIntentMap];
    if (!mapping) return null;

    return {
      action: mapping.action,
      parameters: {
        gestureType: gesture.type,
        coordinates: gesture.coordinates,
        gestureId: gesture.id
      },
      confidence: Math.min(gesture.confidence * mapping.confidence, 1.0)
    };
  }

  private async processCommand(command: MultiModalCommand): Promise<void> {
    // Add to history
    this.addToHistory(command);
    
    // Emit command event
    this.emitEvent({
      type: 'command',
      data: command,
      timestamp: new Date()
    });

    // Update performance metrics
    this.performanceMetrics.commandsProcessed++;
    
    console.log(`Processing ${command.source} command:`, command.intent);
  }

  private addToHistory(command: MultiModalCommand): void {
    this.commandHistory.push(command);
    if (this.commandHistory.length > this.maxHistorySize) {
      this.commandHistory.shift();
    }
  }

  private startContextMonitoring(): void {
    // Monitor context changes every 5 seconds
    setInterval(() => {
      this.updateContext();
    }, 5000);

    // Monitor environmental factors
    this.monitorEnvironmentalFactors();
  }

  private updateContext(): void {
    const previousContext = { ...this.currentContext };
    
    // Update time-based context
    this.currentContext.workContext.timeOfDay = new Date().toLocaleTimeString();
    
    // Update environmental factors
    this.currentContext.environmentalFactors = this.detectEnvironmentalFactors();
    
    // Adapt input method if contextual adaptation is enabled
    if (this.systemState.contextualAdaptation) {
      this.inputManager.adaptInputMethod(this.currentContext);
    }
    
    // Emit context update if significant changes
    if (this.hasSignificantContextChange(previousContext, this.currentContext)) {
      this.emitEvent({
        type: 'context_update',
        data: { previous: previousContext, current: this.currentContext },
        timestamp: new Date()
      });
    }
  }

  private hasSignificantContextChange(prev: InteractionContext, current: InteractionContext): boolean {
    return (
      prev.currentMode !== current.currentMode ||
      prev.workContext.workMode !== current.workContext.workMode ||
      prev.environmentalFactors.isInMeeting !== current.environmentalFactors.isInMeeting ||
      prev.environmentalFactors.noiseLevel !== current.environmentalFactors.noiseLevel
    );
  }

  private monitorEnvironmentalFactors(): void {
    // Monitor noise level through microphone (if available)
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      this.monitorAudioLevel();
    }
    
    // Monitor lighting through camera (if available)
    this.monitorLightingConditions();
  }

  private async monitorAudioLevel(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      microphone.connect(analyser);
      analyser.fftSize = 256;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const checkAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
        
        let noiseLevel = NoiseLevel.QUIET;
        if (average > 100) noiseLevel = NoiseLevel.VERY_LOUD;
        else if (average > 70) noiseLevel = NoiseLevel.LOUD;
        else if (average > 40) noiseLevel = NoiseLevel.MODERATE;
        
        if (this.currentContext.environmentalFactors.noiseLevel !== noiseLevel) {
          this.currentContext.environmentalFactors.noiseLevel = noiseLevel;
          this.updateContext();
        }
        
        setTimeout(checkAudioLevel, 1000);
      };
      
      checkAudioLevel();
    } catch (error) {
      console.warn('Could not access microphone for noise monitoring:', error);
    }
  }

  private async monitorLightingConditions(): Promise<void> {
    // This would use camera to detect lighting conditions
    // For now, we'll use a simplified approach based on time of day
    const hour = new Date().getHours();
    let lightingCondition = LightingCondition.NORMAL;
    
    if (hour < 6 || hour > 20) {
      lightingCondition = LightingCondition.DIM;
    } else if (hour < 4 || hour > 22) {
      lightingCondition = LightingCondition.DARK;
    } else if (hour >= 10 && hour <= 16) {
      lightingCondition = LightingCondition.BRIGHT;
    }
    
    if (this.currentContext.environmentalFactors.lightingCondition !== lightingCondition) {
      this.currentContext.environmentalFactors.lightingCondition = lightingCondition;
    }
  }

  private updatePerformanceMetrics(responseTime: number, success: boolean): void {
    const metrics = this.performanceMetrics;
    
    if (success) {
      metrics.averageResponseTime = (metrics.averageResponseTime + responseTime) / 2;
    }
    
    const totalCommands = metrics.commandsProcessed;
    const errors = totalCommands * metrics.errorRate;
    
    if (!success) {
      metrics.errorRate = (errors + 1) / (totalCommands + 1);
    } else {
      metrics.errorRate = errors / (totalCommands + 1);
    }
  }

  private handleError(source: string, error: Error): void {
    console.error(`MultiModal System Error (${source}):`, error);
    
    this.emitEvent({
      type: 'error',
      data: { source, error: error.message, timestamp: new Date() },
      timestamp: new Date()
    });
  }

  private emitEvent(event: InteractionEvent): void {
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
  }

  private generateCommandId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  public async initialize(): Promise<void> {
    try {
      this.systemState.isActive = true;
      
      // Initialize voice service if supported and enabled
      if (this.currentContext.userPreferences.preferredInputMethods.includes(InputMode.VOICE)) {
        this.voiceService.setLanguage(this.currentContext.userPreferences.voiceLanguage);
      }
      
      console.log('MultiModal Interaction System initialized successfully');
    } catch (error) {
      this.handleError('initialization', error as Error);
      throw error;
    }
  }

  public async startVoiceRecognition(): Promise<void> {
    if (!this.voiceService.isSupported()) {
      throw new Error('Voice recognition not supported');
    }
    
    this.voiceService.startListening();
  }

  public stopVoiceRecognition(): void {
    this.voiceService.stopListening();
  }

  public async startGestureRecognition(videoElement: HTMLVideoElement, canvasElement?: HTMLCanvasElement): Promise<void> {
    if (!this.gestureService.isSupported()) {
      throw new Error('Gesture recognition not supported');
    }
    
    await this.gestureService.startRecognition(videoElement, canvasElement);
  }

  public stopGestureRecognition(): void {
    this.gestureService.stopRecognition();
  }

  public setWorkMode(mode: WorkMode): void {
    this.currentContext.workContext.workMode = mode;
    this.updateContext();
  }

  public setEnvironmentalFactor(factor: Partial<EnvironmentalFactors>): void {
    this.currentContext.environmentalFactors = {
      ...this.currentContext.environmentalFactors,
      ...factor
    };
    this.updateContext();
  }

  public forceInputMode(mode: InputMode, reason?: string): boolean {
    return this.inputManager.forceMode(mode, reason);
  }

  public enableContextualAdaptation(enabled: boolean): void {
    this.systemState.contextualAdaptation = enabled;
  }

  public enableLearning(enabled: boolean): void {
    this.systemState.learningEnabled = enabled;
  }

  public addEventListener(eventType: string, listener: (event: InteractionEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  public removeEventListener(eventType: string, listener: (event: InteractionEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  public getCurrentContext(): InteractionContext {
    return { ...this.currentContext };
  }

  public getSystemState(): SystemState {
    return { ...this.systemState };
  }

  public getPerformanceMetrics(): typeof this.performanceMetrics {
    return { ...this.performanceMetrics };
  }

  public getCommandHistory(): MultiModalCommand[] {
    return [...this.commandHistory];
  }

  public async processTextCommand(text: string): Promise<CommandIntent | null> {
    return await this.nlpProcessor.processCommand(text, this.currentContext);
  }

  public getRecommendedInputMode(): {
    mode: InputMode;
    reason: string;
    confidence: number;
  } {
    return this.inputManager.getRecommendedMode(this.currentContext);
  }

  public updatePreferences(preferences: Partial<InteractionPreferences>): void {
    this.currentContext.userPreferences = {
      ...this.currentContext.userPreferences,
      ...preferences
    };
    
    // Update input manager preferences
    this.inputManager.setPreferences({
      preferredModes: preferences.preferredInputMethods || [],
      adaptiveEnabled: true
    });
    
    // Update voice service language
    if (preferences.voiceLanguage) {
      this.voiceService.setLanguage(preferences.voiceLanguage);
    }
  }

  public shutdown(): void {
    this.systemState.isActive = false;
    this.stopVoiceRecognition();
    this.stopGestureRecognition();
    this.eventListeners.clear();
    console.log('MultiModal Interaction System shut down');
  }
}