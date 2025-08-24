import React, { forwardRef, useState, useId } from 'react';
import { useResponsiveDesign } from '../../hooks/useResponsiveDesign';
import { useAccessibility } from '../../hooks/useAccessibility';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outline';
  inputSize?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  showCharacterCount?: boolean;
  maxLength?: number;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  inputSize = 'md',
  fullWidth = false,
  showCharacterCount = false,
  maxLength,
  className = '',
  disabled,
  required,
  id,
  'aria-describedby': ariaDescribedBy,
  onChange,
  onFocus,
  onBlur,
  value,
  ...props
}, ref) => {
  const { isMobile, touchDevice } = useResponsiveDesign();
  const { announce, generateId } = useAccessibility();
  const [focused, setFocused] = useState(false);
  const [characterCount, setCharacterCount] = useState(
    typeof value === 'string' ? value.length : 0
  );

  const inputId = id || generateId('input');
  const errorId = error ? `${inputId}-error` : undefined;
  const helperTextId = helperText ? `${inputId}-helper` : undefined;
  const characterCountId = showCharacterCount ? `${inputId}-count` : undefined;

  const describedByIds = [
    ariaDescribedBy,
    errorId,
    helperTextId,
    characterCountId,
  ].filter(Boolean).join(' ');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setCharacterCount(newValue.length);
    
    // Announce character count for screen readers when approaching limit
    if (maxLength && newValue.length > maxLength * 0.9) {
      const remaining = maxLength - newValue.length;
      announce(`${remaining} characters remaining`, 'polite');
    }
    
    onChange?.(event);
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    onBlur?.(event);
  };

  const baseInputClasses = [
    'w-full rounded-lg border transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-800',
    'placeholder:text-slate-400 dark:placeholder:text-slate-500',
    // Enhanced touch targets for mobile
    touchDevice ? 'min-h-[44px]' : '',
  ].filter(Boolean).join(' ');

  const variantClasses = {
    default: [
      'border-slate-300 dark:border-slate-600',
      'bg-white dark:bg-slate-900',
      'text-slate-900 dark:text-slate-100',
      error 
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
        : 'focus:border-primary-500 focus:ring-primary-500',
    ].join(' '),
    filled: [
      'border-transparent',
      'bg-slate-100 dark:bg-slate-800',
      'text-slate-900 dark:text-slate-100',
      error 
        ? 'bg-red-50 dark:bg-red-900/20 focus:ring-red-500' 
        : 'focus:bg-white dark:focus:bg-slate-900 focus:ring-primary-500',
    ].join(' '),
    outline: [
      'border-2',
      'border-slate-300 dark:border-slate-600',
      'bg-transparent',
      'text-slate-900 dark:text-slate-100',
      error 
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
        : 'focus:border-primary-500 focus:ring-primary-500',
    ].join(' '),
  };

  const sizeClasses = {
    sm: leftIcon || rightIcon ? 'py-2 pl-10 pr-4 text-sm' : 'px-3 py-2 text-sm',
    md: leftIcon || rightIcon 
      ? (isMobile ? 'py-3 pl-12 pr-4 text-base' : 'py-2.5 pl-10 pr-4 text-sm')
      : (isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2.5 text-sm'),
    lg: leftIcon || rightIcon 
      ? (isMobile ? 'py-4 pl-14 pr-4 text-lg' : 'py-3 pl-12 pr-4 text-base')
      : (isMobile ? 'px-6 py-4 text-lg' : 'px-4 py-3 text-base'),
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconPositionClasses = {
    sm: { left: 'left-3', right: 'right-3' },
    md: { left: 'left-3', right: 'right-3' },
    lg: { left: 'left-4', right: 'right-4' },
  };

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label 
          htmlFor={inputId}
          className={[
            'block text-sm font-medium mb-2',
            'text-slate-700 dark:text-slate-300',
            required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : '',
          ].filter(Boolean).join(' ')}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div 
            className={`absolute ${iconPositionClasses[inputSize].left} top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500`}
            aria-hidden="true"
          >
            <span className={iconSizeClasses[inputSize]}>
              {leftIcon}
            </span>
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={`${baseInputClasses} ${variantClasses[variant]} ${sizeClasses[inputSize]}`}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedByIds || undefined}
          value={value}
          maxLength={maxLength}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        
        {rightIcon && (
          <div 
            className={`absolute ${iconPositionClasses[inputSize].right} top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500`}
            aria-hidden="true"
          >
            <span className={iconSizeClasses[inputSize]}>
              {rightIcon}
            </span>
          </div>
        )}
      </div>

      <div className="mt-1 flex justify-between items-start">
        <div className="flex-1">
          {error && (
            <p 
              id={errorId}
              className="text-sm text-red-600 dark:text-red-400"
              role="alert"
              aria-live="polite"
            >
              {error}
            </p>
          )}
          
          {helperText && !error && (
            <p 
              id={helperTextId}
              className="text-sm text-slate-500 dark:text-slate-400"
            >
              {helperText}
            </p>
          )}
        </div>
        
        {showCharacterCount && maxLength && (
          <p 
            id={characterCountId}
            className={[
              'text-sm ml-2 flex-shrink-0',
              characterCount > maxLength * 0.9 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-slate-500 dark:text-slate-400',
            ].join(' ')}
            aria-live="polite"
          >
            {characterCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
});

Input.displayName = 'Input';