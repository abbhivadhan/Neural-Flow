import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Badge } from '../ui/Badge';
import { Alert, AlertDescription } from '../ui/Alert';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Brain, 
  Activity, 
  Users, 
  Clock,
  Target,
  Zap,
  Shield
} from 'lucide-react';

import { ProductivityMetricsService, ProductivityMetrics, BurnoutIndicators } from '../../services/analytics/ProductivityMetricsService';
import { BehavioralAnalysisService, BehavioralVisualization } from '../../services/analytics/BehavioralAnalysisService';
import { BurnoutDetectionService, BurnoutPrediction, BurnoutIntervention } from '../../services/analytics/BurnoutDetectionService';
import { PerformanceForecastingService, PerformanceForecast } from '../../services/analytics/PerformanceForecastingService';
import { Insight, InsightSeverity } from '../../types/analytics';
import { TimeRange } from '../../types/common';

import ProductivityMetricsWidget from './ProductivityMetricsWidget';
import BehavioralAnalysisWidget from './BehavioralAnalysisWidget';
import BurnoutRiskWidget from './BurnoutRiskWidget';
import PerformanceForecastWidget from './PerformanceForecastWidget';
import InsightsPanel from './InsightsPanel';

interface AnalyticsDashboardProps {
  userId: string;
  className?: string;
}

