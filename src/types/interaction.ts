// Multi-modal interaction types for Neural Flow

export interface VoiceCommand {
  id: string;
  transcript: string;
  confidence: number;
  timestamp: Date;
  language: string;
  intent?: CommandIntent;
}

export interface Gesture {
  id: string;
  type: GestureType;
  confidence: number;
  timestamp: Date;
  coordinates?: GestureCoordinates;
  landmarks?: HandLandmark[];
}

export interface CommandIntent {
  action: string;
  entity?: string;
  parameters?: Record<string, any>;
  confidence: number;
}

export interface InteractionContext {
  currentMode: InputMode;
  availableModes: InputMode[];
  workContext: WorkContext;
  userPreferences: InteractionPreferences;
  environmentalFactors: EnvironmentalFactors;
}

export interface InteractionPreferences {
  preferredInputMethods: InputMode[];
  voiceLanguage: string;
  gestureEnabled: boolean;
  accessibilityNeeds: AccessibilityRequirement[];
}

export interface EnvironmentalFactors {
  isInMeeting: boolean;
  noiseLevel: NoiseLevel;
  lightingCondition: LightingCondition;
  deviceType: DeviceType;
  networkQuality: NetworkQuality;
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface GestureCoordinates {
  x: number;
  y: number;
  z?: number;
}

export enum GestureType {
  POINT = 'point',
  SWIPE_LEFT = 'swipe_left',
  SWIPE_RIGHT = 'swipe_right',
  SWIPE_UP = 'swipe_up',
  SWIPE_DOWN = 'swipe_down',
  PINCH = 'pinch',
  SPREAD = 'spread',
  GRAB = 'grab',
  RELEASE = 'release',
  THUMBS_UP = 'thumbs_up',
  THUMBS_DOWN = 'thumbs_down',
  OK_SIGN = 'ok_sign',
  PEACE_SIGN = 'peace_sign'
}

export enum InputMode {
  KEYBOARD = 'keyboard',
  MOUSE = 'mouse',
  TOUCH = 'touch',
  VOICE = 'voice',
  GESTURE = 'gesture',
  EYE_TRACKING = 'eye_tracking'
}

export enum NoiseLevel {
  QUIET = 'quiet',
  MODERATE = 'moderate',
  LOUD = 'loud',
  VERY_LOUD = 'very_loud'
}

export enum LightingCondition {
  BRIGHT = 'bright',
  NORMAL = 'normal',
  DIM = 'dim',
  DARK = 'dark'
}

export enum DeviceType {
  DESKTOP = 'desktop',
  LAPTOP = 'laptop',
  TABLET = 'tablet',
  MOBILE = 'mobile'
}

export enum NetworkQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor'
}

export enum AccessibilityRequirement {
  SCREEN_READER = 'screen_reader',
  HIGH_CONTRAST = 'high_contrast',
  LARGE_TEXT = 'large_text',
  VOICE_ONLY = 'voice_only',
  GESTURE_ONLY = 'gesture_only',
  KEYBOARD_ONLY = 'keyboard_only'
}

export interface WorkContext {
  currentTask?: string;
  currentProject?: string;
  activeApplications: string[];
  timeOfDay: string;
  workMode: WorkMode;
}

export enum WorkMode {
  FOCUS = 'focus',
  COLLABORATION = 'collaboration',
  RESEARCH = 'research',
  CREATIVE = 'creative',
  ADMINISTRATIVE = 'administrative'
}