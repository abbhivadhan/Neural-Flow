import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  Target, 
  Lightbulb,
  CheckCircle,
  Clock,
  ArrowRight,
  Filter,
  Star
} from 'lucide-react';

import { Insight, InsightSeverity, InsightType, InsightCategory } from '../../types/analytics';

interface InsightsPanelProps {
  insights: Insight[];
}

export default function InsightsPanel({ insights }: InsightsPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<InsightCategory | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<InsightSeverity | 'all'>('all');

  // Filter insights based on selected criteria
  const filteredInsights = insights.filter(insight => {
    const categoryMatch = selectedCategory === 'all' || insight.category === selectedCategory;
    const severityMatch = selectedSeverity === 'all' || insight.severity === selectedSeverity;
    return categoryMatch && severityMatch;
  });

  // Get insight icon based on type
  const getInsightIcon = (type: InsightType) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="h-5 w-5" />;
      case 'anomaly':
        return <AlertTriangle className="h-5 w-5" />;
      case 'prediction':
        return <Brain className="h-5 w-5" />;
      case 'opportunity':
        return <Target className="h-5 w-5" />;
      case 'risk':
        return <AlertTriangle className="h-5 w-5" />;
      case 'pattern':
        return <Lightbulb className="h-5 w-5" />;
      default:
        return <Brain className="h-5 w-5" />;
    }
  };

  // Get severity color
  const getSeverityColor = (severity: InsightSeverity): string => {
    switch (severity) {
      case InsightSeverity.CRITICAL:
        return 'bg-red-100 text-red-800 border-red-200';
      case InsightSeverity.HIGH:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case InsightSeverity.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case InsightSeverity.LOW:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get category color
  const getCategoryColor = (category: InsightCategory): string => {
    switch (category) {
      case InsightCategory.PRODUCTIVITY:
        return 'bg-green-100 text-green-800';
      case InsightCategory.PERFORMANCE:
        return 'bg-blue-100 text-blue-800';
      case InsightCategory.COLLABORATION:
        return 'bg-purple-100 text-purple-800';
      case InsightCategory.WELLBEING:
        return 'bg-red-100 text-red-800';
      case InsightCategory.EFFICIENCY:
        return 'bg-yellow-100 text-yellow-800';
      case InsightCategory.QUALITY:
        return 'bg-indigo-100 text-indigo-800';
      case InsightCategory.INNOVATION:
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get type color
  const getTypeColor = (type: InsightType): string => {
    switch (type) {
      case InsightType.TREND:
        return 'text-blue-600';
      case InsightType.ANOMALY:
        return 'text-red-600';
      case InsightType.PREDICTION:
        return 'text-purple-600';
      case InsightType.OPPORTUNITY:
        return 'text-green-600';
      case InsightType.RISK:
        return 'text-orange-600';
      case InsightType.PATTERN:
        return 'text-indigo-600';
      default:
        return 'text-gray-600';
    }
  };

  // Handle insight action
  const handleInsightAction = (insight: Insight, actionType: 'acknowledge' | 'dismiss' | 'act') => {
    // In a real implementation, this would update the insight status
    console.log(`${actionType} insight:`, insight.id);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            AI Insights ({filteredInsights.length})
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Category:</span>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value as InsightCategory | 'all')}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All</option>
              <option value={InsightCategory.PRODUCTIVITY}>Productivity</option>
              <option value={InsightCategory.PERFORMANCE}>Performance</option>
              <option value={InsightCategory.COLLABORATION}>Collaboration</option>
              <option value={InsightCategory.WELLBEING}>Wellbeing</option>
              <option value={InsightCategory.EFFICIENCY}>Efficiency</option>
              <option value={InsightCategory.QUALITY}>Quality</option>
              <option value={InsightCategory.INNOVATION}>Innovation</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Severity:</span>
            <select 
              value={selectedSeverity} 
              onChange={(e) => setSelectedSeverity(e.target.value as InsightSeverity | 'all')}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All</option>
              <option value={InsightSeverity.CRITICAL}>Critical</option>
              <option value={InsightSeverity.HIGH}>High</option>
              <option value={InsightSeverity.MEDIUM}>Medium</option>
              <option value={InsightSeverity.LOW}>Low</option>
            </select>
          </div>
        </div>

        {/* Insights List */}
        <div className="space-y-4">
          {filteredInsights.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No insights match your current filters.</p>
            </div>
          ) : (
            filteredInsights.map((insight, index) => (
              <div key={insight.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                {/* Insight Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 ${getTypeColor(insight.type)}`}>
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
                      <p className="text-sm text-gray-600">{insight.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getSeverityColor(insight.severity)}>
                      {insight.severity}
                    </Badge>
                    <Badge className={getCategoryColor(insight.category)}>
                      {insight.category}
                    </Badge>
                  </div>
                </div>

                {/* Insight Metadata */}
                <div className="flex items-center space-x-4 mb-3 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Star className="h-3 w-3 mr-1" />
                    <span>Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Impact: {insight.impact.timeframe}</span>
                  </div>
                  <div className="flex items-center">
                    <Target className="h-3 w-3 mr-1" />
                    <span>Scope: {insight.impact.scope}</span>
                  </div>
                </div>

                {/* Recommendations */}
                {insight.recommendations.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Recommendations:</h5>
                    <div className="space-y-2">
                      {insight.recommendations.slice(0, 2).map((rec, recIndex) => (
                        <div key={rec.id} className="flex items-start space-x-2 p-2 bg-gray-50 rounded">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{rec.title}</p>
                            <p className="text-xs text-gray-600">{rec.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {rec.priority} priority
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {rec.effort} effort
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {rec.timeline} days
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                      {insight.recommendations.length > 2 && (
                        <p className="text-xs text-gray-500">
                          +{insight.recommendations.length - 2} more recommendations
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Key Metrics */}
                {Object.keys(insight.data.metrics).length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Key Metrics:</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(insight.data.metrics).slice(0, 6).map(([key, value]) => (
                        <div key={key} className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-sm font-medium">
                            {typeof value === 'number' ? value.toFixed(2) : value}
                          </div>
                          <div className="text-xs text-gray-600">
                            {key.replace(/_/g, ' ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleInsightAction(insight, 'acknowledge')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Acknowledge
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleInsightAction(insight, 'dismiss')}
                    >
                      Dismiss
                    </Button>
                  </div>
                  
                  {insight.recommendations.length > 0 && (
                    <Button 
                      size="sm"
                      onClick={() => handleInsightAction(insight, 'act')}
                    >
                      Take Action
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Stats */}
        {insights.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-red-600">
                  {insights.filter(i => i.severity === InsightSeverity.CRITICAL).length}
                </div>
                <div className="text-xs text-gray-600">Critical</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">
                  {insights.filter(i => i.severity === InsightSeverity.HIGH).length}
                </div>
                <div className="text-xs text-gray-600">High</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-600">
                  {insights.filter(i => i.severity === InsightSeverity.MEDIUM).length}
                </div>
                <div className="text-xs text-gray-600">Medium</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {insights.filter(i => i.severity === InsightSeverity.LOW).length}
                </div>
                <div className="text-xs text-gray-600">Low</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}