import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  Zap, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import { ProductivityMetrics } from '../../services/analytics/ProductivityMetricsService';
import { Insight } from '../../types/analytics';
import { TimeRange } from '../../types/common';

interface ProductivityMetricsWidgetProps {
  metrics: ProductivityMetrics;
  timeRange: TimeRange;
  insights: Insight[];
}

export default function ProductivityMetricsWidget({ 
  metrics, 
  timeRange, 
  insights 
}: ProductivityMetricsWidgetProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const trendChartRef = useRef<HTMLDivElement>(null);
  const [chartsInitialized, setChartsInitialized] = useState(false);

  // Early return if no metrics
  if (!metrics) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-48">
              <p className="text-gray-500">Loading productivity metrics...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Memoize trend data to prevent unnecessary recalculations
  const trendData = useMemo(() => [
    { date: '2024-01-01', value: 0.75, confidence: [0.70, 0.80], anomaly: false },
    { date: '2024-01-02', value: 0.78, confidence: [0.73, 0.83], anomaly: false },
    { date: '2024-01-03', value: 0.82, confidence: [0.77, 0.87], anomaly: false },
    { date: '2024-01-04', value: 0.79, confidence: [0.74, 0.84], anomaly: false },
    { date: '2024-01-05', value: 0.85, confidence: [0.80, 0.90], anomaly: false },
    { date: '2024-01-06', value: 0.88, confidence: [0.83, 0.93], anomaly: false },
    { date: '2024-01-07', value: metrics.productivityScore, confidence: [metrics.productivityScore - 0.05, metrics.productivityScore + 0.05], anomaly: metrics.productivityScore < 0.6 || metrics.productivityScore > 0.95 }
  ], [metrics.productivityScore]);

  // Create charts once when component mounts and data is available
  useEffect(() => {
    if (!chartRef.current || !trendChartRef.current || !metrics || chartsInitialized) {
      return;
    }

    const createGaugeChart = () => {
      try {
        const container = d3.select(chartRef.current);
        container.selectAll('*').remove();

        const width = 300;
        const height = 200;
        const radius = Math.min(width, height) / 2 - 20;

        const svg = container
          .append('svg')
          .attr('width', width)
          .attr('height', height);

        const g = svg
          .append('g')
          .attr('transform', `translate(${width / 2}, ${height / 2})`);

        // Create gauge background
        const arc = d3.arc()
          .innerRadius(radius - 20)
          .outerRadius(radius)
          .startAngle(-Math.PI / 2)
          .endAngle(Math.PI / 2);

        g.append('path')
          .datum({ startAngle: -Math.PI / 2, endAngle: Math.PI / 2 })
          .style('fill', '#e5e7eb')
          .attr('d', arc as any);

        // Create gauge fill
        const scoreAngle = -Math.PI / 2 + (metrics.productivityScore * Math.PI);
        const scoreArc = d3.arc()
          .innerRadius(radius - 20)
          .outerRadius(radius)
          .startAngle(-Math.PI / 2)
          .endAngle(scoreAngle);

        g.append('path')
          .datum({ startAngle: -Math.PI / 2, endAngle: scoreAngle })
          .style('fill', metrics.productivityScore > 0.8 ? '#10b981' : 
                        metrics.productivityScore > 0.6 ? '#f59e0b' : '#ef4444')
          .attr('d', scoreArc as any);

        // Add score text
        g.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '0.35em')
          .style('font-size', '24px')
          .style('font-weight', 'bold')
          .style('fill', '#1f2937')
          .text(`${(metrics.productivityScore * 100).toFixed(0)}%`);

        g.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '1.5em')
          .style('font-size', '12px')
          .style('fill', '#6b7280')
          .text('Productivity Score');

      } catch (error) {
        console.error('Error creating gauge chart:', error);
      }
    };

    const createTrendChart = () => {
      try {
        const container = d3.select(trendChartRef.current);
        container.selectAll('*').remove();

        const width = 500;
        const height = 250;
        const margin = { top: 20, right: 30, bottom: 40, left: 50 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        const svg = container
          .append('svg')
          .attr('width', width)
          .attr('height', height);

        const g = svg
          .append('g')
          .attr('transform', `translate(${margin.left}, ${margin.top})`);

        // Scales
        const xScale = d3.scaleTime()
          .domain(d3.extent(trendData, d => new Date(d.date)) as [Date, Date])
          .range([0, chartWidth]);

        const yScale = d3.scaleLinear()
          .domain([0, 1])
          .range([chartHeight, 0]);

        // Line generator
        const line = d3.line<{ date: string; value: number }>()
          .x(d => xScale(new Date(d.date)))
          .y(d => yScale(d.value))
          .curve(d3.curveMonotoneX);

        // Add main trend line
        g.append('path')
          .datum(trendData)
          .attr('fill', 'none')
          .attr('stroke', '#3b82f6')
          .attr('stroke-width', 3)
          .attr('d', line);

        // Add data points
        g.selectAll('.dot')
          .data(trendData)
          .enter()
          .append('circle')
          .attr('class', 'dot')
          .attr('cx', d => xScale(new Date(d.date)))
          .attr('cy', d => yScale(d.value))
          .attr('r', 4)
          .attr('fill', '#3b82f6')
          .attr('stroke', '#1d4ed8')
          .attr('stroke-width', 1);

        // Add axes
        g.append('g')
          .attr('transform', `translate(0, ${chartHeight})`)
          .call(d3.axisBottom(xScale)
            .tickFormat(d3.timeFormat('%m/%d'))
            .ticks(5));

        g.append('g')
          .call(d3.axisLeft(yScale)
            .tickFormat(d3.format('.0%'))
            .ticks(5));

      } catch (error) {
        console.error('Error creating trend chart:', error);
      }
    };

    // Create both charts
    createGaugeChart();
    createTrendChart();
    setChartsInitialized(true);

  }, [metrics, trendData, chartsInitialized]);

  // Reset charts when metrics change significantly
  useEffect(() => {
    setChartsInitialized(false);
  }, [metrics?.productivityScore]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        d3.select(chartRef.current).selectAll('*').remove();
      }
      if (trendChartRef.current) {
        d3.select(trendChartRef.current).selectAll('*').remove();
      }
    };
  }, []);

  const getMetricStatus = (value: number, threshold: number) => {
    return value >= threshold ? 'good' : 'needs-attention';
  };

  const getStatusIcon = (status: string) => {
    return status === 'good' ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <AlertCircle className="h-4 w-4 text-orange-600" />;
  };

  const getStatusColor = (status: string) => {
    return status === 'good' ? 'text-green-600' : 'text-orange-600';
  };

  return (
    <div className="space-y-6">
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productivity Score Gauge */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Productivity Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              ref={chartRef} 
              className="flex justify-center min-h-[200px] w-full"
              style={{ minHeight: '200px', width: '100%' }}
            ></div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Score</span>
                <Badge variant={metrics.productivityScore > 0.8 ? 'success' : 'warning'}>
                  {metrics.productivityScore > 0.8 ? 'Excellent' : 'Good'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Target</span>
                <span className="text-sm font-medium">80%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Productivity Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              7-Day Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              ref={trendChartRef} 
              className="min-h-[250px] w-full"
              style={{ minHeight: '250px', width: '100%' }}
            ></div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">Trend Direction</span>
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600 font-medium">Improving</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Focus Time */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-medium">Focus Time</h3>
              </div>
              {getStatusIcon(getMetricStatus(metrics.focusTime, 6))}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-2xl font-bold">{metrics.focusTime.toFixed(1)}h</span>
                <span className={`text-sm ${getStatusColor(getMetricStatus(metrics.focusTime, 6))}`}>
                  {metrics.focusTime >= 6 ? 'On Target' : 'Below Target'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, (metrics.focusTime / 8) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>0h</span>
                <span>Target: 6h</span>
                <span>8h</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Completed */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="font-medium">Tasks Completed</h3>
              </div>
              {getStatusIcon(getMetricStatus(metrics.tasksCompleted, 5))}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-2xl font-bold">{metrics.tasksCompleted}</span>
                <span className="text-sm text-gray-600">
                  vs {metrics.tasksCreated} created
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, (metrics.tasksCompleted / Math.max(metrics.tasksCreated, 1)) * 100)}%` 
                    }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">
                  {((metrics.tasksCompleted / Math.max(metrics.tasksCreated, 1)) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Efficiency Ratio */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Zap className="h-5 w-5 text-yellow-600 mr-2" />
                <h3 className="font-medium">Efficiency</h3>
              </div>
              {getStatusIcon(getMetricStatus(metrics.efficiencyRatio, 0.8))}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-2xl font-bold">
                  {(metrics.efficiencyRatio * 100).toFixed(0)}%
                </span>
                <span className={`text-sm ${getStatusColor(getMetricStatus(metrics.efficiencyRatio, 0.8))}`}>
                  {metrics.efficiencyRatio >= 0.8 ? 'High' : 'Moderate'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-600 h-2 rounded-full" 
                  style={{ width: `${metrics.efficiencyRatio * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500">
                Based on task completion rate and priority weighting
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights and Recommendations */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Productivity Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.slice(0, 3).map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {insight.severity === 'high' ? (
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                    {insight.recommendations.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-700">Recommendation:</p>
                        <p className="text-xs text-gray-600">
                          {insight.recommendations[0].title}
                        </p>
                      </div>
                    )}
                  </div>
                  <Badge 
                    variant={insight.severity === 'high' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {insight.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Key Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Completion Time</span>
                  <span className="font-medium">{metrics.averageCompletionTime.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Interruption Count</span>
                  <span className="font-medium">{metrics.interruptionCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Workload Balance</span>
                  <span className="font-medium">{(metrics.workloadBalance * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Collaboration Index</span>
                  <span className="font-medium">{(metrics.collaborationIndex * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Performance Indicators</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Focus Quality</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(metrics.focusTime / 8) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {((metrics.focusTime / 8) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Task Efficiency</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${metrics.efficiencyRatio * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {(metrics.efficiencyRatio * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Work-Life Balance</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${metrics.workloadBalance * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {(metrics.workloadBalance * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}