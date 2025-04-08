'use client';

import { useState, useEffect } from 'react';
import { XIcon } from 'lucide-react';
import Image from 'next/image';

interface ImageModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageModal({ imageUrl, isOpen, onClose }: ImageModalProps) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  
  // Load image dimensions when URL changes
  useEffect(() => {
    if (imageUrl && isOpen) {
      const img = new window.Image();
      img.onload = () => {
        setImageSize({
          width: img.width,
          height: img.height
        });
      };
      img.src = imageUrl;
    }
  }, [imageUrl, isOpen]);
  
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  // Close on backdrop click, but not on image click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-full max-h-full overflow-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-black bg-opacity-60 text-white p-1.5 rounded-full hover:bg-opacity-80 z-10 transition-colors"
          aria-label="Close image"
        >
          <XIcon className="h-6 w-6" />
        </button>
        
        <div className="relative flex items-center justify-center">
          <Image
            src={imageUrl}
            alt="Full size image"
            width={imageSize.width || 800}
            height={imageSize.height || 600}
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-md"
            priority
            style={{
              width: 'auto',
              height: 'auto',
              maxWidth: imageSize.width > 1600 ? '95vw' : 'auto'
            }}
            onError={(e) => {
              console.error('Error loading full size image:', e);
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E';
              target.classList.add('p-12', 'bg-gray-800', 'rounded-lg');
            }}
          />
        </div>
      </div>
    </div>
  );
} 