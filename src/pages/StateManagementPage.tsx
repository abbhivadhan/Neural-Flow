import React from 'react';
import { StateManagementDemo } from '../components/demo/StateManagementDemo';
import { OfflineManager, CacheStatus } from '../components/system/OfflineManager';

export const StateManagementPage: React.FC = () => {
  return (
    <OfflineManager>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <StateManagementDemo />
        <CacheStatus />
      </div>
    </OfflineManager>
  );
};