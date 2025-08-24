import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  Activity, 
  Users, 
  Clock, 
  TrendingUp,
  Eye,
  Download
} from 'lucide-react';

import { BehavioralVisualization } from '../../services/analytics/BehavioralAnalysisService';
import { Insight } from '../../types/analytics';

interface BehavioralAnalysisWidgetProps {
  visualizations: BehavioralVisualization[];
  insights: Insight[];
}

export default function BehavioralAnalysisWidget({ 
  visualizations, 
  insights 
}: BehavioralAnalysisWidgetProps) {
  const heatmapRef = useRef<HTMLDivElement>(null);

  // Mock behavioral data for demonstration
  const mockBehavioralData = {
    activityPatterns: [
      { hour: 9, activity: 'Deep Work', intensity: 0.9, duration: 120 },
      { hour: 11, activity: 'Meetings', intensity: 0.7, duration: 60 },
      { hour: 14, activity: 'Email', intensity: 0.5, duration: 30 },
      { hour: 15, activity: 'Deep Work', intensity: 0.8, duration: 90 },
    ],
    workflowPatterns: [
      { sequence: ['Email Check', 'Task Planning', 'Deep Work'], frequency: 15, efficiency: 0.85 },
      { sequence: ['Meeting', 'Follow-up', 'Documentation'], frequency: 8, efficiency: 0.72 },
      { sequence: ['Research', 'Analysis', 'Report Writing'], frequency: 5, efficiency: 0.78 },
    ],
    collaborationMetrics: {
      teamInteractions: 24,
      responseTime: 1.2, // hours
      meetingEfficiency: 0.75,
      knowledgeSharing: 0.68
    }
  };

  // Create advanced D3.js heatmap with interactive features
  useEffect(() => {
    if (!heatmapRef.current) return;

    const container = d3.select(heatmapRef.current);
    container.selectAll('*').remove();

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Generate realistic activity data with patterns
    const intensityData = days.map((day, dayIndex) => 
      hours.map(hour => {
        let baseIntensity = 0.1;
        
        // Work hours pattern (9-17)
        if (hour >= 9 && hour <= 17 && dayIndex < 5) {
          baseIntensity = 0.6 + Math.random() * 0.3;
        }
        // Lunch dip (12-13)
        if (hour >= 12 && hour <= 13 && dayIndex < 5) {
          baseIntensity *= 0.5;
        }
        // Peak focus hours (10-11, 14-16)
        if ((hour >= 10 && hour <= 11) || (hour >= 14 && hour <= 16)) {
          baseIntensity *= 1.3;
        }
        // Weekend pattern
        if (dayIndex >= 5) {
          baseIntensity = 0.1 + Math.random() * 0.4;
        }
        
        return {
          day: dayIndex,
          dayName: day,
          hour,
          intensity: Math.min(1, baseIntensity + (Math.random() - 0.5) * 0.2),
          tasks: Math.floor(baseIntensity * 10),
          focusTime: baseIntensity * 60 // minutes
        };
      })
    ).flat();

    const width = 800;
    const height = 200;
    const margin = { top: 40, right: 40, bottom: 40, left: 60 };
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
    const xScale = d3.scaleBand()
      .domain(hours.map(String))
      .range([0, chartWidth])
      .padding(0.05);

    const yScale = d3.scaleBand()
      .domain(days)
      .range([0, chartHeight])
      .padding(0.05);

    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
      .domain([0, 1]);

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', '#1f2937')
      .text('Weekly Activity Intensity Heatmap');

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'heatmap-tooltip')
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

    // Create heatmap cells
    const cells = g.selectAll('.cell')
      .data(intensityData)
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('x', d => xScale(d.hour.toString()) || 0)
      .attr('y', d => yScale(d.dayName) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.intensity))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('rx', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('stroke-width', 2)
          .attr('stroke', '#1f2937');

        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`
          <div style="font-weight: bold; margin-bottom: 8px;">${d.dayName} ${d.hour}:00</div>
          <div style="margin-bottom: 4px;">Intensity: ${(d.intensity * 100).toFixed(1)}%</div>
          <div style="margin-bottom: 4px;">Tasks: ${d.tasks}</div>
          <div>Focus Time: ${d.focusTime.toFixed(0)} min</div>
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('stroke-width', 1)
          .attr('stroke', '#fff');

        tooltip.transition().duration(200).style('opacity', 0);
      })
      .on('click', function(event, d) {
        // Could trigger drill-down or detailed view
        console.log('Clicked cell:', d);
      });

    // Add animation on load
    cells
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 5)
      .style('opacity', 1);

    // Add axes
    const xAxis = g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(xScale)
        .tickValues(xScale.domain().filter((d, i) => i % 2 === 0)));

    const yAxis = g.append('g')
      .call(d3.axisLeft(yScale));

    // Style axes
    xAxis.selectAll('text')
      .style('font-size', '11px')
      .style('fill', '#6b7280');

    yAxis.selectAll('text')
      .style('font-size', '11px')
      .style('fill', '#6b7280');

    // Add axis labels
    g.append('text')
      .attr('transform', `translate(${chartWidth / 2}, ${chartHeight + 35})`)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#6b7280')
      .text('Hour of Day');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left + 15)
      .attr('x', 0 - (chartHeight / 2))
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#6b7280')
      .text('Day of Week');

    // Add color legend
    const legendWidth = 200;
    const legendHeight = 10;
    const legendX = chartWidth - legendWidth;
    const legendY = -30;

    const legendScale = d3.scaleLinear()
      .domain([0, 1])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
      .tickSize(legendHeight)
      .tickFormat(d3.format('.0%'))
      .ticks(5);

    const legend = g.append('g')
      .attr('transform', `translate(${legendX}, ${legendY})`);

    // Create gradient for legend
    const legendGradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'legend-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%')
      .attr('y1', '0%')
      .attr('y2', '0%');

    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      legendGradient.append('stop')
        .attr('offset', `${t * 100}%`)
        .attr('stop-color', colorScale(t));
    }

    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#legend-gradient)');

    legend.append('g')
      .call(legendAxis)
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', '#6b7280');

    legend.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -5)
      .style('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#6b7280')
      .text('Activity Intensity');

    // Cleanup tooltip on component unmount
    return () => {
      d3.selectAll('.heatmap-tooltip').remove();
    };

  }, []);

  return (
    <div className="space-y-6">
      {/* Activity Heatmap */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Activity Intensity Heatmap
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={heatmapRef} className="min-h-[200px]"></div>
          <div className="mt-4 grid grid-cols-7 gap-2 text-xs text-center text-gray-500">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day}>{day}</div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Workflow Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockBehavioralData.workflowPatterns.map((pattern, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">
                      Pattern #{index + 1}
                    </h4>
                    <Badge variant="secondary">
                      {pattern.frequency}x
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    {pattern.sequence.join(' → ')}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Efficiency</span>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${pattern.efficiency * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium">
                        {(pattern.efficiency * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Collaboration Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-blue-900">Team Interactions</p>
                  <p className="text-xs text-blue-700">Daily average</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-900">
                    {mockBehavioralData.collaborationMetrics.teamInteractions}
                  </p>
                  <p className="text-xs text-blue-700">interactions</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-900">Response Time</p>
                  <p className="text-xs text-green-700">Average response</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-900">
                    {mockBehavioralData.collaborationMetrics.responseTime}h
                  </p>
                  <p className="text-xs text-green-700">response time</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-purple-900">Meeting Efficiency</p>
                  <p className="text-xs text-purple-700">Productive meetings</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-purple-900">
                    {(mockBehavioralData.collaborationMetrics.meetingEfficiency * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-purple-700">efficiency</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-orange-900">Knowledge Sharing</p>
                  <p className="text-xs text-orange-700">Information exchange</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-orange-900">
                    {(mockBehavioralData.collaborationMetrics.knowledgeSharing * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-orange-700">sharing rate</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Daily Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockBehavioralData.activityPatterns.map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-16 text-center">
                  <span className="text-sm font-medium">{activity.hour}:00</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{activity.activity}</span>
                    <span className="text-xs text-gray-500">{activity.duration}min</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${activity.intensity * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Badge 
                    variant={activity.intensity > 0.8 ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {(activity.intensity * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Behavioral Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Behavioral Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.slice(0, 3).map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <Activity className="h-5 w-5 text-blue-600" />
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
                    {insight.confidence > 0.8 ? 'High Confidence' : 'Medium Confidence'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pattern Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Pattern Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">85%</div>
              <div className="text-sm text-gray-600">Pattern Consistency</div>
              <div className="text-xs text-gray-500 mt-1">
                Your work patterns are highly consistent
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">92%</div>
              <div className="text-sm text-gray-600">Peak Performance</div>
              <div className="text-xs text-gray-500 mt-1">
                Optimal performance during focus hours
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">78%</div>
              <div className="text-sm text-gray-600">Collaboration Score</div>
              <div className="text-xs text-gray-500 mt-1">
                Good balance of individual and team work
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}