/**
 * Lazy-loaded Routes
 * Code-split route components for optimal performance
 */

import { Suspense } from 'react';
import { createLazyComponent, preloadComponent } from '../utils/lazyLoading';
import { LoadingSpinner } from '../components/LoadingSpinner';

// Lazy load page components with code splitting
export const HomePage = createLazyComponent(
  () => import('../pages/HomePage')
);

export const WorkspacePage = createLazyComponent(
  () => import('../pages/WorkspacePage')
);

export const Workspace3DPage = createLazyComponent(
  () => import('../pages/Workspace3DPage')
);

export const AnalyticsPage = createLazyComponent(
  () => import('../pages/AnalyticsPage')
);

export const CollaborationPage = createLazyComponent(
  () => import('../pages/CollaborationPage')
);

export const InteractionDemoPage = createLazyComponent(
  () => import('../pages/InteractionDemoPage')
);

export const SearchPage = createLazyComponent(
  () => import('../pages/SearchPage')
);

export const PrivacyPage = createLazyComponent(
  () => import('../pages/PrivacyPage')
);

export const IntegrationPage = createLazyComponent(
  () => import('../pages/IntegrationPage')
);

// Preload critical routes
export function preloadCriticalRoutes(): void {
  // Preload most commonly accessed routes
  preloadComponent(() => import('../pages/WorkspacePage'));
  preloadComponent(() => import('../pages/AnalyticsPage'));
}

// Route-based code splitting wrapper
export function LazyRoute({ 
  children, 
  fallback = <LoadingSpinner /> 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

// Progressive loading for heavy components
export const HeavyComponents = {
  Workspace3D: createLazyComponent(
    () => import('../components/workspace/Workspace3D')
  ),
  
  AnalyticsDashboard: createLazyComponent(
    () => import('../components/analytics/AnalyticsDashboard')
  ),
  
  MultiModalInterface: createLazyComponent(
    () => import('../components/interaction/MultiModalInterface')
  ),
  
  CollaborationDemo: createLazyComponent(
    () => import('../components/collaboration/CollaborationDemo')
  ),
  
  IntegrationDashboard: createLazyComponent(
    () => import('../components/integration/IntegrationDashboard')
  ),
  
  PrivacyDashboard: createLazyComponent(
    () => import('../components/privacy/PrivacyDashboard')
  ),
  
  IntelligentSearchInterface: createLazyComponent(
    () => import('../components/search/IntelligentSearchInterface')
  )
};

// Preload heavy components based on user behavior
export function preloadHeavyComponents(components: (keyof typeof HeavyComponents)[]): void {
  components.forEach(componentName => {
    const component = HeavyComponents[componentName];
    if (component) {
      // Preload the component module
      switch (componentName) {
        case 'Workspace3D':
          preloadComponent(() => import('../components/workspace/Workspace3D'));
          break;
        case 'AnalyticsDashboard':
          preloadComponent(() => import('../components/analytics/AnalyticsDashboard'));
          break;
        case 'MultiModalInterface':
          preloadComponent(() => import('../components/interaction/MultiModalInterface'));
          break;
        case 'CollaborationDemo':
          preloadComponent(() => import('../components/collaboration/CollaborationDemo'));
          break;
        case 'IntegrationDashboard':
          preloadComponent(() => import('../components/integration/IntegrationDashboard'));
          break;
        case 'PrivacyDashboard':
          preloadComponent(() => import('../components/privacy/PrivacyDashboard'));
          break;
        case 'IntelligentSearchInterface':
          preloadComponent(() => import('../components/search/IntelligentSearchInterface'));
          break;
      }
    }
  });
}