export default function AnalyticsDashboard({ userId, className = '' }: AnalyticsDashboardProps) {
  // State management
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString()
  });
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [productivityMetrics, setProductivityMetrics] = useState<ProductivityMetrics | null>(null);
  const [behavioralVisualizations, setBehavioralVisualizations] = useState<BehavioralVisualization[]>([]);
  const [burnoutPrediction, setBurnoutPrediction] = useState<BurnoutPrediction | null>(null);
  const [burnoutInterventions, setBurnoutInterventions] = useState<BurnoutIntervention[]>([]);
  const [performanceForecasts, setPerformanceForecasts] = useState<PerformanceForecast[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);

  // Services
  const [productivityService] = useState(() => new ProductivityMetricsService());
  const [behavioralService] = useState(() => new BehavioralAnalysisService());
  const [burnoutService] = useState(() => new BurnoutDetectionService());
  const [forecastingService] = useState(() => new PerformanceForecastingService());

  // Load analytics data
  const loadAnalyticsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Mock data - in real implementation, these would come from APIs
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

      // Load productivity metrics
      const metrics = await productivityService.calculateProductivityMetrics(
        userId,
        timeRange,
        mockTasks,
        mockUserBehavior
      );
      setProductivityMetrics(metrics);

      // Generate insights
      const trends = await productivityService.generateProductivityTrends(userId, timeRange);
      const burnoutIndicators = await productivityService.detectBurnoutIndicators(
        userId,
        timeRange,
        mockHistoricalMetrics
      );
      
      const generatedInsights = await productivityService.generateProductivityInsights(
        userId,
        metrics,
        trends,
        burnoutIndicators
      );
      setInsights(generatedInsights);

      // Load behavioral analysis
      const heatmapViz = behavioralService.createActivityHeatmap(
        [], // Mock activity data
        'activity-heatmap',
        { width: 800, height: 400 }
      );
      setBehavioralVisualizations([heatmapViz]);

      // Load burnout prediction
      const riskFactors = await burnoutService.analyzeBurnoutRisk(
        userId,
        metrics,
        mockHistoricalMetrics,
        timeRange
      );
      
      const prediction = await burnoutService.predictBurnoutRisk(
        riskFactors,
        trends.daily,
        {} // Mock user profile
      );
      setBurnoutPrediction(prediction);

      const interventions = await burnoutService.recommendInterventions(
        riskFactors,
        prediction,
        {} // Mock user preferences
      );
      setBurnoutInterventions(interventions);

      // Load performance forecasts
      const forecasts = await forecastingService.generatePerformanceForecast(
        userId,
        mockHistoricalMetrics
      );
      setPerformanceForecasts(forecasts);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      console.error('Analytics loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, timeRange, productivityService, behavioralService, burnoutService, forecastingService]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  // Handle time range changes
  const handleTimeRangeChange = (range: string) => {
    const now = new Date();
    let start: Date;

    switch (range) {
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
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    setTimeRange({
      start: start.toISOString(),
      end: now.toISOString()
    });
  };

  // Get severity color for insights
  const getSeverityColor = (severity: InsightSeverity): string => {
    switch (severity) {
      case InsightSeverity.CRITICAL:
        return 'text-red-600 bg-red-50 border-red-200';
      case InsightSeverity.HIGH:
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case InsightSeverity.MEDIUM:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case InsightSeverity.LOW:
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get risk level color
  const getRiskLevelColor = (level: string): string => {
    switch (level) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
        <Button 
          onClick={loadAnalyticsData} 
          className="mt-4"
          variant="outline"
        >
          Retry Loading
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            AI-powered insights into your productivity and performance
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={timeRange.start} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={loadAnalyticsData} variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {insights.filter(i => i.severity === InsightSeverity.CRITICAL).length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Critical Alert:</strong> {insights.filter(i => i.severity === InsightSeverity.CRITICAL).length} critical issues require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics Overview */}
      {productivityMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Productivity Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(productivityMetrics.productivityScore * 100).toFixed(1)}%
                  </p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-2 flex items-center">
                {productivityMetrics.productivityScore > 0.8 ? (
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                )}
                <span className={`text-sm ${productivityMetrics.productivityScore > 0.8 ? 'text-green-600' : 'text-red-600'}`}>
                  {productivityMetrics.productivityScore > 0.8 ? 'Excellent' : 'Needs Attention'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Focus Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {productivityMetrics.focusTime.toFixed(1)}h
                  </p>
                </div>
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-2">
                <span className="text-sm text-gray-600">
                  Daily average
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Efficiency Ratio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(productivityMetrics.efficiencyRatio * 100).toFixed(1)}%
                  </p>
                </div>
                <Zap className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="mt-2">
                <Badge variant={productivityMetrics.efficiencyRatio > 0.8 ? 'success' : 'warning'}>
                  {productivityMetrics.efficiencyRatio > 0.8 ? 'High' : 'Moderate'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Burnout Risk</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(productivityMetrics.burnoutRisk * 100).toFixed(1)}%
                  </p>
                </div>
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <div className="mt-2">
                <Badge 
                  className={getRiskLevelColor(
                    productivityMetrics.burnoutRisk > 0.7 ? 'high' : 
                    productivityMetrics.burnoutRisk > 0.4 ? 'medium' : 'low'
                  )}
                >
                  {productivityMetrics.burnoutRisk > 0.7 ? 'High Risk' : 
                   productivityMetrics.burnoutRisk > 0.4 ? 'Medium Risk' : 'Low Risk'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="burnout">Burnout Risk</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Insights Panel */}
            <div className="lg:col-span-2">
              <InsightsPanel insights={insights} />
            </div>
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {burnoutInterventions.slice(0, 3).map((intervention, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-sm">{intervention.action.replace(/_/g, ' ')}</h4>
                    <p className="text-xs text-gray-600 mt-1">{intervention.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge className={getRiskLevelColor(intervention.priority)}>
                        {intervention.priority}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {intervention.timeline} days
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="productivity" className="space-y-6">
          {productivityMetrics && (
            <ProductivityMetricsWidget 
              metrics={productivityMetrics}
              timeRange={timeRange}
              insights={insights.filter(i => i.category === 'productivity')}
            />
          )}
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <BehavioralAnalysisWidget 
            visualizations={behavioralVisualizations}
            insights={insights.filter(i => i.category === 'collaboration')}
          />
        </TabsContent>

        <TabsContent value="burnout" className="space-y-6">
          {burnoutPrediction && (
            <BurnoutRiskWidget 
              prediction={burnoutPrediction}
              interventions={burnoutInterventions}
              insights={insights.filter(i => i.category === 'wellbeing')}
            />
          )}
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-6">
          <PerformanceForecastWidget 
            forecasts={performanceForecasts}
            insights={insights.filter(i => i.type === 'prediction')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}