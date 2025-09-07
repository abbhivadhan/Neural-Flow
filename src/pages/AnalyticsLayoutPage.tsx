import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardModeProvider } from '../providers/DashboardModeProvider';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Simple analytics page without complex dependencies
function SimpleAnalyticsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Analytics Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          AI-powered insights into your productivity and performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Productivity Score */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Productivity Score</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">87%</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-sm text-green-600">+5% from last week</span>
            </div>
          </div>
        </div>

        {/* Focus Time */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Focus Time</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">6.2h</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '77%' }}></div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Daily average</p>
          </div>
        </div>

        {/* Tasks Completed */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Tasks Completed</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">24</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="text-green-600 font-medium">+3</span> more than yesterday
            </p>
          </div>
        </div>

        {/* Efficiency */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Efficiency</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">92%</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">High performance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Productivity Trend */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Productivity Trend
          </h3>
          <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-700 rounded-lg">
            <p className="text-slate-500 dark:text-slate-400">Chart visualization would go here</p>
          </div>
        </div>

        {/* Activity Heatmap */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Activity Heatmap
          </h3>
          <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-700 rounded-lg">
            <p className="text-slate-500 dark:text-slate-400">Heatmap visualization would go here</p>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          AI Insights
        </h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Peak Performance Hours</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Your most productive hours are between 10 AM and 12 PM. Consider scheduling important tasks during this time.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Focus Improvement</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Your focus time has increased by 15% this week. Keep up the great work!
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Break Recommendation</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Consider taking more frequent breaks to maintain high productivity levels throughout the day.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsLayoutPage() {
  return (
    <DashboardModeProvider>
      <AppLayout currentContext="coding">
        <ErrorBoundary>
          <SimpleAnalyticsPage />
        </ErrorBoundary>
      </AppLayout>
    </DashboardModeProvider>
  );
}