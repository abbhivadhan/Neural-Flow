import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  Brain, 
  Activity, 
  TrendingUp, 
  Zap,
  MessageSquare,
  FileText,
  Eye,
  Share2,
  Settings,
  RefreshCw,
  Download,
  PieChart,
  LineChart,
  Layers,
  Globe,
  Clock,
  Target
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CollaborationEngine } from '../../services/collaboration/CollaborationEngine';
import { DataVisualizationService } from '../../services/visualization/DataVisualizationService';

interface EnhancedDashboardProps {
  className?: string;
  userId: string;
  teamMembers: any[];
}

interface DashboardWidget {
  id: string;
  title: string;
  type: 'chart' | 'collaboration' | 'ai' | 'metrics';
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  data?: any;
}

export const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({
  className = '',
  userId,
  teamMembers
}) => {
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [realTimeData, setRealTimeData] = useState<any[]>([]);
  const [collaborationEngine, setCollaborationEngine] = useState<CollaborationEngine | null>(null);
  const [visualizationService] = useState(() => new DataVisualizationService());
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  
  // Chart refs
  const productivityChartRef = useRef<HTMLDivElement>(null);
  const collaborationChartRef = useRef<HTMLDivElement>(null);
  const aiInsightsRef = useRef<HTMLDivElement>(null);
  const realTimeMetricsRef = useRef<HTMLDivElement>(null);

  // Initialize collaboration engine
  useEffect(() => {
    const engine = new CollaborationEngine({
      websocketUrl: 'ws://localhost:8080/collaboration',
      userId,
      sessionId: 'dashboard-session',
      enableRealTimeSync: true,
      enableConflictResolution: true,
      enableExpertiseMatching: true,
      enableCommunicationAnalysis: true
    });

    engine.on('presence_updated', (presence) => {
      setActiveUsers(prev => prev + (presence.status === 'active' ? 1 : -1));
    });

    setCollaborationEngine(engine);
    engine.startSession('dashboard-session', teamMembers);

    return () => engine.destroy();
  }, [userId, teamMembers]);

  // Real-time data updates
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const interval = setInterval(() => {
      const newDataPoint = {
        timestamp: new Date().toISOString(),
        productivity: 0.7 + Math.random() * 0.3,
        collaboration: 0.6 + Math.random() * 0.4,
        aiUsage: 0.5 + Math.random() * 0.5,
        activeUsers: Math.floor(Math.random() * 10) + 1
      };
      
      setRealTimeData(prev => [...prev.slice(-50), newDataPoint]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isRealTimeEnabled]);

  // Initialize charts
  useEffect(() => {
    if (productivityChartRef.current && realTimeData.length > 0) {
      createProductivityChart();
    }
    if (collaborationChartRef.current && realTimeData.length > 0) {
      createCollaborationChart();
    }
    if (aiInsightsRef.current) {
      createAIInsightsChart();
    }
    if (realTimeMetricsRef.current && realTimeData.length > 0) {
      createRealTimeMetrics();
    }
  }, [realTimeData]);

  const createProductivityChart = () => {
    if (!productivityChartRef.current) return;
    
    const container = productivityChartRef.current;
    const data = realTimeData.slice(-20);
    
    container.innerHTML = `
      <div class="h-full flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Productivity Trends</h3>
          <div class="flex items-center space-x-2">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span class="text-xs text-slate-500">Live</span>
          </div>
        </div>
        <div class="flex-1 relative">
          <svg class="w-full h-full" viewBox="0 0 400 200">
            ${data.map((d, i) => {
              const x = (i / (data.length - 1)) * 380 + 10;
              const y = 190 - (d.productivity * 160);
              return `<circle cx="${x}" cy="${y}" r="3" fill="#3b82f6" opacity="0.8"/>`;
            }).join('')}
            <polyline
              fill="none"
              stroke="#3b82f6"
              stroke-width="2"
              points="${data.map((d, i) => {
                const x = (i / (data.length - 1)) * 380 + 10;
                const y = 190 - (d.productivity * 160);
                return `${x},${y}`;
              }).join(' ')}"
            />
          </svg>
          <div class="absolute bottom-2 right-2 text-2xl font-bold text-blue-600">
            ${data.length > 0 ? Math.round(data[data.length - 1].productivity * 100) : 0}%
          </div>
        </div>
      </div>
    `;
  };

  const createCollaborationChart = () => {
    if (!collaborationChartRef.current) return;
    
    const container = collaborationChartRef.current;
    
    container.innerHTML = `
      <div class="h-full flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Team Activity</h3>
          <span class="text-sm text-slate-500">${activeUsers} active</span>
        </div>
        <div class="flex-1 space-y-3">
          ${teamMembers.slice(0, 5).map((member, i) => `
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                ${member.name?.charAt(0) || 'U'}
              </div>
              <div class="flex-1">
                <div class="text-sm font-medium text-slate-900 dark:text-slate-100">${member.name || 'User'}</div>
                <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div class="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full" style="width: ${Math.random() * 100}%"></div>
                </div>
              </div>
              <div class="text-xs text-slate-500">${Math.floor(Math.random() * 60)}m</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  const createAIInsightsChart = () => {
    if (!aiInsightsRef.current) return;
    
    const container = aiInsightsRef.current;
    const insights = [
      "Peak productivity detected at 10:30 AM",
      "Collaboration increased by 23% this week",
      "Suggested break time: 2:30 PM",
      "Focus mode recommended for next task"
    ];
    
    container.innerHTML = `
      <div class="h-full flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">AI Insights</h3>
          <div class="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
        </div>
        <div class="flex-1 space-y-3">
          ${insights.map((insight, i) => `
            <div class="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <p class="text-sm text-purple-800 dark:text-purple-200">${insight}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  const createRealTimeMetrics = () => {
    if (!realTimeMetricsRef.current) return;
    
    const container = realTimeMetricsRef.current;
    const latest = realTimeData[realTimeData.length - 1];
    
    if (!latest) return;
    
    container.innerHTML = `
      <div class="h-full flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Live Metrics</h3>
          <div class="flex items-center space-x-1">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span class="text-xs text-slate-500">Real-time</span>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4 flex-1">
          <div class="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">${Math.round(latest.productivity * 100)}%</div>
            <div class="text-xs text-slate-600 dark:text-slate-400">Productivity</div>
          </div>
          <div class="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div class="text-2xl font-bold text-green-600 dark:text-green-400">${latest.activeUsers}</div>
            <div class="text-xs text-slate-600 dark:text-slate-400">Active Users</div>
          </div>
          <div class="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">${Math.round(latest.aiUsage * 100)}%</div>
            <div class="text-xs text-slate-600 dark:text-slate-400">AI Usage</div>
          </div>
          <div class="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">${Math.round(latest.collaboration * 100)}%</div>
            <div class="text-xs text-slate-600 dark:text-slate-400">Collaboration</div>
          </div>
        </div>
      </div>
    `;
  };

  return (
    <div className={`h-full bg-slate-50 dark:bg-slate-950 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Enhanced Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Real-time collaboration, AI insights, and advanced analytics
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
              variant={isRealTimeEnabled ? "default" : "outline"}
              size="sm"
            >
              <Activity className="w-4 h-4 mr-2" />
              {isRealTimeEnabled ? 'Live' : 'Paused'}
            </Button>
            
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="p-6 h-full overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Left Column - Productivity & Analytics */}
          <div className="space-y-6">
            {/* Productivity Chart */}
            <Card className="p-6 h-80">
              <div 
                ref={productivityChartRef}
                className="h-full"
              />
            </Card>

            {/* Quick Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Today's Overview
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {realTimeData.length}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Data Points</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {teamMembers.length}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Team Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {activeUsers}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Active Now</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    94%
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Uptime</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Middle Column - Collaboration */}
          <div className="space-y-6">
            {/* Team Activity */}
            <Card className="p-6 h-80">
              <div 
                ref={collaborationChartRef}
                className="h-full"
              />
            </Card>

            {/* Content AI Panel */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-purple-500" />
                  Content AI
                </h3>
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
                  Active
                </Badge>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Document Generation
                    </span>
                    <span className="text-xs text-green-600 dark:text-green-400">Ready</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Content Enhancement
                    </span>
                    <span className="text-xs text-blue-600 dark:text-blue-400">Processing</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Style Analysis
                    </span>
                    <span className="text-xs text-purple-600 dark:text-purple-400">Learning</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - AI Insights & Real-time */}
          <div className="space-y-6">
            {/* AI Insights */}
            <Card className="p-6 h-80">
              <div 
                ref={aiInsightsRef}
                className="h-full"
              />
            </Card>

            {/* Real-time Metrics */}
            <Card className="p-6 h-64">
              <div 
                ref={realTimeMetricsRef}
                className="h-full"
              />
            </Card>
          </div>
        </div>

        {/* Bottom Section - Advanced Visualizations */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Advanced Chart 1 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                Performance Trends
              </h3>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
            <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <LineChart className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">Advanced trend analysis</p>
                <p className="text-sm text-slate-500 dark:text-slate-500">Interactive charts with forecasting</p>
              </div>
            </div>
          </Card>

          {/* Advanced Chart 2 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-green-500" />
                Resource Distribution
              </h3>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </Button>
              </div>
            </div>
            <div className="h-64 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <PieChart className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">Resource allocation analysis</p>
                <p className="text-sm text-slate-500 dark:text-slate-500">Real-time distribution tracking</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};