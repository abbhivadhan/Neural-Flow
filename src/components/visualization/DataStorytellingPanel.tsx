import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  BookOpen, 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Zap,
  Brain,
  Share2,
  Download,
  RefreshCw
} from 'lucide-react';

import { 
  Insight, 
  InsightType, 
  InsightSeverity, 
  TrendData, 
  ComparisonData 
} from '../../types/analytics';
import { TimeRange } from '../../types/common';

interface DataStory {
  id: string;
  title: string;
  narrative: string;
  keyFindings: string[];
  recommendations: string[];
  visualizations: string[];
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  createdAt: string;
}

interface StorytellingInsight {
  type: 'trend' | 'anomaly' | 'correlation' | 'opportunity' | 'risk';
  title: string;
  description: string;
  evidence: string[];
  implications: string[];
  confidence: number;
}

interface DataStorytellingPanelProps {
  insights: Insight[];
  trends: TrendData[];
  comparisons: ComparisonData[];
  timeRange: TimeRange;
  className?: string;
}

export default function DataStorytellingPanel({
  insights,
  trends,
  comparisons,
  timeRange,
  className = ''
}: DataStorytellingPanelProps) {
  const [stories, setStories] = useState<DataStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<DataStory | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [storytellingInsights, setStorytellingInsights] = useState<StorytellingInsight[]>([]);

  // Generate data stories from insights and trends
  const generateDataStories = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      // Analyze patterns and generate narratives
      const generatedStories = await analyzeAndGenerateStories(insights, trends, comparisons, timeRange);
      setStories(generatedStories);
      
      // Generate storytelling insights
      const storyInsights = await generateStorytellingInsights(insights, trends);
      setStorytellingInsights(storyInsights);
      
      // Auto-select the most impactful story
      if (generatedStories.length > 0) {
        const topStory = generatedStories.reduce((prev, current) => 
          (current.impact === 'high' && current.confidence > prev.confidence) ? current : prev
        );
        setSelectedStory(topStory);
      }
      
    } catch (error) {
      console.error('Error generating data stories:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [insights, trends, comparisons, timeRange]);

  // Export story as report
  const exportStory = async (story: DataStory, format: 'pdf' | 'html' | 'markdown') => {
    try {
      const content = generateStoryContent(story, format);
      const blob = new Blob([content], { 
        type: format === 'pdf' ? 'application/pdf' : 'text/plain' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-story-${story.id}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  // Share story
  const shareStory = async (story: DataStory) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: story.title,
          text: story.narrative.substring(0, 200) + '...',
          url: window.location.href
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          `${story.title}\n\n${story.narrative}\n\nKey Findings:\n${story.keyFindings.join('\n')}`
        );
        alert('Story copied to clipboard!');
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // Load stories on mount and when data changes
  useEffect(() => {
    if (insights.length > 0 || trends.length > 0) {
      generateDataStories();
    }
  }, [generateDataStories]);

  const getSeverityIcon = (severity: InsightSeverity) => {
    switch (severity) {
      case InsightSeverity.CRITICAL:
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case InsightSeverity.HIGH:
        return <TrendingUp className="h-4 w-4 text-orange-600" />;
      case InsightSeverity.MEDIUM:
        return <Target className="h-4 w-4 text-yellow-600" />;
      default:
        return <Lightbulb className="h-4 w-4 text-blue-600" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="h-4 w-4" />;
      case 'anomaly':
        return <AlertTriangle className="h-4 w-4" />;
      case 'correlation':
        return <Zap className="h-4 w-4" />;
      case 'opportunity':
        return <Target className="h-4 w-4" />;
      case 'risk':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <BookOpen className="h-6 w-6 mr-2" />
            Data Storytelling
          </h2>
          <p className="text-gray-600 mt-1">
            AI-generated narratives and insights from your productivity data
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={generateDataStories}
            disabled={isGenerating}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Regenerate Stories'}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isGenerating && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">AI is analyzing your data and crafting stories...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Story Selection */}
      {stories.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Story List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Generated Stories</h3>
            {stories.map((story) => (
              <Card
                key={story.id}
                className={`cursor-pointer transition-all ${
                  selectedStory?.id === story.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedStory(story)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                      {story.title}
                    </h4>
                    <Badge className={getImpactColor(story.impact)}>
                      {story.impact}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-3 mb-2">
                    {story.narrative}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Confidence: {(story.confidence * 100).toFixed(0)}%
                    </span>
                    <span className="text-xs text-gray-500">
                      {story.keyFindings.length} findings
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected Story Details */}
          <div className="lg:col-span-3">
            {selectedStory ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    {selectedStory.title}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge className={getImpactColor(selectedStory.impact)}>
                      {selectedStory.impact} impact
                    </Badge>
                    <Badge variant="secondary">
                      {(selectedStory.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                    <Button
                      onClick={() => shareStory(selectedStory)}
                      variant="outline"
                      size="sm"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button
                      onClick={() => exportStory(selectedStory, 'pdf')}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Narrative */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Story Narrative</h4>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 leading-relaxed">
                        {selectedStory.narrative}
                      </p>
                    </div>
                  </div>

                  {/* Key Findings */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Key Findings</h4>
                    <div className="space-y-2">
                      {selectedStory.keyFindings.map((finding, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                          <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-blue-800">{finding}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Recommendations</h4>
                    <div className="space-y-2">
                      {selectedStory.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                          <Target className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-green-800">{recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a story from the list to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Storytelling Insights */}
      {storytellingInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2" />
              Storytelling Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {storytellingInsights.map((insight, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getInsightTypeIcon(insight.type)}
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                    </div>
                    <Badge variant="secondary">
                      {(insight.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                  
                  {insight.evidence.length > 0 && (
                    <div className="mb-3">
                      <h5 className="text-xs font-medium text-gray-700 mb-1">Evidence:</h5>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {insight.evidence.map((evidence, i) => (
                          <li key={i} className="flex items-start space-x-1">
                            <span className="text-gray-400">•</span>
                            <span>{evidence}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {insight.implications.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-gray-700 mb-1">Implications:</h5>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {insight.implications.map((implication, i) => (
                          <li key={i} className="flex items-start space-x-1">
                            <span className="text-gray-400">→</span>
                            <span>{implication}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isGenerating && stories.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Stories Generated Yet</h3>
            <p className="text-gray-600 mb-4">
              We need more data insights to generate meaningful stories. 
              Try analyzing your productivity data first.
            </p>
            <Button onClick={generateDataStories} disabled={insights.length === 0}>
              <Brain className="h-4 w-4 mr-2" />
              Generate Stories
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper functions for story generation
async function analyzeAndGenerateStories(
  insights: Insight[],
  trends: TrendData[],
  comparisons: ComparisonData[],
  timeRange: TimeRange
): Promise<DataStory[]> {
  const stories: DataStory[] = [];

  // Productivity trend story
  if (trends.length > 0) {
    const productivityTrend = trends.find(t => t.metric === 'productivity_score');
    if (productivityTrend) {
      stories.push({
        id: 'productivity-trend',
        title: 'Your Productivity Journey: Trends and Patterns',
        narrative: generateProductivityNarrative(productivityTrend, insights),
        keyFindings: extractProductivityFindings(productivityTrend, insights),
        recommendations: generateProductivityRecommendations(productivityTrend, insights),
        visualizations: ['line-chart', 'trend-analysis'],
        confidence: 0.85,
        impact: determineImpact(productivityTrend),
        createdAt: new Date().toISOString()
      });
    }
  }

  // Behavioral pattern story
  const behaviorInsights = insights.filter(i => i.category === 'productivity');
  if (behaviorInsights.length > 0) {
    stories.push({
      id: 'behavior-patterns',
      title: 'Hidden Patterns in Your Work Behavior',
      narrative: generateBehaviorNarrative(behaviorInsights),
      keyFindings: extractBehaviorFindings(behaviorInsights),
      recommendations: generateBehaviorRecommendations(behaviorInsights),
      visualizations: ['heatmap', 'pattern-analysis'],
      confidence: 0.78,
      impact: 'medium',
      createdAt: new Date().toISOString()
    });
  }

  // Opportunity story
  const opportunityInsights = insights.filter(i => i.type === InsightType.OPPORTUNITY);
  if (opportunityInsights.length > 0) {
    stories.push({
      id: 'opportunities',
      title: 'Untapped Opportunities for Growth',
      narrative: generateOpportunityNarrative(opportunityInsights),
      keyFindings: extractOpportunityFindings(opportunityInsights),
      recommendations: generateOpportunityRecommendations(opportunityInsights),
      visualizations: ['opportunity-matrix', 'impact-analysis'],
      confidence: 0.72,
      impact: 'high',
      createdAt: new Date().toISOString()
    });
  }

  return stories;
}

async function generateStorytellingInsights(
  insights: Insight[],
  trends: TrendData[]
): Promise<StorytellingInsight[]> {
  const storyInsights: StorytellingInsight[] = [];

  // Trend insight
  if (trends.length > 0) {
    const strongTrends = trends.filter(t => Math.abs(t.changeRate) > 0.1);
    if (strongTrends.length > 0) {
      storyInsights.push({
        type: 'trend',
        title: 'Strong Performance Trends Detected',
        description: `${strongTrends.length} metrics show significant trending patterns`,
        evidence: strongTrends.map(t => `${t.metric} trending ${t.direction} at ${(t.changeRate * 100).toFixed(1)}% rate`),
        implications: ['Performance trajectory is clearly defined', 'Predictable patterns enable forecasting'],
        confidence: 0.9
      });
    }
  }

  // Correlation insight
  const correlationInsights = insights.filter(i => i.type === InsightType.CORRELATION);
  if (correlationInsights.length > 0) {
    storyInsights.push({
      type: 'correlation',
      title: 'Interconnected Performance Factors',
      description: 'Multiple metrics show strong correlations, revealing system-level relationships',
      evidence: correlationInsights.map(i => i.description),
      implications: ['Changes in one area will affect others', 'Holistic optimization approach needed'],
      confidence: 0.8
    });
  }

  return storyInsights;
}

function generateProductivityNarrative(trend: TrendData, insights: Insight[]): string {
  const direction = trend.direction === 'up' ? 'improving' : trend.direction === 'down' ? 'declining' : 'stable';
  const changeRate = Math.abs(trend.changeRate * 100);
  
  return `Over the analyzed period, your productivity has been ${direction} at a rate of ${changeRate.toFixed(1)}% per period. ${
    trend.direction === 'up' 
      ? 'This positive trajectory suggests that your current strategies and habits are working well. The upward trend indicates consistent improvement in your work effectiveness.'
      : trend.direction === 'down'
      ? 'This declining trend warrants attention and may indicate the need for strategy adjustments. Understanding the root causes can help reverse this pattern.'
      : 'Your productivity has remained relatively stable, which suggests consistent performance but may also indicate potential for optimization and growth.'
  } The data reveals several key patterns that can inform future productivity strategies.`;
}

function extractProductivityFindings(trend: TrendData, insights: Insight[]): string[] {
  const findings = [
    `Productivity ${trend.direction === 'up' ? 'increased' : trend.direction === 'down' ? 'decreased' : 'remained stable'} by ${(Math.abs(trend.changeRate) * 100).toFixed(1)}%`,
    `Trend significance level: ${(trend.significance * 100).toFixed(0)}%`
  ];

  // Add insights-based findings
  insights.slice(0, 3).forEach(insight => {
    findings.push(insight.description);
  });

  return findings;
}

function generateProductivityRecommendations(trend: TrendData, insights: Insight[]): string[] {
  const recommendations = [];

  if (trend.direction === 'up') {
    recommendations.push('Continue current successful strategies and habits');
    recommendations.push('Document what\'s working to maintain momentum');
    recommendations.push('Consider scaling successful approaches to other areas');
  } else if (trend.direction === 'down') {
    recommendations.push('Investigate root causes of productivity decline');
    recommendations.push('Implement immediate interventions to reverse the trend');
    recommendations.push('Review and adjust current workflows and processes');
  } else {
    recommendations.push('Explore opportunities for productivity optimization');
    recommendations.push('Experiment with new tools and techniques');
    recommendations.push('Set specific improvement targets and track progress');
  }

  return recommendations;
}

function generateBehaviorNarrative(insights: Insight[]): string {
  return `Analysis of your work behavior patterns reveals interesting insights about how you operate throughout different periods. Your behavioral data shows distinct patterns in activity levels, focus periods, and work rhythms. These patterns provide valuable insights into your natural productivity cycles and can help optimize your work schedule for maximum effectiveness.`;
}

function extractBehaviorFindings(insights: Insight[]): string[] {
  return insights.slice(0, 4).map(insight => insight.description);
}

function generateBehaviorRecommendations(insights: Insight[]): string[] {
  return [
    'Align high-focus tasks with your peak performance periods',
    'Schedule breaks during natural low-energy periods',
    'Optimize your environment based on behavioral patterns',
    'Use insights to improve work-life balance'
  ];
}

function generateOpportunityNarrative(insights: Insight[]): string {
  return `Your data reveals several untapped opportunities for significant productivity improvements. These opportunities represent areas where small changes could yield substantial benefits. By focusing on these high-impact, low-effort improvements, you can unlock new levels of performance and efficiency.`;
}

function extractOpportunityFindings(insights: Insight[]): string[] {
  return insights.map(insight => insight.description);
}

function generateOpportunityRecommendations(insights: Insight[]): string[] {
  return [
    'Prioritize high-impact, low-effort opportunities first',
    'Create implementation timeline for opportunity realization',
    'Track progress and measure impact of changes',
    'Build on successful improvements to create momentum'
  ];
}

function determineImpact(trend: TrendData): 'low' | 'medium' | 'high' {
  const changeRate = Math.abs(trend.changeRate);
  if (changeRate > 0.15) return 'high';
  if (changeRate > 0.05) return 'medium';
  return 'low';
}

function generateStoryContent(story: DataStory, format: 'pdf' | 'html' | 'markdown'): string {
  const content = `
# ${story.title}

## Executive Summary
${story.narrative}

## Key Findings
${story.keyFindings.map(finding => `- ${finding}`).join('\n')}

## Recommendations
${story.recommendations.map(rec => `- ${rec}`).join('\n')}

## Metadata
- Confidence Level: ${(story.confidence * 100).toFixed(0)}%
- Impact Level: ${story.impact}
- Generated: ${new Date(story.createdAt).toLocaleDateString()}
`;

  switch (format) {
    case 'html':
      return content.replace(/\n/g, '<br>').replace(/^# /gm, '<h1>').replace(/^## /gm, '<h2>');
    case 'markdown':
      return content;
    default:
      return content;
  }
}