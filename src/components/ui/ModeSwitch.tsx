import React, { useState, useRef, useEffect } from 'react';
import { DashboardMode, ModeSwitchProps } from '../../types/dashboard';
import { useDashboardMode } from '../../providers/DashboardModeProvider';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useResponsiveDesign } from '../../hooks/useResponsiveDesign';
import { MODE_CONFIGS } from '../../config/dashboardModes';

// Icon components for different modes
const CodeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const getModeIcon = (mode: DashboardMode) => {
  switch (mode) {
    case 'coding':
      return <CodeIcon />;
    case 'meeting':
      return <UsersIcon />;
    default:
      return <CodeIcon />;
  }
};

export function ModeSwitch({
  currentMode,
  onModeChange,
  className = '',
  disabled = false,
  showTooltip = true,
  variant = 'dropdown',
  size = 'medium'
}: ModeSwitchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const { availableModes, isTransitioning } = useDashboardMode();
  const { announce } = useAccessibility();
  const { isMobile, prefersReducedMotion } = useResponsiveDesign();
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<HTMLButtonElement[]>([]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled || isTransitioning) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else if (focusedIndex >= 0) {
          handleModeSelect(availableModes[focusedIndex]);
        }
        break;
      
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        triggerRef.current?.focus();
        break;
      
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else {
          setFocusedIndex(prev => 
            prev < availableModes.length - 1 ? prev + 1 : 0
          );
        }
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(availableModes.length - 1);
        } else {
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : availableModes.length - 1
          );
        }
        break;
      
      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
          setFocusedIndex(-1);
        }
        break;
    }
  };

  const handleModeSelect = (mode: DashboardMode) => {
    if (mode === currentMode || disabled || isTransitioning) return;
    
    setIsOpen(false);
    setFocusedIndex(-1);
    onModeChange(mode);
    
    // Announce mode change for screen readers
    const modeConfig = MODE_CONFIGS[mode];
    announce(`Switched to ${modeConfig.name}. ${modeConfig.description}`);
  };

  const handleTriggerClick = () => {
    if (disabled || isTransitioning) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setFocusedIndex(0);
    }
  };

  // Size classes
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: isMobile ? 'px-3 py-2 text-sm' : 'px-3 py-1.5 text-sm',
    large: isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2 text-base'
  };

  const currentModeConfig = MODE_CONFIGS[currentMode];

  if (variant === 'toggle') {
    // Simple toggle between two modes
    const otherMode = availableModes.find(mode => mode !== currentMode) || availableModes[0];
    const otherModeConfig = MODE_CONFIGS[otherMode];

    return (
      <button
        ref={triggerRef}
        onClick={() => handleModeSelect(otherMode)}
        disabled={disabled || isTransitioning}
        className={`
          inline-flex items-center gap-2 rounded-lg border transition-all duration-200
          ${sizeClasses[size]}
          ${disabled || isTransitioning 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }
          ${currentMode === 'coding' 
            ? 'bg-slate-800 text-white border-slate-600 hover:bg-slate-700' 
            : 'bg-white text-slate-900 border-slate-300 hover:bg-slate-50'
          }
          ${className}
        `}
        aria-label={`Switch to ${otherModeConfig.name}`}
        title={showTooltip ? `Currently in ${currentModeConfig.name}. Click to switch to ${otherModeConfig.name}` : undefined}
        onKeyDown={handleKeyDown}
      >
        {getModeIcon(currentMode)}
        <span className="font-medium">{currentModeConfig.name}</span>
        {isTransitioning && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
      </button>
    );
  }

  // Dropdown variant (default)
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={handleTriggerClick}
        onKeyDown={handleKeyDown}
        disabled={disabled || isTransitioning}
        className={`
          inline-flex items-center gap-2 rounded-lg border transition-all duration-200
          ${sizeClasses[size]}
          ${disabled || isTransitioning 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }
          ${currentMode === 'coding' 
            ? 'bg-slate-800 text-white border-slate-600 hover:bg-slate-700' 
            : 'bg-white text-slate-900 border-slate-300 hover:bg-slate-50'
          }
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Dashboard mode selector. Currently ${currentModeConfig.name}`}
        title={showTooltip ? `Current mode: ${currentModeConfig.name}. ${currentModeConfig.description}` : undefined}
      >
        {getModeIcon(currentMode)}
        <span className="font-medium">{currentModeConfig.name}</span>
        {isTransitioning ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <ChevronDownIcon />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className={`
            absolute top-full left-0 mt-1 min-w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50
            ${prefersReducedMotion ? '' : 'animate-in fade-in-0 zoom-in-95 duration-200'}
          `}
          role="listbox"
          aria-label="Dashboard modes"
        >
          {availableModes.map((mode, index) => {
            const modeConfig = MODE_CONFIGS[mode];
            const isSelected = mode === currentMode;
            const isFocused = index === focusedIndex;

            return (
              <button
                key={mode}
                ref={el => {
                  if (el) optionsRef.current[index] = el;
                }}
                onClick={() => handleModeSelect(mode)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 text-left transition-colors duration-150
                  ${isSelected 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-slate-700 hover:bg-slate-50'
                  }
                  ${isFocused ? 'bg-slate-100' : ''}
                  ${index === 0 ? 'rounded-t-lg' : ''}
                  ${index === availableModes.length - 1 ? 'rounded-b-lg' : ''}
                `}
                role="option"
                aria-selected={isSelected}
                aria-describedby={`mode-${mode}-description`}
                disabled={isSelected || isTransitioning}
              >
                <div className={`flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>
                  {getModeIcon(mode)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{modeConfig.name}</div>
                  <div 
                    id={`mode-${mode}-description`}
                    className="text-xs text-slate-500 truncate"
                  >
                    {modeConfig.description}
                  </div>
                </div>
                {isSelected && (
                  <div className="flex-shrink-0 text-blue-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ModeSwitch;