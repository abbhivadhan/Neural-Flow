import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DemoMetricsDashboard } from '../components/demo/DemoMetricsDashboard';
import { AIProcessingVisualization } from '../components/demo/AIProcessingVisualization';
import { BenchmarkComparison } from '../components/demo/BenchmarkComparison';
import { LiveMetricsService } from '../services/demo/LiveMetricsService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useTheme } from '../providers/ThemeProvider';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Download, 
  Share2, 
  Maximize2, 
  Minimize2,
  Monitor,
  Sun,
  Moon,
  Zap,
  Activity,
  BarChart3,
  Brain,
  TrendingUp,
  Users,
  Globe,
  Cpu,
  Database,
  Network,
  Shield,
  Clock,
  Target,
  Layers,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';

export const LiveDemoPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [metricsService] = useState(() => new LiveMetricsService());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPresenterMode, setIsPresenterMode] = useState(false);
  const [demoScenario, setDemoScenario] = useState<string>('standard');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('global');
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [refreshRate, setRefreshRate] = useState(1000);
  const [customFilters, setCustomFilters] = useState<string[]>([]);
  const [performanceMode, setPerformanceMode] = useState<'standard' | 'high' | 'ultra'>('standard');
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start live metrics when component mounts
    metricsService.startLiveUpdates();

    return () => {
      metricsService.stopLiveUpdates();
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, [metricsService]);

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlay) {
      const tabs = ['dashboard', 'processing', 'benchmarks', 'analytics'];
      let currentIndex = tabs.indexOf(activeTab);
      
      autoPlayIntervalRef.current = setInterval(() => {
        currentIndex = (currentIndex + 1) % tabs.length;
        setActiveTab(tabs[currentIndex]);
      }, 5000);
    } else if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
      autoPlayIntervalRef.current = null;
    }

    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, [isAutoPlay, activeTab]);

  // Performance mode effects
  useEffect(() => {
    const newRefreshRate = performanceMode === 'ultra' ? 500 : 
                          performanceMode === 'high' ? 750 : 1000;
    setRefreshRate(newRefreshRate);
    metricsService.setRefreshRate(newRefreshRate);
  }, [performanceMode, metricsService]);

  const handleScenarioChange = (scenario: string) => {
    setDemoScenario(scenario);
    
    // Trigger different demo scenarios
    switch (scenario) {
      case 'high_load':
        metricsService.simulateHighLoad();
        break;
      case 'optimization':
        metricsService.simulateAIOptimization();
        break;
      case 'stress_test':
        metricsService.simulateStressTest();
        break;
      case 'failure_recovery':
        metricsService.simulateFailureRecovery();
        break;
      case 'scaling':
        metricsService.simulateAutoScaling();
        break;
      case 'standard':
      default:
        metricsService.resetDemo();
        break;
    }
  };

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleExportData = () => {
    const data = metricsService.exportMetrics();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neural-flow-metrics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareDemo = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Neural Flow Live Demo',
          text: 'Check out this amazing AI performance dashboard!',
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

  const tabs = [
    { 
      id: 'dashboard', 
      label: 'Live Dashboard', 
      icon: <Monitor className="w-4 h-4" />,
      description: 'Real-time system overview'
    },
    { 
      id: 'processing', 
      label: 'AI Processing', 
      icon: <Brain className="w-4 h-4" />,
      description: 'Neural network performance'
    },
    { 
      id: 'benchmarks', 
      label: 'Benchmarks', 
      icon: <TrendingUp className="w-4 h-4" />,
      description: 'Performance comparisons'
    },
    { 
      id: 'analytics', 
      label: 'Advanced Analytics', 
      icon: <BarChart3 className="w-4 h-4" />,
      description: 'Deep insights and trends'
    },
    { 
      id: 'infrastructure', 
      label: 'Infrastructure', 
      icon: <Database className="w-4 h-4" />,
      description: 'System resources and health'
    },
    { 
      id: 'security', 
      label: 'Security Monitor', 
      icon: <Shield className="w-4 h-4" />,
      description: 'Security metrics and alerts'
    }
  ];

  const scenarios = [
    { id: 'standard', name: 'Standard Operation', description: 'Normal system performance', color: 'bg-green-500' },
    { id: 'high_load', name: 'High Load Demo', description: 'System under heavy usage', color: 'bg-yellow-500' },
    { id: 'optimization', name: 'AI Optimization', description: 'Real-time model improvement', color: 'bg-blue-500' },
    { id: 'stress_test', name: 'Stress Test', description: 'Maximum capacity testing', color: 'bg-red-500' },
    { id: 'failure_recovery', name: 'Failure Recovery', description: 'System resilience demo', color: 'bg-orange-500' },
    { id: 'scaling', name: 'Auto Scaling', description: 'Dynamic resource allocation', color: 'bg-purple-500' }
  ];

  const regions = [
    { id: 'global', name: 'Global', flag: '🌍' },
    { id: 'us-east', name: 'US East', flag: '🇺🇸' },
    { id: 'eu-west', name: 'EU West', flag: '🇪🇺' },
    { id: 'asia-pacific', name: 'Asia Pacific', flag: '🌏' }
  ];

  const performanceModes = [
    { id: 'standard', name: 'Standard', description: '1s refresh', icon: <Activity className="w-4 h-4" /> },
    { id: 'high', name: 'High Performance', description: '750ms refresh', icon: <Zap className="w-4 h-4" /> },
    { id: 'ultra', name: 'Ultra Performance', description: '500ms refresh', icon: <Target className="w-4 h-4" /> }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
    }`}>
      {/* Enhanced Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`border-b transition-colors duration-300 ${
          theme === 'dark' 
            ? 'border-slate-700 bg-slate-900/95' 
            : 'border-slate-200 bg-white/95'
        } backdrop-blur-sm sticky top-0 z-50 shadow-sm`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Neural Flow Live Demo
                </h1>
                <p className={`text-sm mt-1 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Real-time AI Performance & Advanced Analytics Dashboard
                </p>
              </div>
              
              {/* Status Indicators */}
              <div className="flex items-center space-x-2">
                <Badge variant={metricsService.isLive() ? 'default' : 'secondary'} animate>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${
                      metricsService.isLive() ? 'bg-red-500 animate-pulse' : 'bg-gray-500'
                    }`}></div>
                    <span>{metricsService.isLive() ? 'LIVE' : 'PAUSED'}</span>
                  </div>
                </Badge>
                
                <Badge variant="outline">
                  <Globe className="w-3 h-3 mr-1" />
                  {regions.find(r => r.id === selectedRegion)?.name}
                </Badge>
                
                <Badge variant="outline">
                  <Clock className="w-3 h-3 mr-1" />
                  {refreshRate}ms
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <Button
                onClick={toggleTheme}
                variant="outline"
                size="sm"
                className="p-2"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              {/* Performance Mode */}
              <select
                value={performanceMode}
                onChange={(e) => setPerformanceMode(e.target.value as any)}
                className={`px-3 py-1 text-sm rounded-lg border transition-colors duration-300 ${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-600 text-white' 
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                {performanceModes.map(mode => (
                  <option key={mode.id} value={mode.id}>
                    {mode.name}
                  </option>
                ))}
              </select>

              {/* Region Selector */}
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className={`px-3 py-1 text-sm rounded-lg border transition-colors duration-300 ${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-600 text-white' 
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                {regions.map(region => (
                  <option key={region.id} value={region.id}>
                    {region.flag} {region.name}
                  </option>
                ))}
              </select>

              {/* Auto-play Toggle */}
              <Button
                onClick={() => setIsAutoPlay(!isAutoPlay)}
                variant={isAutoPlay ? "default" : "outline"}
                size="sm"
              >
                {isAutoPlay ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isAutoPlay ? 'Pause' : 'Auto'}
              </Button>

              {/* Advanced Controls */}
              <div className="flex items-center space-x-1">
                <Button onClick={handleExportData} variant="outline" size="sm" title="Export Data">
                  <Download className="w-4 h-4" />
                </Button>
                <Button onClick={handleShareDemo} variant="outline" size="sm" title="Share Demo">
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button onClick={handleFullscreenToggle} variant="outline" size="sm" title="Fullscreen">
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </div>

              {/* Settings */}
              <Button
                onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
                variant={showAdvancedMetrics ? "default" : "outline"}
                size="sm"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Advanced Controls Panel */}
          <AnimatePresence>
            {showAdvancedMetrics && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Scenario Selector */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Demo Scenario
                    </label>
                    <div className="space-y-2">
                      {scenarios.map(scenario => (
                        <button
                          key={scenario.id}
                          onClick={() => handleScenarioChange(scenario.id)}
                          className={`w-full text-left p-2 rounded-lg text-sm transition-all duration-200 ${
                            demoScenario === scenario.id
                              ? `${scenario.color} text-white shadow-lg`
                              : theme === 'dark'
                              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <div className="font-medium">{scenario.name}</div>
                          <div className="text-xs opacity-75">{scenario.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Alerts & Notifications */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Alerts & Monitoring
                    </label>
                    <div className="space-y-2">
                      <button
                        onClick={() => setAlertsEnabled(!alertsEnabled)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${
                          theme === 'dark' 
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span>System Alerts</span>
                        {alertsEnabled ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                      </button>
                      <div className={`p-2 rounded-lg text-xs ${
                        theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span>Active Alerts</span>
                          <Badge variant="destructive" size="sm">3</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Performance Mode
                    </label>
                    <div className="space-y-2">
                      {performanceModes.map(mode => (
                        <button
                          key={mode.id}
                          onClick={() => setPerformanceMode(mode.id as any)}
                          className={`w-full flex items-center space-x-2 p-2 rounded-lg text-sm transition-all ${
                            performanceMode === mode.id
                              ? 'bg-blue-500 text-white shadow-lg'
                              : theme === 'dark'
                              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {mode.icon}
                          <div>
                            <div className="font-medium">{mode.name}</div>
                            <div className="text-xs opacity-75">{mode.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* System Status */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      System Status
                    </label>
                    <div className="space-y-2">
                      <div className={`p-2 rounded-lg text-sm ${
                        theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>CPU Usage</span>
                          <span className="text-green-500 font-medium">23%</span>
                        </div>
                        <div className={`w-full h-2 rounded-full ${
                          theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'
                        }`}>
                          <div className="w-1/4 h-2 bg-green-500 rounded-full"></div>
                        </div>
                      </div>
                      <div className={`p-2 rounded-lg text-sm ${
                        theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>Memory</span>
                          <span className="text-blue-500 font-medium">67%</span>
                        </div>
                        <div className={`w-full h-2 rounded-full ${
                          theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'
                        }`}>
                          <div className="w-2/3 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      </div>
                      <div className={`p-2 rounded-lg text-sm ${
                        theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>Network</span>
                          <span className="text-purple-500 font-medium">45%</span>
                        </div>
                        <div className={`w-full h-2 rounded-full ${
                          theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'
                        }`}>
                          <div className="w-1/2 h-2 bg-purple-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Enhanced Tab Navigation */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className={`flex space-x-1 p-1 rounded-xl transition-colors duration-300 ${
            theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'
          }`}>
            {tabs.map((tab, index) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : theme === 'dark'
                    ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <span className={`transition-colors ${
                  activeTab === tab.id ? 'text-white' : ''
                }`}>
                  {tab.icon}
                </span>
                <div className="text-left">
                  <div>{tab.label}</div>
                  <div className={`text-xs opacity-75 ${
                    activeTab === tab.id ? 'text-white/80' : 'text-slate-500'
                  }`}>
                    {tab.description}
                  </div>
                </div>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {isAutoPlay && activeTab === tab.id && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Status Bar */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <Badge variant={isPresenterMode ? 'default' : 'secondary'} animate>
              {isPresenterMode ? (
                <>
                  <Eye className="w-3 h-3 mr-1" />
                  Presenter Mode
                </>
              ) : (
                <>
                  <Monitor className="w-3 h-3 mr-1" />
                  Full Dashboard
                </>
              )}
            </Badge>
            
            <Badge variant="outline">
              <Activity className="w-3 h-3 mr-1" />
              {tabs.find(t => t.id === activeTab)?.label}
            </Badge>
            
            {isAutoPlay && (
              <Badge variant="default" animate>
                <Play className="w-3 h-3 mr-1" />
                Auto-playing
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setIsPresenterMode(!isPresenterMode)}
              variant={isPresenterMode ? "default" : "outline"}
              size="sm"
            >
              {isPresenterMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {isPresenterMode ? 'Exit Presenter' : 'Presenter Mode'}
            </Button>
            
            <Button
              onClick={() => metricsService.resetDemo()}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </motion.div>

        {/* Tab Content with Enhanced Features */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <DemoMetricsDashboard />
                
                {/* Additional Dashboard Widgets */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className={`transition-colors duration-300 ${
                    theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-slate-200'
                  }`}>
                    <div className="p-6">
                      <h3 className={`text-lg font-semibold mb-4 ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>
                        <Activity className="w-5 h-5 inline mr-2" />
                        System Health
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>Uptime</span>
                          <Badge variant="default">99.9%</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>Response Time</span>
                          <Badge variant="default">12ms</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>Error Rate</span>
                          <Badge variant="destructive">0.01%</Badge>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className={`transition-colors duration-300 ${
                    theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-slate-200'
                  }`}>
                    <div className="p-6">
                      <h3 className={`text-lg font-semibold mb-4 ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>
                        <Users className="w-5 h-5 inline mr-2" />
                        Active Users
                      </h3>
                      <div className="text-3xl font-bold text-blue-500 mb-2">1,247</div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        +12% from last hour
                      </div>
                    </div>
                  </Card>

                  <Card className={`transition-colors duration-300 ${
                    theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-slate-200'
                  }`}>
                    <div className="p-6">
                      <h3 className={`text-lg font-semibold mb-4 ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>
                        <TrendingUp className="w-5 h-5 inline mr-2" />
                        Performance Score
                      </h3>
                      <div className="text-3xl font-bold text-green-500 mb-2">94</div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        Excellent performance
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'processing' && (
              <div className="space-y-6">
                <AIProcessingVisualization />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className={`transition-colors duration-300 ${
                    theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-slate-200'
                  }`}>
                    <div className="p-6">
                      <h3 className={`text-xl font-semibold mb-4 ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>
                        <Brain className="w-5 h-5 inline mr-2" />
                        AI Model Performance
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {metricsService.getAIModels().map((model, index) => (
                          <motion.div 
                            key={index} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-4 rounded-lg transition-colors ${
                              theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-100'
                            }`}
                          >
                            <h4 className={`font-medium mb-2 ${
                              theme === 'dark' ? 'text-white' : 'text-slate-900'
                            }`}>
                              {model.name}
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>Inference:</span>
                                <span className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>{model.inferenceTime.toFixed(0)}ms</span>
                              </div>
                              <div className="flex justify-between">
                                <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>Accuracy:</span>
                                <span className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>{model.accuracy.toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>Throughput:</span>
                                <span className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>{model.throughput.toFixed(0)}/s</span>
                              </div>
                              <div className="flex justify-between">
                                <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>Status:</span>
                                <Badge variant={model.status === 'active' ? 'default' : 'secondary'}>
                                  {model.status}
                                </Badge>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </Card>

                  <Card className={`transition-colors duration-300 ${
                    theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-slate-200'
                  }`}>
                    <div className="p-6">
                      <h3 className={`text-xl font-semibold mb-4 ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>
                        <Cpu className="w-5 h-5 inline mr-2" />
                        Processing Queue
                      </h3>
                      <div className="space-y-4">
                        <div className={`p-3 rounded-lg ${
                          theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-100'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>Active Jobs</span>
                            <Badge variant="default">23</Badge>
                          </div>
                          <div className={`w-full h-2 rounded-full ${
                            theme === 'dark' ? 'bg-slate-600' : 'bg-slate-200'
                          }`}>
                            <div className="w-3/4 h-2 bg-blue-500 rounded-full"></div>
                          </div>
                        </div>
                        <div className={`p-3 rounded-lg ${
                          theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-100'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>Pending</span>
                            <Badge variant="secondary">7</Badge>
                          </div>
                          <div className={`w-full h-2 rounded-full ${
                            theme === 'dark' ? 'bg-slate-600' : 'bg-slate-200'
                          }`}>
                            <div className="w-1/4 h-2 bg-yellow-500 rounded-full"></div>
                          </div>
                        </div>
                        <div className={`p-3 rounded-lg ${
                          theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-100'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>Completed</span>
                            <Badge variant="default">1,247</Badge>
                          </div>
                          <div className={`w-full h-2 rounded-full ${
                            theme === 'dark' ? 'bg-slate-600' : 'bg-slate-200'
                          }`}>
                            <div className="w-full h-2 bg-green-500 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'benchmarks' && (
              <div className="space-y-6">
                <BenchmarkComparison />
                
                <Card className={`transition-colors duration-300 ${
                  theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-slate-200'
                }`}>
                  <div className="p-6">
                    <h3 className={`text-xl font-semibold mb-4 ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      <Target className="w-5 h-5 inline mr-2" />
                      Performance Benchmarks
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-500 mb-2">2.3ms</div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          Average Response Time
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-500 mb-2">99.99%</div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          Uptime SLA
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-500 mb-2">10K</div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          Requests per Second
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <Card className={`transition-colors duration-300 ${
                  theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-slate-200'
                }`}>
                  <div className="p-6">
                    <h3 className={`text-xl font-semibold mb-4 ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      <BarChart3 className="w-5 h-5 inline mr-2" />
                      Advanced Analytics Dashboard
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className={`p-4 rounded-lg ${
                        theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-100'
                      }`}>
                        <h4 className={`font-medium mb-3 ${
                          theme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>
                          Traffic Patterns
                        </h4>
                        <div className="h-32 flex items-end space-x-2">
                          {Array.from({ length: 12 }, (_, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-blue-500 rounded-t"
                              style={{ height: `${Math.random() * 100}%` }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className={`p-4 rounded-lg ${
                        theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-100'
                      }`}>
                        <h4 className={`font-medium mb-3 ${
                          theme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>
                          User Engagement
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>Session Duration</span>
                            <span className="font-medium">4m 32s</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>Bounce Rate</span>
                            <span className="font-medium">23%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>Conversion Rate</span>
                            <span className="font-medium">8.7%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'infrastructure' && (
              <div className="space-y-6">
                <Card className={`transition-colors duration-300 ${
                  theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-slate-200'
                }`}>
                  <div className="p-6">
                    <h3 className={`text-xl font-semibold mb-4 ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      <Database className="w-5 h-5 inline mr-2" />
                      Infrastructure Overview
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className={`p-4 rounded-lg text-center ${
                        theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-100'
                      }`}>
                        <Cpu className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                        <div className="text-2xl font-bold text-blue-500">23%</div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>CPU Usage</div>
                      </div>
                      <div className={`p-4 rounded-lg text-center ${
                        theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-100'
                      }`}>
                        <Database className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        <div className="text-2xl font-bold text-green-500">67%</div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Memory</div>
                      </div>
                      <div className={`p-4 rounded-lg text-center ${
                        theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-100'
                      }`}>
                        <Network className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                        <div className="text-2xl font-bold text-purple-500">45%</div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Network</div>
                      </div>
                      <div className={`p-4 rounded-lg text-center ${
                        theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-100'
                      }`}>
                        <Activity className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                        <div className="text-2xl font-bold text-orange-500">12</div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Active Nodes</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <Card className={`transition-colors duration-300 ${
                  theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-slate-200'
                }`}>
                  <div className="p-6">
                    <h3 className={`text-xl font-semibold mb-4 ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      <Shield className="w-5 h-5 inline mr-2" />
                      Security Monitor
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className={`p-4 rounded-lg ${
                        theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-100'
                      }`}>
                        <h4 className={`font-medium mb-3 ${
                          theme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>
                          Threat Level
                        </h4>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-500 mb-2">LOW</div>
                          <Badge variant="default">All Clear</Badge>
                        </div>
                      </div>
                      <div className={`p-4 rounded-lg ${
                        theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-100'
                      }`}>
                        <h4 className={`font-medium mb-3 ${
                          theme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>
                          Active Alerts
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>Critical</span>
                            <Badge variant="destructive">0</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>Warning</span>
                            <Badge variant="secondary">2</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>Info</span>
                            <Badge variant="outline">5</Badge>
                          </div>
                        </div>
                      </div>
                      <div className={`p-4 rounded-lg ${
                        theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-100'
                      }`}>
                        <h4 className={`font-medium mb-3 ${
                          theme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>
                          Security Score
                        </h4>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-500 mb-2">98</div>
                          <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                            Excellent Security
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Action Button for Quick Actions */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <Button
          onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
          className="w-14 h-14 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          title="Toggle Advanced Controls"
        >
          <Settings className="w-6 h-6" />
        </Button>
      </motion.div>

      {/* Auto-play Progress Indicator */}
      {isAutoPlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-6 left-6 z-40"
        >
          <Card className={`p-3 ${
            theme === 'dark' ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-slate-200'
          } backdrop-blur-sm`}>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                Auto-playing Demo
              </span>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};