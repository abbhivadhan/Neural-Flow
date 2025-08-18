import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  AlertTriangle,
  Target,
  Calendar,
  Activity,
  Eye
} from 'lucide-react';

import { PerformanceForecast } from '../../services/analytics/PerformanceForecastingService';
import { Insight } from '../../types/analytics';

interface PerformanceForecastWidgetProps {
  forecasts: PerformanceForecast[];
  insights: Insight[];
}

export default function PerformanceForecastWidget({ 
  forecasts, 
  insights 
}: PerformanceForecastWidgetProps) {
  const forecastChartRef = useRef<HTMLDivElement>(null);
  const anomalyChartRef = useRef<HTMLDivElement>(null);

  // Create forecast visualization
  useEffect(() => {
    if (!forecastChartRef.current || forecasts.length === 0) return;

    const container = d3.select(forecastChartRef.current);
    container.selectAll('*').remove();

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 80, bottom: 40, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Use the first forecast for demonstration
    const forecast = forecasts[0];
    if (!forecast || !forecast.predictions) return;

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(forecast.predictions, d => new Date(d.timestamp)) as [Date, Date])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(forecast.predictions, d => d.value) as [number, number])
      .nice()
      .range([chartHeight, 0]);

    // Create line generator
    const line = d3.line<{ timestamp: string; value: number; confidence: [number, number] }>()
      .x(d => xScale(new Date(d.timestamp)))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Create confidence area generator
    const area = d3.area<{ timestamp: string; value: number; confidence: [number, number] }>()
      .x(d => xScale(new Date(d.timestamp)))
      .y0(d => yScale(d.confidence[0]))
      .y1(d => yScale(d.confidence[1]))
      .curve(d3.curveMonotoneX);

    // Add confidence interval
    g.append('path')
      .datum(forecast.predictions)
      .attr('fill', 'rgba(59, 130, 246, 0.2)')
      .attr('d', area);

    // Add forecast line
    g.append('path')
      .datum(forecast.predictions)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add data points
    g.selectAll('.dot')
      .data(forecast.predictions)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(new Date(d.timestamp)))
      .attr('cy', d => yScale(d.value))
      .attr('r', 3)
      .attr('fill', '#3b82f6');

    // Add axes
    g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%m/%d')));

    g.append('g')
      .call(d3.axisLeft(yScale));

    // Add labels
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (chartHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(forecast.metric);

    g.append('text')
      .attr('transform', `translate(${chartWidth / 2}, ${chartHeight + margin.bottom})`)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Date');

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text(`${forecast.metric} Forecast`);

  }, [forecasts]);

  // Create anomaly detection chart
  useEffect(() => {
    if (!anomalyChartRef.current || forecasts.length === 0) return;

    const container = d3.select(anomalyChartRef.current);
    container.selectAll('*').remove();

    const forecast = forecasts[0];
    if (!forecast || !forecast.anomalies) return;

    const width = 400;
    const height = 200;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(forecast.anomalies, d => new Date(d.timestamp)) as [Date, Date])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, 1])
      .range([chartHeight, 0]);

    // Add anomaly points
    g.selectAll('.anomaly')
      .data(forecast.anomalies)
      .enter()
      .append('circle')
      .attr('class', 'anomaly')
      .attr('cx', d => xScale(new Date(d.timestamp)))
      .attr('cy', d => yScale(d.anomalyScore))
      .attr('r', d => 3 + d.probability * 5)
      .attr('fill', d => {
        switch (d.type) {
          case 'spike': return '#ef4444';
          case 'drop': return '#f59e0b';
          case 'trend_break': return '#8b5cf6';
          default: return '#6b7280';
        }
      })
      .attr('opacity', 0.7);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%m/%d')));

    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d3.format('.0%')));

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text('Anomaly Detection');

  }, [forecasts]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-green-600';
      case 'decreasing':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getAnomalyTypeColor = (type: string) => {
    switch (type) {
      case 'spike':
        return 'bg-red-100 text-red-800';
      case 'drop':
        return 'bg-orange-100 text-orange-800';
      case 'trend_break':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Forecast Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {forecasts.slice(0, 4).map((forecast, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Target className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="font-medium text-sm">{forecast.metric}</h3>
                </div>
                {getTrendIcon(forecast.trends.shortTerm)}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-lg font-bold">
                    {forecast.predictions.length > 0 ? 
                      forecast.predictions[forecast.predictions.length - 1].value.toFixed(2) : 
                      'N/A'
                    }
                  </span>
                  <span className={`text-sm ${getTrendColor(forecast.trends.shortTerm)}`}>
                    {forecast.trends.shortTerm}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Model: {forecast.model.type} ({(forecast.model.accuracy * 100).toFixed(0)}% accuracy)
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Forecast Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Performance Forecast
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View All Metrics
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Adjust Timeline
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={forecastChartRef}></div>
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-600 rounded mr-2"></div>
                <span>Forecast</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-200 rounded mr-2"></div>
                <span>Confidence Interval</span>
              </div>
            </div>
            <div className="text-xs">
              {forecasts.length > 0 && `Model: ${forecasts[0].model.type} | Confidence: ${(forecasts[0].model.confidence * 100).toFixed(0)}%`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trend Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Trend Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {forecasts.slice(0, 3).map((forecast, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getTrendIcon(forecast.trends.shortTerm)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{forecast.metric}</p>
                      <p className="text-xs text-gray-600">
                        Short-term: {forecast.trends.shortTerm} | Long-term: {forecast.trends.longTerm}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {forecast.seasonality ? forecast.seasonality.type : 'No pattern'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Anomaly Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={anomalyChartRef} className="mb-4"></div>
            <div className="space-y-2">
              {forecasts.length > 0 && forecasts[0].anomalies.slice(0, 3).map((anomaly, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <Badge className={getAnomalyTypeColor(anomaly.type)}>
                      {anomaly.type.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-gray-600">
                      {new Date(anomaly.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-xs font-medium">
                    {(anomaly.probability * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Forecast-Based Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {forecasts.slice(0, 3).map((forecast, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{forecast.metric} Optimization</h4>
                  <Badge variant="outline" className="text-xs">
                    {forecast.model.type} model
                  </Badge>
                </div>
                <div className="space-y-2">
                  {forecast.recommendations.slice(0, 2).map((rec, recIndex) => (
                    <div key={recIndex} className="flex items-start space-x-2">
                      <Activity className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Model Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Model Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {forecasts.slice(0, 3).map((forecast, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {(forecast.model.accuracy * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 mb-1">{forecast.metric}</div>
                <div className="text-xs text-gray-500">
                  {forecast.model.type} model accuracy
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${forecast.model.accuracy * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Prediction Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prediction Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.slice(0, 3).map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
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
                  <Badge variant="secondary" className="text-xs">
                    {(insight.confidence * 100).toFixed(0)}% confidence
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}