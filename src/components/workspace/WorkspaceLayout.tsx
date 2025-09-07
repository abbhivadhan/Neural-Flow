import React, { useState, useEffect } from 'react';
import { AdaptiveSidebar } from './AdaptiveSidebar';
import { ContextToolbar } from './ContextToolbar';
import { TaskBoard } from './TaskBoard';
import { ProjectGrid } from './ProjectGrid';
import { QuickAddModal } from './QuickAddModal';

import { Task, TaskStatus } from '../../types/task';
import { Project } from '../../types/project';
import { Priority } from '../../types/common';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

interface WorkspaceLayoutProps {
  initialView?: 'dashboard' | 'projects' | 'tasks' | 'calendar' | 'analytics';
  tasks?: Task[];
  projects?: Project[];
  onTaskMove: (taskId: string, newStatus: TaskStatus, newIndex?: number) => void;
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onProjectClick: (project: Project) => void;
  onAddProject: () => void;
  className?: string;
}

type WorkspaceContext = 'coding' | 'writing' | 'research' | 'design' | 'meeting' | 'dashboard';
type ContextToolbarContext = 'coding' | 'writing' | 'research' | 'design' | 'meeting';

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  initialView = 'dashboard',
  tasks = [],
  projects = [],
  onTaskMove,
  onAddTask,
  onEditTask,
  onProjectClick,
  onAddProject,
  className = '',
}) => {
  // Check if coming from tutorial and start with tasks view
  const urlParams = new URLSearchParams(window.location.search);
  const fromTutorial = urlParams.get('tutorial') === 'true';
  const [currentView, setCurrentView] = useState(fromTutorial ? 'tasks' : initialView);
  
  // Ensure we have at least one task column visible for tutorial
  useEffect(() => {
    if (fromTutorial && currentView === 'tasks') {
      // Make sure we're in tasks view for tutorial
      setCurrentView('tasks');
    }
  }, [fromTutorial, currentView]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentContext, setCurrentContext] = useState<WorkspaceContext>('dashboard');
  const [isAIActive] = useState(true);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);

  // Detect context based on current activity and time
  useEffect(() => {
    const detectContext = (): WorkspaceContext => {
      const hour = new Date().getHours();
      
      // Time-based context detection
      if (hour >= 9 && hour <= 11) return 'coding';
      if (hour >= 14 && hour <= 16) return 'meeting';
      if (hour >= 16 && hour <= 18) return 'writing';
      
      // Activity-based context (this would be enhanced with real behavioral data)
      if (currentView === 'tasks') return 'coding';
      if (currentView === 'projects') return 'design';
      if (currentView === 'analytics') return 'research';
      
      return 'dashboard';
    };

    const context = detectContext();
    setCurrentContext(context);
  }, [currentView]);

  const handleNavigation = (itemId: string) => {
    setCurrentView(itemId as any);
  };

  const handleToolbarAction = (actionId: string) => {
    console.log('Toolbar action:', actionId);
    // Handle various toolbar actions
    switch (actionId) {
      case 'search':
        // Open search modal
        break;
      case 'ai-review':
        // Trigger AI code review
        break;
      case 'voice-command':
        // Toggle voice commands
        break;
      default:
        console.log('Unhandled action:', actionId);
    }
  };

  const handleQuickAdd = () => {
    // Context-aware quick add behavior
    switch (currentContext) {
      case 'coding':
      case 'dashboard':
        // For coding context or dashboard, show task creation modal
        setShowQuickAddModal(true);
        break;
      case 'design':
        // For design context, add new project
        onAddProject();
        break;
      case 'writing':
        // For writing context, create new document/task
        setShowQuickAddModal(true);
        break;
      case 'research':
        // For research context, add new research item/task
        setShowQuickAddModal(true);
        break;
      case 'meeting':
        // For meeting context, create new meeting task
        setShowQuickAddModal(true);
        break;
      default:
        setShowQuickAddModal(true);
    }
  };

  const handleQuickAddSubmit = (taskData: { title: string; description: string; priority: Priority }) => {
    // Create a new task with the provided data
    const newTask: Partial<Task> = {
      id: `task-${Date.now()}`,
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      status: 'todo' as TaskStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Log the task creation - in a real app, this would be handled by a proper task management system
    console.log('Quick add task created:', newTask);
    
    // Close the modal - the task has been created with all necessary data
    setShowQuickAddModal(false);
  };

  const renderMainContent = () => {
    switch (currentView) {
      case 'tasks':
        return (
          <TaskBoard
            tasks={tasks}
            onTaskMove={onTaskMove}
            onAddTask={onAddTask}
            onEditTask={onEditTask}
            className="h-full"
            data-tutorial="task-board"
          />
        );
      
      case 'projects':
        return (
          <ProjectGrid
            projects={projects}
            onProjectClick={onProjectClick}
            onAddProject={onAddProject}
            className="h-full"
          />
        );
      

      
      case 'dashboard':
        return (
          <div className="h-full p-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Welcome back Abbhivadhan! 👋
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Your AI-powered workspace is ready. Here's what's happening today.
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="neural-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Active Tasks</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {tasks.filter(t => t.status === 'in_progress').length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <div className="w-6 h-6 bg-blue-500 rounded"></div>
                    </div>
                  </div>
                </div>

                <div className="neural-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Projects</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {projects.filter(p => p.status === 'active').length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <div className="w-6 h-6 bg-green-500 rounded"></div>
                    </div>
                  </div>
                </div>

                <div className="neural-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">AI Suggestions</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">12</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded"></div>
                    </div>
                  </div>
                </div>

                <div className="neural-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Productivity</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">94%</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <div className="w-6 h-6 bg-orange-500 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="neural-card p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Recent Tasks
                  </h3>
                  <div className="space-y-3">
                    {tasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className={`w-3 h-3 rounded-full ${
                          task.status === 'done' ? 'bg-green-500' :
                          task.status === 'in_progress' ? 'bg-blue-500' :
                          'bg-slate-400'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {task.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {task.status.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="neural-card p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    AI Insights
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                        Pattern Detected
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        You're most productive between 9-11 AM. Consider scheduling complex tasks during this time.
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                        Optimization Tip
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Group similar tasks together to reduce context switching and improve focus.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {currentView.charAt(0).toUpperCase() + currentView.slice(1)}
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                This view is coming soon!
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`h-screen flex bg-slate-50 dark:bg-slate-950 ${className}`}>
      {/* Adaptive Sidebar */}
      <AdaptiveSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentContext={currentContext === 'dashboard' ? 'coding' : currentContext as any}
        onNavigate={handleNavigation}
        onQuickAdd={handleQuickAdd}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Context-Aware Toolbar */}
        <ContextToolbar
          context={currentContext === 'dashboard' ? 'coding' : currentContext as ContextToolbarContext}
          onAction={handleToolbarAction}
          isAIActive={isAIActive}
        />

        {/* Tutorial Add Task Button - Only visible during tutorial */}
        {fromTutorial && currentView === 'tasks' && (
          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/20">
            <button
              onClick={() => {
                console.log('Tutorial Add Task button clicked');
                onAddTask('todo');
              }}
              data-tutorial="add-task"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Click here to create your first task as part of the tutorial
            </p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden px-4 pt-4" data-tutorial="workspace">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
              data-tutorial={currentView === 'tasks' ? 'workspace-main' : undefined}
            >
              {renderMainContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
        currentContext={currentContext === 'dashboard' ? 'coding' : currentContext as any}
        onAddTask={handleQuickAddSubmit}
        onAddProject={onAddProject}
        onAddDocument={() => console.log('Add document functionality coming soon')}
        onAddMeeting={() => console.log('Add meeting functionality coming soon')}
        onAddIdea={() => console.log('Add idea functionality coming soon')}
      />
    </div>
  );
};