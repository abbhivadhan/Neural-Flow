import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '../ui/Logo';
import { SettingsButton } from '../settings/SettingsButton';
import { ModeSwitch } from '../ui/ModeSwitch';
import { useDashboardMode } from '../../providers/DashboardModeProvider';

interface TopBarProps {
  showLogo?: boolean;
  currentContext?: 'coding' | 'writing' | 'research' | 'design' | 'meeting';
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  showLogo = false,
  currentContext = 'coding',
  className = ''
}) => {
  const { currentMode, changeMode } = useDashboardMode();

  return (
    <motion.div
      className={`
        h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700
        flex items-center justify-between px-6 relative z-50 ${className}
      `}
    >
      {/* Left side - Logo when sidebar is collapsed */}
      <div className="flex items-center space-x-4">
        <AnimatePresence mode="wait">
          {showLogo && (
            <motion.div
              initial={{ opacity: 0, x: -20, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.8 }}
              transition={{ 
                duration: 0.4, 
                ease: [0.4, 0.0, 0.2, 1],
                delay: 0.1
              }}
              className="flex items-center space-x-3"
            >
              <Logo size="md" variant="icon" />
              <div>
                <h1 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                  Neural Flow
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  {currentContext} Mode
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Center - Mode Switcher */}
      <div className="flex-1 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <ModeSwitch
            currentMode={currentMode}
            onModeChange={changeMode}
            variant="toggle"
            size="medium"
            className="shadow-sm"
          />
        </motion.div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center space-x-3">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <SettingsButton size="sm" showQuickPanel={true} />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default TopBar;