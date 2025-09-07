import React from 'react';
import { motion } from 'framer-motion';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  animate = false
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-full transition-colors';
  
  const variantClasses = {
    default: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    secondary: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    destructive: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    outline: 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (animate) {
    return (
      <motion.span
        className={classes}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.span>
    );
  }

  return (
    <span className={classes}>
      {children}
    </span>
  );
};