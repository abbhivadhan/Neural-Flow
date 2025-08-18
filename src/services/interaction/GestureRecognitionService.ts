import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS } from '@mediapipe/hands';
import { 
  Gesture, 
  GestureType, 
  HandLandmark, 
  GestureCoordinates,
  InteractionContext 
} from '../../types/interaction';

export class GestureRecognitionService {
  private hands: Hands | null = null;
  private camera: Camera | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private isInitialized = false;
  private isRecognizing = false;
  private onGestureCallback?: (gesture: Gesture) => void;
  private onErrorCallback?: (error: Error) => void;
  private lastGestureTime = 0;
  private gestureThrottleMs = 100; // Throttle gestures to avoid spam

  constructor() {
    this.initializeMediaPipe();
  }

  private async initializeMediaPipe(): Promise<void> {
    try {
      this.hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      this.hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.hands.onResults(this.handleResults.bind(this));
      this.isInitialized = true;
    } catch (error) {
      this.onErrorCallback?.(error as Error);
    }
  }

  private handleResults(results: Results): void {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      return;
    }

    const now = Date.now();
    if (now - this.lastGestureTime < this.gestureThrottleMs) {
      return;
    }

    // Process each detected hand
    for (let i = 0; i < results.multiHandLandmarks.length; i++) {
      const landmarks = results.multiHandLandmarks[i];
      const handedness = results.multiHandedness[i];
      
      const gesture = this.recognizeGesture(landmarks, handedness);
      if (gesture) {
        this.lastGestureTime = now;
        this.onGestureCallback?.(gesture);
      }
    }

