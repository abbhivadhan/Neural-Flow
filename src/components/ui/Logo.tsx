import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon' | 'text' | 'full';
  className?: string;
}

export function Logo({ size = 'md', variant = 'full', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-20 h-20 md:w-24 md:h-24',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl md:text-6xl lg:text-7xl',
  };

  // Neural network inspired SVG icon
  const IconComponent = () => (
    <svg
      className={`${sizeClasses[size]} ${className}`}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Neural network nodes */}
      <circle cx="20" cy="30" r="4" fill="url(#neuralGradient)" filter="url(#glow)" />
      <circle cx="20" cy="50" r="4" fill="url(#neuralGradient)" filter="url(#glow)" />
      <circle cx="20" cy="70" r="4" fill="url(#neuralGradient)" filter="url(#glow)" />
      
      <circle cx="50" cy="20" r="5" fill="url(#neuralGradient)" filter="url(#glow)" />
      <circle cx="50" cy="40" r="5" fill="url(#neuralGradient)" filter="url(#glow)" />
      <circle cx="50" cy="60" r="5" fill="url(#neuralGradient)" filter="url(#glow)" />
      <circle cx="50" cy="80" r="5" fill="url(#neuralGradient)" filter="url(#glow)" />
      
      <circle cx="80" cy="35" r="4" fill="url(#neuralGradient)" filter="url(#glow)" />
      <circle cx="80" cy="55" r="4" fill="url(#neuralGradient)" filter="url(#glow)" />
      
      {/* Neural network connections */}
      <line x1="24" y1="30" x2="46" y2="20" stroke="url(#neuralGradient)" strokeWidth="1.5" opacity="0.6" />
      <line x1="24" y1="30" x2="46" y2="40" stroke="url(#neuralGradient)" strokeWidth="1.5" opacity="0.6" />
      <line x1="24" y1="50" x2="46" y2="40" stroke="url(#neuralGradient)" strokeWidth="1.5" opacity="0.8" />
      <line x1="24" y1="50" x2="46" y2="60" stroke="url(#neuralGradient)" strokeWidth="1.5" opacity="0.8" />
      <line x1="24" y1="70" x2="46" y2="60" stroke="url(#neuralGradient)" strokeWidth="1.5" opacity="0.6" />
      <line x1="24" y1="70" x2="46" y2="80" stroke="url(#neuralGradient)" strokeWidth="1.5" opacity="0.6" />
      
      <line x1="54" y1="20" x2="76" y2="35" stroke="url(#neuralGradient)" strokeWidth="1.5" opacity="0.7" />
      <line x1="54" y1="40" x2="76" y2="35" stroke="url(#neuralGradient)" strokeWidth="1.5" opacity="0.9" />
      <line x1="54" y1="40" x2="76" y2="55" stroke="url(#neuralGradient)" strokeWidth="1.5" opacity="0.9" />
      <line x1="54" y1="60" x2="76" y2="55" stroke="url(#neuralGradient)" strokeWidth="1.5" opacity="0.9" />
      <line x1="54" y1="80" x2="76" y2="55" stroke="url(#neuralGradient)" strokeWidth="1.5" opacity="0.7" />
    </svg>
  );

  if (variant === 'icon') {
    return <IconComponent />;
  }

  if (variant === 'text') {
    return (
      <span className={`${textSizeClasses[size]} font-bold text-gradient ${className}`}>
        Neural Flow
      </span>
    );
  }

  // Full logo with icon and text
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <IconComponent />
      <span className={`${textSizeClasses[size]} font-bold text-gradient`}>
        Neural Flow
      </span>
    </div>
  );
}

// Animated version for hero sections
export function AnimatedLogo({ size = 'xl', className = '' }: Omit<LogoProps, 'variant'>) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        <Logo size={size} variant="icon" className="animate-pulse" />
        <div className="absolute inset-0 animate-ping">
          <Logo size={size} variant="icon" className="opacity-20" />
        </div>
      </div>
      <Logo size={size} variant="text" className="mt-4" />
    </div>
  );
}