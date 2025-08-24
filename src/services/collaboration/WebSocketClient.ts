import { WebSocketMessage, Operation, CursorPosition, PresenceInfo } from '../../types/collaboration';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(url: string) {
    this.url = url;
    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    this.eventListeners.set('operation', []);
    this.eventListeners.set('cursor', []);
    this.eventListeners.set('presence', []);
    this.eventListeners.set('chat', []);
    this.eventListeners.set('system', []);
    this.eventListeners.set('connected', []);
    this.eventListeners.set('disconnected', []);
    this.eventListeners.set('error', []);
  }

  async connect(userId: string, sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${this.url}?userId=${userId}&sessionId=${sessionId}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.flushMessageQueue();
          this.emit('connected', { userId, sessionId });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.stopHeartbeat();
          this.emit('disconnected', { code: event.code, reason: event.reason });
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect(userId, sessionId);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'operation':
        this.emit('operation', message.payload);
        break;
      case 'cursor':
        this.emit('cursor', message.payload);
        break;
      case 'presence':
        this.emit('presence', message.payload);
        break;
      case 'chat':
        this.emit('chat', message.payload);
        break;
      case 'system':
        this.emit('system', message.payload);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  sendOperation(operation: Operation): void {
    const message: WebSocketMessage = {
      type: 'operation',
      payload: operation,
      sessionId: operation.sessionId,
      userId: operation.userId,
      timestamp: new Date()
    };
    this.sendMessage(message);
  }

  sendCursorPosition(cursor: CursorPosition, sessionId: string): void {
    const message: WebSocketMessage = {
      type: 'cursor',
      payload: cursor,
      sessionId,
      userId: cursor.userId,
      timestamp: new Date()
    };
    this.sendMessage(message);
  }

  sendPresenceUpdate(presence: PresenceInfo, sessionId: string): void {
    const message: WebSocketMessage = {
      type: 'presence',
      payload: presence,
      sessionId,
      userId: presence.userId,
      timestamp: new Date()
    };
    this.sendMessage(message);
  }

  sendChatMessage(content: string, userId: string, sessionId: string): void {
    const message: WebSocketMessage = {
      type: 'chat',
      payload: { content, userId, timestamp: new Date() },
      sessionId,
      userId,
      timestamp: new Date()
    };
    this.sendMessage(message);
  }

  private sendMessage(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(message);
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect(userId: string, sessionId: string): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect(userId, sessionId).catch(() => {
        // Reconnection failed, will try again if attempts remain
      });
    }, delay);
  }

  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}