'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      leftIcon,
      rightIcon,
      fullWidth = false,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn('space-y-1', fullWidth && 'w-full')}>
        {label && (
          <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-600 dark:text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-400',
              error && 'border-red-500 focus:ring-red-400 dark:border-red-500 dark:focus:ring-red-400',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 dark:text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input; 