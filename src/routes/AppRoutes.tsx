import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadingSpinner } from '../components/LoadingSpinner';

// Lazy load components for better performance
const HomePage = lazy(() => import('../pages/HomePage'));
const WorkspacePage = lazy(() => import('../pages/WorkspacePage'));
const Workspace3DPage = lazy(() => import('../pages/Workspace3DPage'));
const ContentGenerationDemo = lazy(() => import('../components/content/ContentGenerationDemo'));
const InteractionDemoPage = lazy(() => import('../pages/InteractionDemoPage'));
const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage'));
const CollaborationPage = lazy(() => import('../pages/CollaborationPage'));
const SearchPage = lazy(() => import('../pages/SearchPage'));
const PrivacyPage = lazy(() => import('../pages/PrivacyPage'));
const IntegrationPage = lazy(() => import('../pages/IntegrationPage'));
const PerformancePage = lazy(() => import('../pages/PerformancePage'));
const AccessibilityPage = lazy(() => import('../pages/AccessibilityPage'));
const StateManagementPage = lazy(() => import('../pages/StateManagementPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="/workspace-3d" element={<Workspace3DPage />} />
        <Route path="/content-demo" element={<ContentGenerationDemo />} />
        <Route path="/interaction-demo" element={<InteractionDemoPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/collaboration" element={<CollaborationPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/integration" element={<IntegrationPage />} />
        <Route path="/performance" element={<PerformancePage />} />
        <Route path="/accessibility" element={<AccessibilityPage />} />
        <Route path="/state-management" element={<StateManagementPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}