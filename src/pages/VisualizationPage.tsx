import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { 
  BarChart3, 
  BookOpen, 
  Download, 
  Eye, 
  TrendingUp, 
  Zap,
  Settings,
  Share2,
  RefreshCw
} from 'lucide-react';

import AdvancedVisualizationDashboard from '../components/visualization/AdvancedVisualizationDashboard';
import DataStorytellingPanel from '../components/visualization/DataStorytellingPanel';
import { ProductivityMetricsService } from '../services/analytics/ProductivityMetricsService';
import { BehavioralAnalysisService } from '../services/analytics/BehavioralAnalysisService';
import { ReportExportService, ReportExportOptions } from '../services/visualization/ReportExportService';
import { DataVisualizationService } from '../services/visualization/DataVisualizationService';
import { 
  Insight, 
  TrendData, 
  ComparisonData,
  InsightSeverity 
} from '../types/analytics';
import { TimeRange } from '../types/common';

export default function VisualizationPage() {
  // State management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data state
  const [insights, setInsights] = useState<Insight[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [comparisons, setComparisons] = useState<ComparisonData[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString()
  });

  // Services
  const [productivityService] = useState(() => new ProductivityMetricsService());
  const [behavioralService] = useState(() => new BehavioralAnalysisService());
  const [visualizationService] = useState(() => new DataVisualizationService());
  const [reportService] = useState(() => new ReportExportService(visualizationService));

  // Statistics
  const [stats, setStats] = useState({
    totalInsights: 0,
    criticalInsights: 0,
    trendsAnalyzed: 0,
    chartsGenerated: 0
  });

  // Load analytics data
  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Mock user ID - in real app, get from auth context
      const userId = 'user-123';

      // Generate sample productivity metrics
      const mockTasks: any[] = [];
      const mockUserBehavior: any[] = [];
      const mockHistoricalMetrics = [
        {
          tasksCompleted: 8,
          tasksCreated: 10,
          averageCompletionTime: 2.5,
          focusTime: 6.2,
          interruptionCount: 12,
          productivityScore: 0.78,
          efficiencyRatio: 0.85,
          burnoutRisk: 0.3,
          workloadBalance: 0.72,
          collaborationIndex: 0.65
        },
        {
          tasksCompleted: 7,
          tasksCreated: 9,
          averageCompletionTime: 2.8,
          focusTime: 5.8,
          interruptionCount: 15,
          productivityScore: 0.72,
          efficiencyRatio: 0.82,
          burnoutRisk: 0.4,
          workloadBalance: 0.68,
          collaborationIndex: 0.58
        }
      ];

      const productivityMetrics = await productivityService.calculateProductivityMetrics(
        userId,
        timeRange,
        mockTasks,
        mockUserBehavior
      );

      // Generate trends
      const productivityTrends = await productivityService.generateProductivityTrends(
        userId,
        timeRange
      );
      setTrends(productivityTrends.daily);

      // Generate insights
      const burnoutIndicators = await productivityService.detectBurnoutIndicators(
        userId,
        timeRange,
        mockHistoricalMetrics
      );

      const generatedInsights = await productivityService.generateProductivityInsights(
        userId,
        productivityMetrics,
        productivityTrends,
        burnoutIndicators
      );
      setInsights(generatedInsights);

      // Generate comparisons (mock data)
      const mockComparisons: ComparisonData[] = [
        {
          metric: 'productivity_score',
          current: productivityMetrics.productivityScore,
          previous: productivityMetrics.productivityScore * 0.9,
          benchmark: 0.8,
          percentChange: 10,
          significance: 0.85
        },
        {
          metric: 'focus_time',
          current: productivityMetrics.focusTime,
          previous: productivityMetrics.focusTime * 0.95,
          benchmark: 6,
          percentChange: 5,
          significance: 0.7
        }
      ];
      setComparisons(mockComparisons);

      // Update statistics
      setStats({
        totalInsights: generatedInsights.length,
        criticalInsights: generatedInsights.filter(i => i.severity === InsightSeverity.CRITICAL).length,
        trendsAnalyzed: productivityTrends.daily.length + productivityTrends.weekly.length + productivityTrends.monthly.length,
        chartsGenerated: 6 // Mock number of charts
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      console.error('Analytics loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Export comprehensive report
  const exportComprehensiveReport = async (format: 'pdf' | 'html' | 'csv') => {
    try {
      const reportOptions: ReportExportOptions = {
        format,
        includeCharts: true,
        includeData: true,
        includeInsights: true,
        branding: {
          companyName: 'Neural Flow',
          colors: {
            primary: '#3b82f6',
            secondary: '#10b981',
            accent: '#f59e0b'
          }
        }
      };

      const reportBlob = await reportService.generateExecutiveSummary(
        {
          timeRange,
          productivityScore: 0.75,
          focusTime: 6.2,
          efficiencyRatio: 0.82,
          tasksCompleted: 24,
          collaborationIndex: 0.68,
          burnoutRisk: 0.35,
          trend: 'Improving'
        },
        insights.map(i => i.description),
        reportOptions
      );

      // Download the report
      const url = URL.createObjectURL(reportBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `neural-flow-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export report');
    }
  };

  // Share dashboard
  const shareDashboard = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Neural Flow Analytics Dashboard',
          text: 'Check out my productivity analytics dashboard powered by AI',
          url: window.location.href
        });
      } else {
        // Fallback: copy URL to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Dashboard URL copied to clipboard!');
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading advanced visualizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="h-8 w-8 mr-3 text-blue-600" />
              Advanced Data Visualization
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Interactive charts, AI insights, and data storytelling for productivity analytics
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button onClick={shareDashboard} variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button onClick={() => exportComprehensiveReport('pdf')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={loadAnalyticsData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Insights</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalInsights}</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="mt-2">
                <Badge variant={stats.criticalInsights > 0 ? 'destructive' : 'secondary'}>
                  {stats.criticalInsights} critical
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Trends Analyzed</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.trendsAnalyzed}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-2">
                <span className="text-sm text-gray-600">Across multiple timeframes</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Charts Generated</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.chartsGenerated}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-2">
                <span className="text-sm text-gray-600">Interactive visualizations</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Data Stories</p>
                  <p className="text-3xl font-bold text-gray-900">3</p>
                </div>
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
              <div className="mt-2">
                <span className="text-sm text-gray-600">AI-generated narratives</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Interactive Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="storytelling" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Data Storytelling</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Reports & Export</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <AdvancedVisualizationDashboard 
              userId="user-123"
              className="bg-white rounded-lg shadow-sm"
            />
          </TabsContent>

          <TabsContent value="storytelling" className="space-y-6">
            <DataStorytellingPanel
              insights={insights}
              trends={trends}
              comparisons={comparisons}
              timeRange={timeRange}
              className="bg-white rounded-lg shadow-sm p-6"
            />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2" />
                  Export & Reporting Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick Export Options */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Quick Export</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      onClick={() => exportComprehensiveReport('pdf')}
                      className="flex items-center justify-center h-20"
                    >
                      <div className="text-center">
                        <Download className="h-6 w-6 mx-auto mb-2" />
                        <div>Executive Summary (PDF)</div>
                      </div>
                    </Button>
                    
                    <Button
                      onClick={() => exportComprehensiveReport('html')}
                      variant="outline"
                      className="flex items-center justify-center h-20"
                    >
                      <div className="text-center">
                        <Eye className="h-6 w-6 mx-auto mb-2" />
                        <div>Interactive Report (HTML)</div>
                      </div>
                    </Button>
                    
                    <Button
                      onClick={() => exportComprehensiveReport('csv')}
                      variant="outline"
                      className="flex items-center justify-center h-20"
                    >
                      <div className="text-center">
                        <BarChart3 className="h-6 w-6 mx-auto mb-2" />
                        <div>Raw Data (CSV)</div>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Report Templates */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Report Templates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-4">
                      <h4 className="font-medium mb-2">Productivity Analysis Report</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Comprehensive analysis of productivity metrics, trends, and recommendations.
                      </p>
                      <Button size="sm" variant="outline">
                        Generate Report
                      </Button>
                    </Card>
                    
                    <Card className="p-4">
                      <h4 className="font-medium mb-2">Executive Dashboard</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        High-level overview with key metrics and strategic insights.
                      </p>
                      <Button size="sm" variant="outline">
                        Generate Report
                      </Button>
                    </Card>
                    
                    <Card className="p-4">
                      <h4 className="font-medium mb-2">Behavioral Insights Report</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Deep dive into work patterns and behavioral analytics.
                      </p>
                      <Button size="sm" variant="outline">
                        Generate Report
                      </Button>
                    </Card>
                    
                    <Card className="p-4">
                      <h4 className="font-medium mb-2">Custom Report Builder</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Create custom reports with selected metrics and visualizations.
                      </p>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Customize
                      </Button>
                    </Card>
                  </div>
                </div>

                {/* Scheduled Reports */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Automated Reporting</h3>
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Schedule Regular Reports</h4>
                        <p className="text-sm text-gray-600">
                          Set up automated report generation and delivery
                        </p>
                      </div>
                      <Button variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}