'use client';

import { cn } from '@/lib/utils';
import { getInitials, getAvatarColor } from '@/lib/utils';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  name?: string;
  userId?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  status?: 'online' | 'offline' | null;
}

const Avatar = ({
  src,
  name = '',
  userId = '',
  size = 'md',
  className,
  status,
}: AvatarProps) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  const statusSizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  };

  return (
    <div className="relative inline-block">
      {src ? (
        <div
          className={cn(
            'relative rounded-full overflow-hidden',
            sizeClasses[size],
            className
          )}
        >
          <Image
            src={src}
            alt={name || 'User avatar'}
            fill
            sizes={`(max-width: 768px) ${sizeClasses[size].split(' ')[0]}, ${
              sizeClasses[size].split(' ')[0]
            }`}
            className="object-cover"
          />
        </div>
      ) : (
        <div
          className={cn(
            'flex items-center justify-center rounded-full',
            getAvatarColor(userId || name),
            sizeClasses[size],
            'text-white font-medium',
            className
          )}
        >
          {getInitials(name)}
        </div>
      )}

      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-white',
            statusSizeClasses[size],
            status === 'online' ? 'bg-green-500' : 'bg-gray-400'
          )}
        />
      )}
    </div>
  );
};

export default Avatar; 