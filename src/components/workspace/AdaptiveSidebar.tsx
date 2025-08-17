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
  Users,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  className?: string;
}

export const AdaptiveSidebar: React.FC<AdaptiveSidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  currentContext = 'coding',
  onNavigate,
  className = '',
}) => {
  const [activeItem, setActiveItem] = useState('dashboard');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['workspace']));

  // Context-aware navigation items
  const getContextualItems = (): SidebarItem[] => {
    const baseItems: SidebarItem[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: Home,
        isActive: activeItem === 'dashboard',
      },
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
            id: 'calendar',
            label: 'Calendar',
            icon: Calendar,
            isActive: activeItem === 'calendar',
          },
        ],
      },
      {
        id: 'ai-assistant',
        label: 'AI Assistant',
        icon: Brain,
        aiSuggested: true,
        isActive: activeItem === 'ai-assistant',
      },
    ];

    // Add context-specific items
    const contextItems: Record<string, SidebarItem[]> = {
      coding: [
        {
          id: 'code-review',
          label: 'Code Review',
          icon: Search,
          aiSuggested: true,
          badge: 2,
        },
        {
          id: 'performance',
          label: 'Performance',
          icon: Zap,
          aiSuggested: true,
        },
      ],
      writing: [
        {
          id: 'documents',
          label: 'Documents',
          icon: FolderOpen,
          badge: 5,
        },
        {
          id: 'grammar-check',
          label: 'Grammar Check',
          icon: CheckSquare,
          aiSuggested: true,
        },
      ],
      research: [
        {
          id: 'sources',
          label: 'Sources',
          icon: Search,
          badge: 8,
        },
        {
          id: 'insights',
          label: 'AI Insights',
          icon: Brain,
          aiSuggested: true,
        },
      ],
      design: [
        {
          id: 'assets',
          label: 'Assets',
          icon: FolderOpen,
          badge: 15,
        },
        {
          id: 'inspiration',
          label: 'Inspiration',
          icon: Zap,
          aiSuggested: true,
        },
      ],
      meeting: [
        {
          id: 'agenda',
          label: 'Agenda',
          icon: CheckSquare,
        },
        {
          id: 'participants',
          label: 'Participants',
          icon: Users,
          badge: 6,
        },
      ],
    };

    const contextSpecific = contextItems[currentContext] || [];
    
    return [
      ...baseItems,
      ...contextSpecific,
      {
        id: 'analytics',
        label: 'Analytics',
        icon: BarChart3,
        isActive: activeItem === 'analytics',
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        badge: 3,
        isActive: activeItem === 'notifications',
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
      onNavigate?.(item.id);
    }
  };

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedGroups.has(item.id);
    const isChild = level > 0;

    return (
      <div key={item.id}>
        <motion.button
          onClick={() => handleItemClick(item)}
          className={`
            w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200
            ${isChild ? 'ml-6 pl-2' : ''}
            ${item.isActive 
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }
            ${item.aiSuggested ? 'border-l-2 border-purple-500' : ''}
          `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Icon className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : ''}`} />
          
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex items-center justify-between flex-1"
              >
                <span className="font-medium">{item.label}</span>
                
                <div className="flex items-center space-x-2">
                  {item.aiSuggested && (
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                  )}
                  
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                      {item.badge}
                    </span>
                  )}
                  
                  {hasChildren && (
                    <ChevronRight 
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isExpanded ? 'rotate-90' : ''
                      }`} 
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Children */}
        <AnimatePresence>
          {hasChildren && isExpanded && !isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1 space-y-1"
            >
              {item.children!.map(child => renderSidebarItem(child, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.div
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`
        h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700
        flex flex-col ${className}
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center space-x-3"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg"></div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100">Neural Flow</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                    {currentContext} Mode
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 border-b border-slate-200 dark:border-slate-700"
          >
            <button className="w-full neural-button-primary flex items-center justify-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Quick Add</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Items */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {getContextualItems().map(item => renderSidebarItem(item))}
      </div>

      {/* AI Context Indicator */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 border-t border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
              <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  AI Active
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Learning your patterns
                </p>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};