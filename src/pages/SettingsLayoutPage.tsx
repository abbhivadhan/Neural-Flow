import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardModeProvider } from '../providers/DashboardModeProvider';
import SettingsPage from './SettingsPage';

export default function SettingsLayoutPage() {
  return (
    <DashboardModeProvider>
      <AppLayout currentContext="coding">
        <SettingsPage />
      </AppLayout>
    </DashboardModeProvider>
  );
}