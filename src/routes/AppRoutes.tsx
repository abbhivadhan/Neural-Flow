import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadingSpinner } from '../components/LoadingSpinner';

// Lazy load components for better performance
const HomePage = lazy(() => import('../pages/HomePage'));
const WorkspacePage = lazy(() => import('../pages/WorkspacePage'));
const ContentGenerationDemo = lazy(() => import('../components/content/ContentGenerationDemo'));
const InteractionDemoPage = lazy(() => import('../pages/InteractionDemoPage'));
const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="/content-demo" element={<ContentGenerationDemo />} />
        <Route path="/interaction-demo" element={<InteractionDemoPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}