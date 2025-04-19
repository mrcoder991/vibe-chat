'use client';

import { useState, useEffect } from 'react';
import { BellIcon, BellOffIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Tooltip } from 'react-tooltip';

export default function NotificationToggle() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      return;
    }

    // Get the current permission state
    setPermissionState(Notification.permission);
    setNotificationsEnabled(Notification.permission === 'granted');
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications are not supported in your browser');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      setNotificationsEnabled(permission === 'granted');
      
      if (permission === 'granted') {
        toast.success('Notifications enabled!');
      } else if (permission === 'denied') {
        toast.error('Notification permission denied');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Error enabling notifications');
    }
  };

  const handleToggle = () => {
    if (permissionState === 'granted') {
      // If already granted, just toggle the state
      setNotificationsEnabled(!notificationsEnabled);
      toast.success(notificationsEnabled ? 'Notifications disabled' : 'Notifications enabled');
    } else {
      // Need to request permission
      requestPermission();
    }
  };

  // If notifications aren't supported, don't render the component
  if (!('Notification' in window)) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleToggle}
        className="relative flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-2 px-3 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        data-tooltip-id="notification-tooltip"
        data-tooltip-content={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
      >
        {notificationsEnabled ? (
          <BellIcon className="h-5 w-5" />
        ) : (
          <BellOffIcon className="h-5 w-5" />
        )}
      </button>
      <Tooltip id="notification-tooltip" place="top" className="z-50 bg-gray-800 dark:bg-gray-700 text-white" />
    </>
  );
} 