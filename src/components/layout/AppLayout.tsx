import React, { useState } from 'react';
import { TopBar } from './TopBar';
import { AdaptiveSidebar } from '../workspace/AdaptiveSidebar';
import { useDashboardMode } from '../../providers/DashboardModeProvider';

interface AppLayoutProps {
  children: React.ReactNode;
  currentContext?: 'coding' | 'writing' | 'research' | 'design' | 'meeting';
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  currentContext = 'coding'
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLogoInTopbar, setShowLogoInTopbar] = useState(false);
  const { currentMode } = useDashboardMode();

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogoVisibilityChange = (visible: boolean) => {
    setShowLogoInTopbar(!visible);
  };

  // Map dashboard mode to context
  const contextFromMode = currentMode === 'meeting' ? 'meeting' : 'coding';

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Top Bar */}
      <TopBar 
        showLogo={showLogoInTopbar}
        currentContext={currentContext || contextFromMode}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <AdaptiveSidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          currentContext={currentContext || contextFromMode}
          onLogoVisibilityChange={handleLogoVisibilityChange}
        />
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-white dark:bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;