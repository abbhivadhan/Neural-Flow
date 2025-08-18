import React from 'react';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';

export default function AnalyticsPage() {
  // In a real application, this would come from authentication context
  const userId = 'user-123';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <AnalyticsDashboard userId={userId} />
      </div>
    </div>
  );
}