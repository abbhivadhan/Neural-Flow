import React, { useState, useRef, useEffect } from 'react';
import { useResponsiveDesign } from '../../hooks/useResponsiveDesign';
import { useAccessibility, useKeyboardNavigation } from '../../hooks/useAccessibility';

interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
  children?: NavigationItem[];
}

interface NavigationProps {
  items: NavigationItem[];
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  activeItem?: string;
  onItemSelect?: (item: NavigationItem) => void;
  className?: string;
  'aria-label'?: string;
}

export function Navigation({
  items,
  orientation = 'horizontal',
  variant = 'default',
  size = 'md',
  activeItem,
  onItemSelect,
  className = '',
  'aria-label': ariaLabel = 'Navigation',
}: NavigationProps) {
  const { isMobile, touchDevice } = useResponsiveDesign();
  const { announce, generateId } = useAccessibility();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  // Flatten items for keyboard navigation
  const flattenedItems = React.useMemo(() => {
    const flatten = (items: NavigationItem[], level = 0): (NavigationItem & { level: number })[] => {
      return items.reduce((acc, item) => {
        acc.push({ ...item, level });
        if (item.children && expandedItems.has(item.id)) {
          acc.push(...flatten(item.children, level + 1));
        }
        return acc;
      }, [] as (NavigationItem & { level: number })[]);
    };
    return flatten(items);
  }, [items, expandedItems]);

  const { handleKeyDown } = useKeyboardNavigation(
    itemRefs.current.filter(Boolean) as HTMLElement[],
    focusedIndex,
    {
      orientation: orientation === 'horizontal' ? 'horizontal' : 'vertical',
      onNavigate: setFocusedIndex,
    }
  );

  const handleItemClick = (item: NavigationItem, index: number) => {
    if (item.disabled) return;

    setFocusedIndex(index);
    
    // Handle expandable items
    if (item.children) {
      const newExpanded = new Set(expandedItems);
      if (expandedItems.has(item.id)) {
        newExpanded.delete(item.id);
        announce(`${item.label} collapsed`, 'polite');
      } else {
        newExpanded.add(item.id);
        announce(`${item.label} expanded`, 'polite');
      }
      setExpandedItems(newExpanded);
    }

    // Handle navigation
    if (item.href) {
      window.location.href = item.href;
    } else if (item.onClick) {
      item.onClick();
    }

    onItemSelect?.(item);
    announce(`Navigated to ${item.label}`, 'polite');
  };

  const handleKeyPress = (event: React.KeyboardEvent, item: NavigationItem, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleItemClick(item, index);
    } else {
      handleKeyDown(event as any);
    }
  };

  const baseClasses = [
    'flex',
    orientation === 'horizontal' ? 'flex-row' : 'flex-col',
    orientation === 'horizontal' && isMobile ? 'overflow-x-auto' : '',
    className,
  ].filter(Boolean).join(' ');

  const getItemClasses = (item: NavigationItem & { level: number }, index: number) => {
    const isActive = activeItem === item.id;
    const isFocused = focusedIndex === index;
    
    const baseItemClasses = [
      'flex items-center gap-2 transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      // Enhanced touch targets for mobile
      touchDevice ? 'min-h-[44px]' : '',
      // Indentation for nested items
      item.level > 0 ? `pl-${4 + item.level * 4}` : '',
    ].filter(Boolean);

    const sizeClasses = {
      sm: 'px-2 py-1 text-sm',
      md: isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2 text-sm',
      lg: isMobile ? 'px-6 py-4 text-lg' : 'px-4 py-3 text-base',
    };

    const variantClasses = {
      default: [
        isActive 
          ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100' 
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
        'rounded-lg',
      ].join(' '),
      pills: [
        isActive 
          ? 'bg-primary-600 text-white shadow-lg' 
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
        'rounded-full',
      ].join(' '),
      underline: [
        isActive 
          ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400' 
          : 'text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400',
        'border-b-2 border-transparent',
      ].join(' '),
    };

    return [
      ...baseItemClasses,
      sizeClasses[size],
      variantClasses[variant],
      item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    ].join(' ');
  };

  const renderItem = (item: NavigationItem & { level: number }, index: number) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const itemId = generateId(`nav-item-${item.id}`);

    return (
      <li key={item.id} role="none">
        <div
          ref={(el) => (itemRefs.current[index] = el)}
          className={getItemClasses(item, index)}
          role={hasChildren ? 'button' : 'menuitem'}
          tabIndex={index === focusedIndex ? 0 : -1}
          aria-current={activeItem === item.id ? 'page' : undefined}
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-disabled={item.disabled}
          id={itemId}
          onClick={() => handleItemClick(item, index)}
          onKeyDown={(e) => handleKeyPress(e, item, index)}
        >
          {item.icon && (
            <span className="flex-shrink-0" aria-hidden="true">
              {item.icon}
            </span>
          )}
          
          <span className="flex-1 truncate">{item.label}</span>
          
          {item.badge && (
            <span 
              className="flex-shrink-0 px-2 py-1 text-xs bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 rounded-full"
              aria-label={`${item.badge} notifications`}
            >
              {item.badge}
            </span>
          )}
          
          {hasChildren && (
            <span 
              className="flex-shrink-0 transition-transform duration-200"
              aria-hidden="true"
              style={{
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          )}
        </div>
      </li>
    );
  };

  return (
    <nav
      ref={navRef}
      className={baseClasses}
      role="menubar"
      aria-label={ariaLabel}
      aria-orientation={orientation}
    >
      <ul 
        className={[
          'flex',
          orientation === 'horizontal' ? 'flex-row gap-1' : 'flex-col gap-1',
          'list-none m-0 p-0',
        ].join(' ')}
        role="menu"
      >
        {flattenedItems.map((item, index) => renderItem(item, index))}
      </ul>
    </nav>
  );
}

// Mobile-optimized bottom navigation
export function BottomNavigation({
  items,
  activeItem,
  onItemSelect,
  className = '',
}: {
  items: NavigationItem[];
  activeItem?: string;
  onItemSelect?: (item: NavigationItem) => void;
  className?: string;
}) {
  const { announce } = useAccessibility();

  const handleItemClick = (item: NavigationItem) => {
    if (item.disabled) return;
    
    if (item.href) {
      window.location.href = item.href;
    } else if (item.onClick) {
      item.onClick();
    }

    onItemSelect?.(item);
    announce(`Navigated to ${item.label}`, 'polite');
  };

  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 ${className}`}
      role="tablist"
      aria-label="Bottom navigation"
    >
      <div className="flex">
        {items.map((item) => {
          const isActive = activeItem === item.id;
          
          return (
            <button
              key={item.id}
              className={[
                'flex-1 flex flex-col items-center justify-center py-2 px-1 min-h-[64px]',
                'transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                isActive 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300',
                item.disabled ? 'opacity-50 cursor-not-allowed' : '',
              ].filter(Boolean).join(' ')}
              role="tab"
              aria-selected={isActive}
              aria-disabled={item.disabled}
              disabled={item.disabled}
              onClick={() => handleItemClick(item)}
            >
              {item.icon && (
                <span className="mb-1" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              <span className="text-xs font-medium truncate max-w-full">
                {item.label}
              </span>
              {item.badge && (
                <span 
                  className="absolute top-1 right-1/2 transform translate-x-2 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center"
                  aria-label={`${item.badge} notifications`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}