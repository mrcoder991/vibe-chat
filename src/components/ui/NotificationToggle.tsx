'use client';

import { useNotifications } from '@/components/providers/NotificationProvider';
import { BellIcon, BellOffIcon } from 'lucide-react';
import { useState } from 'react';
import { Tooltip } from 'react-tooltip';

export default function NotificationToggle() {
  const { permissionStatus, isEnabled, enableNotifications, disableNotifications } = useNotifications();
  const [tooltipId] = useState(`notification-tooltip-${Math.random().toString(36).substr(2, 9)}`);
  
  // Don't render if notifications aren't supported
  if (permissionStatus === 'unsupported') {
    return null;
  }
  
  let tooltipContent = 'Enable notifications';
  let icon = <BellOffIcon className="h-5 w-5" />;
  
  if (permissionStatus === 'denied') {
    tooltipContent = 'Notifications blocked by browser. Check your browser settings to enable.';
    icon = <BellOffIcon className="h-5 w-5" />;
  } else if (isEnabled) {
    tooltipContent = 'Disable notifications';
    icon = <BellIcon className="h-5 w-5" />;
  }
  
  const handleToggle = async () => {
    if (permissionStatus === 'denied') {
      // Can't do anything if denied by browser
      return;
    }
    
    if (isEnabled) {
      disableNotifications();
    } else {
      await enableNotifications();
    }
  };
  
  return (
    <>
      <button
        data-tooltip-id={tooltipId}
        onClick={handleToggle}
        className={`p-2 rounded-full transition-colors ${
          isEnabled ? 'text-blue-500 hover:bg-blue-100' : 'text-gray-500 hover:bg-gray-100'
        } ${permissionStatus === 'denied' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        disabled={permissionStatus === 'denied'}
      >
        {icon}
      </button>
      <Tooltip id={tooltipId} place="bottom">
        {tooltipContent}
      </Tooltip>
    </>
  );
} 