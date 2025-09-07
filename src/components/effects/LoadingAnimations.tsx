import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'neural' | 'pulse' | 'dots' | 'wave' | 'brain';
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'neural',
  color = '#3b82f6',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const sizeValue = {
    sm: 16,
    md: 32,
    lg: 48,
    xl: 64
  };

  const currentSize = sizeValue[size];

  if (variant === 'neural') {
    return (
      <div className={`${sizeClasses[size]} ${className}`}>
        <svg
          viewBox="0 0 50 50"
          className="animate-spin"
          style={{ animationDuration: '2s' }}
        >
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="31.416"
            strokeDashoffset="31.416"
            className="animate-pulse"
          >
            <animate
              attributeName="stroke-dasharray"
              dur="2s"
              values="0 31.416;15.708 15.708;0 31.416"
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-dashoffset"
              dur="2s"
              values="0;-15.708;-31.416"
              repeatCount="indefinite"
            />
          </circle>
          
          {/* Neural nodes */}
          <circle cx="25" cy="5" r="2" fill={color} opacity="0.8">
            <animate attributeName="opacity" dur="1s" values="0.8;0.2;0.8" repeatCount="indefinite" />
          </circle>
          <circle cx="45" cy="25" r="2" fill={color} opacity="0.6">
            <animate attributeName="opacity" dur="1s" values="0.6;0.2;0.6" repeatCount="indefinite" begin="0.25s" />
          </circle>
          <circle cx="25" cy="45" r="2" fill={color} opacity="0.4">
            <animate attributeName="opacity" dur="1s" values="0.4;0.2;0.4" repeatCount="indefinite" begin="0.5s" />
          </circle>
          <circle cx="5" cy="25" r="2" fill={color} opacity="0.2">
            <animate attributeName="opacity" dur="1s" values="0.2;0.8;0.2" repeatCount="indefinite" begin="0.75s" />
          </circle>
        </svg>
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={`${sizeClasses[size]} ${className} relative`}>
        <div 
          className="absolute inset-0 rounded-full animate-ping"
          style={{ backgroundColor: `${color}40` }}
        />
        <div 
          className="absolute inset-2 rounded-full animate-pulse"
          style={{ backgroundColor: color }}
        />
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={`flex space-x-1 ${className}`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-5 h-5'} rounded-full animate-bounce`}
            style={{ 
              backgroundColor: color,
              animationDelay: `${i * 0.1}s`,
              animationDuration: '0.6s'
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'wave') {
    return (
      <div className={`flex items-end space-x-1 ${className}`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`${size === 'sm' ? 'w-1' : size === 'md' ? 'w-2' : size === 'lg' ? 'w-3' : 'w-4'} bg-current animate-pulse`}
            style={{ 
              height: `${currentSize * (0.3 + Math.sin(i * 0.5) * 0.3)}px`,
              backgroundColor: color,
              animationDelay: `${i * 0.1}s`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'brain') {
    return (
      <div className={`${sizeClasses[size]} ${className}`}>
        <svg viewBox="0 0 100 100" className="animate-pulse">
          <path
            d="M50 10 C30 10, 10 30, 10 50 C10 70, 30 90, 50 90 C70 90, 90 70, 90 50 C90 30, 70 10, 50 10 Z"
            fill="none"
            stroke={color}
            strokeWidth="2"
            className="animate-pulse"
          />
          
          {/* Brain-like internal structure */}
          <path
            d="M25 30 Q40 25, 50 35 Q60 25, 75 30"
            fill="none"
            stroke={color}
            strokeWidth="1"
            opacity="0.6"
          />
          <path
            d="M25 50 Q40 45, 50 55 Q60 45, 75 50"
            fill="none"
            stroke={color}
            strokeWidth="1"
            opacity="0.6"
          />
          <path
            d="M25 70 Q40 65, 50 75 Q60 65, 75 70"
            fill="none"
            stroke={color}
            strokeWidth="1"
            opacity="0.6"
          />
          
          {/* Animated synapses */}
          <circle cx="30" cy="35" r="2" fill={color} opacity="0.8">
            <animate attributeName="opacity" dur="1.5s" values="0.8;0.2;0.8" repeatCount="indefinite" />
          </circle>
          <circle cx="50" cy="40" r="2" fill={color} opacity="0.6">
            <animate attributeName="opacity" dur="1.5s" values="0.6;0.2;0.6" repeatCount="indefinite" begin="0.3s" />
          </circle>
          <circle cx="70" cy="35" r="2" fill={color} opacity="0.4">
            <animate attributeName="opacity" dur="1.5s" values="0.4;0.2;0.4" repeatCount="indefinite" begin="0.6s" />
          </circle>
        </svg>
      </div>
    );
  }

  // Default neural variant
  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div 
        className="animate-spin rounded-full border-2 border-transparent"
        style={{ 
          borderTopColor: color,
          borderRightColor: `${color}60`
        }}
      />
    </div>
  );
};

interface SkeletonLoaderProps {
  variant?: 'text' | 'card' | 'avatar' | 'neural';
  className?: string;
  animated?: boolean;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  className = '',
  animated = true
}) => {
  const baseClasses = `bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 ${
    animated ? 'animate-pulse' : ''
  }`;

  if (variant === 'text') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className={`h-4 ${baseClasses} rounded w-3/4`} />
        <div className={`h-4 ${baseClasses} rounded w-1/2`} />
        <div className={`h-4 ${baseClasses} rounded w-5/6`} />
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`${className}`}>
        <div className={`h-48 ${baseClasses} rounded-t-lg mb-4`} />
        <div className="space-y-2 p-4">
          <div className={`h-6 ${baseClasses} rounded w-3/4`} />
          <div className={`h-4 ${baseClasses} rounded w-full`} />
          <div className={`h-4 ${baseClasses} rounded w-2/3`} />
        </div>
      </div>
    );
  }

  if (variant === 'avatar') {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        <div className={`w-12 h-12 ${baseClasses} rounded-full`} />
        <div className="space-y-2 flex-1">
          <div className={`h-4 ${baseClasses} rounded w-1/4`} />
          <div className={`h-3 ${baseClasses} rounded w-1/3`} />
        </div>
      </div>
    );
  }

  if (variant === 'neural') {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center space-x-4 mb-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-8 h-8 ${baseClasses} rounded-full`}
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
        <div className="space-y-2">
          <div className={`h-2 ${baseClasses} rounded w-full`} />
          <div className={`h-2 ${baseClasses} rounded w-3/4`} />
          <div className={`h-2 ${baseClasses} rounded w-1/2`} />
        </div>
      </div>
    );
  }

  return <div className={`h-4 ${baseClasses} rounded ${className}`} />;
};

export default { LoadingSpinner, SkeletonLoader };