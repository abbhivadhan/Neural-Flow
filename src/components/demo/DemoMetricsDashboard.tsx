import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface MetricData {
  timestamp: number;
  value: number;
  label: string;
}

interface AIProcessingMetric {
  modelName: string;
  inferenceTime: number;
  accuracy: number;
  throughput: number;
  status: 'processing' | 'idle' | 'optimizing';
}

interface BenchmarkComparison {
  metric: string;
  neuralFlow: number;
  traditional: number;
  improvement: number;
  unit: string;
}

export const DemoMetricsDashboard: React.FC = () => {
  const [isLive, setIsLive] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<MetricData[]>([]);
  const [aiMetrics, setAiMetrics] = useState<AIProcessingMetric[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkComparison[]>([]);
  const [currentUsers, setCurrentUsers] = useState(0);
  const [tasksProcessed, setTasksProcessed] = useState(0);
  const [aiPredictions, setAiPredictions] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Initialize demo data
  useEffect(() => {
    setBenchmarks([
      {
        metric: 'Task Completion Speed',
        neuralFlow: 85,
        traditional: 45,
        improvement: 89,
        unit: 'tasks/hour'
      },
      {
        metric: 'Context Switch Time',
        neuralFlow: 2.3,
        traditional: 8.7,
        improvement: 74,
        unit: 'seconds'
      },
      {
        metric: 'Prediction Accuracy',
        neuralFlow: 94,
        traditional: 12,
        improvement: 683,
        unit: '%'
      },
      {
        metric: 'User Satisfaction',
        neuralFlow: 9.2,
        traditional: 6.1,
        improvement: 51,
        unit: '/10'
      }
    ]);

    setAiMetrics([
      {
        modelName: 'Task Predictor',
        inferenceTime: 45,
        accuracy: 94.2,
        throughput: 1250,
        status: 'processing'
      },
      {
        modelName: 'Content Generator',
        inferenceTime: 120,
        accuracy: 91.8,
        throughput: 850,
        status: 'processing'
      },
      {
        modelName: 'Behavior Analyzer',
        inferenceTime: 28,
        accuracy: 96.5,
        throughput: 2100,
        status: 'optimizing'
      }
    ]);
  }, []);

  // Start/stop live demo
  const toggleLiveDemo = () => {
    if (isLive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setIsLive(false);
    } else {
      setIsLive(true);
      intervalRef.current = setInterval(() => {
        updateMetrics();
      }, 1000);
    }
  };

  const updateMetrics = () => {
    const now = Date.now();
    
    // Update performance metrics
    setPerformanceMetrics(prev => {
      const newMetric: MetricData = {
        timestamp: now,
        value: 70 + Math.random() * 30,
        label: 'CPU Usage'
      };
      return [...prev.slice(-29), newMetric];
    });

    // Update counters
    setCurrentUsers(prev => Math.max(1, prev + (Math.random() > 0.7 ? 1 : -1)));
    setTasksProcessed(prev => prev + Math.floor(Math.random() * 3));
    setAiPredictions(prev => prev + Math.floor(Math.random() * 5));

    // Update AI metrics
    setAiMetrics(prev => prev.map(metric => ({
      ...metric,
      inferenceTime: metric.inferenceTime + (Math.random() - 0.5) * 10,
      accuracy: Math.min(100, Math.max(85, metric.accuracy + (Math.random() - 0.5) * 2)),
      throughput: metric.throughput + (Math.random() - 0.5) * 100,
      status: Math.random() > 0.9 ? 'optimizing' : 'processing'
    })));
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="w-full">
        {/* Dashboard Controls */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Live Metrics Dashboard
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Real-time performance monitoring</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={isLive ? 'success' : 'secondary'}>
              <div className="flex items-center space-x-1">
                {isLive ? (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span>LIVE</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full"></div>
                    <span>PAUSED</span>
                  </>
                )}
              </div>
            </Badge>
            <Button 
              onClick={toggleLiveDemo}
              variant={isLive ? 'destructive' : 'primary'}
              size="sm"
            >
              {isLive ? 'Stop Demo' : 'Start Live Demo'}
            </Button>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Active Users</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{currentUsers}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Tasks Processed</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{tasksProcessed}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">AI Predictions</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{aiPredictions}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">System Health</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">98.5%</p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  💚
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Real-time Performance Chart */}
          <Card className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Real-time Performance</h3>
              <div className="h-64 relative">
                <svg className="w-full h-full">
                  <defs>
                    <linearGradient id="performanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8"/>
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1"/>
                    </linearGradient>
                  </defs>
                  {performanceMetrics.length > 1 && (
                    <path
                      d={`M ${performanceMetrics.map((metric, index) => 
                        `${(index / (performanceMetrics.length - 1)) * 100}% ${100 - metric.value}%`
                      ).join(' L ')}`}
                      fill="url(#performanceGradient)"
                      stroke="#3B82F6"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                </svg>
                <div className="absolute bottom-2 left-2 text-xs text-slate-600 dark:text-slate-400">
                  CPU Usage: {performanceMetrics[performanceMetrics.length - 1]?.value.toFixed(1)}%
                </div>
              </div>
            </div>
          </Card>

          {/* AI Processing Status */}
          <Card className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">AI Models Status</h3>
              <div className="space-y-4">
                {aiMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{metric.modelName}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {metric.inferenceTime.toFixed(0)}ms • {metric.accuracy.toFixed(1)}% accuracy
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={metric.status === 'processing' ? 'success' : 'warning'}>
                        {metric.status}
                      </Badge>
                      <div className={`w-3 h-3 rounded-full ${
                        metric.status === 'processing' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Benchmark Comparisons */}
        <Card className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 mt-6">
          <div className="p-6">
            <h3 className="text-2xl font-semibold mb-6 text-slate-900 dark:text-white">Neural Flow vs Traditional Tools</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {benchmarks.map((benchmark, index) => (
                <div key={index} className="p-4 bg-slate-100 dark:bg-slate-700/30 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-slate-900 dark:text-white">{benchmark.metric}</h4>
                    <Badge variant="success">+{benchmark.improvement}%</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Neural Flow</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {benchmark.neuralFlow} {benchmark.unit}
                      </span>
                    </div>
                    <div className="w-full bg-slate-300 dark:bg-slate-600 rounded-full h-2">
                      <div 
                        className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(100, (benchmark.neuralFlow / Math.max(benchmark.neuralFlow, benchmark.traditional)) * 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Traditional</span>
                      <span className="font-bold text-slate-600 dark:text-slate-400">
                        {benchmark.traditional} {benchmark.unit}
                      </span>
                    </div>
                    <div className="w-full bg-slate-300 dark:bg-slate-600 rounded-full h-2">
                      <div 
                        className="bg-slate-600 dark:bg-slate-400 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(100, (benchmark.traditional / Math.max(benchmark.neuralFlow, benchmark.traditional)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};