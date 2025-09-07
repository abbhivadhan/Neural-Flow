import React, { useState, useEffect } from 'react';

interface MetricData {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

interface BenchmarkData {
  metric: string;
  neuralFlow: number;
  traditional: number;
  improvement: number;
  unit: string;
}

export const SimpleLiveDemo: React.FC = () => {
  const [isLive, setIsLive] = useState(false);
  const [metrics, setMetrics] = useState<MetricData[]>([
    { name: 'Active Users', value: 12, unit: '', trend: 'up', color: 'text-blue-400' },
    { name: 'Tasks Processed', value: 0, unit: '', trend: 'up', color: 'text-green-400' },
    { name: 'AI Predictions', value: 0, unit: '', trend: 'up', color: 'text-purple-400' },
    { name: 'System Health', value: 98.5, unit: '%', trend: 'stable', color: 'text-emerald-400' }
  ]);

  const [benchmarks] = useState<BenchmarkData[]>([
    { metric: 'Task Completion Speed', neuralFlow: 85, traditional: 45, improvement: 89, unit: 'tasks/hour' },
    { metric: 'Context Switch Time', neuralFlow: 2.3, traditional: 8.7, improvement: 74, unit: 'seconds' },
    { metric: 'Prediction Accuracy', neuralFlow: 94, traditional: 12, improvement: 683, unit: '%' },
    { metric: 'User Satisfaction', neuralFlow: 9.2, traditional: 6.1, improvement: 51, unit: '/10' }
  ]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLive) {
      interval = setInterval(() => {
        setMetrics(prev => prev.map(metric => {
          let newValue = metric.value;
          
          switch (metric.name) {
            case 'Active Users':
              newValue = Math.max(1, newValue + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0));
              break;
            case 'Tasks Processed':
              newValue = newValue + Math.floor(Math.random() * 3);
              break;
            case 'AI Predictions':
              newValue = newValue + Math.floor(Math.random() * 5);
              break;
            case 'System Health':
              newValue = Math.max(95, Math.min(100, newValue + (Math.random() - 0.5) * 2));
              break;
          }
          
          return { ...metric, value: newValue };
        }));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive]);

  return (
    <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Neural Flow Live Demo
            </h1>
            <p className="text-slate-300 mt-2">Real-time AI Performance Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isLive ? 'bg-red-500 text-white' : 'bg-slate-600 text-slate-300'
            }`}>
              <div className="flex items-center space-x-1">
                {isLive ? (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span>LIVE</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span>PAUSED</span>
                  </>
                )}
              </div>
            </span>
            <button 
              onClick={() => setIsLive(!isLive)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isLive 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isLive ? 'Stop Demo' : 'Start Live Demo'}
            </button>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{metric.name}</p>
                  <p className={`text-3xl font-bold ${metric.color}`}>
                    {metric.value.toFixed(metric.name === 'System Health' ? 1 : 0)}{metric.unit}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  {index === 0 && (
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  )}
                  {index === 1 && (
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {index === 2 && (
                    <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  )}
                  {index === 3 && (
                    <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* AI Processing Status */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">AI Models Status</h3>
          <div className="space-y-4">
            {[
              { name: 'Task Predictor', time: 45, accuracy: 94.2, status: 'processing' },
              { name: 'Content Generator', time: 120, accuracy: 91.8, status: 'processing' },
              { name: 'Behavior Analyzer', time: 28, accuracy: 96.5, status: 'optimizing' }
            ].map((model, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <p className="font-medium">{model.name}</p>
                  <p className="text-sm text-slate-400">
                    {model.time}ms • {model.accuracy}% accuracy
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    model.status === 'processing' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {model.status}
                  </span>
                  <div className={`w-3 h-3 rounded-full ${
                    model.status === 'processing' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benchmark Comparisons */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-2xl font-semibold mb-6">Neural Flow vs Traditional Tools</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benchmarks.map((benchmark, index) => (
              <div key={index} className="p-4 bg-slate-700/30 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">{benchmark.metric}</h4>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm font-medium">
                    +{benchmark.improvement}%
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Neural Flow</span>
                    <span className="font-bold text-blue-400">
                      {benchmark.neuralFlow} {benchmark.unit}
                    </span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-blue-400 h-2 rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${Math.min(100, (benchmark.neuralFlow / Math.max(benchmark.neuralFlow, benchmark.traditional)) * 100)}%`
                      }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Traditional</span>
                    <span className="font-bold text-slate-400">
                      {benchmark.traditional} {benchmark.unit}
                    </span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-slate-400 h-2 rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${Math.min(100, (benchmark.traditional / Math.max(benchmark.neuralFlow, benchmark.traditional)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};