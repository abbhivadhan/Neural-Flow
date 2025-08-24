import { WebSocketClient } from './WebSocketClient';
import { OperationalTransform } from './OperationalTransform';
import { ExpertiseMatchingService, ExpertiseQuery, ExpertiseMatch } from './ExpertiseMatchingService';
import { CommunicationAnalysisService, CommunicationMetrics } from './CommunicationAnalysisService';
import {
  TeamMember,
  CollaborationSession,
  Operation,
  OperationResult,
  Message,
  TeamInsights,
  CursorPosition,
  PresenceInfo,

} from '../../types/collaboration';

export interface CollaborationConfig {
  websocketUrl: string;
  userId: string;
  sessionId: string;
  enableRealTimeSync: boolean;
  enableConflictResolution: boolean;
  enableExpertiseMatching: boolean;
  enableCommunicationAnalysis: boolean;
}

export class CollaborationEngine {
  private wsClient: WebSocketClient;
  private operationalTransform: OperationalTransform;
  private expertiseService: ExpertiseMatchingService;
  private communicationService: CommunicationAnalysisService;
  private config: CollaborationConfig;
  
  private currentSession: CollaborationSession | null = null;
  private teamMembers: TeamMember[] = [];
  private messages: Message[] = [];
  private presenceMap: Map<string, PresenceInfo> = new Map();
  private cursorPositions: Map<string, CursorPosition> = new Map();
  
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(config: CollaborationConfig) {
    this.config = config;
    this.wsClient = new WebSocketClient(config.websocketUrl);
    this.operationalTransform = new OperationalTransform();
    this.expertiseService = new ExpertiseMatchingService();
    this.communicationService = new CommunicationAnalysisService();
    
    this.initializeEventListeners();
    this.setupWebSocketHandlers();
  }

  private initializeEventListeners(): void {
    const events = [
      'session_started', 'session_ended', 'member_joined', 'member_left',
      'operation_applied', 'conflict_resolved', 'message_received',
      'presence_updated', 'cursor_moved', 'expertise_matched'
    ];
    
    events.forEach(event => {
      this.eventListeners.set(event, []);
    });
  }

  private setupWebSocketHandlers(): void {
    this.wsClient.on('connected', () => {
      console.log('Collaboration engine connected');
      this.emit('connected', { userId: this.config.userId });
    });

    this.wsClient.on('operation', (operation: Operation) => {
      this.handleRemoteOperation(operation);
    });

    this.wsClient.on('cursor', (cursor: CursorPosition) => {
      this.handleCursorUpdate(cursor);
    });

    this.wsClient.on('presence', (presence: PresenceInfo) => {
      this.handlePresenceUpdate(presence);
    });

    this.wsClient.on('chat', (message: Message) => {
      this.handleChatMessage(message);
    });

    this.wsClient.on('system', (data: any) => {
      this.handleSystemMessage(data);
    });
  }

  /**
   * Start a collaboration session
   */
  async startSession(sessionId: string, teamMembers: TeamMember[]): Promise<void> {
    try {
      await this.wsClient.connect(this.config.userId, sessionId);
      
      this.currentSession = {
        id: sessionId,
        projectId: sessionId, // Simplified
        participants: teamMembers,
        startTime: new Date(),
        type: 'editing',
        status: 'active'
      };
      
      this.teamMembers = teamMembers;
      this.emit('session_started', this.currentSession);
      
      // Send initial presence
      this.updatePresence('active');
      
    } catch (error) {
      console.error('Failed to start collaboration session:', error);
      throw error;
    }
  }

  /**
   * End the current collaboration session
   */
  async endSession(): Promise<void> {
    if (this.currentSession) {
      this.currentSession.status = 'ended';
      this.currentSession.endTime = new Date();
      
      this.wsClient.disconnect();
      this.emit('session_ended', this.currentSession);
      
      this.currentSession = null;
      this.presenceMap.clear();
      this.cursorPositions.clear();
    }
  }

  /**
   * Apply a local operation and broadcast it
   */
  async applyOperation(operation: Operation): Promise<OperationResult> {
    if (!this.config.enableRealTimeSync) {
      return { operation, transformed: false, conflicts: [] };
    }

    // Add to operation history
    this.operationalTransform.addToHistory(operation);
    
    // Broadcast to other participants
    this.wsClient.sendOperation(operation);
    
    this.emit('operation_applied', operation);
    
    return { operation, transformed: false, conflicts: [] };
  }

  private async handleRemoteOperation(operation: Operation): Promise<void> {
    if (!this.config.enableConflictResolution) {
      this.emit('operation_applied', operation);
      return;
    }

    // Get recent operations for conflict detection
    const recentOps = this.operationalTransform.getHistory()
      .filter(op => 
        Math.abs(op.timestamp.getTime() - operation.timestamp.getTime()) < 5000 &&
        op.userId !== operation.userId
      );

    if (recentOps.length > 0) {
      // Resolve conflicts using operational transformation
      const results = this.operationalTransform.resolveConflicts([...recentOps, operation]);
      const currentResult = results.find(r => r.operation.id === operation.id);
      
      if (currentResult && currentResult.conflicts.length > 0) {
        this.emit('conflict_resolved', {
          operation: currentResult.operation,
          conflicts: currentResult.conflicts
        });
      }
    }

    this.operationalTransform.addToHistory(operation);
    this.emit('operation_applied', operation);
  }

