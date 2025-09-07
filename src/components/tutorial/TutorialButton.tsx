import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useTutorialContext } from './TutorialProvider';

interface TutorialButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export const TutorialButton: React.FC<TutorialButtonProps> = ({
  variant = 'outline',
  size = 'sm',
  className = '',
  children,
}) => {
  const { openLauncher } = useTutorialContext();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={openLauncher}
      className={`flex items-center space-x-2 ${className}`}
      data-tutorial="tutorial-launcher"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      <span>{children || 'Tutorials'}</span>
    </Button>
  );
};

interface QuickStartButtonProps {
  className?: string;
}

export const QuickStartButton: React.FC<QuickStartButtonProps> = ({
  className = '',
}) => {
  const { startTutorial } = useTutorialContext();
  const navigate = useNavigate();

  const handleQuickStart = () => {
    // Navigate to workspace with tutorial parameter, then start tutorial
    navigate('/workspace?tutorial=true');
    // Start tutorial after navigation
    setTimeout(() => {
      startTutorial('neural-flow-onboarding');
    }, 500);
  };

  return (
    <button
      onClick={handleQuickStart}
      className={`
        group relative overflow-hidden
        px-8 py-4 rounded-2xl
        bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500
        hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600
        text-white font-semibold text-lg
        shadow-lg hover:shadow-xl
        transform hover:scale-105 active:scale-95
        transition-all duration-300 ease-out
        border border-white/20
        ${className}
      `}
      aria-label="Start the Neural Flow tutorial and onboarding experience"
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-teal-400/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
      
      {/* Content */}
      <div className="relative flex items-center space-x-3">
        {/* Rocket icon with animation */}
        <div className="relative">
          <svg 
            className="w-6 h-6 transform group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 01-1.161.886l-.143.048a1.107 1.107 0 00-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 01-1.652.928l-.679-.906a1.125 1.125 0 00-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 00-8.862 12.872M12.75 3.031a9 9 0 016.69 14.036m0 0l-.177-.529A2.25 2.25 0 0017.128 15H16.5l-.324-.324a1.453 1.453 0 00-2.328.377l-.036.073a1.586 1.586 0 01-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438c.08.474.49.821.97.821.846 0 1.598.542 1.865 1.345l.215.643m5.276-3.67a9.012 9.012 0 01-5.276 3.67m0 0a9 9 0 01-10.275-4.835M15.75 9c0 .896-.393 1.7-1.016 2.25" 
            />
          </svg>
          {/* Sparkle effects */}
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping" />
          <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-pink-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse delay-150" />
        </div>
        
        {/* Text with subtle animation */}
        <span className="relative">
          Quick Start
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 delay-100" />
        </span>
        
        {/* Arrow with bounce animation */}
        <svg 
          className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2.5} 
            d="M13 7l5 5m0 0l-5 5m5-5H6" 
          />
        </svg>
      </div>
      
      {/* Pulse ring effect */}
      <div className="absolute inset-0 rounded-2xl border-2 border-white/30 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
    </button>
  );
};