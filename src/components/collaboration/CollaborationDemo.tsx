import React, { useState, useEffect, useRef } from 'react';
import { CollaborationEngine, CollaborationConfig } from '../../services/collaboration';
import { TeamMember, Message, CursorPosition, PresenceInfo } from '../../types/collaboration';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface CollaborationDemoProps {
  teamMembers: TeamMember[];
  currentUserId: string;
}

export const CollaborationDemo: React.FC<CollaborationDemoProps> = ({
  teamMembers,
  currentUserId
}) => {
  const [engine, setEngine] = useState<CollaborationEngine | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [presenceInfo, setPresenceInfo] = useState<Map<string, PresenceInfo>>(new Map());
  const [cursorPositions, setCursorPositions] = useState<Map<string, CursorPosition>>(new Map());
  const [messageInput, setMessageInput] = useState('');
  const [documentContent, setDocumentContent] = useState('Start typing to see real-time collaboration...');
  const [expertiseQuery, setExpertiseQuery] = useState('');
  const [expertiseResults, setExpertiseResults] = useState<any[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Initialize collaboration engine
    const config: CollaborationConfig = {
      websocketUrl: 'ws://localhost:8080/collaboration', // Mock URL
      userId: currentUserId,
      sessionId: 'demo-session',
      enableRealTimeSync: true,
      enableConflictResolution: true,
      enableExpertiseMatching: true,
      enableCommunicationAnalysis: true
    };

    const collaborationEngine = new CollaborationEngine(config);
    
    // Set up event listeners
    collaborationEngine.on('connected', () => {
      setIsConnected(true);
    });

    collaborationEngine.on('message_received', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    collaborationEngine.on('presence_updated', (presence: PresenceInfo) => {
      setPresenceInfo(prev => new Map(prev.set(presence.userId, presence)));
    });

    collaborationEngine.on('cursor_moved', (cursor: CursorPosition) => {
      setCursorPositions(prev => new Map(prev.set(cursor.userId, cursor)));
    });

    collaborationEngine.on('operation_applied', (operation: any) => {
      console.log('Operation applied:', operation);
      // In a real implementation, this would update the document
    });

    setEngine(collaborationEngine);

    // Simulate starting a session
    collaborationEngine.startSession('demo-session', teamMembers).catch(console.error);

    return () => {
      collaborationEngine.destroy();
    };
  }, [currentUserId, teamMembers]);

  const handleSendMessage = () => {
    if (engine && messageInput.trim()) {
      engine.sendMessage(messageInput);
      setMessageInput('');
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setDocumentContent(newContent);
    
    if (engine) {
      // Update cursor position
      engine.updateCursor(cursorPos);
      
      // In a real implementation, we would create and send operations
      // For demo purposes, we'll just update presence
      engine.updatePresence('active', 'demo-document');
    }
  };

  const handleExpertiseSearch = () => {
    if (engine && expertiseQuery.trim()) {
      const results = engine.findExpertise({
        skills: expertiseQuery.split(',').map(s => s.trim()),
        urgency: 'medium'
      });
      setExpertiseResults(results);
    }
  };

  const getPresenceStatus = (userId: string): string => {
    const presence = presenceInfo.get(userId);
    return presence?.status || 'offline';
  };

  const getPresenceColor = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'away': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Real-Time Collaboration Demo
        </h1>
        <div className="flex items-center justify-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Editor */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Collaborative Document</h2>
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={documentContent}
                onChange={handleDocumentChange}
                className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Start typing to see real-time collaboration..."
              />
              
              {/* Cursor indicators */}
              {Array.from(cursorPositions.entries()).map(([userId, cursor]) => (
                userId !== currentUserId && (
                  <div
                    key={userId}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${cursor.position % 50}px`, // Simplified positioning
                      top: `${Math.floor(cursor.position / 50) * 20 + 20}px`,
                    }}
                  >
                    <div
                      className="w-0.5 h-5"
                      style={{ backgroundColor: cursor.color }}
                    />
                    <div
                      className="text-xs px-1 py-0.5 rounded text-white"
                      style={{ backgroundColor: cursor.color }}
                    >
                      {teamMembers.find(m => m.id === userId)?.name || userId}
                    </div>
                  </div>
                )
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Presence */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3">Team Presence</h3>
            <div className="space-y-2">
              {teamMembers.map(member => (
                <div key={member.id} className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getPresenceColor(getPresenceStatus(member.id))}`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{member.name}</div>
                    <div className="text-xs text-gray-500 capitalize">
                      {getPresenceStatus(member.id)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Expertise Matching */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3">Find Expertise</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={expertiseQuery}
                onChange={(e) => setExpertiseQuery(e.target.value)}
                placeholder="e.g., javascript, react, python"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <Button onClick={handleExpertiseSearch} className="w-full">
                Search Expertise
              </Button>
              
              {expertiseResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Results:</h4>
                  {expertiseResults.slice(0, 3).map((result, index) => (
                    <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{result.member.name}</span>
                        <Badge variant="secondary">
                          {Math.round(result.score * 100)}% match
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {result.reasoning}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Chat */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Team Chat</h2>
        <div className="space-y-4">
          <div className="h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
            {messages.length === 0 ? (
              <div className="text-gray-500 text-sm">No messages yet...</div>
            ) : (
              messages.map(message => (
                <div key={message.id} className="flex space-x-2">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {teamMembers.find(m => m.id === message.senderId)?.name || 'Unknown'}:
                  </span>
                  <span className="text-sm">{message.content}</span>
                  {message.sentiment && (
                    <Badge 
                      variant={message.sentiment === 'positive' ? 'default' : 
                              message.sentiment === 'negative' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {message.sentiment}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className="flex space-x-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <Button onClick={handleSendMessage}>Send</Button>
          </div>
        </div>
      </Card>

      {/* Analytics */}
      {engine && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Collaboration Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {messages.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Messages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {Array.from(presenceInfo.values()).filter(p => p.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {teamMembers.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Team Size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {isConnected ? '100%' : '0%'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};