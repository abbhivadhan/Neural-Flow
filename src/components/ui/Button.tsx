import React, { forwardRef, useRef } from 'react';
import { useResponsiveDesign } from '../../hooks/useResponsiveDesign';
import { useAccessibility } from '../../hooks/useAccessibility';
import { HoverEffect } from '../effects/HoverEffects';
import { useHapticFeedback } from '../../utils/hapticFeedback';
import { microInteractions } from '../../utils/animations';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'destructive' | 'ghost' | 'primary' | 'secondary' | 'neural' | 'cta' | 'quickstart';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
  'aria-label'?: string;
  'aria-describedby'?: string;
  hoverEffect?: 'glow' | 'lift' | 'tilt' | 'neural' | 'pulse' | 'magnetic' | 'quickstart' | 'none';
  hapticEnabled?: boolean;
  glowColor?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ 
  variant = 'default', 
  size = 'md', 
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '', 
  children, 
  disabled,
  onClick,
  onMouseEnter,
  onMouseLeave,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  hoverEffect = 'glow',
  hapticEnabled = true,
  glowColor,
  ...props 
}, ref) => {
  const { isMobile, touchDevice, prefersReducedMotion } = useResponsiveDesign();
  const { announce } = useAccessibility();
  const { buttonPress, buttonRelease } = useHapticFeedback();
  const internalRef = useRef<HTMLButtonElement>(null);
  const buttonRef = (ref as React.RefObject<HTMLButtonElement>) || internalRef;

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;

    // Haptic feedback
    if (hapticEnabled && !prefersReducedMotion) {
      buttonPress();
    }

    // Visual feedback
    if (buttonRef.current && !prefersReducedMotion) {
      await microInteractions.pulse(buttonRef.current, 1.05, 150);
    }
    
    // Announce action for screen readers
    if (ariaLabel) {
      announce(`${ariaLabel} activated`);
    }
    
    onClick?.(event);
  };

  const handleMouseEnter = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;
    onMouseEnter?.(event);
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;

    // Haptic feedback on release
    if (hapticEnabled && !prefersReducedMotion) {
      buttonRelease();
    }

    onMouseLeave?.(event);
  };

  const baseClasses = [
    'inline-flex items-center justify-center rounded-lg font-medium group',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900',
    'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
    'select-none',
    // Enhanced touch targets for mobile
    touchDevice ? 'min-h-[44px] min-w-[44px]' : '',
    // Respect motion preferences
    prefersReducedMotion ? '' : 'transition-all duration-200 transform hover:scale-105 active:scale-95',
    // Full width option
    fullWidth ? 'w-full' : '',
  ].filter(Boolean).join(' ');
  
  const variantClasses = {
    default: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-lg hover:shadow-xl',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500 shadow-lg hover:shadow-xl',
    outline: 'border-2 border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50 focus:ring-slate-500 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-lg hover:shadow-xl',
    ghost: 'text-slate-700 hover:bg-slate-100 focus:ring-slate-500 dark:text-slate-300 dark:hover:bg-slate-800',
    neural: 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 focus:ring-purple-500 shadow-lg hover:shadow-xl relative overflow-hidden',
    cta: 'bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-600 text-white hover:from-primary-600 hover:via-secondary-600 hover:to-primary-700 focus:ring-primary-500 shadow-xl hover:shadow-2xl relative overflow-hidden font-semibold text-shadow-md',
    quickstart: 'bg-gradient-to-r from-primary-600 via-purple-600 to-secondary-600 text-white hover:from-primary-700 hover:via-purple-700 hover:to-secondary-700 focus:ring-purple-500 shadow-xl hover:shadow-2xl relative overflow-hidden font-bold border-2 border-white/20 hover:border-white/30 text-shadow-lg uppercase tracking-wider'
  };
  
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2 text-sm',
    lg: isMobile ? 'px-6 py-4 text-lg' : 'px-6 py-3 text-base',
    xl: isMobile ? 'px-8 py-5 text-xl' : 'px-8 py-4 text-lg'
  };

  const LoadingSpinner = () => (
    <svg 
      className="animate-spin -ml-1 mr-2 h-4 w-4" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
  
  const getGlowColor = () => {
    if (glowColor) return glowColor;
    
    switch (variant) {
      case 'primary': return '#3b82f6';
      case 'secondary': return '#6b7280';
      case 'destructive': return '#ef4444';
      case 'neural': return '#8b5cf6';
      case 'cta': return '#d946ef';
      case 'quickstart': return '#8b5cf6';
      default: return '#3b82f6';
    }
  };

  const buttonContent = (
    <button 
      ref={buttonRef}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {!loading && icon && iconPosition === 'left' && (
        <span className="mr-2" aria-hidden="true">{icon}</span>
      )}
      <span className={`
        ${loading ? 'opacity-0' : ''}
        ${variant === 'quickstart' ? 'text-shadow-lg drop-shadow-sm animate-text-glow' : ''}
        ${variant === 'cta' ? 'text-shadow-md' : ''}
        relative z-10 font-medium tracking-wide
      `}>
        {children}
        {/* Text highlight effect for premium variants */}
        {(variant === 'quickstart' || variant === 'cta') && !disabled && !loading && !prefersReducedMotion && (
          <span className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/40 to-white/20 -translate-x-full animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}
      </span>
      {!loading && icon && iconPosition === 'right' && (
        <span className="ml-2" aria-hidden="true">{icon}</span>
      )}
      
      {/* Neural variant background animation */}
      {variant === 'neural' && !disabled && !loading && !prefersReducedMotion && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
      )}
      
      {/* CTA variant enhanced effects */}
      {variant === 'cta' && !disabled && !loading && !prefersReducedMotion && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full animate-shimmer" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-400/20 to-secondary-400/20 animate-pulse-glow" />
        </>
      )}
      
      {/* QuickStart variant premium effects */}
      {variant === 'quickstart' && !disabled && !loading && !prefersReducedMotion && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-300/30 via-purple-300/30 to-secondary-300/30 animate-glow-pulse" />
          <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 via-purple-500 to-secondary-500 rounded-lg blur opacity-30 animate-pulse" />
        </>
      )}
    </button>
  );

  // Wrap with hover effect if not disabled and effect is enabled
  if (!disabled && !loading && hoverEffect !== 'none' && !prefersReducedMotion) {
    return (
      <HoverEffect
        effect={hoverEffect}
        color={getGlowColor()}
        intensity="medium"
      >
        {buttonContent}
      </HoverEffect>
    );
  }

  return buttonContent;
});

Button.displayName = 'Button';