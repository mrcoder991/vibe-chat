'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    children,
    variant = 'default',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    disabled,
    ...props
  }, ref) => {
    const variantClasses = {
      default: 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
      primary: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600',
      secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600',
      ghost: 'bg-transparent hover:bg-gray-100 text-gray-800 dark:text-gray-200 dark:hover:bg-gray-800',
      link: 'bg-transparent text-blue-600 hover:underline p-0 dark:text-blue-400',
    };

    const sizeClasses = {
      xs: 'text-xs px-2 py-1',
      sm: 'text-sm px-3 py-1.5',
      md: 'text-md px-4 py-2',
      lg: 'text-lg px-6 py-3',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-blue-500 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2',
          variantClasses[variant],
          sizeClasses[size],
          variant !== 'link' && 'shadow-sm',
          className
        )}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {!isLoading && leftIcon}
        {children}
        {rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button; 