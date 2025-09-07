import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';

interface AICapabilitiesDemoProps {
  onStepComplete?: () => void;
  isActive?: boolean;
}

export const AICapabilitiesDemo: React.FC<AICapabilitiesDemoProps> = ({
  onStepComplete,
  isActive = false,
}) => {
  const [currentDemo, setCurrentDemo] = useState<'prediction' | 'content' | 'analysis'>('prediction');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTaskPredictionDemo = async () => {
    setIsProcessing(true);
    setResults(null);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const predictions = [
      {
        task: 'Review pull request #247',
        confidence: 0.94,
        reasoning: 'User typically reviews PRs after completing coding tasks',
        estimatedTime: '15 minutes',
        suggestedTime: '2:30 PM (optimal focus period)',
      },
      {
        task: 'Update API documentation',
        confidence: 0.87,
        reasoning: 'Documentation updates usually follow API changes',
        estimatedTime: '45 minutes',
        suggestedTime: '3:00 PM (after PR review)',
      },
      {
        task: 'Prepare for team standup',
        confidence: 0.92,
        reasoning: 'Daily standup scheduled for 4:00 PM',
        estimatedTime: '10 minutes',
        suggestedTime: '3:50 PM (just before meeting)',
      },
    ];

    setResults({ type: 'predictions', data: predictions });
    setIsProcessing(false);
  };

  const runContentGenerationDemo = async () => {
    setIsProcessing(true);
    setResults(null);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    const content = {
      originalPrompt: 'Write a technical blog post about React performance optimization',
      generatedContent: `# Optimizing React Performance: A Developer's Guide

React applications can sometimes suffer from performance issues as they grow in complexity. Here are proven strategies to keep your React apps running smoothly:

## 1. Memoization with React.memo and useMemo

React.memo prevents unnecessary re-renders of functional components when props haven't changed. Use it for components that receive the same props frequently.

## 2. Code Splitting with React.lazy

Implement dynamic imports to split your bundle and load components only when needed. This reduces initial bundle size and improves load times.

## 3. Virtual Scrolling for Large Lists

When rendering thousands of items, virtual scrolling renders only visible items, dramatically improving performance.

*Generated with 94% confidence based on your writing style and technical expertise.*`,
      styleAnalysis: {
        tone: 'Professional and instructional',
        complexity: 'Intermediate',
        structure: 'Well-organized with clear headings',
        technicalDepth: 'Appropriate for developers',
      },
      suggestions: [
        'Add code examples for each optimization technique',
        'Include performance benchmarks and metrics',
        'Consider adding a practical case study',
      ],
    };

    setResults({ type: 'content', data: content });
    setIsProcessing(false);
  };

  const runBehaviorAnalysisDemo = async () => {
    setIsProcessing(true);
    setResults(null);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2500));

    const analysis = {
      productivityPattern: {
        peakHours: '10:00 AM - 12:00 PM',
        focusScore: 0.87,
        averageTaskDuration: '2.3 hours',
        contextSwitchFrequency: 'Low (3.2 per day)',
      },
      workStyleInsights: [
        {
          insight: 'Deep Work Preference',
          description: 'You perform best with 2+ hour uninterrupted blocks',
          confidence: 0.91,
          recommendation: 'Schedule complex tasks during morning hours',
        },
        {
          insight: 'Collaborative Efficiency',
          description: 'Productivity increases 23% when working with Sarah and Mike',
          confidence: 0.84,
          recommendation: 'Consider pairing for challenging tasks',
        },
        {
          insight: 'Tool Optimization',
          description: 'VS Code usage correlates with highest output quality',
          confidence: 0.78,
          recommendation: 'Maintain consistent development environment',
        },
      ],
      burnoutRisk: {
        level: 'Low',
        score: 0.23,
        factors: ['Consistent break patterns', 'Healthy work-life balance'],
        recommendations: ['Maintain current schedule', 'Consider 15-min breaks every 90 minutes'],
      },
    };

    setResults({ type: 'analysis', data: analysis });
    setIsProcessing(false);
  };

  useEffect(() => {
    if (isActive && currentDemo === 'prediction') {
      runTaskPredictionDemo();
    }
  }, [isActive, currentDemo]);

  const renderPredictionResults = () => {
    if (!results || results.type !== 'predictions') return null;

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-lg">AI Task Predictions</h4>
        <div className="space-y-3">
          {results.data.map((prediction: any, index: number) => (
            <Card key={index} className="p-4 border-l-4 border-l-blue-500">
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-medium">{prediction.task}</h5>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {Math.round(prediction.confidence * 100)}% confidence
                </Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {prediction.reasoning}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-green-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{prediction.estimatedTime}</span>
                </div>
                <div className="flex items-center gap-1 text-purple-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{prediction.suggestedTime}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderContentResults = () => {
    if (!results || results.type !== 'content') return null;

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-lg">AI Content Generation</h4>
        
        <Card className="p-4">
          <h5 className="font-medium mb-2">Original Prompt</h5>
          <p className="text-sm text-gray-600 dark:text-gray-400 italic">
            "{results.data.originalPrompt}"
          </p>
        </Card>

        <Card className="p-4">
          <h5 className="font-medium mb-2">Generated Content</h5>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-line text-sm">
              {results.data.generatedContent}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h5 className="font-medium mb-2">Style Analysis</h5>
            <div className="space-y-2 text-sm">
              <div><strong>Tone:</strong> {results.data.styleAnalysis.tone}</div>
              <div><strong>Complexity:</strong> {results.data.styleAnalysis.complexity}</div>
              <div><strong>Structure:</strong> {results.data.styleAnalysis.structure}</div>
              <div><strong>Technical Depth:</strong> {results.data.styleAnalysis.technicalDepth}</div>
            </div>
          </Card>

          <Card className="p-4">
            <h5 className="font-medium mb-2">AI Suggestions</h5>
            <ul className="space-y-1 text-sm">
              {results.data.suggestions.map((suggestion: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    );
  };

  const renderAnalysisResults = () => {
    if (!results || results.type !== 'analysis') return null;

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-lg">Behavioral Analysis</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h5 className="font-medium mb-3">Productivity Pattern</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Peak Hours:</span>
                <span className="font-medium text-green-600">{results.data.productivityPattern.peakHours}</span>
              </div>
              <div className="flex justify-between">
                <span>Focus Score:</span>
                <span className="font-medium text-blue-600">{results.data.productivityPattern.focusScore}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Task Duration:</span>
                <span className="font-medium">{results.data.productivityPattern.averageTaskDuration}</span>
              </div>
              <div className="flex justify-between">
                <span>Context Switches:</span>
                <span className="font-medium text-purple-600">{results.data.productivityPattern.contextSwitchFrequency}</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h5 className="font-medium mb-3">Burnout Risk Assessment</h5>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">Risk Level:</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {results.data.burnoutRisk.level}
                </Badge>
              </div>
              <div className="text-sm">
                <strong>Score:</strong> {results.data.burnoutRisk.score}/1.0
              </div>
              <div className="text-sm">
                <strong>Positive Factors:</strong>
                <ul className="mt-1 ml-4">
                  {results.data.burnoutRisk.factors.map((factor: string, index: number) => (
                    <li key={index} className="text-xs">• {factor}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <h5 className="font-medium mb-3">Work Style Insights</h5>
          <div className="space-y-3">
            {results.data.workStyleInsights.map((insight: any, index: number) => (
              <div key={index} className="border-l-4 border-l-indigo-500 pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <h6 className="font-medium text-sm">{insight.insight}</h6>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(insight.confidence * 100)}%
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {insight.description}
                </p>
                <div className="flex items-start gap-1 text-xs text-indigo-600 dark:text-indigo-400">
                  <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span>{insight.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">AI Capabilities Demonstration</h3>
        <div className="flex gap-2">
          <Button
            onClick={() => setCurrentDemo('prediction')}
            variant={currentDemo === 'prediction' ? 'default' : 'outline'}
            size="sm"
          >
            Task Prediction
          </Button>
          <Button
            onClick={() => setCurrentDemo('content')}
            variant={currentDemo === 'content' ? 'default' : 'outline'}
            size="sm"
          >
            Content Generation
          </Button>
          <Button
            onClick={() => setCurrentDemo('analysis')}
            variant={currentDemo === 'analysis' ? 'default' : 'outline'}
            size="sm"
          >
            Behavior Analysis
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-semibold">
              {currentDemo === 'prediction' && 'Predictive Task Intelligence'}
              {currentDemo === 'content' && 'AI Content Generation'}
              {currentDemo === 'analysis' && 'Behavioral Pattern Analysis'}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {currentDemo === 'prediction' && 'AI predicts your next tasks based on patterns and context'}
              {currentDemo === 'content' && 'Generate high-quality content that matches your style'}
              {currentDemo === 'analysis' && 'Deep insights into your work patterns and productivity'}
            </p>
          </div>
          <Button
            onClick={() => {
              if (currentDemo === 'prediction') runTaskPredictionDemo();
              if (currentDemo === 'content') runContentGenerationDemo();
              if (currentDemo === 'analysis') runBehaviorAnalysisDemo();
            }}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Run Demo'}
          </Button>
        </div>

        {isProcessing && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI is analyzing patterns and generating insights...
              </p>
            </div>
          </div>
        )}

        {!isProcessing && results && (
          <div>
            {renderPredictionResults()}
            {renderContentResults()}
            {renderAnalysisResults()}
          </div>
        )}

        {!isProcessing && !results && (
          <div className="text-center py-12 text-gray-500">
            Click "Run Demo" to see AI capabilities in action
          </div>
        )}
      </Card>

      {results && (
        <div className="flex justify-end">
          <Button onClick={onStepComplete}>
            Continue to Next Step
          </Button>
        </div>
      )}
    </div>
  );
};