import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  SortAsc, 
  MoreHorizontal, 
  Zap, 
  Brain,
  Mic,
  Command,
  Eye,
  Share2,
  Download,
  // Upload,
  RefreshCw,
  Settings,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToolbarAction {
  id: string;
  label: string;
  icon: any;
  shortcut?: string;
  aiSuggested?: boolean;
  priority: 'primary' | 'secondary' | 'tertiary';
  onClick?: () => void;
}

interface ContextToolbarProps {
  context: 'coding' | 'writing' | 'research' | 'design' | 'meeting' | 'dashboard';
  onAction?: (actionId: string) => void;
  isAIActive?: boolean;
  className?: string;
}

export const ContextToolbar: React.FC<ContextToolbarProps> = ({
  context,
  onAction,
  isAIActive = true,
  className = '',
}) => {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);

  // Context-specific actions
  const getContextActions = (): ToolbarAction[] => {
    const baseActions: ToolbarAction[] = [
      {
        id: 'search',
        label: 'Search',
        icon: Search,
        shortcut: '⌘K',
        priority: 'primary',
      },
      {
        id: 'filter',
        label: 'Filter',
        icon: Filter,
        priority: 'secondary',
      },
      {
        id: 'sort',
        label: 'Sort',
        icon: SortAsc,
        priority: 'secondary',
      },
    ];

    const contextSpecificActions: Record<string, ToolbarAction[]> = {
      coding: [
        {
          id: 'ai-review',
          label: 'AI Code Review',
          icon: Brain,
          shortcut: '⌘R',
          aiSuggested: true,
          priority: 'primary',
        },
        {
          id: 'refactor',
          label: 'Smart Refactor',
          icon: Zap,
          aiSuggested: true,
          priority: 'secondary',
        },
        {
          id: 'test-gen',
          label: 'Generate Tests',
          icon: Sparkles,
          aiSuggested: true,
          priority: 'tertiary',
        },
      ],
      writing: [
        {
          id: 'ai-enhance',
          label: 'Enhance Writing',
          icon: Sparkles,
          shortcut: '⌘E',
          aiSuggested: true,
          priority: 'primary',
        },
        {
          id: 'grammar-check',
          label: 'Grammar Check',
          icon: Eye,
          aiSuggested: true,
          priority: 'secondary',
        },
        {
          id: 'voice-to-text',
          label: 'Voice Input',
          icon: Mic,
          priority: 'secondary',
        },
      ],
      research: [
        {
          id: 'ai-insights',
          label: 'AI Insights',
          icon: Brain,
          shortcut: '⌘I',
          aiSuggested: true,
          priority: 'primary',
        },
        {
          id: 'summarize',
          label: 'Summarize',
          icon: Zap,
          aiSuggested: true,
          priority: 'secondary',
        },
        {
          id: 'extract-data',
          label: 'Extract Data',
          icon: Download,
          aiSuggested: true,
          priority: 'tertiary',
        },
      ],
      design: [
        {
          id: 'ai-generate',
          label: 'AI Generate',
          icon: Sparkles,
          shortcut: '⌘G',
          aiSuggested: true,
          priority: 'primary',
        },
        {
          id: 'color-palette',
          label: 'Smart Colors',
          icon: Eye,
          aiSuggested: true,
          priority: 'secondary',
        },
        {
          id: 'layout-suggest',
          label: 'Layout Ideas',
          icon: Zap,
          aiSuggested: true,
          priority: 'tertiary',
        },
      ],
      meeting: [
        {
          id: 'record',
          label: 'Record & Transcribe',
          icon: Mic,
          shortcut: '⌘M',
          aiSuggested: true,
          priority: 'primary',
        },
        {
          id: 'action-items',
          label: 'Extract Actions',
          icon: Brain,
          aiSuggested: true,
          priority: 'secondary',
        },
        {
          id: 'share-notes',
          label: 'Share Notes',
          icon: Share2,
          priority: 'secondary',
        },
      ],
      dashboard: [
        {
          id: 'ai-insights',
          label: 'AI Insights',
          icon: Brain,
          shortcut: '⌘I',
          aiSuggested: true,
          priority: 'primary',
        },
        {
          id: 'refresh',
          label: 'Refresh Data',
          icon: RefreshCw,
          priority: 'secondary',
        },
        {
          id: 'export',
          label: 'Export Report',
          icon: Download,
          priority: 'tertiary',
        },
      ],
    };

    const contextActions = contextSpecificActions[context] || [];
    
    return [
      ...baseActions,
      ...contextActions,
      {
        id: 'voice-command',
        label: isVoiceActive ? 'Stop Listening' : 'Voice Command',
        icon: Mic,
        shortcut: '⌘⇧V',
        priority: 'secondary',
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        priority: 'tertiary',
      },
    ];
  };

  const actions = getContextActions();
  const primaryActions = actions.filter(a => a.priority === 'primary');
  const secondaryActions = actions.filter(a => a.priority === 'secondary');
  const tertiaryActions = actions.filter(a => a.priority === 'tertiary');

  const handleAction = (action: ToolbarAction) => {
    if (action.id === 'voice-command') {
      setIsVoiceActive(!isVoiceActive);
    }
    onAction?.(action.id);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      const action = actions.find(a => 
        a.shortcut?.toLowerCase().includes(e.key.toLowerCase())
      );
      if (action) {
        e.preventDefault();
        handleAction(action);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);

  return (
    <div className={`
      flex items-center justify-between p-4 bg-white dark:bg-slate-900 
      border-b border-slate-200 dark:border-slate-700 ${className}
    `}>
      {/* Left Section - Primary Actions */}
      <div className="flex items-center space-x-3">
        {primaryActions.map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              onClick={() => handleAction(action)}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${action.aiSuggested 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }
                ${action.id === 'voice-command' && isVoiceActive ? 'bg-red-500 text-white' : ''}
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className={`w-4 h-4 ${action.id === 'voice-command' && isVoiceActive ? 'animate-pulse' : ''}`} />
              <span>{action.label}</span>
              {action.shortcut && (
                <span className="text-xs opacity-70 ml-2 px-1 py-0.5 bg-black/10 rounded">
                  {action.shortcut}
                </span>
              )}
              {action.aiSuggested && (
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Center Section - Context Indicator */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
          <Command className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">
            {context} Mode
          </span>
          {isAIActive && (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          )}
        </div>
      </div>

      {/* Right Section - Secondary Actions & More */}
      <div className="flex items-center space-x-2">
        {/* Secondary Actions */}
        {secondaryActions.slice(0, 3).map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              onClick={() => handleAction(action)}
              className={`
                p-2 rounded-lg transition-all duration-200
                ${action.aiSuggested 
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }
                ${action.id === 'voice-command' && isVoiceActive ? 'bg-red-100 text-red-600' : ''}
              `}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={`${action.label}${action.shortcut ? ` (${action.shortcut})` : ''}`}
            >
              <Icon className={`w-4 h-4 ${action.id === 'voice-command' && isVoiceActive ? 'animate-pulse' : ''}`} />
              {action.aiSuggested && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full"></div>
              )}
            </motion.button>
          );
        })}

        {/* More Actions Dropdown */}
        <div className="relative">
          <motion.button
            onClick={() => setShowMoreActions(!showMoreActions)}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </motion.button>

          <AnimatePresence>
            {showMoreActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50"
              >
                {[...secondaryActions.slice(3), ...tertiaryActions].map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => {
                        handleAction(action);
                        setShowMoreActions(false);
                      }}
                      className={`
                        w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors
                        ${action.aiSuggested ? 'text-purple-600 dark:text-purple-400' : 'text-slate-700 dark:text-slate-300'}
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="flex-1">{action.label}</span>
                      {action.shortcut && (
                        <span className="text-xs text-slate-400">{action.shortcut}</span>
                      )}
                      {action.aiSuggested && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Voice Command Indicator */}
      <AnimatePresence>
        {isVoiceActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 z-50"
          >
            <Mic className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium">Listening...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};