'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type Size = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string | null;
  name: string;
  userId: string;
  status?: 'online' | 'offline' | 'away' | null;
  size?: Size;
  className?: string;
}

export default function Avatar({ src, name, userId, status, size = 'md', className }: AvatarProps) {
  // Calculate size based on prop
  const dimensions = useMemo(() => {
    switch (size) {
      case 'sm': return { size: 32, fontSize: 'text-xs' };
      case 'md': return { size: 40, fontSize: 'text-sm' };
      case 'lg': return { size: 48, fontSize: 'text-base' };
      case 'xl': return { size: 64, fontSize: 'text-lg' };
      default: return { size: 40, fontSize: 'text-sm' };
    }
  }, [size]);
  
  // Generate background color based on user ID for consistency
  const generateColor = (id: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    
    // Use a simple hash function on the user ID
    const hash = id.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };
  
  // Get initials from the name
  const getInitials = (name: string) => {
    if (!name) return '?';
    
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };
  
  const statusClasses = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500'
  };
  
  return (
    <div 
      className={cn(
        'relative inline-block',
        className
      )}
      style={{ 
        width: dimensions.size, 
        height: dimensions.size 
      }}
    >
      {src ? (
        <Image
          src={src}
          alt={name || 'User avatar'}
          width={dimensions.size}
          height={dimensions.size}
          className="rounded-full object-cover border border-gray-200 dark:border-gray-700"
          onError={(e) => {
            // Fallback to initials avatar on error
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            // Force re-render of parent component
            const parent = target.parentElement;
            if (parent) {
              parent.classList.add('initials-fallback', generateColor(userId));
              parent.setAttribute('data-initials', getInitials(name));
            }
          }}
        />
      ) : (
        <div 
          className={`${generateColor(userId)} rounded-full flex items-center justify-center text-white border border-transparent ${dimensions.fontSize} font-medium`}
          style={{ 
            width: dimensions.size,
            height: dimensions.size
          }}
        >
          {getInitials(name)}
        </div>
      )}
      
      {status && (
        <span 
          className={`absolute bottom-0 right-0 block rounded-full ${statusClasses[status]} ring-2 ring-white dark:ring-gray-900`}
          style={{ 
            width: dimensions.size / 4, 
            height: dimensions.size / 4 
          }}
        />
      )}
      
      {/* Fallback styles for when image fails to load */}
      <style jsx>{`
        .initials-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          border-radius: 100%;
        }
        
        .initials-fallback::before {
          content: attr(data-initials);
          ${dimensions.fontSize === 'text-xs' ? 'font-size: 0.75rem;' : ''}
          ${dimensions.fontSize === 'text-sm' ? 'font-size: 0.875rem;' : ''}
          ${dimensions.fontSize === 'text-base' ? 'font-size: 1rem;' : ''}
          ${dimensions.fontSize === 'text-lg' ? 'font-size: 1.125rem;' : ''}
          font-weight: 500;
        }
      `}</style>
    </div>
  );
} 