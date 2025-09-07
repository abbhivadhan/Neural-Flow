import React, { useState } from 'react';
import { 
  Home, 
  FolderOpen, 
  CheckSquare, 
  BarChart3, 
  Settings, 
  Brain, 
  Zap,
  Calendar,
  Search,
  Bell,
  Plus,
  Code,
  FileText,
  Bookmark,
  HelpCircle,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '../ui/Logo';
import { SettingsIndicator } from '../settings/SettingsIndicator';

interface SidebarItem {
  id: string;
  label: string;
  icon: any;
  href?: string;
  badge?: number;
  isActive?: boolean;
  aiSuggested?: boolean;
  children?: SidebarItem[];
}

interface AdaptiveSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  currentContext?: 'coding' | 'writing' | 'research' | 'design' | 'meeting';
  onNavigate?: (itemId: string) => void;
  onQuickAdd?: () => void;
  className?: string;
  onLogoVisibilityChange?: (visible: boolean) => void;
}

export const AdaptiveSidebar: React.FC<AdaptiveSidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  currentContext = 'coding',
  onNavigate,
  onQuickAdd,
  className = '',
  onLogoVisibilityChange,
}) => {
  
  // Notify parent about logo visibility changes
  React.useEffect(() => {
    onLogoVisibilityChange?.(!isCollapsed);
  }, [isCollapsed, onLogoVisibilityChange]);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['workspace']));
  const [quickAddClicked, setQuickAddClicked] = useState(false);

  // Organized navigation items with cleaner structure
  const getNavigationItems = (): SidebarItem[] => {
    return [
      // Main Navigation
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: Home,
        isActive: activeItem === 'dashboard',
      },
      
      // Workspace Section
      {
        id: 'workspace',
        label: 'Workspace',
        icon: FolderOpen,
        children: [
          {
            id: 'projects',
            label: 'Projects',
            icon: FolderOpen,
            badge: 3,
            isActive: activeItem === 'projects',
          },
          {
            id: 'tasks',
            label: 'Tasks',
            icon: CheckSquare,
            badge: 12,
            isActive: activeItem === 'tasks',
          },
          {
            id: 'code-editor',
            label: 'Code Editor',
            icon: Code,
            isActive: activeItem === 'code-editor',
          },
          {
            id: 'documents',
            label: 'Documents',
            icon: FileText,
            badge: 5,
            isActive: activeItem === 'documents',
          },
        ],
      },

      // AI & Tools Section
      {
        id: 'ai-tools',
        label: 'AI Tools',
        icon: Brain,
        children: [
          {
            id: 'ai-assistant',
            label: 'AI Assistant',
            icon: Brain,
            aiSuggested: true,
            isActive: activeItem === 'ai-assistant',
          },
          {
            id: 'code-review',
            label: 'Code Review',
            icon: Search,
            aiSuggested: true,
            badge: 2,
            isActive: activeItem === 'code-review',
          },
          {
            id: 'performance',
            label: 'Performance',
            icon: Zap,
            aiSuggested: true,
            isActive: activeItem === 'performance',
          },
        ],
      },

      // Analytics & Insights
      {
        id: 'analytics',
        label: 'Analytics',
        icon: BarChart3,
        isActive: activeItem === 'analytics',
      },

      // Calendar & Schedule
      {
        id: 'calendar',
        label: 'Calendar',
        icon: Calendar,
        isActive: activeItem === 'calendar',
      },

      // Search & Discovery
      {
        id: 'search',
        label: 'Search',
        icon: Search,
        isActive: activeItem === 'search',
      },

      // Bookmarks & Favorites
      {
        id: 'bookmarks',
        label: 'Bookmarks',
        icon: Bookmark,
        badge: 8,
        isActive: activeItem === 'bookmarks',
      },
    ];
  };

  // Bottom navigation items (settings, notifications, etc.)
  const getBottomItems = (): SidebarItem[] => {
    return [
      {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        badge: 3,
        isActive: activeItem === 'notifications',
      },
      {
        id: 'help',
        label: 'Help & Support',
        icon: HelpCircle,
        isActive: activeItem === 'help',
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        isActive: activeItem === 'settings',
      },
    ];
  };

  const handleItemClick = (item: SidebarItem) => {
    if (item.children) {
      setExpandedGroups(prev => {
        const newSet = new Set(prev);
        if (newSet.has(item.id)) {
          newSet.delete(item.id);
        } else {
          newSet.add(item.id);
        }
        return newSet;
      });
    } else {
      setActiveItem(item.id);
      
      // Handle navigation for specific items
      if (item.id === 'settings') {
        window.location.href = '/settings';
      } else if (item.id === 'analytics') {
        window.location.href = '/analytics';
      } else if (item.id === 'search') {
        window.location.href = '/search';
      } else if (item.id === 'privacy') {
        window.location.href = '/privacy';
      } else if (item.id === 'performance') {
        window.location.href = '/performance';
      } else if (item.id === 'collaboration') {
        window.location.href = '/collaboration';
      } else if (item.id === 'dashboard') {
        window.location.href = '/';
      } else if (item.id === 'workspace') {
        window.location.href = '/workspace';
      }
      
      onNavigate?.(item.id);
    }
  };

  const handleQuickAdd = () => {
    setQuickAddClicked(true);
    
    // Reset the clicked state after animation
    setTimeout(() => setQuickAddClicked(false), 200);
    
    if (onQuickAdd) {
      onQuickAdd();
    } else {
      // Default behavior - show a context-aware quick add menu
      const contextActions = {
        coding: 'Create new file or project',
        writing: 'Create new document',
        research: 'Add new source or note',
        design: 'Create new design or asset',
        meeting: 'Schedule new meeting'
      };
      
      const action = contextActions[currentContext];
      console.log(`Quick Add: ${action}`);
      
      // You could also dispatch an action or show a modal here
      // For now, we'll just log the action
    }
  };

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedGroups.has(item.id);
    const isChild = level > 0;

    if (isCollapsed) {
      // Collapsed state - show only icons
      return (
        <motion.button
          key={item.id}
          onClick={() => handleItemClick(item)}
          className={`
            w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 relative group
            ${item.isActive 
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            }
            ${item.aiSuggested && !item.isActive ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10' : ''}
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={item.label}
        >
          <div className="relative">
            <Icon className="w-5 h-5" />
            {/* Badge indicator */}
            {item.badge && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none shadow-sm">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
            {/* AI suggested indicator */}
            {item.aiSuggested && !item.isActive && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-sm"></div>
            )}
            {/* Settings indicator */}
            {item.id === 'settings' && (
              <div className="absolute -top-1 -right-1">
                <SettingsIndicator />
              </div>
            )}
          </div>
        </motion.button>
      );
    }

    // Expanded state
    return (
      <div key={item.id}>
        <motion.button
          onClick={() => handleItemClick(item)}
          className={`
            w-full flex items-center rounded-xl text-left transition-all duration-200 relative group
            ${isChild ? 'ml-4 pl-3 px-3 py-2.5' : 'px-4 py-3'}
            space-x-3
            ${item.isActive 
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
            }
            ${item.aiSuggested && !item.isActive ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border-l-2 border-purple-400' : ''}
          `}
          whileHover={{ scale: 1.01, x: 2 }}
          whileTap={{ scale: 0.99 }}
          data-tutorial={item.id === 'ai-assistant' ? 'ai-assistant' : undefined}
        >
          <div className="relative flex-shrink-0">
            <Icon className={`${isChild ? 'w-4 h-4' : 'w-5 h-5'} transition-colors`} />
          </div>
          
          <div className="flex items-center justify-between flex-1">
            <span className={`font-medium whitespace-nowrap transition-colors ${isChild ? 'text-sm' : ''}`}>
              {item.label}
            </span>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              {item.aiSuggested && !item.isActive && (
                <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-sm"></div>
              )}
              
              {item.id === 'settings' && <SettingsIndicator />}
              
              {item.badge && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center font-medium shadow-sm">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
              
              {hasChildren && (
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="w-4 h-4 flex items-center justify-center"
                >
                  <div className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    item.isActive 
                      ? 'bg-white shadow-sm' 
                      : 'bg-slate-400 dark:bg-slate-500 group-hover:bg-slate-600 dark:group-hover:bg-slate-400'
                  }`} />
                </motion.div>
              )}
            </div>
          </div>
        </motion.button>

        {/* Children */}
        <AnimatePresence mode="wait">
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ 
                duration: 0.3, 
                ease: [0.4, 0.0, 0.2, 1],
                staggerChildren: 0.05
              }}
              className="mt-1 space-y-1 overflow-hidden"
            >
              {item.children!.map((child, index) => (
                <motion.div
                  key={child.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ 
                    duration: 0.2, 
                    delay: index * 0.05,
                    ease: [0.4, 0.0, 0.2, 1]
                  }}
                >
                  {renderSidebarItem(child, level + 1)}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.div
      animate={{ width: isCollapsed ? 72 : 280 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.4, 0.0, 0.2, 1], // Custom cubic-bezier for smoother animation
        type: "tween"
      }}
      className={`
        h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-r border-slate-200/50 dark:border-slate-700/50
        flex flex-col relative shadow-sm overflow-hidden ${className}
      `}
    >
      {/* Header - Logo and Toggle Button */}
      <div className={`${isCollapsed ? 'p-3' : 'p-6'} ${!isCollapsed ? 'border-b border-slate-200/50 dark:border-slate-700/50' : ''}`}>
        <div className="flex items-center justify-between">
          {/* Logo - Only show when expanded */}
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.9 }}
                transition={{ 
                  duration: 0.4, 
                  ease: [0.4, 0.0, 0.2, 1],
                  delay: 0.1 // Slight delay for smoother appearance
                }}
                className="flex items-center space-x-3"
              >
                <Logo size="md" variant="icon" />
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100">Neural Flow</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-0.5">
                    {currentContext} Mode
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle Button */}
          <motion.button
            onClick={onToggleCollapse}
            className={`
              ${isCollapsed ? 'w-12 h-12' : 'w-8 h-8'} 
              bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 
              rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm
              ${isCollapsed ? 'mx-auto' : 'flex-shrink-0'}
            `}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              <Layers className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </motion.div>
          </motion.button>
        </div>
      </div>

      {/* Quick Add Button */}
      <div className={`${isCollapsed ? 'p-3' : 'px-6 py-4'} ${!isCollapsed ? 'border-b border-slate-200/50 dark:border-slate-700/50' : ''}`}>
        <motion.button 
          onClick={handleQuickAdd}
          className={`
            w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 
            text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 
            flex items-center justify-center relative overflow-hidden transition-all duration-200
            ${isCollapsed ? 'h-12 w-12' : 'py-3 px-4 space-x-2'}
          `}
          title={`Quick add for ${currentContext} context`}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          animate={quickAddClicked ? { scale: [1, 0.95, 1] } : {}}
          transition={{ duration: 0.2 }}
          data-tutorial="quick-add-sidebar"
        >
          <Plus className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} transition-transform duration-200 ${quickAddClicked ? 'rotate-90' : ''}`} />
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0, x: -10 }}
                animate={{ opacity: 1, width: 'auto', x: 0 }}
                exit={{ opacity: 0, width: 0, x: -10 }}
                transition={{ 
                  duration: 0.3, 
                  ease: [0.4, 0.0, 0.2, 1],
                  delay: 0.15
                }}
                className="whitespace-nowrap font-medium"
              >
                Quick Add
              </motion.span>
            )}
          </AnimatePresence>
          
          {/* Ripple effect */}
          {quickAddClicked && (
            <motion.div
              className="absolute inset-0 bg-white/20 rounded-xl"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 1, opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.button>
      </div>

      {/* Navigation Items */}
      <div className={`flex-1 ${isCollapsed ? 'px-3 py-4' : 'px-6 py-4'} overflow-hidden`} data-tutorial="main-nav">
        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent hover:scrollbar-thumb-slate-400 dark:hover:scrollbar-thumb-slate-500">
          {/* Main Navigation */}
          <div className={`${isCollapsed ? 'space-y-2' : 'space-y-1'} mb-8`}>
            {getNavigationItems().map(item => renderSidebarItem(item))}
          </div>
          
          {/* Divider */}
          {!isCollapsed && (
            <div className="border-t border-slate-200/50 dark:border-slate-700/50 my-6"></div>
          )}
          
          {/* Collapsed state divider */}
          {isCollapsed && (
            <div className="flex justify-center my-4">
              <div className="w-8 h-px bg-slate-200 dark:bg-slate-700"></div>
            </div>
          )}
          
          {/* Bottom Items */}
          <div className={`${isCollapsed ? 'space-y-2' : 'space-y-1'}`}>
            {getBottomItems().map((item, index) => (
              <React.Fragment key={item.id}>
                {renderSidebarItem(item)}
                {/* Add divider after notifications (first item) in collapsed state */}
                {isCollapsed && index === 0 && (
                  <div className="flex justify-center py-2">
                    <div className="w-8 h-px bg-slate-200 dark:bg-slate-700"></div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* AI Status Indicator */}
      <div className={`${isCollapsed ? 'p-3' : 'p-6'} border-t border-slate-200/50 dark:border-slate-700/50`}>
        {isCollapsed ? (
          <div className="flex justify-center">
            <motion.div 
              className="relative w-12 h-12 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl flex items-center justify-center shadow-sm"
              whileHover={{ scale: 1.05 }}
            >
              <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
            </motion.div>
          </div>
        ) : (
          <motion.div 
            className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl shadow-sm"
            whileHover={{ scale: 1.01 }}
          >
            <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                AI Active
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Learning patterns
              </p>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};