import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardModeProvider } from '../providers/DashboardModeProvider';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { IntelligentSearchInterface } from '../components/search/IntelligentSearchInterface';

export default function SearchLayoutPage() {
  return (
    <DashboardModeProvider>
      <AppLayout currentContext="research">
        <ErrorBoundary>
          <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Intelligent Search
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                AI-powered semantic search with natural language understanding
              </p>
            </div>
            
            <IntelligentSearchInterface
              onResultSelect={(result) => {
                console.log('Selected result:', result);
                // Handle result selection
              }}
              onRecommendationSelect={(recommendation) => {
                console.log('Selected recommendation:', recommendation);
                // Handle recommendation selection
              }}
              context={{
                workContext: 'research',
                timeOfDay: 'afternoon'
              }}
            />
          </div>
        </ErrorBoundary>
      </AppLayout>
    </DashboardModeProvider>
  );
}