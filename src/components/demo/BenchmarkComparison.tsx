import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface BenchmarkData {
  category: string;
  metrics: {
    name: string;
    neuralFlow: number;
    traditional: number;
    unit: string;
    improvement: number;
    description: string;
  }[];
}

interface ComparisonScenario {
  id: string;
  name: string;
  description: string;
  duration: string;
  participants: number;
}

export const BenchmarkComparison: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<string>('productivity');
  const [animateValues, setAnimateValues] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData[]>([]);

  const scenarios: ComparisonScenario[] = [
    {
      id: 'productivity',
      name: 'Individual Productivity',
      description: 'Single user workflow optimization',
      duration: '8 hours',
      participants: 1
    },
    {
      id: 'collaboration',
      name: 'Team Collaboration',
      description: 'Multi-user project coordination',
      duration: '1 week',
      participants: 8
    },
    {
      id: 'content',
      name: 'Content Creation',
      description: 'AI-assisted content generation',
      duration: '4 hours',
      participants: 3
    },
    {
      id: 'analysis',
      name: 'Data Analysis',
      description: 'Insights and decision making',
      duration: '2 days',
      participants: 5
    }
  ];

  useEffect(() => {
    const data: Record<string, BenchmarkData[]> = {
      productivity: [
        {
          category: 'Task Management',
          metrics: [
            {
              name: 'Task Completion Speed',
              neuralFlow: 85,
              traditional: 45,
              unit: 'tasks/hour',
              improvement: 89,
              description: 'Average tasks completed per hour with AI assistance'
            },
            {
              name: 'Context Switch Time',
              neuralFlow: 2.3,
              traditional: 8.7,
              unit: 'seconds',
              improvement: 74,
              description: 'Time to switch between different work contexts'
            },
            {
              name: 'Priority Accuracy',
              neuralFlow: 94,
              traditional: 67,
              unit: '%',
              improvement: 40,
              description: 'Accuracy of task prioritization decisions'
            }
          ]
        },
        {
          category: 'Workflow Efficiency',
          metrics: [
            {
              name: 'Automation Rate',
              neuralFlow: 78,
              traditional: 12,
              unit: '%',
              improvement: 550,
              description: 'Percentage of routine tasks automated'
            },
            {
              name: 'Prediction Accuracy',
              neuralFlow: 92,
              traditional: 15,
              unit: '%',
              improvement: 513,
              description: 'Accuracy of next-task predictions'
            },
            {
              name: 'Resource Preparation',
              neuralFlow: 96,
              traditional: 23,
              unit: '%',
              improvement: 317,
              description: 'Proactive resource and tool preparation'
            }
          ]
        }
      ],
      collaboration: [
        {
          category: 'Team Coordination',
          metrics: [
            {
              name: 'Meeting Efficiency',
              neuralFlow: 87,
              traditional: 54,
              unit: '%',
              improvement: 61,
              description: 'Percentage of meeting time spent on productive discussion'
            },
            {
              name: 'Conflict Resolution',
              neuralFlow: 4.2,
              traditional: 18.5,
              unit: 'minutes',
              improvement: 77,
              description: 'Average time to resolve merge conflicts'
            },
            {
              name: 'Knowledge Sharing',
              neuralFlow: 91,
              traditional: 34,
              unit: '%',
              improvement: 168,
              description: 'Effective knowledge transfer between team members'
            }
          ]
        },
        {
          category: 'Communication',
          metrics: [
            {
              name: 'Response Relevance',
              neuralFlow: 94,
              traditional: 71,
              unit: '%',
              improvement: 32,
              description: 'Relevance of AI-suggested responses'
            },
            {
              name: 'Action Item Extraction',
              neuralFlow: 89,
              traditional: 45,
              unit: '%',
              improvement: 98,
              description: 'Automatic extraction of action items from discussions'
            },
            {
              name: 'Expertise Matching',
              neuralFlow: 96,
              traditional: 28,
              unit: '%',
              improvement: 243,
              description: 'Accuracy of matching tasks to team member expertise'
            }
          ]
        }
      ],
      content: [
        {
          category: 'Content Generation',
          metrics: [
            {
              name: 'Writing Speed',
              neuralFlow: 1250,
              traditional: 420,
              unit: 'words/hour',
              improvement: 198,
              description: 'Average words produced per hour with AI assistance'
            },
            {
              name: 'Content Quality',
              neuralFlow: 8.9,
              traditional: 6.2,
              unit: '/10',
              improvement: 44,
              description: 'Quality rating of generated content'
            },
            {
              name: 'Research Integration',
              neuralFlow: 92,
              traditional: 34,
              unit: '%',
              improvement: 171,
              description: 'Automatic integration of relevant research and citations'
            }
          ]
        },
        {
          category: 'Creative Enhancement',
          metrics: [
            {
              name: 'Idea Generation',
              neuralFlow: 156,
              traditional: 23,
              unit: 'ideas/session',
              improvement: 578,
              description: 'Number of creative ideas generated per brainstorming session'
            },
            {
              name: 'Style Consistency',
              neuralFlow: 97,
              traditional: 73,
              unit: '%',
              improvement: 33,
              description: 'Consistency of writing style across documents'
            },
            {
              name: 'Visual Generation',
              neuralFlow: 45,
              traditional: 3,
              unit: 'visuals/hour',
              improvement: 1400,
              description: 'Charts, diagrams, and visuals created per hour'
            }
          ]
        }
      ],
      analysis: [
        {
          category: 'Data Processing',
          metrics: [
            {
              name: 'Insight Discovery',
              neuralFlow: 78,
              traditional: 12,
              unit: 'insights/hour',
              improvement: 550,
              description: 'Actionable insights discovered per hour of analysis'
            },
            {
              name: 'Pattern Recognition',
              neuralFlow: 94,
              traditional: 67,
              unit: '%',
              improvement: 40,
              description: 'Accuracy of identifying data patterns and trends'
            },
            {
              name: 'Report Generation',
              neuralFlow: 23,
              traditional: 4,
              unit: 'reports/day',
              improvement: 475,
              description: 'Complete analytical reports generated per day'
            }
          ]
        },
        {
          category: 'Decision Support',
          metrics: [
            {
              name: 'Recommendation Quality',
              neuralFlow: 91,
              traditional: 58,
              unit: '%',
              improvement: 57,
              description: 'Quality and relevance of AI-generated recommendations'
            },
            {
              name: 'Risk Assessment',
              neuralFlow: 87,
              traditional: 43,
              unit: '%',
              improvement: 102,
              description: 'Accuracy of automated risk assessment'
            },
            {
              name: 'Forecast Accuracy',
              neuralFlow: 89,
              traditional: 62,
              unit: '%',
              improvement: 44,
              description: 'Accuracy of predictive forecasting models'
            }
          ]
        }
      ]
    };

    setBenchmarkData(data[selectedScenario] || []);
  }, [selectedScenario]);

  const triggerAnimation = () => {
    setAnimateValues(false);
    setTimeout(() => setAnimateValues(true), 100);
  };

  useEffect(() => {
    triggerAnimation();
  }, [selectedScenario]);

  const getImprovementColor = (improvement: number) => {
    if (improvement >= 200) return 'text-emerald-400';
    if (improvement >= 100) return 'text-green-400';
    if (improvement >= 50) return 'text-blue-400';
    return 'text-yellow-400';
  };

  const getImprovementBadge = (improvement: number) => {
    if (improvement >= 200) return 'Exceptional';
    if (improvement >= 100) return 'Outstanding';
    if (improvement >= 50) return 'Significant';
    return 'Notable';
  };

  return (
    <div className="space-y-6">
      {/* Scenario Selection */}
      <Card className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Benchmark Scenarios</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setSelectedScenario(scenario.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedScenario === scenario.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/30 hover:border-slate-400 dark:hover:border-slate-500'
                }`}
              >
                <h4 className="font-semibold text-slate-900 dark:text-white">{scenario.name}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{scenario.description}</p>
                <div className="flex justify-between items-center mt-3 text-xs text-slate-500 dark:text-slate-500">
                  <span>{scenario.duration}</span>
                  <span>{scenario.participants} users</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Benchmark Results */}
      {benchmarkData.map((category, categoryIndex) => (
        <Card key={categoryIndex} className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{category.category}</h3>
              <Button onClick={triggerAnimation} variant="secondary" size="sm">
                Refresh Data
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {category.metrics.map((metric, metricIndex) => (
                <div key={metricIndex} className="p-4 bg-slate-100 dark:bg-slate-700/30 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">{metric.name}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{metric.description}</p>
                    </div>
                    <Badge 
                      variant="success" 
                      className={getImprovementColor(metric.improvement)}
                    >
                      {getImprovementBadge(metric.improvement)}
                    </Badge>
                  </div>

                  {/* Neural Flow Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Neural Flow</span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {metric.neuralFlow} {metric.unit}
                      </span>
                    </div>
                    <div className="w-full bg-slate-300 dark:bg-slate-600 rounded-full h-3">
                      <div 
                        className={`bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-400 h-3 rounded-full transition-all duration-1000 ${
                          animateValues ? 'ease-out' : ''
                        }`}
                        style={{ 
                          width: animateValues 
                            ? `${Math.min(100, (metric.neuralFlow / Math.max(metric.neuralFlow, metric.traditional)) * 100)}%`
                            : '0%'
                        }}
                      />
                    </div>
                  </div>

                  {/* Traditional Tools Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Traditional Tools</span>
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                        {metric.traditional} {metric.unit}
                      </span>
                    </div>
                    <div className="w-full bg-slate-300 dark:bg-slate-600 rounded-full h-3">
                      <div 
                        className={`bg-gradient-to-r from-slate-600 to-slate-500 dark:from-slate-500 dark:to-slate-400 h-3 rounded-full transition-all duration-1000 ${
                          animateValues ? 'ease-out' : ''
                        }`}
                        style={{ 
                          width: animateValues 
                            ? `${Math.min(100, (metric.traditional / Math.max(metric.neuralFlow, metric.traditional)) * 100)}%`
                            : '0%'
                        }}
                      />
                    </div>
                  </div>

                  {/* Improvement Indicator */}
                  <div className="flex justify-center">
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${getImprovementColor(metric.improvement)} bg-slate-200 dark:bg-slate-800`}>
                      +{metric.improvement}% improvement
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}

      {/* Summary Statistics */}
      <Card className="bg-gradient-to-r from-blue-100/50 to-purple-100/50 dark:from-blue-900/50 dark:to-purple-900/50 border-blue-300/50 dark:border-blue-700/50">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Overall Performance Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {benchmarkData.reduce((acc, cat) => 
                  acc + cat.metrics.reduce((sum, m) => sum + m.improvement, 0), 0
                ) / benchmarkData.reduce((acc, cat) => acc + cat.metrics.length, 0) || 0}%
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">Average Improvement</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                {benchmarkData.reduce((acc, cat) => acc + cat.metrics.length, 0)}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">Metrics Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {benchmarkData.filter(cat => 
                  cat.metrics.some(m => m.improvement >= 100)
                ).length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">Categories with 100%+ Gains</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                {Math.max(...benchmarkData.flatMap(cat => cat.metrics.map(m => m.improvement)))}%
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">Maximum Improvement</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};