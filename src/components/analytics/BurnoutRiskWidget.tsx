import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Alert, AlertDescription } from '../ui/Alert';
import { 
  Shield, 
  AlertTriangle, 
  Clock, 
  TrendingDown,
  Heart,
  Brain,
  Users,
  CheckCircle,
  XCircle
} from 'lucide-react';

import { BurnoutPrediction, BurnoutIntervention } from '../../services/analytics/BurnoutDetectionService';
import { Insight } from '../../types/analytics';

interface BurnoutRiskWidgetProps {
  prediction: BurnoutPrediction;
  interventions: BurnoutIntervention[];
  insights: Insight[];
}

export default function BurnoutRiskWidget({ 
  prediction, 
  interventions, 
  insights 
}: BurnoutRiskWidgetProps) {
  const riskGaugeRef = useRef<HTMLDivElement>(null);
  const factorsChartRef = useRef<HTMLDivElement>(null);

  // Create risk gauge visualization
  useEffect(() => {
    if (!riskGaugeRef.current) return;

    const container = d3.select(riskGaugeRef.current);
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
    const backgroundArc = d3.arc()
      .innerRadius(radius - 25)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2);

    g.append('path')
      .datum({ startAngle: -Math.PI / 2, endAngle: Math.PI / 2 })
      .style('fill', '#e5e7eb')
      .attr('d', backgroundArc as any);

    // Create risk level segments
    const riskLevels = [
      { level: 'low', color: '#10b981', start: -Math.PI / 2, end: -Math.PI / 4 },
      { level: 'medium', color: '#f59e0b', start: -Math.PI / 4, end: 0 },
      { level: 'high', color: '#ef4444', start: 0, end: Math.PI / 4 },
      { level: 'critical', color: '#dc2626', start: Math.PI / 4, end: Math.PI / 2 }
    ];

    riskLevels.forEach(level => {
      const levelArc = d3.arc()
        .innerRadius(radius - 25)
        .outerRadius(radius)
        .startAngle(level.start)
        .endAngle(level.end);

      g.append('path')
        .datum(level)
        .style('fill', level.color)
        .style('opacity', 0.3)
        .attr('d', levelArc as any);
    });

    // Create needle
    const needleAngle = -Math.PI / 2 + (prediction.probability * Math.PI);
    const needleLength = radius - 30;

    g.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', needleLength * Math.cos(needleAngle))
      .attr('y2', needleLength * Math.sin(needleAngle))
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round');

    g.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 8)
      .attr('fill', '#1f2937');

    // Add risk score text
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('y', 30)
      .style('font-size', '24px')
      .style('font-weight', 'bold')
      .style('fill', '#1f2937')
      .text(`${(prediction.probability * 100).toFixed(0)}%`);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('y', 50)
      .style('font-size', '12px')
      .style('fill', '#6b7280')
      .text('Burnout Risk');

    // Add level labels
    const labelPositions = [
      { level: 'Low', angle: -3 * Math.PI / 8, color: '#10b981' },
      { level: 'Med', angle: -Math.PI / 8, color: '#f59e0b' },
      { level: 'High', angle: Math.PI / 8, color: '#ef4444' },
      { level: 'Critical', angle: 3 * Math.PI / 8, color: '#dc2626' }
    ];

    labelPositions.forEach(pos => {
      const labelRadius = radius + 15;
      const x = labelRadius * Math.cos(pos.angle);
      const y = labelRadius * Math.sin(pos.angle);

      g.append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .style('fill', pos.color)
        .text(pos.level);
    });

  }, [prediction]);

  // Create risk factors radar chart
  useEffect(() => {
    if (!factorsChartRef.current || !prediction.primaryFactors) return;

    const container = d3.select(factorsChartRef.current);
    container.selectAll('*').remove();

    const width = 400;
    const height = 300;
    const radius = Math.min(width, height) / 2 - 40;

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Mock risk factor data with scores
    const riskFactors = [
      { factor: 'Workload', score: 0.8, angle: 0 },
      { factor: 'Hours', score: 0.6, angle: Math.PI / 3 },
      { factor: 'Social', score: 0.4, angle: 2 * Math.PI / 3 },
      { factor: 'Quality', score: 0.7, angle: Math.PI },
      { factor: 'Support', score: 0.3, angle: 4 * Math.PI / 3 },
      { factor: 'Control', score: 0.5, angle: 5 * Math.PI / 3 }
    ];

    // Create concentric circles for scale
    const scales = [0.2, 0.4, 0.6, 0.8, 1.0];
    scales.forEach(scale => {
      g.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', radius * scale)
        .attr('fill', 'none')
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 1);
    });

    // Create axis lines
    riskFactors.forEach(factor => {
      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', radius * Math.cos(factor.angle - Math.PI / 2))
        .attr('y2', radius * Math.sin(factor.angle - Math.PI / 2))
        .attr('stroke', '#d1d5db')
        .attr('stroke-width', 1);
    });

    // Create data polygon
    const lineGenerator = d3.line<{ factor: string; score: number; angle: number }>()
      .x(d => (radius * d.score) * Math.cos(d.angle - Math.PI / 2))
      .y(d => (radius * d.score) * Math.sin(d.angle - Math.PI / 2))
      .curve(d3.curveLinearClosed);

    g.append('path')
      .datum(riskFactors)
      .attr('d', lineGenerator)
      .attr('fill', '#ef4444')
      .attr('fill-opacity', 0.2)
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2);

    // Add data points
    g.selectAll('.risk-point')
      .data(riskFactors)
      .enter()
      .append('circle')
      .attr('class', 'risk-point')
      .attr('cx', d => (radius * d.score) * Math.cos(d.angle - Math.PI / 2))
      .attr('cy', d => (radius * d.score) * Math.sin(d.angle - Math.PI / 2))
      .attr('r', 4)
      .attr('fill', '#ef4444')
      .attr('stroke', '#dc2626')
      .attr('stroke-width', 2);

    // Add factor labels
    riskFactors.forEach(factor => {
      const labelRadius = radius + 20;
      const x = labelRadius * Math.cos(factor.angle - Math.PI / 2);
      const y = labelRadius * Math.sin(factor.angle - Math.PI / 2);

      g.append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .style('fill', '#374151')
        .text(factor.factor);

      // Add score labels
      g.append('text')
        .attr('x', x)
        .attr('y', y + 12)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .style('font-size', '9px')
        .style('fill', '#6b7280')
        .text(`${(factor.score * 100).toFixed(0)}%`);
    });

    // Add scale labels
    scales.forEach(scale => {
      if (scale > 0) {
        g.append('text')
          .attr('x', 5)
          .attr('y', -radius * scale)
          .attr('dy', '0.35em')
          .style('font-size', '9px')
          .style('fill', '#9ca3af')
          .text(`${(scale * 100).toFixed(0)}%`);
      }
    });

  }, [prediction]);

  const getRiskLevelColor = (level: string): string => {
    switch (level) {
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-100 border-green-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <XCircle className="h-6 w-6 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-6 w-6 text-orange-600" />;
      case 'medium':
        return <Shield className="h-6 w-6 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      default:
        return <Shield className="h-6 w-6 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-600 text-white';
      case 'medium':
        return 'bg-yellow-600 text-white';
      case 'low':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getEffortColor = (effort: string): string => {
    switch (effort) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Risk Level Alert */}
      {(prediction.riskLevel === 'critical' || prediction.riskLevel === 'high') && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>
              {prediction.riskLevel === 'critical' ? 'Critical' : 'High'} Burnout Risk Detected
            </strong>
            <br />
            Immediate action recommended. Probability: {(prediction.probability * 100).toFixed(1)}%
          </AlertDescription>
        </Alert>
      )}

      {/* Risk Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Burnout Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Risk Gauge */}
              <div className="flex flex-col items-center">
                <div ref={riskGaugeRef}></div>
                <div className="mt-4 text-center">
                  <Badge className={getRiskLevelColor(prediction.riskLevel)}>
                    {prediction.riskLevel.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-2">
                    Confidence: {(prediction.confidenceInterval[0] * 100).toFixed(1)}% - {(prediction.confidenceInterval[1] * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Risk Factors Radar */}
              <div className="flex flex-col items-center">
                <div ref={factorsChartRef}></div>
                <p className="text-sm text-gray-600 text-center mt-2">
                  Risk Factor Analysis
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Risk Probability</span>
                  <span className="text-sm text-gray-600">
                    {(prediction.probability * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${
                      prediction.probability > 0.7 ? 'bg-red-600' :
                      prediction.probability > 0.4 ? 'bg-orange-600' : 'bg-green-600'
                    }`}
                    style={{ width: `${prediction.probability * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Confidence Interval</span>
                  <span className="text-sm text-gray-600">
                    {(prediction.confidenceInterval[0] * 100).toFixed(1)}% - {(prediction.confidenceInterval[1] * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ 
                      marginLeft: `${prediction.confidenceInterval[0] * 100}%`,
                      width: `${(prediction.confidenceInterval[1] - prediction.confidenceInterval[0]) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Time to Onset
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {prediction.timeToOnset}
              </div>
              <div className="text-sm text-gray-600 mb-4">days</div>
              <div className="text-xs text-gray-500">
                Estimated time before burnout symptoms may appear
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Primary Risk Factors */}
      <Card>
        <CardHeader>
          <CardTitle>Primary Risk Factors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {prediction.primaryFactors.map((factor, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {factor.includes('Workload') && <TrendingDown className="h-5 w-5 text-red-600" />}
                  {factor.includes('Hours') && <Clock className="h-5 w-5 text-orange-600" />}
                  {factor.includes('Social') && <Users className="h-5 w-5 text-blue-600" />}
                  {factor.includes('Exhaustion') && <Heart className="h-5 w-5 text-purple-600" />}
                  {factor.includes('Achievement') && <Brain className="h-5 w-5 text-green-600" />}
                  {!factor.includes('Workload') && !factor.includes('Hours') && !factor.includes('Social') && 
                   !factor.includes('Exhaustion') && !factor.includes('Achievement') && 
                   <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{factor}</p>
                  <p className="text-xs text-gray-500">Contributing factor</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Intervention Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Interventions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {interventions.slice(0, 5).map((intervention, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {intervention.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {intervention.description}
                    </p>
                  </div>
                  <Badge className={getPriorityColor(intervention.priority)}>
                    {intervention.priority}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <div className="font-medium capitalize">{intervention.type.replace('_', ' ')}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Timeline:</span>
                    <div className="font-medium">{intervention.timeline} days</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Effort:</span>
                    <div className={`font-medium ${getEffortColor(intervention.effort)}`}>
                      {intervention.effort}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Expected Impact:</span>
                    <div className="font-medium">
                      {(intervention.expectedImpact * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <Button variant="outline" size="sm">
                    Start Intervention
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Burnout Prevention Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Prevention Strategies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Immediate Actions</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Take Regular Breaks</p>
                    <p className="text-xs text-gray-600">Schedule 15-minute breaks every 2 hours</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Set Work Boundaries</p>
                    <p className="text-xs text-gray-600">Define clear start and end times for work</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Practice Mindfulness</p>
                    <p className="text-xs text-gray-600">5-minute meditation sessions during the day</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Long-term Strategies</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Workload Management</p>
                    <p className="text-xs text-gray-600">Regularly review and adjust task priorities</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Skill Development</p>
                    <p className="text-xs text-gray-600">Learn stress management and delegation skills</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Social Support</p>
                    <p className="text-xs text-gray-600">Maintain connections with colleagues and friends</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wellbeing Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Wellbeing Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.slice(0, 3).map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <Heart className="h-5 w-5 text-red-600" />
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
    </div>
  );
}