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

  // Create advanced forecast visualization with multiple metrics and scenarios
  useEffect(() => {
    if (!forecastChartRef.current || forecasts.length === 0) return;

    const container = d3.select(forecastChartRef.current);
    container.selectAll('*').remove();

    const width = 900;
    const height = 500;
    const margin = { top: 40, right: 120, bottom: 60, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Use multiple forecasts for comparison
    const primaryForecast = forecasts[0];
    if (!primaryForecast || !primaryForecast.predictions) return;

    // Generate historical data points (last 30 days)
    const historicalData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (30 - i));
      return {
        timestamp: date.toISOString(),
        value: 0.7 + Math.sin(i * 0.2) * 0.1 + (Math.random() - 0.5) * 0.1,
        isHistorical: true
      };
    });

    // Combine historical and forecast data
    const allData = [
      ...historicalData,
      ...primaryForecast.predictions.map(p => ({ ...p, isHistorical: false }))
    ];

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(allData, d => new Date(d.timestamp)) as [Date, Date])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(allData, d => d.value) as [number, number])
      .nice()
      .range([chartHeight, 0]);

    // Create gradients
    const defs = svg.append('defs');

    // Historical data gradient
    const historicalGradient = defs.append('linearGradient')
      .attr('id', 'historical-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', chartHeight)
      .attr('x2', 0).attr('y2', 0);

    historicalGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.1);

    historicalGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.4);

    // Forecast confidence gradient
    const forecastGradient = defs.append('linearGradient')
      .attr('id', 'forecast-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', chartHeight)
      .attr('x2', 0).attr('y2', 0);

    forecastGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0.1);

    forecastGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0.3);

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-chartHeight)
        .tickFormat('')
        .ticks(8))
      .style('stroke-dasharray', '2,2')
      .style('opacity', 0.3);

    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .tickSize(-chartWidth)
        .tickFormat('')
        .ticks(6))
      .style('stroke-dasharray', '2,2')
      .style('opacity', 0.3);

    // Add confidence interval for forecast
    const confidenceArea = d3.area<{ timestamp: string; value: number; confidence: [number, number] }>()
      .x(d => xScale(new Date(d.timestamp)))
      .y0(d => yScale(d.confidence[0]))
      .y1(d => yScale(d.confidence[1]))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(primaryForecast.predictions)
      .attr('fill', 'url(#forecast-gradient)')
      .attr('d', confidenceArea);

    // Historical data area
    const historicalArea = d3.area<{ timestamp: string; value: number }>()
      .x(d => xScale(new Date(d.timestamp)))
      .y0(chartHeight)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(historicalData)
      .attr('fill', 'url(#historical-gradient)')
      .attr('d', historicalArea);

    // Line generators
    const historicalLine = d3.line<{ timestamp: string; value: number }>()
      .x(d => xScale(new Date(d.timestamp)))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    const forecastLine = d3.line<{ timestamp: string; value: number }>()
      .x(d => xScale(new Date(d.timestamp)))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Add historical line
    g.append('path')
      .datum(historicalData)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 3)
      .attr('d', historicalLine);

    // Add forecast line
    g.append('path')
      .datum(primaryForecast.predictions)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '8,4')
      .attr('d', forecastLine);

    // Add vertical line to separate historical from forecast
    const separatorX = xScale(new Date(historicalData[historicalData.length - 1].timestamp));
    g.append('line')
      .attr('x1', separatorX)
      .attr('x2', separatorX)
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .attr('stroke', '#6b7280')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.7);

    // Add separator label
    g.append('text')
      .attr('x', separatorX + 5)
      .attr('y', 15)
      .style('font-size', '11px')
      .style('fill', '#6b7280')
      .text('Forecast →');

    // Add data points with enhanced interactivity
    const tooltip = d3.select('body').append('div')
      .attr('class', 'forecast-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'rgba(0,0,0,0.9)')
      .style('color', 'white')
      .style('padding', '12px')
      .style('border-radius', '8px')
      .style('font-size', '12px')
      .style('box-shadow', '0 4px 6px rgba(0,0,0,0.1)')
      .style('pointer-events', 'none')
      .style('z-index', '1000');

    // Historical data points
    g.selectAll('.historical-dot')
      .data(historicalData.filter((_, i) => i % 3 === 0)) // Show every 3rd point
      .enter()
      .append('circle')
      .attr('class', 'historical-dot')
      .attr('cx', d => xScale(new Date(d.timestamp)))
      .attr('cy', d => yScale(d.value))
      .attr('r', 4)
      .attr('fill', '#10b981')
      .attr('stroke', '#059669')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).transition().duration(200).attr('r', 6);
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`
          <div style="font-weight: bold; margin-bottom: 4px;">Historical Data</div>
          <div>Date: ${new Date(d.timestamp).toLocaleDateString()}</div>
          <div>Value: ${(d.value * 100).toFixed(1)}%</div>
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).transition().duration(200).attr('r', 4);
        tooltip.transition().duration(200).style('opacity', 0);
      });

    // Forecast data points
    g.selectAll('.forecast-dot')
      .data(primaryForecast.predictions.filter((_, i) => i % 2 === 0)) // Show every 2nd point
      .enter()
      .append('circle')
      .attr('class', 'forecast-dot')
      .attr('cx', d => xScale(new Date(d.timestamp)))
      .attr('cy', d => yScale(d.value))
      .attr('r', 4)
      .attr('fill', '#3b82f6')
      .attr('stroke', '#1d4ed8')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).transition().duration(200).attr('r', 6);
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`
          <div style="font-weight: bold; margin-bottom: 4px;">Forecast</div>
          <div>Date: ${new Date(d.timestamp).toLocaleDateString()}</div>
          <div>Predicted: ${(d.value * 100).toFixed(1)}%</div>
          <div>Range: ${(d.confidence[0] * 100).toFixed(1)}% - ${(d.confidence[1] * 100).toFixed(1)}%</div>
          <div style="margin-top: 4px; font-size: 10px; color: #9ca3af;">Model: ${primaryForecast.model.type}</div>
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).transition().duration(200).attr('r', 4);
        tooltip.transition().duration(200).style('opacity', 0);
      });

    // Add anomaly markers
    if (primaryForecast.anomalies && primaryForecast.anomalies.length > 0) {
      g.selectAll('.anomaly-marker')
        .data(primaryForecast.anomalies)
        .enter()
        .append('circle')
        .attr('class', 'anomaly-marker')
        .attr('cx', d => xScale(new Date(d.timestamp)))
        .attr('cy', d => yScale(d.expectedValue))
        .attr('r', 8)
        .attr('fill', 'none')
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '4,2')
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          tooltip.transition().duration(200).style('opacity', 1);
          tooltip.html(`
            <div style="font-weight: bold; margin-bottom: 4px; color: #ef4444;">⚠ Anomaly Detected</div>
            <div>Date: ${new Date(d.timestamp).toLocaleDateString()}</div>
            <div>Type: ${d.type.replace('_', ' ')}</div>
            <div>Probability: ${(d.probability * 100).toFixed(1)}%</div>
            <div>Expected: ${(d.expectedValue * 100).toFixed(1)}%</div>
          `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', function() {
          tooltip.transition().duration(200).style('opacity', 0);
        });
    }

    // Add axes with better formatting
    const xAxis = g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(xScale)
        .tickFormat(d3.timeFormat('%m/%d'))
        .ticks(8));

    const yAxis = g.append('g')
      .call(d3.axisLeft(yScale)
        .tickFormat(d3.format('.0%'))
        .ticks(6));

    // Style axes
    xAxis.selectAll('text')
      .style('font-size', '11px')
      .style('fill', '#6b7280');

    yAxis.selectAll('text')
      .style('font-size', '11px')
      .style('fill', '#6b7280');

    // Add axis labels
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left + 20)
      .attr('x', 0 - (chartHeight / 2))
      .style('text-anchor', 'middle')
      .style('font-size', '13px')
      .style('fill', '#374151')
      .text(primaryForecast.metric);

    g.append('text')
      .attr('transform', `translate(${chartWidth / 2}, ${chartHeight + 45})`)
      .style('text-anchor', 'middle')
      .style('font-size', '13px')
      .style('fill', '#374151')
      .text('Date');

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', '#1f2937')
      .text(`${primaryForecast.metric} Performance Forecast`);

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right + 10}, ${margin.top})`);

    const legendItems = [
      { label: 'Historical', color: '#10b981', dasharray: 'none' },
      { label: 'Forecast', color: '#3b82f6', dasharray: '8,4' },
      { label: 'Confidence', color: '#3b82f6', opacity: 0.3 },
      { label: 'Anomaly', color: '#ef4444', dasharray: '4,2' }
    ];

    legendItems.forEach((item, i) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${i * 25})`);

      if (item.label === 'Confidence') {
        legendItem.append('rect')
          .attr('width', 20)
          .attr('height', 8)
          .attr('fill', item.color)
          .attr('opacity', item.opacity);
      } else if (item.label === 'Anomaly') {
        legendItem.append('circle')
          .attr('cx', 10)
          .attr('cy', 4)
          .attr('r', 6)
          .attr('fill', 'none')
          .attr('stroke', item.color)
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', item.dasharray);
      } else {
        legendItem.append('line')
          .attr('x1', 0)
          .attr('x2', 20)
          .attr('y1', 4)
          .attr('y2', 4)
          .attr('stroke', item.color)
          .attr('stroke-width', 3)
          .attr('stroke-dasharray', item.dasharray);
      }

      legendItem.append('text')
        .attr('x', 25)
        .attr('y', 4)
        .attr('dy', '0.35em')
        .style('font-size', '12px')
        .style('fill', '#374151')
        .text(item.label);
    });

    // Cleanup tooltip on component unmount
    return () => {
      d3.selectAll('.forecast-tooltip').remove();
    };

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