import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Badge } from '../ui/Badge';
import { 
  Download, 
  RefreshCw, 
  Settings, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Activity,
  Zap,
  Eye,
  Share2
} from 'lucide-react';

import { DataVisualizationService, VisualizationData, ExportOptions, InteractiveChart } from '../../services/visualization/DataVisualizationService';
import { ProductivityMetricsService } from '../../services/analytics/ProductivityMetricsService';
import { BehavioralAnalysisService } from '../../services/analytics/BehavioralAnalysisService';
import { PerformanceForecastingService } from '../../services/analytics/PerformanceForecastingService';
import { ChartType } from '../../types/analytics';
import { TimeRange } from '../../types/common';

interface AdvancedVisualizationDashboardProps {
  userId: string;
  className?: string;
}

interface ChartConfig {
  id: string;
  title: string;
  type: ChartType;
  dataSource: string;
  refreshInterval: number;
  exportEnabled: boolean;
}

export default function AdvancedVisualizationDashboard({ 
  userId, 
  className = '' 
}: AdvancedVisualizationDashboardProps) {
  // State management
  const [activeTab, setActiveTab] = useState('productivity');
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);

  // Chart references
  const productivityChartRef = useRef<HTMLDivElement>(null);
  const behaviorHeatmapRef = useRef<HTMLDivElement>(null);
  const correlationMatrixRef = useRef<HTMLDivElement>(null);
  const trendAnalysisRef = useRef<HTMLDivElement>(null);
  const performanceForecastRef = useRef<HTMLDivElement>(null);
  const realTimeDashboardRef = useRef<HTMLDivElement>(null);

  // Services
  const [visualizationService] = useState(() => new DataVisualizationService());
  const [productivityService] = useState(() => new ProductivityMetricsService());
  const [behavioralService] = useState(() => new BehavioralAnalysisService());
  const [forecastingService] = useState(() => new PerformanceForecastingService());

  // Chart instances
  const [charts, setCharts] = useState<Map<string, InteractiveChart>>(new Map());
  const [visualizationData, setVisualizationData] = useState<VisualizationData[]>([]);
  const [insights, setInsights] = useState<string[]>([]);

  // Load visualization data
  const loadVisualizationData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate sample data for demonstrations
      const productivityData = await generateProductivityData();
      const behaviorData = await generateBehaviorData();
      const correlationData = await generateCorrelationData();
      const trendData = await generateTrendData();
      const forecastData = await generateForecastData();

      setVisualizationData([
        {
          id: 'productivity-metrics',
          title: 'Productivity Metrics Over Time',
          data: productivityData,
          config: {
            chartType: ChartType.LINE,
            axes: [],
            series: [],
            colors: { type: 'categorical', colors: [] },
            styling: {} as any,
            interactions: []
          }
        },
        {
          id: 'behavior-heatmap',
          title: 'Activity Heatmap',
          data: behaviorData,
          config: {
            chartType: ChartType.HEATMAP,
            axes: [],
            series: [],
            colors: { type: 'sequential', colors: [] },
            styling: {} as any,
            interactions: []
          }
        },
        {
          id: 'correlation-matrix',
          title: 'Metric Correlations',
          data: correlationData,
          config: {
            chartType: ChartType.HEATMAP,
            axes: [],
            series: [],
            colors: { type: 'diverging', colors: [] },
            styling: {} as any,
            interactions: []
          }
        }
      ]);

      // Generate insights
      const allInsights = [
        ...visualizationService.generateVisualizationInsights(productivityData, ChartType.LINE),
        ...visualizationService.generateVisualizationInsights(behaviorData, ChartType.HEATMAP),
        ...visualizationService.generateVisualizationInsights(correlationData, ChartType.SCATTER)
      ];
      setInsights(allInsights);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load visualization data');
      console.error('Visualization loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, timeRange, visualizationService]);

  // Initialize charts
  const initializeCharts = useCallback(async () => {
    if (!visualizationData.length) return;

    const newCharts = new Map<string, InteractiveChart>();

    try {
      // Productivity metrics chart
      if (productivityChartRef.current) {
        try {
          const productivityData = visualizationData.find(v => v.id === 'productivity-metrics')?.data || await generateProductivityData();
          const productivityChart = visualizationService.createProductivityMetricsChart(
            'productivity-chart',
            productivityData
          );
          newCharts.set('productivity', productivityChart);
        } catch (err) {
          console.error('Productivity chart error:', err);
          createFallbackChart(productivityChartRef.current, await generateProductivityData(), 'line');
        }
      }

      // Behavior heatmap
      if (behaviorHeatmapRef.current) {
        try {
          const behaviorData = visualizationData.find(v => v.id === 'behavior-heatmap')?.data || await generateBehaviorData();
          const behaviorChart = visualizationService.createBehavioralHeatmap(
            'behavior-heatmap',
            behaviorData
          );
          newCharts.set('behavior', behaviorChart);
        } catch (err) {
          console.error('Behavior chart error:', err);
          createFallbackChart(behaviorHeatmapRef.current, await generateBehaviorData(), 'heatmap');
        }
      }

      // Correlation matrix
      if (correlationMatrixRef.current) {
        try {
          const correlationData = visualizationData.find(v => v.id === 'correlation-matrix')?.data || await generateCorrelationData();
          const correlationChart = visualizationService.createCorrelationMatrix(
            'correlation-matrix',
            correlationData
          );
          newCharts.set('correlation', correlationChart);
        } catch (err) {
          console.error('Correlation chart error:', err);
          createFallbackChart(correlationMatrixRef.current, await generateCorrelationData(), 'matrix');
        }
      }

      // Trend analysis
      if (trendAnalysisRef.current) {
        try {
          const trendChart = visualizationService.createTrendAnalysisChart(
            'trend-analysis',
            await generateTrendData(),
            await generateForecastData()
          );
          newCharts.set('trend', trendChart);
        } catch (err) {
          console.error('Trend chart error:', err);
          createFallbackChart(trendAnalysisRef.current, await generateTrendData(), 'trend');
        }
      }

      // Real-time dashboard
      if (realTimeDashboardRef.current && realTimeEnabled) {
        try {
          const realTimeChart = visualizationService.createRealTimePerformanceDashboard(
            'realtime-dashboard',
            await generateRealTimeData()
          );
          newCharts.set('realtime', realTimeChart);
        } catch (err) {
          console.error('Real-time chart error:', err);
          createFallbackChart(realTimeDashboardRef.current, await generateRealTimeData(), 'realtime');
        }
      }

      setCharts(newCharts);

    } catch (err) {
      console.error('Chart initialization error:', err);
      setError('Failed to initialize charts');
    }
  }, [visualizationData, realTimeEnabled, visualizationService]);

  // Fallback chart creation
  const createFallbackChart = (container: HTMLElement, data: any[], type: string) => {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div class="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
          ${type.charAt(0).toUpperCase() + type.slice(1)} Visualization
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Showing ${data.length} data points
        </div>
        <div class="w-full max-w-md">
          ${type === 'line' ? createSimpleLineChart(data) : 
            type === 'heatmap' ? createSimpleHeatmap(data) :
            type === 'matrix' ? createSimpleMatrix(data) :
            createSimpleMetrics(data)}
        </div>
      </div>
    `;
  };

  const createSimpleLineChart = (data: any[]) => {
    const maxValue = Math.max(...data.map(d => d.value));
    return `
      <div class="space-y-2">
        ${data.slice(-10).map((d, i) => `
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-300">${new Date(d.date || d.timestamp).toLocaleDateString()}</span>
            <div class="flex items-center space-x-2">
              <div class="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div class="bg-blue-600 dark:bg-blue-400 h-2 rounded-full" style="width: ${(d.value / maxValue) * 100}%"></div>
              </div>
              <span class="text-gray-800 dark:text-gray-200 font-medium">${(d.value * 100).toFixed(1)}%</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  };

  const createSimpleHeatmap = (data: any[]) => {
    const maxValue = Math.max(...data.map(d => d.value));
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return `
      <div class="grid grid-cols-7 gap-1 text-xs">
        ${days.map(day => `<div class="text-center font-medium text-gray-600 dark:text-gray-300 p-1">${day}</div>`).join('')}
        ${data.slice(0, 49).map(d => `
          <div class="aspect-square rounded" 
               style="background-color: rgba(59, 130, 246, ${d.value / maxValue})"
               title="${d.day} ${d.hour}:00 - ${d.value}">
          </div>
        `).join('')}
      </div>
    `;
  };

  const createSimpleMatrix = (data: any[]) => {
    return `
      <div class="space-y-2">
        ${data.slice(0, 10).map(d => `
          <div class="flex items-center justify-between text-sm p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
            <span class="text-gray-600 dark:text-gray-300">${d.metric1} ↔ ${d.metric2}</span>
            <span class="font-medium ${d.coefficient > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
              ${d.coefficient.toFixed(2)}
            </span>
          </div>
        `).join('')}
      </div>
    `;
  };

  const createSimpleMetrics = (data: any[]) => {
    return `
      <div class="grid grid-cols-2 gap-4">
        <div class="text-center p-4 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">${data.length}</div>
          <div class="text-sm text-gray-600 dark:text-gray-300">Data Points</div>
        </div>
        <div class="text-center p-4 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">
            ${data.length > 0 ? (data[data.length - 1].value * 100).toFixed(1) + '%' : 'N/A'}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-300">Latest Value</div>
        </div>
      </div>
    `;
  };

  // Export chart
  const exportChart = async (chartId: string, format: ExportOptions['format']) => {
    const chart = charts.get(chartId);
    if (!chart) return;

    try {
      const blob = await chart.export({ format });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${chartId}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export chart');
    }
  };

  // Real-time data updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(async () => {
      const realTimeChart = charts.get('realtime');
      if (realTimeChart) {
        const newData = await generateRealTimeData();
        realTimeChart.update(newData);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [realTimeEnabled, charts]);

  // Load data on mount
  useEffect(() => {
    loadVisualizationData();
  }, [loadVisualizationData]);

  // Initialize charts when data is loaded
  useEffect(() => {
    if (visualizationData.length > 0) {
      initializeCharts();
    }
  }, [visualizationData, initializeCharts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      charts.forEach(chart => chart.destroy());
      visualizationService.destroy();
    };
  }, [charts, visualizationService]);

  // Handle time range changes
  const handleTimeRangeChange = (range: string) => {
    const now = new Date();
    let start: Date;

    switch (range) {
      case '1d':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    setSelectedTimeRange(range);
    setTimeRange({
      start: start.toISOString(),
      end: now.toISOString()
    });
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading advanced visualizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Advanced Data Visualization</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Interactive charts and AI-generated insights for data storytelling
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={selectedTimeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            variant={realTimeEnabled ? "default" : "outline"}
            size="sm"
          >
            <Activity className="h-4 w-4 mr-2" />
            {realTimeEnabled ? 'Live' : 'Static'}
          </Button>
          
          <Button onClick={loadVisualizationData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* AI Insights Panel */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-500" />
              AI-Generated Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insights.map((insight, index) => (
                <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visualization Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="correlations">Correlations</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
        </TabsList>

        <TabsContent value="productivity" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Productivity Metrics Over Time
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => exportChart('productivity', 'png')}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  PNG
                </Button>
                <Button
                  onClick={() => exportChart('productivity', 'svg')}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  SVG
                </Button>
                <Button
                  onClick={() => exportChart('productivity', 'csv')}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                id="productivity-chart"
                ref={productivityChartRef}
                className="w-full h-96 border rounded-lg"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Activity Heatmap
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => exportChart('behavior', 'png')}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                id="behavior-heatmap"
                ref={behaviorHeatmapRef}
                className="w-full h-96 border rounded-lg"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlations" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Metric Correlation Matrix
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => exportChart('correlation', 'png')}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                id="correlation-matrix"
                ref={correlationMatrixRef}
                className="w-full h-96 border rounded-lg"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Trend Analysis with Forecasting
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Predictive</Badge>
                <Button
                  onClick={() => exportChart('trend', 'png')}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                id="trend-analysis"
                ref={trendAnalysisRef}
                className="w-full h-96 border rounded-lg"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Real-time Performance Dashboard
                {realTimeEnabled && (
                  <Badge className="ml-2 bg-green-100 text-green-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1" />
                    Live
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                  variant={realTimeEnabled ? "default" : "outline"}
                  size="sm"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {realTimeEnabled ? 'Stop' : 'Start'} Live Updates
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                id="realtime-dashboard"
                ref={realTimeDashboardRef}
                className="w-full h-96 border rounded-lg"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export and Sharing Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Share2 className="h-5 w-5 mr-2" />
            Export & Sharing Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => {
                // Export all charts as a report
                console.log('Exporting comprehensive report...');
              }}
              className="flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Full Report (PDF)
            </Button>
            
            <Button
              onClick={() => {
                // Share dashboard link
                console.log('Generating shareable link...');
              }}
              variant="outline"
              className="flex items-center justify-center"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Dashboard
            </Button>
            
            <Button
              onClick={() => {
                // Schedule automated reports
                console.log('Opening report scheduler...');
              }}
              variant="outline"
              className="flex items-center justify-center"
            >
              <Settings className="h-4 w-4 mr-2" />
              Schedule Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions to generate sample data
async function generateProductivityData() {
  const data = [];
  const now = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const weekday = date.getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    
    // Add realistic patterns - lower productivity on weekends and Mondays
    let baseProductivity = 0.75;
    if (isWeekend) baseProductivity = 0.4;
    if (weekday === 1) baseProductivity = 0.65; // Monday blues
    if (weekday === 2 || weekday === 3) baseProductivity = 0.85; // Peak days
    
    const productivity = Math.max(0.1, Math.min(1.0, 
      baseProductivity + (Math.random() - 0.5) * 0.3 + Math.sin(i / 7) * 0.1
    ));
    
    const focus = Math.max(0.1, Math.min(1.0,
      productivity * 0.9 + (Math.random() - 0.5) * 0.2
    ));
    
    const efficiency = Math.max(0.1, Math.min(1.0,
      productivity * 1.1 + (Math.random() - 0.5) * 0.15
    ));
    
    data.push({
      date: date.toISOString().split('T')[0],
      timestamp: date.toISOString(),
      value: productivity,
      productivity,
      focus,
      efficiency,
      tasks_completed: Math.floor(productivity * 12 + Math.random() * 4),
      interruptions: Math.floor((1 - focus) * 20 + Math.random() * 5)
    });
  }
  
  return data;
}

async function generateBehaviorData() {
  const data = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  for (const day of days) {
    const isWeekend = day === 'Saturday' || day === 'Sunday';
    
    for (let hour = 0; hour < 24; hour++) {
      let intensity = 0;
      
      if (isWeekend) {
        // Weekend pattern - later start, more evening activity
        if (hour >= 10 && hour <= 14) intensity = 40 + Math.random() * 30;
        else if (hour >= 19 && hour <= 22) intensity = 50 + Math.random() * 40;
        else intensity = Math.random() * 15;
      } else {
        // Weekday pattern - traditional work hours
        if (hour >= 9 && hour <= 12) intensity = 70 + Math.random() * 25; // Morning peak
        else if (hour >= 13 && hour <= 17) intensity = 80 + Math.random() * 20; // Afternoon peak
        else if (hour >= 19 && hour <= 21) intensity = 30 + Math.random() * 20; // Evening work
        else if (hour >= 7 && hour <= 8) intensity = 20 + Math.random() * 15; // Early morning
        else intensity = Math.random() * 10;
      }
      
      data.push({
        day,
        hour,
        value: Math.round(intensity),
        dayIndex: days.indexOf(day),
        hourLabel: `${hour.toString().padStart(2, '0')}:00`
      });
    }
  }
  
  return data;
}

async function generateCorrelationData() {
  const metrics = ['productivity', 'focus', 'efficiency', 'collaboration', 'wellbeing'];
  const data = [];
  
  // Define realistic correlations
  const correlationMap: { [key: string]: number } = {
    'productivity-focus': 0.78,
    'productivity-efficiency': 0.85,
    'productivity-collaboration': 0.45,
    'productivity-wellbeing': 0.62,
    'focus-efficiency': 0.72,
    'focus-collaboration': -0.23,
    'focus-wellbeing': 0.55,
    'efficiency-collaboration': 0.38,
    'efficiency-wellbeing': 0.48,
    'collaboration-wellbeing': 0.41
  };
  
  for (let i = 0; i < metrics.length; i++) {
    for (let j = 0; j < metrics.length; j++) {
      if (i === j) {
        data.push({
          metric1: metrics[i],
          metric2: metrics[j],
          coefficient: 1.0,
          pValue: 0.0,
          strength: 'perfect' as const,
          direction: 'positive' as const
        });
      } else {
        const key1 = `${metrics[i]}-${metrics[j]}`;
        const key2 = `${metrics[j]}-${metrics[i]}`;
        let coefficient = correlationMap[key1] || correlationMap[key2] || (Math.random() - 0.5) * 0.6;
        
        // Add some noise
        coefficient += (Math.random() - 0.5) * 0.1;
        coefficient = Math.max(-1, Math.min(1, coefficient));
        
        const strength = Math.abs(coefficient) > 0.7 ? 'strong' : 
                        Math.abs(coefficient) > 0.4 ? 'moderate' : 'weak';
        
        data.push({
          metric1: metrics[i],
          metric2: metrics[j],
          coefficient,
          pValue: Math.random() * 0.05,
          strength: strength as any,
          direction: coefficient > 0 ? 'positive' as const : 'negative' as const
        });
      }
    }
  }
  
  return data;
}

async function generateTrendData() {
  const data = [];
  const now = new Date();
  const metrics = ['productivity', 'focus', 'efficiency', 'wellbeing'];
  
  for (const metric of metrics) {
    const metricData = [];
    let baseValue = 0.7;
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      
      // Add trend and seasonality
      const trend = (30 - i) * 0.005; // Slight upward trend
      const seasonal = Math.sin(i / 7) * 0.1; // Weekly pattern
      const noise = (Math.random() - 0.5) * 0.08;
      
      const value = Math.max(0.1, Math.min(1.0, baseValue + trend + seasonal + noise));
      
      metricData.push({
        timestamp: date.toISOString(),
        value
      });
    }
    
    // Calculate trend direction and change rate
    const firstValue = metricData[0].value;
    const lastValue = metricData[metricData.length - 1].value;
    const changeRate = (lastValue - firstValue) / firstValue;
    
    data.push({
      metric,
      values: metricData,
      direction: changeRate > 0.02 ? 'up' as const : 
                changeRate < -0.02 ? 'down' as const : 'stable' as const,
      changeRate,
      significance: 0.75 + Math.random() * 0.2
    });
  }
  
  return data;
}

async function generateForecastData() {
  const data = [];
  const now = new Date();
  const metrics = ['productivity', 'focus', 'efficiency', 'wellbeing'];
  
  for (const metric of metrics) {
    const forecastData = [];
    let baseValue = 0.75;
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      
      // Forecast with decreasing confidence over time
      const trend = i * 0.002; // Slight positive trend
      const seasonal = Math.sin(i / 7) * 0.08; // Weekly pattern
      const uncertainty = (Math.random() - 0.5) * 0.03 * (i / 14); // Increasing uncertainty
      
      const value = Math.max(0.1, Math.min(1.0, baseValue + trend + seasonal + uncertainty));
      
      forecastData.push({
        timestamp: date.toISOString(),
        value,
        confidence: Math.max(0.3, 0.9 - (i / 14) * 0.4) // Decreasing confidence
      });
    }
    
    data.push({
      metric,
      values: forecastData,
      direction: 'up' as const,
      changeRate: 0.02 + Math.random() * 0.02,
      significance: 0.6 - Math.random() * 0.2
    });
  }
  
  return data;
}

async function generateRealTimeData() {
  const data = [];
  const now = new Date();
  
  for (let i = 60; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 1000);
    const hour = timestamp.getHours();
    
    // Simulate realistic real-time patterns based on time of day
    let baseActivity = 0.3;
    if (hour >= 9 && hour <= 17) baseActivity = 0.8; // Work hours
    else if (hour >= 19 && hour <= 21) baseActivity = 0.5; // Evening
    
    const activity = Math.max(0.1, Math.min(1.0,
      baseActivity + Math.sin(i / 10) * 0.15 + (Math.random() - 0.5) * 0.2
    ));
    
    data.push({
      timestamp: timestamp.toISOString(),
      value: activity,
      cpu_usage: Math.random() * 80 + 10,
      memory_usage: Math.random() * 60 + 20,
      active_tasks: Math.floor(Math.random() * 8) + 2,
      focus_score: activity * 0.9 + Math.random() * 0.2
    });
  }
  
  return data;
}