import React from 'react';
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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                {getRiskIcon(prediction.riskLevel)}
                <div>
                  <h3 className="text-lg font-semibold">
                    {prediction.riskLevel.charAt(0).toUpperCase() + prediction.riskLevel.slice(1)} Risk
                  </h3>
                  <p className="text-sm text-gray-600">
                    {(prediction.probability * 100).toFixed(1)}% probability
                  </p>
                </div>
              </div>
              <Badge className={getRiskLevelColor(prediction.riskLevel)}>
                {prediction.riskLevel.toUpperCase()}
              </Badge>
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