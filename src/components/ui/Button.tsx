import React, { forwardRef } from 'react';
import { useResponsiveDesign } from '../../hooks/useResponsiveDesign';
import { useAccessibility } from '../../hooks/useAccessibility';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'destructive' | 'ghost' | 'primary' | 'secondary';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
  'aria-label'?: string;
  'aria-describedby'?: string;
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
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props 
}, ref) => {
  const { isMobile, touchDevice, prefersReducedMotion } = useResponsiveDesign();
  const { announce } = useAccessibility();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;
    
    // Announce action for screen readers
    if (ariaLabel) {
      announce(`${ariaLabel} activated`);
    }
    
    onClick?.(event);
  };

  const baseClasses = [
    'inline-flex items-center justify-center rounded-lg font-medium',
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
    ghost: 'text-slate-700 hover:bg-slate-100 focus:ring-slate-500 dark:text-slate-300 dark:hover:bg-slate-800'
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
  
  return (
    <button 
      ref={ref}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {!loading && icon && iconPosition === 'left' && (
        <span className="mr-2" aria-hidden="true">{icon}</span>
      )}
      <span className={loading ? 'opacity-0' : ''}>{children}</span>
      {!loading && icon && iconPosition === 'right' && (
        <span className="ml-2" aria-hidden="true">{icon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';