import React from 'react';
import { IntegrationDashboard } from '../components/integration/IntegrationDashboard';

export const IntegrationPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Intelligent Integration Ecosystem
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Connect, sync, and orchestrate your productivity tools with AI-powered intelligence
          </p>
        </div>
        
        <IntegrationDashboard />
      </div>
    </div>
  );
};