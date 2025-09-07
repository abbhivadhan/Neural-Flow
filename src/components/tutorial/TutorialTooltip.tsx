import React, { useState, useEffect, useRef } from 'react';
import { TooltipConfig, ContextCondition } from '../../types/tutorial';

interface TutorialTooltipProps {
  config: TooltipConfig;
  isVisible: boolean;
  onClose?: () => void;
}

export const TutorialTooltip: React.FC<TutorialTooltipProps> = ({
  config,
  isVisible,
  onClose,
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isShowing, setIsShowing] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isVisible) {
      setIsShowing(false);
      return;
    }

    const targetElement = document.querySelector(config.target);
    if (!targetElement) return;

    const showTooltip = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        updatePosition(targetElement);
        setIsShowing(true);
      }, config.delay || 0);
    };

    const hideTooltip = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (!config.persistent) {
        setIsShowing(false);
      }
    };

    // Add event listeners based on trigger
    switch (config.trigger) {
      case 'hover':
        targetElement.addEventListener('mouseenter', showTooltip);
        targetElement.addEventListener('mouseleave', hideTooltip);
        break;
      case 'click':
        targetElement.addEventListener('click', showTooltip);
        document.addEventListener('click', (e) => {
          if (!targetElement.contains(e.target as Node) && !tooltipRef.current?.contains(e.target as Node)) {
            hideTooltip();
          }
        });
        break;
      case 'focus':
        targetElement.addEventListener('focus', showTooltip);
        targetElement.addEventListener('blur', hideTooltip);
        break;
      case 'contextual':
        // For contextual tooltips, show immediately if conditions are met
        if (checkContextConditions(config.contextConditions || [])) {
          showTooltip();
        }
        break;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      targetElement.removeEventListener('mouseenter', showTooltip);
      targetElement.removeEventListener('mouseleave', hideTooltip);
      targetElement.removeEventListener('click', showTooltip);
      targetElement.removeEventListener('focus', showTooltip);
      targetElement.removeEventListener('blur', hideTooltip);
    };
  }, [isVisible, config]);

  const updatePosition = (targetElement: Element) => {
    const rect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    
    if (!tooltipRect) return;

    let top = 0;
    let left = 0;

    switch (config.position) {
      case 'top':
        top = rect.top - tooltipRect.height - 8;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = rect.bottom + 8;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.right + 8;
        break;
    }

    // Ensure tooltip stays within viewport
    top = Math.max(8, Math.min(top, window.innerHeight - tooltipRect.height - 8));
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));

    setPosition({ top, left });
  };

  const checkContextConditions = (conditions: ContextCondition[]): boolean => {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'route':
          return window.location.pathname.includes(condition.value as string);
        case 'element_visible':
          const element = document.querySelector(condition.value as string);
          return element && isElementVisible(element);
        case 'user_action':
          // This would check against stored user actions
          return true; // Simplified for demo
        case 'time_spent':
          // This would check time spent on current page
          return true; // Simplified for demo
        case 'feature_used':
          // This would check if a feature has been used
          return true; // Simplified for demo
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
      rect.right <= window.innerWidth
    );
  };

  if (!isShowing) return null;

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 tooltip-container"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <div className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 max-w-xs shadow-lg relative">
        {/* Arrow */}
        <div
          className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
            config.position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
            config.position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
            config.position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' :
            'left-[-4px] top-1/2 -translate-y-1/2'
          }`}
        />
        
        {/* Content */}
        <div className="relative z-10">
          {config.content}
        </div>
        
        {/* Close button for persistent tooltips */}
        {config.persistent && onClose && (
          <button
            onClick={onClose}
            className="absolute top-1 right-1 text-gray-400 hover:text-white text-xs"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

interface TooltipManagerProps {
  tooltips: TooltipConfig[];
  enabled: boolean;
}

export const TooltipManager: React.FC<TooltipManagerProps> = ({
  tooltips,
  enabled,
}) => {
  const [visibleTooltips, setVisibleTooltips] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) {
      setVisibleTooltips(new Set());
      return;
    }

    // Check which tooltips should be visible based on context
    const newVisibleTooltips = new Set<string>();
    
    tooltips.forEach(tooltip => {
      if (tooltip.trigger === 'contextual') {
        const targetElement = document.querySelector(tooltip.target);
        if (targetElement && checkContextConditions(tooltip.contextConditions || [])) {
          newVisibleTooltips.add(tooltip.id);
        }
      }
    });

    setVisibleTooltips(newVisibleTooltips);
  }, [tooltips, enabled]);

  const checkContextConditions = (conditions: ContextCondition[]): boolean => {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'route':
          return window.location.pathname.includes(condition.value as string);
        case 'element_visible':
          const element = document.querySelector(condition.value as string);
          return element && isElementVisible(element);
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
      rect.right <= window.innerWidth
    );
  };

  const handleTooltipClose = (tooltipId: string) => {
    setVisibleTooltips(prev => {
      const newSet = new Set(prev);
      newSet.delete(tooltipId);
      return newSet;
    });
  };

  if (!enabled) return null;

  return (
    <>
      {tooltips.map(tooltip => (
        <TutorialTooltip
          key={tooltip.id}
          config={tooltip}
          isVisible={visibleTooltips.has(tooltip.id) || tooltip.trigger !== 'contextual'}
          onClose={() => handleTooltipClose(tooltip.id)}
        />
      ))}
    </>
  );
};