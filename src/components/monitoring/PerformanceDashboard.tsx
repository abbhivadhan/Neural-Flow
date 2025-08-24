/**
 * Performance Dashboard Component
 * Displays real-time performance metrics and monitoring data
 */

import React, { useState, useEffect } from 'react';
import { performanceMonitor } from '../../services/monitoring/PerformanceMonitor';
import { errorTracker } from '../../services/monitoring/ErrorTracker';
import { Card } from '../ui/Card';

interface PerformanceMetrics {
  score: number;
  lcp: number;
  fid: number;
  cls: number;
  memoryUsage: number;
  errorRate: number;
  aiInferenceTime: number;
}

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    score: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    memoryUsage: 0,
    errorRate: 0,
    aiInferenceTime: 0
  });

  const [isMonitoring, setIsMonitoring] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  useEffect(() => {
    const updateMetrics = () => {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      
      const recentMetrics = performanceMonitor.getMetrics({ start: oneHourAgo, end: now });
      const errorStats = errorTracker.getErrorStats({ start: oneHourAgo, end: now });

      setMetrics({
        score: performanceMonitor.getPerformanceScore(),
        lcp: performanceMonitor.getAverageMetric('largest-contentful-paint', { start: oneHourAgo, end: now }),
        fid: performanceMonitor.getAverageMetric('first-input-delay', { start: oneHourAgo, end: now }),
        cls: performanceMonitor.getAverageMetric('cumulative-layout-shift', { start: oneHourAgo, end: now }),
        memoryUsage: performanceMonitor.getAverageMetric('memory-used', { start: oneHourAgo, end: now }),
        errorRate: errorStats.errorRate,
        aiInferenceTime: performanceMonitor.getAverageMetric('ai-inference-time', { start: oneHourAgo, end: now })
      });
    };

    updateMetrics();

    let interval: NodeJS.Timeout;
    if (isMonitoring) {
      interval = setInterval(updateMetrics, refreshInterval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isMonitoring, refreshInterval]);

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number): string => {
    if (score >= 90) return 'bg-green-100 dark:bg-green-900';
    if (score >= 70) return 'bg-yellow-100 dark:bg-yellow-900';
    return 'bg-red-100 dark:bg-red-900';
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const exportMetrics = () => {
    const data = performanceMonitor.exportMetrics();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportErrors = () => {
    const data = errorTracker.exportErrors();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-log-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Performance Dashboard
        </h2>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Refresh:
            </label>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800"
            >
              <option value={1000}>1s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
          </div>
          
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`px-3 py-1 rounded text-sm font-medium ${
              isMonitoring
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isMonitoring ? 'Stop' : 'Start'}
          </button>
        </div>
      </div>

      {/* Performance Score */}
      <Card className={`p-6 ${getScoreBackground(metrics.score)}`}>
        <div className="text-center">
          <div className={`text-4xl font-bold ${getScoreColor(metrics.score)}`}>
            {metrics.score}
          </div>
          <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
            Performance Score
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Based on Core Web Vitals and custom metrics
          </div>
        </div>
      </Card>

      {/* Core Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatTime(metrics.lcp)}
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Largest Contentful Paint
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Good: &lt; 2.5s
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatTime(metrics.fid)}
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              First Input Delay
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Good: &lt; 100ms
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {metrics.cls.toFixed(3)}
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Cumulative Layout Shift
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Good: &lt; 0.1
            </div>
          </div>
        </Card>
      </div>

      {/* Custom Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {formatBytes(metrics.memoryUsage)}
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Memory Usage
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              JavaScript heap size
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {metrics.errorRate.toFixed(2)}%
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Error Rate
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Errors per hour
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {formatTime(metrics.aiInferenceTime)}
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              AI Inference Time
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Average ML processing
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={exportMetrics}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
        >
          Export Metrics
        </button>
        
        <button
          onClick={exportErrors}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
        >
          Export Errors
        </button>
        
        <button
          onClick={() => {
            performanceMonitor.clearMetrics();
            errorTracker.clearErrors();
          }}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors"
        >
          Clear Data
        </button>
      </div>
    </div>
  );
};