  /**
   * Update cursor position
   */
  updateCursor(position: number, selection?: { start: number; end: number }): void {
    if (!this.currentSession) return;

    const cursor: CursorPosition = {
      userId: this.config.userId,
      position,
      selection: selection || { start: 0, end: 0 },
      color: this.getUserColor(this.config.userId)
    };

    this.cursorPositions.set(this.config.userId, cursor);
    this.wsClient.sendCursorPosition(cursor, this.currentSession.id);
  }

  private handleCursorUpdate(cursor: CursorPosition): void {
    this.cursorPositions.set(cursor.userId, cursor);
    this.emit('cursor_moved', cursor);
  }

  /**
   * Update user presence
   */
  updatePresence(status: 'active' | 'idle' | 'away', currentDocument?: string): void {
    if (!this.currentSession) return;

    const presence: PresenceInfo = {
      userId: this.config.userId,
      status,
      lastSeen: new Date(),
      currentDocument: currentDocument || '',
      cursor: this.cursorPositions.get(this.config.userId) || { userId: this.config.userId, position: 0, selection: { start: 0, end: 0 }, color: '#000000' }
    };

    this.presenceMap.set(this.config.userId, presence);
    this.wsClient.sendPresenceUpdate(presence, this.currentSession.id);
  }

  private handlePresenceUpdate(presence: PresenceInfo): void {
    this.presenceMap.set(presence.userId, presence);
    this.emit('presence_updated', presence);
  }

  /**
   * Send a chat message
   */
  sendMessage(content: string): void {
    if (!this.currentSession) return;

    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: this.config.userId,
      content,
      timestamp: new Date(),
      type: 'text'
    };

    // Analyze message locally
    if (this.config.enableCommunicationAnalysis) {
      const sentiment = this.communicationService.analyzeSentiment(content);
      const intent = this.communicationService.detectIntent(content);
      
      message.sentiment = sentiment.label;
      message.intent = intent;
    }

    this.messages.push(message);
    this.wsClient.sendChatMessage(content, this.config.userId, this.currentSession.id);
    this.emit('message_sent', message);
  }

  private handleChatMessage(message: Message): void {
    this.messages.push(message);
    this.emit('message_received', message);
  }

  private handleSystemMessage(data: any): void {
    switch (data.type) {
      case 'member_joined':
        this.handleMemberJoined(data.member);
        break;
      case 'member_left':
        this.handleMemberLeft(data.memberId);
        break;
      default:
        console.log('Unknown system message:', data);
    }
  }

  private handleMemberJoined(member: TeamMember): void {
    if (!this.teamMembers.find(m => m.id === member.id)) {
      this.teamMembers.push(member);
      this.emit('member_joined', member);
    }
  }

  private handleMemberLeft(memberId: string): void {
    this.teamMembers = this.teamMembers.filter(m => m.id !== memberId);
    this.presenceMap.delete(memberId);
    this.cursorPositions.delete(memberId);
    this.emit('member_left', { memberId });
  }

  /**
   * Find team members with specific expertise
   */
  findExpertise(query: ExpertiseQuery): ExpertiseMatch[] {
    if (!this.config.enableExpertiseMatching) {
      return [];
    }

    const matches = this.expertiseService.findExpertise(query, this.teamMembers);
    this.emit('expertise_matched', { query, matches });
    return matches;
  }

  /**
   * Get team communication insights
   */
  getTeamInsights(): TeamInsights {
    if (!this.config.enableCommunicationAnalysis) {
      return {
        communicationPatterns: [],
        collaborationEfficiency: 0,
        expertiseGaps: [],
        recommendedConnections: [],
        productivityTrends: []
      };
    }

    const insights = this.communicationService.analyzeTeamCommunication(this.messages, this.teamMembers);
    
    // Add expertise-based connections
    if (this.config.enableExpertiseMatching) {
      insights.recommendedConnections = this.expertiseService.suggestConnections(this.teamMembers);
    }

    return insights;
  }

  /**
   * Get communication metrics
   */
  getCommunicationMetrics(): CommunicationMetrics {
    if (!this.config.enableCommunicationAnalysis) {
      return {
        totalMessages: 0,
        averageResponseTime: 0,
        sentimentTrend: 0,
        collaborationScore: 0,
        engagementLevel: 0
      };
    }

    return this.communicationService.getCommunicationMetrics(this.messages, this.teamMembers);
  }

  /**
   * Get current session info
   */
  getCurrentSession(): CollaborationSession | null {
    return this.currentSession;
  }

  /**
   * Get team members
   */
  getTeamMembers(): TeamMember[] {
    return [...this.teamMembers];
  }

  /**
   * Get presence information for all users
   */
  getPresenceInfo(): Map<string, PresenceInfo> {
    return new Map(this.presenceMap);
  }

  /**
   * Get cursor positions for all users
   */
  getCursorPositions(): Map<string, CursorPosition> {
    return new Map(this.cursorPositions);
  }

  /**
   * Get recent messages
   */
  getMessages(limit?: number): Message[] {
    const messages = [...this.messages].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return limit ? messages.slice(0, limit) : messages;
  }

  private getUserColor(userId: string): string {
    // Generate consistent color for user
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length] || '#000000';
  }

  /**
   * Event listener management
   */
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
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.wsClient.disconnect();
    this.eventListeners.clear();
    this.presenceMap.clear();
    this.cursorPositions.clear();
    this.messages = [];
    this.teamMembers = [];
    this.currentSession = null;
  }
}