    // Draw results if canvas is available
    if (this.canvasElement && results.image) {
      this.drawResults(results);
    }
  }

  private recognizeGesture(landmarks: any[], handedness: any): Gesture | null {
    const handLandmarks: HandLandmark[] = landmarks.map(landmark => ({
      x: landmark.x,
      y: landmark.y,
      z: landmark.z,
      visibility: landmark.visibility || 1
    }));

    // Get key landmark positions for gesture recognition
    const thumb_tip = landmarks[4];
    const thumb_ip = landmarks[3];
    const index_tip = landmarks[8];
    const index_pip = landmarks[6];
    const middle_tip = landmarks[12];
    const middle_pip = landmarks[10];
    const ring_tip = landmarks[16];
    const ring_pip = landmarks[14];
    const pinky_tip = landmarks[20];
    const pinky_pip = landmarks[18];
    const wrist = landmarks[0];

    // Calculate gesture type based on finger positions
    const gestureType = this.classifyGesture({
      thumb_tip, thumb_ip, index_tip, index_pip,
      middle_tip, middle_pip, ring_tip, ring_pip,
      pinky_tip, pinky_pip, wrist
    });

    if (!gestureType) {
      return null;
    }

    // Calculate center point for gesture coordinates
    const centerX = landmarks.reduce((sum, lm) => sum + lm.x, 0) / landmarks.length;
    const centerY = landmarks.reduce((sum, lm) => sum + lm.y, 0) / landmarks.length;
    const centerZ = landmarks.reduce((sum, lm) => sum + lm.z, 0) / landmarks.length;

    return {
      id: this.generateGestureId(),
      type: gestureType,
      confidence: this.calculateConfidence(landmarks, gestureType),
      timestamp: new Date(),
      coordinates: {
        x: centerX,
        y: centerY,
        z: centerZ
      },
      landmarks: handLandmarks
    };
  }

  private classifyGesture(fingers: any): GestureType | null {
    const { thumb_tip, thumb_ip, index_tip, index_pip, middle_tip, middle_pip, 
            ring_tip, ring_pip, pinky_tip, pinky_pip, wrist } = fingers;

    // Helper function to check if finger is extended
    const isFingerExtended = (tip: any, pip: any) => tip.y < pip.y;
    
    // Check finger states
    const thumbExtended = thumb_tip.x > thumb_ip.x; // Thumb logic is different
    const indexExtended = isFingerExtended(index_tip, index_pip);
    const middleExtended = isFingerExtended(middle_tip, middle_pip);
    const ringExtended = isFingerExtended(ring_tip, ring_pip);
    const pinkyExtended = isFingerExtended(pinky_tip, pinky_pip);

    // Gesture classification logic
    if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      return GestureType.POINT;
    }

    if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      return GestureType.THUMBS_UP;
    }

    if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
      return GestureType.PEACE_SIGN;
    }

    if (thumbExtended && indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      // Check if thumb and index are close (OK sign)
      const distance = Math.sqrt(
        Math.pow(thumb_tip.x - index_tip.x, 2) + 
        Math.pow(thumb_tip.y - index_tip.y, 2)
      );
      if (distance < 0.05) {
        return GestureType.OK_SIGN;
      }
    }

    // Check for grab gesture (all fingers closed)
    if (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      return GestureType.GRAB;
    }

    // Check for open hand (all fingers extended)
    if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
      return GestureType.RELEASE;
    }

    return null;
  }

  private calculateConfidence(landmarks: any[], gestureType: GestureType): number {
    // Simple confidence calculation based on landmark visibility and gesture clarity
    const avgVisibility = landmarks.reduce((sum, lm) => sum + (lm.visibility || 1), 0) / landmarks.length;
    
    // Adjust confidence based on gesture type complexity
    const complexityFactor = this.getGestureComplexity(gestureType);
    
    return Math.min(avgVisibility * complexityFactor, 1.0);
  }

  private getGestureComplexity(gestureType: GestureType): number {
    const complexityMap = {
      [GestureType.POINT]: 0.9,
      [GestureType.THUMBS_UP]: 0.85,
      [GestureType.PEACE_SIGN]: 0.8,
      [GestureType.OK_SIGN]: 0.75,
      [GestureType.GRAB]: 0.9,
      [GestureType.RELEASE]: 0.85,
      [GestureType.SWIPE_LEFT]: 0.7,
      [GestureType.SWIPE_RIGHT]: 0.7,
      [GestureType.SWIPE_UP]: 0.7,
      [GestureType.SWIPE_DOWN]: 0.7,
      [GestureType.PINCH]: 0.6,
      [GestureType.SPREAD]: 0.6,
      [GestureType.THUMBS_DOWN]: 0.85
    };
    
    return complexityMap[gestureType] || 0.5;
  }

  private drawResults(results: Results): void {
    if (!this.canvasElement) return;

    const ctx = this.canvasElement.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    ctx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);

    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
        drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 2 });
      }
    }
    ctx.restore();
  }

  private generateGestureId(): string {
    return `gesture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public async startRecognition(videoElement: HTMLVideoElement, canvasElement?: HTMLCanvasElement): Promise<void> {
    if (!this.isInitialized || !this.hands) {
      throw new Error('MediaPipe Hands not initialized');
    }

    this.videoElement = videoElement;
    this.canvasElement = canvasElement || null;

    try {
      this.camera = new Camera(videoElement, {
        onFrame: async () => {
          if (this.hands) {
            await this.hands.send({ image: videoElement });
          }
        },
        width: 640,
        height: 480
      });

      await this.camera.start();
      this.isRecognizing = true;
    } catch (error) {
      this.onErrorCallback?.(error as Error);
    }
  }

  public stopRecognition(): void {
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }
    this.isRecognizing = false;
  }

  public onGesture(callback: (gesture: Gesture) => void): void {
    this.onGestureCallback = callback;
  }

  public onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  public isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  public setGestureThrottle(ms: number): void {
    this.gestureThrottleMs = ms;
  }

  public updateSettings(settings: {
    maxNumHands?: number;
    modelComplexity?: number;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
  }): void {
    if (this.hands) {
      this.hands.setOptions({
        maxNumHands: settings.maxNumHands || 2,
        modelComplexity: settings.modelComplexity || 1,
        minDetectionConfidence: settings.minDetectionConfidence || 0.5,
        minTrackingConfidence: settings.minTrackingConfidence || 0.5
      });
    }
  }

  public getRecognitionStatus(): {
    isInitialized: boolean;
    isRecognizing: boolean;
    isSupported: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
      isRecognizing: this.isRecognizing,
      isSupported: this.isSupported()
    };
  }
}