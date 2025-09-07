import React from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../../providers/SettingsProvider';

interface SettingsIndicatorProps {
  className?: string;
}

export const SettingsIndicator: React.FC<SettingsIndicatorProps> = ({ className = '' }) => {
  const { hasUnsavedChanges } = useSettings();

  if (!hasUnsavedChanges) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      className={`w-2 h-2 bg-orange-500 rounded-full ${className}`}
      title="Unsaved changes"
    />
  );
};

export default SettingsIndicator;