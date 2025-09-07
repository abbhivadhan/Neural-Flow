import React, { useState, useEffect } from 'react';
import { ContextualHelp, HelpSuggestion, ContextCondition } from '../../types/tutorial';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface ContextualHelpProps {
  enabled: boolean;
  helpItems: ContextualHelp[];
  onStartTutorial?: (tutorialId: string) => void;
}

export const ContextualHelpPanel: React.FC<ContextualHelpProps> = ({
  enabled,
  helpItems,
  onStartTutorial,
}) => {
  const [activeSuggestions, setActiveSuggestions] = useState<HelpSuggestion[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [currentContext, setCurrentContext] = useState<string>('');

  useEffect(() => {
    if (!enabled) {
      setActiveSuggestions([]);
      setIsVisible(false);
      return;
    }

    const updateContextualHelp = () => {
      const context = getCurrentContext();
      setCurrentContext(context);

      const relevantHelp = helpItems
        .filter(help => checkContextConditions(help.conditions))
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 3); // Show top 3 suggestions

      const suggestions = relevantHelp.flatMap(help => help.suggestions);
      setActiveSuggestions(suggestions);
      setIsVisible(suggestions.length > 0);
    };

    // Update immediately
    updateContextualHelp();

    // Set up observers for dynamic updates
    const observer = new MutationObserver(updateContextualHelp);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    // Update on route changes
    const handleRouteChange = () => {
      setTimeout(updateContextualHelp, 100);
    };
    
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [enabled, helpItems]);

  const getCurrentContext = (): string => {
    const path = window.location.pathname;
    const activeElement = document.activeElement;
    
    // Determine context based on current page and focused elements
    if (path.includes('/workspace')) return 'workspace';
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/collaboration')) return 'collaboration';
    if (path.includes('/settings')) return 'settings';
    if (activeElement?.tagName === 'INPUT') return 'input';
    if (activeElement?.tagName === 'TEXTAREA') return 'textarea';
    
    return 'general';
  };

  const checkContextConditions = (conditions: ContextCondition[]): boolean => {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'route':
          const currentRoute = window.location.pathname;
          if (condition.operator === 'contains') {
            return currentRoute.includes(condition.value as string);
          }
          return currentRoute === condition.value;
          
        case 'element_visible':
          const element = document.querySelector(condition.value as string);
          return element && isElementVisible(element);
          
        case 'user_action':
          // In a real implementation, this would check user action history
          return true;
          
        case 'time_spent':
          // In a real implementation, this would check time spent on current page
          const timeSpent = getTimeSpentOnPage();
          if (condition.operator === 'greater_than') {
            return timeSpent > (condition.value as number);
          }
          return timeSpent === condition.value;
          
        case 'feature_used':
          // In a real implementation, this would check feature usage
          return hasUsedFeature(condition.value as string);
          
        default:
          return true;
      }
    });
  };

  const isElementVisible = (element: Element): boolean => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth &&
      rect.width > 0 &&
      rect.height > 0
    );
  };

  const getTimeSpentOnPage = (): number => {
    // Simplified implementation - in real app, track page load time
    return Date.now() - (window as any).pageLoadTime || 0;
  };

  const hasUsedFeature = (featureId: string): boolean => {
    // Simplified implementation - in real app, check feature usage tracking
    const usedFeatures = JSON.parse(localStorage.getItem('used-features') || '[]');
    return usedFeatures.includes(featureId);
  };

  const handleSuggestionClick = (suggestion: HelpSuggestion) => {
    if (suggestion.action) {
      suggestion.action();
    } else if (suggestion.tutorialId && onStartTutorial) {
      onStartTutorial(suggestion.tutorialId);
    }
  };

  const getSuggestionIcon = (type: string): React.ReactNode => {
    switch (type) {
      case 'tip': 
        return <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>;
      case 'shortcut': 
        return <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>;
      case 'feature': 
        return <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>;
      case 'tutorial': 
        return <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>;
      default: 
        return <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>;
    }
  };

  if (!isVisible || activeSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm">
      <Card className="bg-white dark:bg-gray-800 shadow-lg border border-blue-200 dark:border-blue-700">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Helpful Tips
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
          
          <div className="space-y-2">
            {activeSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 mt-0.5">
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {suggestion.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Context: {currentContext}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Hook for managing contextual help
export const useContextualHelp = () => {
  const [helpItems, setHelpItems] = useState<ContextualHelp[]>([]);

  const registerHelp = (help: ContextualHelp) => {
    setHelpItems(prev => {
      const existing = prev.findIndex(h => h.id === help.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = help;
        return updated;
      }
      return [...prev, help];
    });
  };

  const unregisterHelp = (helpId: string) => {
    setHelpItems(prev => prev.filter(h => h.id !== helpId));
  };

  const clearHelp = () => {
    setHelpItems([]);
  };

  return {
    helpItems,
    registerHelp,
    unregisterHelp,
    clearHelp,
  };
};