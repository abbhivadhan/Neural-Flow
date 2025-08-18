import React, { useState } from 'react';

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

interface SelectValueProps {
  placeholder?: string;
}

export function Select({ value, onValueChange, children }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || '');

  const handleSelect = (newValue: string) => {
    setSelectedValue(newValue);
    onValueChange?.(newValue);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          if (child.type === SelectTrigger) {
            return React.cloneElement(child, {
              onClick: () => setIsOpen(!isOpen),
              'aria-expanded': isOpen
            } as any);
          }
          if (child.type === SelectContent && isOpen) {
            return React.cloneElement(child, {
              onSelect: handleSelect,
              selectedValue
            } as any);
          }
        }
        return child;
      })}
    </div>
  );
}

export function SelectTrigger({ children, className = '', ...props }: SelectTriggerProps & any) {
  return (
    <button
      className={`flex items-center justify-between w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      {...props}
    >
      {children}
      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

export function SelectContent({ children, onSelect, selectedValue }: SelectContentProps & any) {
  return (
    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
      {React.Children.map(children, child => {
        if (React.isValidElement(child) && child.type === SelectItem) {
          return React.cloneElement(child, {
            onSelect,
            isSelected: child.props.value === selectedValue
          } as any);
        }
        return child;
      })}
    </div>
  );
}

export function SelectItem({ value, children, onSelect, isSelected }: SelectItemProps & any) {
  return (
    <button
      className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-100 ${isSelected ? 'bg-blue-50 text-blue-600' : ''}`}
      onClick={() => onSelect?.(value)}
    >
      {children}
    </button>
  );
}

export function SelectValue({ placeholder }: SelectValueProps) {
  return <span className="text-gray-500">{placeholder}</span>;
}