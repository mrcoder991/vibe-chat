'use client';

import React, { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";

export interface MenuDropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  isDestructive?: boolean;
  disabled?: boolean;
}

interface MenuDropdownProps {
  items: MenuDropdownItem[];
  position?: 'left' | 'right';
  disabled?: boolean;
}

export default function MenuDropdown({ 
  items,
  position = 'right',
  disabled = false
}: MenuDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  const handleItemClick = (onClick: () => void) => {
    onClick();
    setIsOpen(false);
  };

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleMenu}
        className={`p-2 rounded-full ${
          disabled 
            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        aria-label="Menu options"
        disabled={disabled}
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen && !disabled && (
        <div 
          className={`absolute z-10 mt-1 ${position === 'left' ? 'left-0' : 'right-0'} w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none`}
        >
          <div className="py-1" role="menu" aria-orientation="vertical">
            {items.map((item, index) => (
              <button
                key={index}
                className={`${
                  item.isDestructive 
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' 
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                } ${
                  item.disabled ? 'opacity-50 cursor-not-allowed' : ''
                } group flex items-center w-full px-4 py-2 text-sm`}
                role="menuitem"
                onClick={() => !item.disabled && handleItemClick(item.onClick)}
                disabled={item.disabled}
              >
                {item.icon && <span className="mr-3">{item.icon}</span>}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 