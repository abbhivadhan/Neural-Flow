import React, { useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DashboardModeProvider } from '../providers/DashboardModeProvider';
import { EnhancedDashboard } from '../components/dashboard/EnhancedDashboard';
import { AdvancedVisualizationSidebar } from '../components/dashboard/AdvancedVisualizationSidebar';
import { RealTimeCollaborationPanel } from '../components/dashboard/RealTimeCollaborationPanel';
import { ContentAIPanel } from '../components/dashboard/ContentAIPanel';
import { 
  Zap, 
  Brain, 
  BarChart3, 
  Users, 
  Code, 
  FileText,
  Calendar,
  Search,
  Layers,
  MessageSquare,
  Sparkles
} from 'lucide-react';

export default function DemoLayoutPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [collaborationExpanded, setCollaborationExpanded] = useState(false);
  const [contentAIExpanded, setContentAIExpanded] = useState(false);
  const [currentContent, setCurrentContent] = useState('');

  // Sample team members for collaboration demo
  const teamMembers = [
    { id: '1', name: 'Alice Johnson', status: 'active' as const, currentActivity: 'Editing dashboard' },
    { id: '2', name: 'Bob Smith', status: 'active' as const, currentActivity: 'Reviewing analytics' },
    { id: '3', name: 'Carol Davis', status: 'idle' as const, currentActivity: 'In meeting' },
    { id: '4', name: 'David Wilson', status: 'away' as const, lastSeen: new Date(Date.now() - 1800000) },
    { id: '5', name: 'Eva Brown', status: 'active' as const, currentActivity: 'Working on visualizations' }
  ];

  return (
    <DashboardModeProvider>
      <div className="h-screen flex bg-slate-50 dark:bg-slate-950">
        {/* Advanced Visualization Sidebar */}
        <AdvancedVisualizationSidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Neural Flow Enhanced Dashboard
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Real-time collaboration, AI-powered content generation, and advanced data visualization
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => setCollaborationExpanded(!collaborationExpanded)}
                  variant={collaborationExpanded ? "default" : "outline"}
                  size="sm"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Collaboration
                </Button>
                <Button
                  onClick={() => setContentAIExpanded(!contentAIExpanded)}
                  variant={contentAIExpanded ? "default" : "outline"}
                  size="sm"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Content AI
                </Button>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="flex-1 overflow-hidden">
            <EnhancedDashboard
              userId="current-user"
              teamMembers={teamMembers}
              className="h-full"
            />
          </div>
        </div>

        {/* Right Panel - Collaboration & AI */}
        <div className="w-96 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col">
          {/* Collaboration Panel */}
          <div className={`${collaborationExpanded ? 'flex-1' : 'flex-shrink-0'} transition-all duration-300`}>
            <RealTimeCollaborationPanel
              userId="current-user"
              teamMembers={teamMembers}
              isExpanded={collaborationExpanded}
              onToggleExpanded={() => setCollaborationExpanded(!collaborationExpanded)}
              className="h-full"
            />
          </div>

          {/* Content AI Panel */}
          <div className={`${contentAIExpanded ? 'flex-1' : 'flex-shrink-0'} transition-all duration-300 ${collaborationExpanded && contentAIExpanded ? 'border-t border-slate-200 dark:border-slate-700' : ''}`}>
            <ContentAIPanel
              isExpanded={contentAIExpanded}
              onToggleExpanded={() => setContentAIExpanded(!contentAIExpanded)}
              currentContent={currentContent}
              onContentUpdate={setCurrentContent}
              className="h-full"
            />
          </div>

          {/* Quick Actions */}
          {!collaborationExpanded && !contentAIExpanded && (
            <div className="p-4 space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Content
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Start Chat
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Create Chart
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Layers className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardModeProvider>
  );
}


    </DashboardModeProvider>
  );
}