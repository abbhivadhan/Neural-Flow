/**
 * Performance Monitoring Demo Page
 * Demonstrates the performance monitoring and error tracking capabilities
 */

import React from 'react';
import { PerformanceDashboard } from '../components/monitoring/PerformanceDashboard';
import { usePerformanceMonitoring } from '../hooks/usePerformanceMonitoring';

const PerformancePage: React.FC = () => {
  const monitoring = usePerformanceMonitoring({
    componentName: 'PerformancePage',
    trackRenders: true,
    trackAI: true,
    trackErrors: true,
    autoOptimize: true
  });

  const simulateAIOperation = async () => {
    monitoring.startTimer('ai-simulation');
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
    
    const duration = monitoring.endTimer('ai-simulation');
    monitoring.recordAIInference('demo-model', duration);
  };

  const simulateError = () => {
    try {
      throw new Error('Simulated error for testing');
    } catch (error) {
      monitoring.recordError(error as Error, {
        context: 'user-triggered',
        action: 'simulate-error'
      });
    }
  };

  const simulateSlowOperation = async () => {
    monitoring.startTimer('slow-operation');
    
    // Simulate slow operation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    monitoring.endTimer('slow-operation');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Performance Monitoring
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Real-time performance monitoring, error tracking, and system health dashboard.
          </p>
          
          {/* Demo Controls */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={simulateAIOperation}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            >
              Simulate AI Operation
            </button>
            
            <button
              onClick={simulateError}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
            >
              Simulate Error
            </button>
            
            <button
              onClick={simulateSlowOperation}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md font-medium transition-colors"
            >
              Simulate Slow Operation
            </button>
            
            <button
              onClick={() => {
                monitoring.recordMetric('custom-metric', Math.random() * 100, {
                  type: 'demo',
                  category: 'user-generated'
                });
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
            >
              Record Custom Metric
            </button>
          </div>
        </div>

        {/* Performance Dashboard */}
        <PerformanceDashboard />
      </div>
    </div>
  );
};

export default PerformancePage;