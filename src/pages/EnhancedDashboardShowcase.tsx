import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Minimize2,
  Settings,
  Info,
  Zap,
  Brain,
  Users,
  BarChart3,
  Sparkles,
  Activity,
  TrendingUp,
  MessageSquare,
  FileText,
  Eye,
  Share2,
  Download
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EnhancedDashboard } from '../components/dashboard/EnhancedDashboard';
import { AdvancedVisualizationSidebar } from '../components/dashboard/AdvancedVisualizationSidebar';
import { RealTimeCollaborationPanel } from '../components/dashboard/RealTimeCollaborationPanel';
import { ContentAIPanel } from '../components/dashboard/ContentAIPanel';

interface DemoStep {
  id: string;
  title: string;
  description: string;
  component: 'sidebar' | 'dashboard' | 'collaboration' | 'ai' | 'all';
  duration: number;
  highlights: string[];
}

export default function EnhancedDashboardShowcase() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [collaborationExpanded, setCollaborationExpanded] = useState(false);
  const [contentAIExpanded, setContentAIExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);

  // Sample team members for collaboration demo
  const teamMembers = [
    { id: '1', name: 'Alice Johnson', status: 'active' as const, currentActivity: 'Editing dashboard' },
    { id: '2', name: 'Bob Smith', status: 'active' as const, currentActivity: 'Reviewing analytics' },
    { id: '3', name: 'Carol Davis', status: 'idle' as const, currentActivity: 'In meeting' },
    { id: '4', name: 'David Wilson', status: 'away' as const, lastSeen: new Date(Date.now() - 1800000) },
    { id: '5', name: 'Eva Brown', status: 'active' as const, currentActivity: 'Working on visualizations' }
  ];

  const demoSteps: DemoStep[] = [
    {
      id: 'intro',
      title: 'Welcome to Enhanced Dashboard',
      description: 'Experience the next generation of data visualization, real-time collaboration, and AI-powered content generation.',
      component: 'all',
      duration: 3000,
      highlights: ['Real-time updates', 'AI integration', 'Collaborative features']
    },
    {
      id: 'sidebar',
      title: 'Advanced Visualization Sidebar',
      description: 'Interactive charts and data widgets with real-time updates and customizable layouts.',
      component: 'sidebar',
      duration: 5000,
      highlights: ['Mini charts', 'Real-time data', 'Export capabilities', 'Customizable widgets']
    },
    {
      id: 'dashboard',
      title: 'Enhanced Dashboard',
      description: 'Comprehensive analytics with live metrics, productivity tracking, and AI insights.',
      component: 'dashboard',
      duration: 4000,
      highlights: ['Live metrics', 'Productivity trends', 'AI insights', 'Team activity']
    },
    {
      id: 'collaboration',
      title: 'Real-Time Collaboration',
      description: 'Team chat, presence indicators, voice/video calls, and collaborative editing.',
      component: 'collaboration',
      duration: 6000,
      highlights: ['Team presence', 'Real-time chat', 'Voice/video calls', 'Activity tracking']
    },
    {
      id: 'ai',
      title: 'Content AI Assistant',
      description: 'AI-powered content generation, optimization suggestions, and writing assistance.',
      component: 'ai',
      duration: 5000,
      highlights: ['Content generation', 'Writing suggestions', 'SEO optimization', 'Readability analysis']
    }
  ];

  // Auto-play demo
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        const nextStep = (prev + 1) % demoSteps.length;
        
        // Auto-expand panels based on current step
        const step = demoSteps[nextStep];
        switch (step.component) {
          case 'sidebar':
            setSidebarCollapsed(false);
            setCollaborationExpanded(false);
            setContentAIExpanded(false);
            break;
          case 'collaboration':
            setCollaborationExpanded(true);
            setContentAIExpanded(false);
            break;
          case 'ai':
            setCollaborationExpanded(false);
            setContentAIExpanded(true);
            break;
          case 'all':
            setCollaborationExpanded(true);
            setContentAIExpanded(true);
            setSidebarCollapsed(false);
            break;
        }
        
        return nextStep;
      });
    }, demoSteps[currentStep]?.duration || 4000);

    return () => clearInterval(interval);
  }, [isPlaying, currentStep, demoSteps]);

  // Update progress
  useEffect(() => {
    setDemoProgress((currentStep / (demoSteps.length - 1)) * 100);
  }, [currentStep, demoSteps.length]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setSidebarCollapsed(false);
    setCollaborationExpanded(false);
    setContentAIExpanded(false);
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    setIsPlaying(false);
  };

  const currentStepData = demoSteps[currentStep];

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'} bg-slate-50 dark:bg-slate-950`}>
      {/* Demo Controls */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Enhanced Dashboard Showcase
              </h1>
              <Badge variant="default" animate>
                Interactive Demo
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Demo Controls */}
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handlePlayPause}
                  variant={isPlaying ? "destructive" : "default"}
                  size="sm"
                >
                  {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {isPlaying ? 'Pause' : 'Play'} Demo
                </Button>
                <Button onClick={handleReset} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  variant="outline"
                  size="sm"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Step {currentStep + 1} of {demoSteps.length}: {currentStepData?.title}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {Math.round(demoProgress)}% Complete
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${demoProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Step Navigation */}
          <div className="flex items-center space-x-2 mt-4">
            {demoSteps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => handleStepClick(index)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-blue-500 text-white'
                    : index < currentStep
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {step.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Current Step Info */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-slate-200 dark:border-slate-700 p-4"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  {currentStepData?.title}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-3">
                  {currentStepData?.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentStepData?.highlights.map((highlight, index) => (
                    <Badge key={index} variant="secondary" size="sm">
                      {highlight}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <div className="flex items-center space-x-1">
                  <Activity className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Live Demo</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Main Dashboard */}
      <div className="flex h-full">
        {/* Advanced Visualization Sidebar */}
        <motion.div
          animate={{
            opacity: currentStepData?.component === 'sidebar' || currentStepData?.component === 'all' ? 1 : 0.7,
            scale: currentStepData?.component === 'sidebar' ? 1.02 : 1
          }}
          transition={{ duration: 0.5 }}
        >
          <AdvancedVisualizationSidebar
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </motion.div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <motion.div
            animate={{
              opacity: currentStepData?.component === 'dashboard' || currentStepData?.component === 'all' ? 1 : 0.7,
              scale: currentStepData?.component === 'dashboard' ? 1.01 : 1
            }}
            transition={{ duration: 0.5 }}
            className="flex-1 overflow-hidden"
          >
            <EnhancedDashboard
              userId="demo-user"
              teamMembers={teamMembers}
              className="h-full"
            />
          </motion.div>
        </div>

        {/* Right Panel - Collaboration & AI */}
        <div className="w-96 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col">
          {/* Collaboration Panel */}
          <motion.div
            animate={{
              opacity: currentStepData?.component === 'collaboration' || currentStepData?.component === 'all' ? 1 : 0.7,
              scale: currentStepData?.component === 'collaboration' ? 1.02 : 1
            }}
            transition={{ duration: 0.5 }}
            className={`${collaborationExpanded ? 'flex-1' : 'flex-shrink-0'} transition-all duration-300`}
          >
            <RealTimeCollaborationPanel
              userId="demo-user"
              teamMembers={teamMembers}
              isExpanded={collaborationExpanded}
              onToggleExpanded={() => setCollaborationExpanded(!collaborationExpanded)}
              className="h-full"
            />
          </motion.div>

          {/* Content AI Panel */}
          <motion.div
            animate={{
              opacity: currentStepData?.component === 'ai' || currentStepData?.component === 'all' ? 1 : 0.7,
              scale: currentStepData?.component === 'ai' ? 1.02 : 1
            }}
            transition={{ duration: 0.5 }}
            className={`${contentAIExpanded ? 'flex-1' : 'flex-shrink-0'} transition-all duration-300 ${collaborationExpanded && contentAIExpanded ? 'border-t border-slate-200 dark:border-slate-700' : ''}`}
          >
            <ContentAIPanel
              isExpanded={contentAIExpanded}
              onToggleExpanded={() => setContentAIExpanded(!contentAIExpanded)}
              className="h-full"
            />
          </motion.div>

          {/* Feature Highlights */}
          {!collaborationExpanded && !contentAIExpanded && (
            <div className="p-4 space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Key Features</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Advanced Visualizations
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Interactive charts with real-time updates
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <Users className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Real-Time Collaboration
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Team chat, presence, and voice calls
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-500" />
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      AI Content Assistant
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Smart writing and optimization
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <Activity className="w-5 h-5 text-orange-500" />
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Live Metrics
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Real-time performance tracking
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Demo Overlay */}
      {isPlaying && (
        <div className="fixed top-4 right-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4"
          >
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Demo Playing
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}