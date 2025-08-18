import { VoiceCommand, CommandIntent, InteractionContext } from '../../types/interaction';

export class VoiceCommandService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private onCommandCallback?: (command: VoiceCommand) => void;
  private onErrorCallback?: (error: Error) => void;
  private currentLanguage = 'en-US';

  constructor() {
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition(): void {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.currentLanguage;
    this.recognition.maxAlternatives = 3;

    this.recognition.onresult = this.handleSpeechResult.bind(this);
    this.recognition.onerror = this.handleSpeechError.bind(this);
    this.recognition.onend = this.handleSpeechEnd.bind(this);
    this.recognition.onstart = this.handleSpeechStart.bind(this);
  }

  private handleSpeechResult(event: SpeechRecognitionEvent): void {
    const lastResult = event.results[event.results.length - 1];
    
    if (lastResult.isFinal) {
      const transcript = lastResult[0].transcript.trim();
      const confidence = lastResult[0].confidence;

      const voiceCommand: VoiceCommand = {
        id: this.generateCommandId(),
        transcript,
        confidence,
        timestamp: new Date(),
        language: this.currentLanguage,
        intent: this.parseIntent(transcript)
      };

      this.onCommandCallback?.(voiceCommand);
    }
  }

  private handleSpeechError(event: SpeechRecognitionErrorEvent): void {
    const error = new Error(`Speech recognition error: ${event.error}`);
    this.onErrorCallback?.(error);
    
    // Auto-restart on certain errors
    if (event.error === 'no-speech' || event.error === 'audio-capture') {
      setTimeout(() => this.startListening(), 1000);
    }
  }

  private handleSpeechStart(): void {
    this.isListening = true;
  }

  private handleSpeechEnd(): void {
    this.isListening = false;
    
    // Auto-restart if we were intentionally listening
    if (this.onCommandCallback) {
      setTimeout(() => this.startListening(), 100);
    }
  }

  private parseIntent(transcript: string): CommandIntent | undefined {
    const lowerTranscript = transcript.toLowerCase();
    
    // Simple intent parsing - in production, this would use a more sophisticated NLP model
    const intentPatterns = [
      { pattern: /create (new )?task/i, action: 'create_task' },
      { pattern: /open (project|file)/i, action: 'open_item' },
      { pattern: /search for (.+)/i, action: 'search', entity: '$1' },
      { pattern: /delete (task|project)/i, action: 'delete_item' },
      { pattern: /save (file|document)/i, action: 'save' },
      { pattern: /switch to (.+) mode/i, action: 'switch_mode', entity: '$1' },
      { pattern: /show (calendar|tasks|projects)/i, action: 'show_view', entity: '$1' },
      { pattern: /help|assistance/i, action: 'help' },
      { pattern: /cancel|stop|nevermind/i, action: 'cancel' }
    ];

    for (const { pattern, action, entity } of intentPatterns) {
      const match = lowerTranscript.match(pattern);
      if (match) {
        return {
          action,
          entity: entity ? match[1] : undefined,
          parameters: { originalTranscript: transcript },
          confidence: 0.8 // Simple confidence score
        };
      }
    }

    return undefined;
  }

  private generateCommandId(): string {
    return `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public startListening(): void {
    if (!this.recognition) {
      throw new Error('Speech recognition not available');
    }

    if (this.isListening) {
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      this.onErrorCallback?.(error as Error);
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  public setLanguage(language: string): void {
    this.currentLanguage = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  public onCommand(callback: (command: VoiceCommand) => void): void {
    this.onCommandCallback = callback;
  }

  public onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  public isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public getAvailableLanguages(): string[] {
    // Common languages supported by Web Speech API
    return [
      'en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 
      'pt-BR', 'ru-RU', 'ja-JP', 'ko-KR', 'zh-CN', 'ar-SA'
    ];
  }
}

// Extend the Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}