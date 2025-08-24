import React, { useState, useEffect } from 'react';
import { useResponsiveDesign } from '../../hooks/useResponsiveDesign';
import { useAccessibility } from '../../hooks/useAccessibility';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  sidebarWidth?: 'sm' | 'md' | 'lg';
  sidebarPosition?: 'left' | 'right';
  collapsibleSidebar?: boolean;
  className?: string;
}

export function ResponsiveLayout({
  children,
  sidebar,
  header,
  footer,
  sidebarWidth = 'md',
  sidebarPosition = 'left',
  collapsibleSidebar = true,
  className = '',
}: ResponsiveLayoutProps) {
  const { isMobile, isTablet, breakpoint } = useResponsiveDesign();
  const { announce, generateId } = useAccessibility();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else if (isTablet) {
      setSidebarCollapsed(true);
    } else {
      setSidebarCollapsed(false);
      setSidebarOpen(true);
    }
  }, [isMobile, isTablet]);

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
      announce(sidebarOpen ? 'Sidebar closed' : 'Sidebar opened', 'polite');
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
      announce(sidebarCollapsed ? 'Sidebar expanded' : 'Sidebar collapsed', 'polite');
    }
  };

  const sidebarWidthClasses = {
    sm: sidebarCollapsed ? 'w-16' : 'w-64',
    md: sidebarCollapsed ? 'w-20' : 'w-80',
    lg: sidebarCollapsed ? 'w-24' : 'w-96',
  };

  const mainContentClasses = [
    'flex-1 flex flex-col min-h-0',
    sidebar && sidebarOpen && !isMobile 
      ? `${sidebarPosition === 'left' ? 'ml-0' : 'mr-0'}` 
      : '',
  ].filter(Boolean).join(' ');

  const sidebarClasses = [
    'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700',
    'flex flex-col transition-all duration-300 ease-in-out',
    isMobile 
      ? 'fixed inset-y-0 z-50 w-80 shadow-xl' 
      : `${sidebarWidthClasses[sidebarWidth]} ${sidebarPosition === 'left' ? 'border-r' : 'border-l'}`,
    sidebarPosition === 'left' ? 'left-0' : 'right-0',
    isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0',
  ].filter(Boolean).join(' ');

  const overlayClasses = [
    'fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300',
    isMobile && sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
  ].join(' ');

  const skipLinkId = generateId('skip-link');
  const mainContentId = generateId('main-content');
  const sidebarId = generateId('sidebar');

  return (
    <div className={`flex h-screen bg-slate-50 dark:bg-slate-950 ${className}`}>
      {/* Skip to main content link for screen readers */}
      <a
        id={skipLinkId}
        href={`#${mainContentId}`}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-primary-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        Skip to main content
      </a>

      {/* Mobile overlay */}
      {isMobile && (
        <div 
          className={overlayClasses}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      {sidebar && (
        <aside
          id={sidebarId}
          className={sidebarClasses}
          aria-label="Sidebar navigation"
          aria-hidden={isMobile && !sidebarOpen}
        >
          {/* Sidebar header with toggle button */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
                  Neural Flow
                </h2>
              </div>
            )}
            
            {collapsibleSidebar && (
              <button
                onClick={toggleSidebar}
                className={[
                  'p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
                  'hover:bg-slate-100 dark:hover:bg-slate-800',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500',
                  'transition-colors duration-200',
                  'min-w-[40px] min-h-[40px]',
                ].join(' ')}
                aria-label={
                  isMobile 
                    ? 'Close sidebar' 
                    : sidebarCollapsed 
                      ? 'Expand sidebar' 
                      : 'Collapse sidebar'
                }
                aria-expanded={sidebarOpen}
                aria-controls={sidebarId}
              >
                {isMobile ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : sidebarCollapsed ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                )}
              </button>
            )}
          </div>

          {/* Sidebar content */}
          <div className="flex-1 overflow-y-auto">
            {sidebar}
          </div>
        </aside>
      )}

      {/* Main content area */}
      <div className={mainContentClasses}>
        {/* Header */}
        {header && (
          <header className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between px-4 py-3">
              {/* Mobile menu button */}
              {isMobile && sidebar && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className={[
                    'p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
                    'hover:bg-slate-100 dark:hover:bg-slate-800',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500',
                    'transition-colors duration-200',
                    'min-w-[44px] min-h-[44px]',
                  ].join(' ')}
                  aria-label="Open sidebar"
                  aria-expanded={sidebarOpen}
                  aria-controls={sidebarId}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              
              <div className="flex-1">
                {header}
              </div>
            </div>
          </header>
        )}

        {/* Main content */}
        <main
          id={mainContentId}
          className="flex-1 overflow-auto focus:outline-none"
          tabIndex={-1}
        >
          <div className="h-full">
            {children}
          </div>
        </main>

        {/* Footer */}
        {footer && (
          <footer className="flex-shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

// Grid layout component for responsive content
export function ResponsiveGrid({
  children,
  columns = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 },
  gap = 'md',
  className = '',
}: {
  children: React.ReactNode;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const columnClasses = [
    `grid`,
    columns.xs ? `grid-cols-${columns.xs}` : 'grid-cols-1',
    columns.sm ? `sm:grid-cols-${columns.sm}` : '',
    columns.md ? `md:grid-cols-${columns.md}` : '',
    columns.lg ? `lg:grid-cols-${columns.lg}` : '',
    columns.xl ? `xl:grid-cols-${columns.xl}` : '',
    columns['2xl'] ? `2xl:grid-cols-${columns['2xl']}` : '',
    gapClasses[gap],
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={columnClasses}>
      {children}
    </div>
  );
}

// Container component with responsive padding
export function Container({
  children,
  size = 'default',
  className = '',
}: {
  children: React.ReactNode;
  size?: 'sm' | 'default' | 'lg' | 'xl' | 'full';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'max-w-3xl',
    default: 'max-w-7xl',
    lg: 'max-w-screen-xl',
    xl: 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${sizeClasses[size]} ${className}`}>
      {children}
    </div>
  );
}