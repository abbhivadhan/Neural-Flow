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
const VisualizationPage = lazy(() => import('../pages/VisualizationPage'));
const LiveDemoPage = lazy(() => import('../pages/LiveDemoPage'));
const SimpleLiveDemoPage = lazy(() => import('../pages/SimpleLiveDemoPage'));
const TutorialDemoPage = lazy(() => import('../pages/TutorialDemoPage'));
const VisualEffectsDemoPage = lazy(() => import('../pages/VisualEffectsDemoPage'));
const TestPage = lazy(() => import('../pages/TestPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const SettingsLayoutPage = lazy(() => import('../pages/SettingsLayoutPage'));
const SimpleSettingsPage = lazy(() => import('../pages/SimpleSettingsPage'));
const AnalyticsLayoutPage = lazy(() => import('../pages/AnalyticsLayoutPage'));
const SearchLayoutPage = lazy(() => import('../pages/SearchLayoutPage'));
const VisualizationLayoutPage = lazy(() => import('../pages/VisualizationLayoutPage'));
const SimpleSettingsLayoutPage = lazy(() => import('../pages/SimpleSettingsLayoutPage'));
const DemoLayoutPage = lazy(() => import('../pages/DemoLayoutPage'));
const EnhancedDashboardShowcase = lazy(() => import('../pages/EnhancedDashboardShowcase'));

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
        <Route path="/analytics" element={<AnalyticsLayoutPage />} />
        <Route path="/analytics-old" element={<AnalyticsPage />} />
        <Route path="/collaboration" element={<CollaborationPage />} />
        <Route path="/search" element={<SearchLayoutPage />} />
        <Route path="/search-old" element={<SearchPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/integration" element={<IntegrationPage />} />
        <Route path="/performance" element={<PerformancePage />} />
        <Route path="/accessibility" element={<AccessibilityPage />} />
        <Route path="/state-management" element={<StateManagementPage />} />
        <Route path="/visualization" element={<VisualizationLayoutPage />} />
        <Route path="/visualization-old" element={<VisualizationPage />} />
        <Route path="/live-demo" element={<LiveDemoPage />} />
        <Route path="/simple-live-demo" element={<SimpleLiveDemoPage />} />
        <Route path="/tutorial-demo" element={<TutorialDemoPage />} />
        <Route path="/visual-effects" element={<VisualEffectsDemoPage />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="/settings" element={<SimpleSettingsLayoutPage />} />
        <Route path="/settings-complex" element={<SettingsLayoutPage />} />
        <Route path="/settings-simple" element={<SimpleSettingsPage />} />
        <Route path="/demo-layout" element={<DemoLayoutPage />} />
        <Route path="/enhanced-dashboard" element={<EnhancedDashboardShowcase />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}