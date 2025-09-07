import React, { useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardModeProvider } from '../providers/DashboardModeProvider';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Activity, 
  Download, 
  RefreshCw,
  Settings,
  Eye,
  Share2,
  Zap
} from 'lucide-react';

export default function VisualizationLayoutPage() {
  const [activeTab, setActiveTab] = useState('productivity');
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  const tabs = [
    { id: 'productivity', label: 'Productivity', icon: TrendingUp },
    { id: 'behavior', label: 'Behavior', icon: BarChart3 },
    { id: 'correlations', label: 'Correlations', icon: PieChart },
    { id: 'trends', label: 'Trends', icon: Activity },
    { id: 'realtime', label: 'Real-time', icon: Eye }
  ];

  const timeRanges = [
    { value: '1d', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' }
  ];

  const insights = [
    "Your productivity peaks between 10 AM and 12 PM with 87% efficiency",
    "Focus time has increased by 15% this week compared to last week",
    "Collaboration activities show strong correlation with project completion rates",
    "Weekend work patterns suggest potential burnout risk - consider more breaks"
  ];

  const createVisualizationPlaceholder = (title: string, type: string) => (
    <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      <div className="h-80 bg-slate-50 dark:bg-slate-700 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-200 dark:bg-slate-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            {type === 'line' && <TrendingUp className="w-8 h-8 text-slate-500 dark:text-slate-400" />}
            {type === 'bar' && <BarChart3 className="w-8 h-8 text-slate-500 dark:text-slate-400" />}
            {type === 'pie' && <PieChart className="w-8 h-8 text-slate-500 dark:text-slate-400" />}
            {type === 'activity' && <Activity className="w-8 h-8 text-slate-500 dark:text-slate-400" />}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {type.charAt(0).toUpperCase() + type.slice(1)} visualization would appear here
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            Interactive charts with real-time data updates
          </p>
        </div>
      </div>
    </Card>
  );

  return (
    <DashboardModeProvider>
      <AppLayout currentContext="coding">
        <ErrorBoundary>
          <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Advanced Data Visualization
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  Interactive charts and AI-generated insights for data storytelling
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {timeRanges.map(range => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
                
                <Button
                  onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                  variant={realTimeEnabled ? "default" : "outline"}
                  size="sm"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  {realTimeEnabled ? 'Live' : 'Static'}
                </Button>
                
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* AI Insights Panel */}
            <Card className="mb-8 p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <div className="flex items-center mb-4">
                <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">AI-Generated Insights</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight, index) => (
                  <div key={index} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">{insight}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Visualization Tabs */}
            <div className="mb-6">
              <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-8">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                        {tab.id === 'realtime' && realTimeEnabled && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1" />
                            Live
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'productivity' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {createVisualizationPlaceholder('Productivity Metrics Over Time', 'line')}
                  {createVisualizationPlaceholder('Task Completion Rates', 'bar')}
                </div>
              )}

              {activeTab === 'behavior' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {createVisualizationPlaceholder('Activity Heatmap', 'activity')}
                  {createVisualizationPlaceholder('Work Pattern Analysis', 'bar')}
                </div>
              )}

              {activeTab === 'correlations' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {createVisualizationPlaceholder('Metric Correlation Matrix', 'pie')}
                  {createVisualizationPlaceholder('Performance Relationships', 'line')}
                </div>
              )}

              {activeTab === 'trends' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {createVisualizationPlaceholder('Trend Analysis with Forecasting', 'line')}
                  {createVisualizationPlaceholder('Seasonal Patterns', 'bar')}
                </div>
              )}

              {activeTab === 'realtime' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {createVisualizationPlaceholder('Real-time Performance Dashboard', 'activity')}
                  {createVisualizationPlaceholder('Live Metrics Stream', 'line')}
                </div>
              )}
            </div>

            {/* Export and Sharing Options */}
            <Card className="mt-8 p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <div className="flex items-center mb-4">
                <Share2 className="h-5 w-5 mr-2 text-slate-600 dark:text-slate-400" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Export & Sharing Options</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="flex items-center justify-center">
                  <Download className="h-4 w-4 mr-2" />
                  Export Full Report (PDF)
                </Button>
                
                <Button variant="outline" className="flex items-center justify-center">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Dashboard
                </Button>
                
                <Button variant="outline" className="flex items-center justify-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Schedule Reports
                </Button>
              </div>
            </Card>
          </div>
        </ErrorBoundary>
      </AppLayout>
    </DashboardModeProvider>
  );
}