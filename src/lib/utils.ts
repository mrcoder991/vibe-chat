import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

// Function to merge classnames with Tailwind CSS
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Function to format Firebase timestamp as relative time
export function formatTimestamp(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return 'Just now';
  
  try {
    const date = timestamp.toDate();
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Unknown time';
  }
}

// Function to format Firebase timestamp as time
export function formatMessageTime(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return '';
  
  try {
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return '';
  }
}

// Avatar placeholder function
export function getInitials(name: string): string {
  if (!name) return '?';
  
  const parts = name.split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
}

// Generate avatar color based on string
export function getAvatarColor(id: string): string {
  const colors = [
    'bg-blue-500',
    'bg-red-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  hash = Math.abs(hash);
  return colors[hash % colors.length];
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength) + '...';
} 