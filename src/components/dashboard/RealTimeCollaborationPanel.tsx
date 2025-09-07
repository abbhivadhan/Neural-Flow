import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  MessageSquare, 
  Video, 
  Mic, 
  MicOff, 
  VideoOff,
  Share2, 
  Edit3, 
  Eye, 
  Clock,
  Activity,
  Zap,
  Brain,
  Send,
  Phone,
  PhoneOff,
  Settings,
  MoreHorizontal,
  UserPlus,
  Bell,
  BellOff
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CollaborationEngine } from '../../services/collaboration/CollaborationEngine';

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  status: 'active' | 'idle' | 'away' | 'offline';
  currentActivity?: string;
  lastSeen?: Date;
  isTyping?: boolean;
  cursorPosition?: { x: number; y: number };
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'ai';
  reactions?: { emoji: string; users: string[] }[];
}

interface RealTimeCollaborationPanelProps {
  userId: string;
  teamMembers: TeamMember[];
  className?: string;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

export const RealTimeCollaborationPanel: React.FC<RealTimeCollaborationPanelProps> = ({
  userId,
  teamMembers,
  className = '',
  isExpanded = false,
  onToggleExpanded
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [activeCall, setActiveCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [collaborationEngine, setCollaborationEngine] = useState<CollaborationEngine | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Initialize collaboration engine
  useEffect(() => {
    const engine = new CollaborationEngine({
      websocketUrl: 'ws://localhost:8080/collaboration',
      userId,
      sessionId: 'dashboard-collaboration',
      enableRealTimeSync: true,
      enableConflictResolution: true,
      enableExpertiseMatching: true,
      enableCommunicationAnalysis: true
    });

    engine.on('message_received', (message: any) => {
      setMessages(prev => [...prev, {
        id: message.id,
        senderId: message.senderId,
        content: message.content,
        timestamp: new Date(message.timestamp),
        type: message.type || 'text'
      }]);
    });

    engine.on('typing_started', (data: any) => {
      setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
    });

    engine.on('typing_stopped', (data: any) => {
      setTypingUsers(prev => prev.filter(id => id !== data.userId));
    });

    setCollaborationEngine(engine);
    engine.startSession('dashboard-collaboration', teamMembers);

    // Add some initial messages
    const initialMessages: Message[] = [
      {
        id: '1',
        senderId: 'system',
        content: 'Collaboration session started',
        timestamp: new Date(Date.now() - 300000),
        type: 'system'
      },
      {
        id: '2',
        senderId: 'ai',
        content: 'I\'ve analyzed the current project status and suggest focusing on the high-priority tasks first.',
        timestamp: new Date(Date.now() - 240000),
        type: 'ai'
      },
      {
        id: '3',
        senderId: teamMembers[0]?.id || 'user1',
        content: 'Great! Let\'s review the dashboard metrics together.',
        timestamp: new Date(Date.now() - 180000),
        type: 'text'
      }
    ];
    setMessages(initialMessages);

    return () => engine.destroy();
  }, [userId, teamMembers]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !collaborationEngine) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: userId,
      content: newMessage,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    collaborationEngine.sendMessage(newMessage);
    setNewMessage('');
    setIsTyping(false);
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      collaborationEngine?.updateTypingStatus(true);
    } else if (isTyping && value.length === 0) {
      setIsTyping(false);
      collaborationEngine?.updateTypingStatus(false);
    }
  };

  const toggleCall = () => {
    setActiveCall(!activeCall);
    if (!activeCall) {
      // Simulate joining a call
      const systemMessage: Message = {
        id: Date.now().toString(),
        senderId: 'system',
        content: `${getCurrentUser()?.name || 'You'} joined the call`,
        timestamp: new Date(),
        type: 'system'
      };
      setMessages(prev => [...prev, systemMessage]);
    }
  };

  const getCurrentUser = () => teamMembers.find(m => m.id === userId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'away': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  const getMessageSender = (senderId: string) => {
    if (senderId === 'system') return { name: 'System', avatar: null };
    if (senderId === 'ai') return { name: 'AI Assistant', avatar: null };
    return teamMembers.find(m => m.id === senderId) || { name: 'Unknown', avatar: null };
  };

  if (!isExpanded) {
    return (
      <motion.div
        className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 ${className}`}
        whileHover={{ scale: 1.02 }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Users className="w-6 h-6 text-blue-500" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Team Collaboration
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {teamMembers.filter(m => m.status === 'active').length} active
                </p>
              </div>
            </div>
            <Button
              onClick={onToggleExpanded}
              variant="outline"
              size="sm"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Mini team avatars */}
          <div className="flex items-center space-x-2 mt-4">
            {teamMembers.slice(0, 4).map(member => (
              <div key={member.id} className="relative">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {member.name.charAt(0)}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(member.status)} rounded-full border-2 border-white dark:border-slate-800`} />
              </div>
            ))}
            {teamMembers.length > 4 && (
              <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 text-sm font-medium">
                +{teamMembers.length - 4}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Users className="w-6 h-6 text-blue-500" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Real-Time Collaboration
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {teamMembers.filter(m => m.status === 'active').length} of {teamMembers.length} online
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setNotifications(!notifications)}
              variant="outline"
              size="sm"
            >
              {notifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </Button>
            <Button
              onClick={onToggleExpanded}
              variant="outline"
              size="sm"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-96">
        {/* Team Members Sidebar */}
        <div className="w-64 border-r border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-slate-900 dark:text-slate-100">Team Members</h4>
            <Button variant="outline" size="sm">
              <UserPlus className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {teamMembers.map(member => (
              <div key={member.id} className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                    {member.name.charAt(0)}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(member.status)} rounded-full border-2 border-white dark:border-slate-800`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {member.name}
                    </p>
                    {member.isTyping && (
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                    {member.status}
                  </p>
                  {member.currentActivity && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                      {member.currentActivity}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Call Controls */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-2">
              <Button
                onClick={toggleCall}
                variant={activeCall ? "destructive" : "default"}
                size="sm"
                className="flex-1"
              >
                {activeCall ? <PhoneOff className="w-4 h-4 mr-2" /> : <Phone className="w-4 h-4 mr-2" />}
                {activeCall ? 'Leave' : 'Join'} Call
              </Button>
            </div>
            
            {activeCall && (
              <div className="flex items-center space-x-2 mt-2">
                <Button
                  onClick={() => setIsMuted(!isMuted)}
                  variant={isMuted ? "destructive" : "outline"}
                  size="sm"
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  variant={isVideoOn ? "default" : "outline"}
                  size="sm"
                >
                  {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {messages.map(message => {
                const sender = getMessageSender(message.senderId);
                const isOwnMessage = message.senderId === userId;
                const isSystemMessage = message.type === 'system';
                const isAIMessage = message.type === 'ai';

                if (isSystemMessage) {
                  return (
                    <div key={message.id} className="text-center">
                      <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                        {message.content}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                      {!isOwnMessage && (
                        <div className="flex items-center space-x-2 mb-1">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            isAIMessage 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                              : 'bg-gradient-to-r from-blue-400 to-purple-500 text-white'
                          }`}>
                            {isAIMessage ? <Brain className="w-3 h-3" /> : sender.name.charAt(0)}
                          </div>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            {sender.name}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                      <div className={`px-4 py-2 rounded-lg ${
                        isOwnMessage
                          ? 'bg-blue-500 text-white'
                          : isAIMessage
                          ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 text-slate-900 dark:text-slate-100 border border-purple-200 dark:border-purple-800'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                      </div>
                      {isOwnMessage && (
                        <div className="text-right mt-1">
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Typing indicators */}
              {typingUsers.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {typingUsers.map(id => getMessageSender(id).name).join(', ')} typing...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-2">
              <input
                ref={messageInputRef}
                type="text"
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};