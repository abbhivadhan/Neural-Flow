import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { QuickSettingsPanel } from './QuickSettingsPanel';
import { SettingsIndicator } from './SettingsIndicator';

interface SettingsButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  showQuickPanel?: boolean;
}

export const SettingsButton: React.FC<SettingsButtonProps> = ({
  className = '',
  size = 'md',
  variant = 'icon',
  showQuickPanel = true
}) => {
  const [showPanel, setShowPanel] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleClick = () => {
    if (showQuickPanel) {
      setShowPanel(true);
    } else {
      window.location.href = '/settings';
    }
  };

  if (variant === 'button') {
    return (
      <>
        <motion.button
          onClick={handleClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-lg
            bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700
            text-slate-700 dark:text-slate-300 transition-colors
            ${className}
          `}
        >
          <div className="relative">
            <Settings className={iconSizes[size]} />
            <SettingsIndicator className="absolute -top-1 -right-1" />
          </div>
          <span className="text-sm font-medium">Settings</span>
        </motion.button>

        {showQuickPanel && (
          <QuickSettingsPanel
            isOpen={showPanel}
            onClose={() => setShowPanel(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          relative flex items-center justify-center rounded-lg
          bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700
          text-slate-700 dark:text-slate-300 transition-colors
          ${sizeClasses[size]} ${className}
        `}
        title="Settings"
      >
        <Settings className={iconSizes[size]} />
        <SettingsIndicator className="absolute -top-1 -right-1" />
      </motion.button>

      {showQuickPanel && (
        <QuickSettingsPanel
          isOpen={showPanel}
          onClose={() => setShowPanel(false)}
        />
      )}
    </>
  );
};

export default SettingsButton;