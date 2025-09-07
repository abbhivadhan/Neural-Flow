import React, { useState } from 'react';

interface TabsProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className = '' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(value || '');

  const handleTabChange = (newValue: string) => {
    setActiveTab(newValue);
    onValueChange?.(newValue);
  };

  return (
    <div className={className}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            activeTab,
            onTabChange: handleTabChange
          } as any);
        }
        return child;
      })}
    </div>
  );
}

export function TabsList({ children, className = '', activeTab, onTabChange }: TabsListProps & any) {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 p-1 text-gray-500 dark:text-gray-400 ${className}`}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            activeTab,
            onTabChange
          } as any);
        }
        return child;
      })}
    </div>
  );
}

export function TabsTrigger({ value, children, className = '', activeTab, onTabChange }: TabsTriggerProps & any) {
  const isActive = activeTab === value;
  
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white dark:ring-offset-gray-950 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive 
          ? 'bg-white dark:bg-gray-950 text-gray-950 dark:text-gray-50 shadow-sm' 
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
      } ${className}`}
      onClick={() => onTabChange?.(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className = '', activeTab }: TabsContentProps & any) {
  if (activeTab !== value) return null;
  
  return (
    <div className={`mt-2 ring-offset-white dark:ring-offset-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 ${className}`}>
      {children}
    </div>
  );
}