'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'react-hot-toast';
import { BellOffIcon } from 'lucide-react';
import { 
  notificationsSupported, 
  requestNotificationPermission, 
  getNotificationPermissionStatus,
  showMessageNotification,
  showInviteNotification,
  saveCurrentUserToLocalStorage,
  playNotificationSound
} from '@/lib/notificationUtils';

interface NotificationContextType {
  permissionStatus: string;
  isEnabled: boolean;
  enableNotifications: () => Promise<void>;
  disableNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { chats, pendingInvites, currentChatMessages, selectedChatId } = useAppStore();
  
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  
  // Track previous data to detect changes
  const [prevInvitesCount, setPrevInvitesCount] = useState<number>(0);
  const [prevMessagesMap, setPrevMessagesMap] = useState<Map<string, number>>(new Map());
  
  // Initialize notification permission status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const status = getNotificationPermissionStatus();
      setPermissionStatus(status);
      setIsEnabled(status === 'granted' && localStorage.getItem('notifications-enabled') === 'true');
    }
  }, []);
  
  // Save user to localStorage for notification filtering
  useEffect(() => {
    if (user) {
      saveCurrentUserToLocalStorage(user);
    }
  }, [user]);
  
  // Handle new invites
  useEffect(() => {
    if (!user || !isEnabled || pendingInvites.length <= prevInvitesCount) {
      setPrevInvitesCount(pendingInvites.length);
      return;
    }
    
    // Check for new invites
    const newInvites = pendingInvites.slice(prevInvitesCount);
    
    // Show notifications for new invites
    newInvites.forEach(invite => {
      showInviteNotification(invite, () => {
        // Callback when notification is clicked
        document.dispatchEvent(new CustomEvent('show-invites-dialog'));
      });
      playNotificationSound('invite');
    });
    
    setPrevInvitesCount(pendingInvites.length);
  }, [pendingInvites, user, isEnabled, prevInvitesCount]);
  
  // Handle new messages
  useEffect(() => {
    if (!user || !isEnabled || currentChatMessages.length === 0) {
      return;
    }
    
    // Find the current chat
    const currentChat = chats.find(chat => chat.id === selectedChatId);
    if (!currentChat) return;
    
    // Skip notifications for the active chat when it's visible
    if (selectedChatId && document.visibilityState === 'visible') {
      // Update count for tracking purposes
      const messagesMap = new Map(prevMessagesMap);
      messagesMap.set(selectedChatId, currentChatMessages.length);
      setPrevMessagesMap(messagesMap);
      return;
    }
    
    // Check for new messages
    const prevCount = prevMessagesMap.get(selectedChatId || '') || 0;
    
    if (currentChatMessages.length > prevCount) {
      // Get the newest message
      const latestMessage = currentChatMessages[currentChatMessages.length - 1];
      
      if (latestMessage && latestMessage.senderId !== user.id) {
        // Find sender info
        const senderId = latestMessage.senderId;
        const senderInfo = currentChat.participantInfo[senderId] || { name: 'Unknown User' };
        
        // Show notification
        showMessageNotification(
          latestMessage,
          senderInfo.name,
          currentChat.participantInfo[senderId]?.name || 'Chat',
          () => {
            // Navigate to this chat when notification is clicked
            const { setSelectedChatId } = useAppStore.getState();
            setSelectedChatId(currentChat.id);
            window.focus();
          }
        );
        
        playNotificationSound('message');
      }
    }
    
    // Update the message count map
    const messagesMap = new Map(prevMessagesMap);
    messagesMap.set(selectedChatId || '', currentChatMessages.length);
    setPrevMessagesMap(messagesMap);
  }, [currentChatMessages, user, isEnabled, selectedChatId, chats, prevMessagesMap]);
  
  // Handle new chats with messages (conversations not currently visible)
  useEffect(() => {
    if (!user || !isEnabled) return;
    
    // Check all chats for new messages
    chats.forEach(chat => {
      // Skip the currently selected chat
      if (chat.id === selectedChatId) return;
      
      // Only process chats with last messages
      if (!chat.lastMessage) return;
      
      // Get the chat's last update timestamp
      const lastUpdateTime = chat.lastMessage.timestamp?.toMillis() || 0;
      
      // Check if this is a recent message (within the last 10 seconds)
      const isRecent = Date.now() - lastUpdateTime < 10000; // 10 seconds threshold
      
      if (isRecent && chat.lastMessage.senderId !== user.id) {
        // Find sender info
        const senderId = chat.lastMessage.senderId;
        const senderInfo = chat.participantInfo[senderId] || { name: 'Unknown User' };
        
        // Create a simplified message object for the notification
        const messageObj = {
          id: `temp-${Date.now()}`,
          chatId: chat.id,
          senderId: senderId,
          content: chat.lastMessage.content,
          type: chat.lastMessage.type,
          timestamp: chat.lastMessage.timestamp,
          read: false,
          deleted: false
        };
        
        // Show notification
        showMessageNotification(
          messageObj,
          senderInfo.name,
          chat.participantInfo[senderId]?.name || 'Chat',
          () => {
            // Navigate to this chat when notification is clicked
            const { setSelectedChatId } = useAppStore.getState();
            setSelectedChatId(chat.id);
            window.focus();
          }
        );
        
        playNotificationSound('message');
      }
    });
  }, [chats, user, isEnabled, selectedChatId]);
  
  const enableNotifications = async () => {
    if (!notificationsSupported()) {
      toast.error('Notifications are not supported in your browser');
      return;
    }
    
    const granted = await requestNotificationPermission();
    setPermissionStatus(Notification.permission);
    
    if (granted) {
      setIsEnabled(true);
      localStorage.setItem('notifications-enabled', 'true');
      toast.success('Notifications enabled');
    } else {
      toast.error('Notification permission denied', {
        icon: <BellOffIcon className="h-5 w-5" />,
        duration: 4000,
      });
    }
  };
  
  const disableNotifications = () => {
    setIsEnabled(false);
    localStorage.setItem('notifications-enabled', 'false');
    toast.success('Notifications disabled', {
      icon: <BellOffIcon className="h-5 w-5" />,
    });
  };
  
  return (
    <NotificationContext.Provider
      value={{
        permissionStatus,
        isEnabled,
        enableNotifications,
        disableNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
} 