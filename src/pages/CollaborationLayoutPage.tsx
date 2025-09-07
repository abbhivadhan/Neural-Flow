import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardModeProvider } from '../providers/DashboardModeProvider';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { 
  Users, 
  MessageCircle, 
  Video, 
  Share2, 
  Edit3, 
  Eye, 
  Clock,
  Activity,
  Zap,
  Bell,
  UserPlus,
  Settings,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';

interface CollaboratorStatus {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  currentAction: string;
  lastSeen: string;
  cursor?: { x: number; y: number };
}

interface RealtimeActivity {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'edit' | 'comment' | 'share' | 'view';
}

export default function CollaborationLayoutPage() {
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [collaborators, setCollaborators] = useState<CollaboratorStatus[]>([
    {
      id: '1',
      name: 'Alice Johnson',
      avatar: 'AJ',
      status: 'online',
      currentAction: 'Editing document.md',
      lastSeen: 'now',
      cursor: { x: 45, y: 23 }
    },
    {
      id: '2',
      name: 'Bob Smith',
      avatar: 'BS',
      status: 'online',
      currentAction: 'Reviewing changes',
      lastSeen: '2 min ago',
      cursor: { x: 67, y: 45 }
    },
    {
      id: '3',
      name: 'Carol Davis',
      avatar: 'CD',
      status: 'away',
      currentAction: 'Left a comment',
      lastSeen: '5 min ago'
    },
    {
      id: '4',
      name: 'David Wilson',
      avatar: 'DW',
      status: 'busy',
      currentAction: 'In a meeting',
      lastSeen: '15 min ago'
    }
  ]);

  const [realtimeActivities, setRealtimeActivities] = useState<RealtimeActivity[]>([
    {
      id: '1',
      user: 'Alice Johnson',
      action: 'edited',
      target: 'Project Requirements',
      timestamp: '2 seconds ago',
      type: 'edit'
    },
    {
      id: '2',
      user: 'Bob Smith',
      action: 'commented on',
      target: 'API Documentation',
      timestamp: '1 minute ago',
      type: 'comment'
    },
    {
      id: '3',
      user: 'Carol Davis',
      action: 'shared',
      target: 'Design Mockups',
      timestamp: '3 minutes ago',
      type: 'share'
    },
    {
      id: '4',
      user: 'Alice Johnson',
      action: 'viewed',
      target: 'Analytics Dashboard',
      timestamp: '5 minutes ago',
      type: 'view'
    }
  ]);

  // Simulate real-time updates
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const interval = setInterval(() => {
      // Simulate new activity
      const actions = ['edited', 'commented on', 'shared', 'viewed'];
      const targets = ['Project Plan', 'Code Review', 'Meeting Notes', 'Design System'];
      const users = ['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson'];
      const types: ('edit' | 'comment' | 'share' | 'view')[] = ['edit', 'comment', 'share', 'view'];

      const newActivity: RealtimeActivity = {
        id: Date.now().toString(),
        user: users[Math.floor(Math.random() * users.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        target: targets[Math.floor(Math.random() * targets.length)],
        timestamp: 'just now',
        type: types[Math.floor(Math.random() * types.length)]
      };

      setRealtimeActivities(prev => [newActivity, ...prev.slice(0, 9)]);

      // Update collaborator status
      setCollaborators(prev => prev.map(collab => ({
        ...collab,
        cursor: collab.status === 'online' ? {
          x: Math.random() * 100,
          y: Math.random() * 100
        } : collab.cursor
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, [isRealTimeEnabled]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'edit': return <Edit3 className="w-4 h-4 text-blue-500" />;
      case 'comment': return <MessageCircle className="w-4 h-4 text-green-500" />;
      case 'share': return <Share2 className="w-4 h-4 text-purple-500" />;
      case 'view': return <Eye className="w-4 h-4 text-gray-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <DashboardModeProvider>
      <AppLayout currentContext="meeting">
        <ErrorBoundary>
          <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Real-Time Collaboration
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  Live collaboration dashboard with real-time updates and team activity
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
                  variant={isRealTimeEnabled ? "default" : "outline"}
                  size="sm"
                >
                  {isRealTimeEnabled ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {isRealTimeEnabled ? 'Pause Updates' : 'Resume Updates'}
                </Button>
                
                <Button variant="outline" size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite
                </Button>
                
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>

            {/* Status Bar */}
            <Card className="mb-8 p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {collaborators.filter(c => c.status === 'online').length} online
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {realtimeActivities.length} recent activities
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Real-time sync active
                    </span>
                  </div>
                </div>
                
                {isRealTimeEnabled && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
                    Live
                  </Badge>
                )}
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Collaboration Area */}
              <div className="lg:col-span-2 space-y-6">
                {/* Active Collaborators */}
                <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Active Collaborators
                    </h2>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {collaborators.map((collaborator) => (
                      <div key={collaborator.id} className="flex items-center space-x-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {collaborator.avatar}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(collaborator.status)} rounded-full border-2 border-white dark:border-slate-700`}></div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{collaborator.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {collaborator.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{collaborator.currentAction}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">Last seen: {collaborator.lastSeen}</p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Video className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Collaborative Document Editor Simulation */}
                <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center">
                      <Edit3 className="w-5 h-5 mr-2" />
                      Collaborative Document
                    </h2>
                    <div className="flex items-center space-x-2">
                      <div className="flex -space-x-2">
                        {collaborators.filter(c => c.status === 'online').map((collab, index) => (
                          <div key={collab.id} className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 border-white dark:border-slate-800">
                            {collab.avatar}
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                  
                  <div className="relative bg-slate-50 dark:bg-slate-700 rounded-lg p-6 min-h-[300px]">
                    {/* Simulated cursors */}
                    {collaborators
                      .filter(c => c.status === 'online' && c.cursor)
                      .map((collab) => (
                        <div
                          key={collab.id}
                          className="absolute pointer-events-none transition-all duration-1000"
                          style={{
                            left: `${collab.cursor!.x}%`,
                            top: `${collab.cursor!.y}%`
                          }}
                        >
                          <div className="flex items-center space-x-1">
                            <div className="w-4 h-6 bg-blue-500 rounded-sm"></div>
                            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              {collab.name}
                            </div>
                          </div>
                        </div>
                      ))}
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Project Requirements Document</h3>
                      <div className="space-y-2 text-slate-700 dark:text-slate-300">
                        <p>This document outlines the key requirements for the Neural Flow collaboration system...</p>
                        <p className="bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded border-l-4 border-yellow-500">
                          <span className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">Alice is editing this section</span>
                        </p>
                        <p>The system should support real-time collaboration with the following features:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Live cursor tracking</li>
                          <li>Real-time text synchronization</li>
                          <li>Comment and suggestion system</li>
                          <li>Version history and conflict resolution</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Activity Feed */}
              <div className="space-y-6">
                <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Live Activity Feed
                    </h2>
                    {isRealTimeEnabled && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-600 dark:text-green-400">Live</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {realtimeActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <div className="flex-shrink-0 mt-1">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-900 dark:text-slate-100">
                            <span className="font-medium">{activity.user}</span>
                            {' '}
                            <span className="text-slate-600 dark:text-slate-400">{activity.action}</span>
                            {' '}
                            <span className="font-medium">{activity.target}</span>
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 flex items-center mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {activity.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Quick Actions */}
                <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button className="w-full justify-start" variant="outline">
                      <Video className="w-4 h-4 mr-2" />
                      Start Video Call
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Open Team Chat
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Screen
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Bell className="w-4 h-4 mr-2" />
                      Send Notification
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </ErrorBoundary>
      </AppLayout>
    </DashboardModeProvider>
  );
}