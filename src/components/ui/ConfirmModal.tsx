'use client';

import React, { useEffect } from "react";
import { XIcon, AlertTriangleIcon } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDestructive = false,
}: ConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent scrolling of the background when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Re-enable scrolling when modal is closed
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onCancel]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            {isDestructive && (
              <AlertTriangleIcon className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
            )}
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
        </div>
        
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isDestructive
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-500 dark:focus:ring-offset-gray-800"
                : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
} 