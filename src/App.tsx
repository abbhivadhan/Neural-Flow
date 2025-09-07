import { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './providers/ThemeProvider';
import { TutorialProvider } from './components/tutorial/TutorialProvider';
import { SettingsProvider } from './providers/SettingsProvider';
import { AppRoutes } from './routes/AppRoutes';
import { initializeMonitoring } from './services/monitoring';
import { usePerformanceMonitoring } from './hooks/usePerformanceMonitoring';

function App() {
  const monitoring = usePerformanceMonitoring({
    componentName: 'App',
    trackRenders: true,
    trackAI: true,
    trackErrors: true,
    autoOptimize: true
  });

  useEffect(() => {
    // Initialize monitoring systems
    initializeMonitoring();
    
    // Record app startup time
    monitoring.recordMetric('app-startup-time', performance.now(), {
      type: 'lifecycle'
    });

    // Preload critical resources
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // Preload critical routes and resources
        import('./pages/WorkspacePage').catch(console.warn);
        import('./pages/AnalyticsPage').catch(console.warn);
      });
    }
  }, [monitoring]);

  return (
    <ErrorBoundary>
      <SettingsProvider>
        <ThemeProvider>
          <TutorialProvider>
            <Router>
              <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 transition-colors duration-300">
                <AppRoutes />
              </div>
            </Router>
          </TutorialProvider>
        </ThemeProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}

export default App;