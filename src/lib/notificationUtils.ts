import { Message, ChatInvite, User, NotificationType } from '@/types';

// Check if notifications are supported by the browser
export const notificationsSupported = (): boolean => {
  return 'Notification' in window;
};

// Request permission for notifications
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!notificationsSupported()) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  // Ask for permission
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// Function to check current notification permission status
export const getNotificationPermissionStatus = (): string => {
  if (!notificationsSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
};

// Check if the document is currently visible
export const isDocumentVisible = (): boolean => {
  return typeof document !== 'undefined' && document.visibilityState === 'visible';
};

// Function to show notifications for new messages
export const showMessageNotification = (
  message: Message, 
  senderName: string, 
  chatTitle: string,
  onClick?: () => void
): void => {
  if (!notificationsSupported() || Notification.permission !== 'granted') {
    return;
  }

  // Don't notify for your own messages
  if (message.senderId === getCurrentUserId()) {
    return;
  }
  
  // Don't show notifications if document is visible (user is using the app)
  if (isDocumentVisible()) {
    return;
  }

  const content = message.type === 'text' 
    ? message.content
    : '📷 Sent you an image';
  
  const notification = new Notification(`${senderName}`, {
    body: content,
    icon: '/logo.png', // Update with your app logo path
    badge: '/logo.png',
    tag: `message-${message.chatId}`, // Group notifications by chat
    silent: false
  });

  if (onClick) {
    notification.onclick = () => {
      window.focus();
      onClick();
      notification.close();
    };
  }
};

// Function to show notifications for new invites
export const showInviteNotification = (
  invite: ChatInvite,
  onClick?: () => void
): void => {
  if (!notificationsSupported() || Notification.permission !== 'granted') {
    return;
  }
  
  // Don't show notifications if document is visible (user is using the app)
  if (isDocumentVisible()) {
    return;
  }

  const notification = new Notification('New Chat Invitation', {
    body: `${invite.senderName} invited you to chat`,
    icon: '/logo.png', // Update with your app logo path
    badge: '/logo.png',
    tag: `invite-${invite.senderId}`, // Group notifications by sender
    silent: false
  });

  if (onClick) {
    notification.onclick = () => {
      window.focus();
      onClick();
      notification.close();
    };
  }
};

// Helper to get current user ID from local storage (to prevent notifications for own messages)
const getCurrentUserId = (): string | null => {
  try {
    // Check if we can access localStorage (not available in SSR)
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    
    // Try to get the user info from local storage
    const userInfo = localStorage.getItem('vibe-chat-user');
    if (!userInfo) return null;
    
    const user = JSON.parse(userInfo) as { id: string };
    return user.id;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
};

// Save user ID to localStorage to help with notification filtering
export const saveCurrentUserToLocalStorage = (user: User): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('vibe-chat-user', JSON.stringify({ id: user.id }));
    }
  } catch (error) {
    console.error('Error saving user to localStorage:', error);
  }
};

// Function to play notification sound
export const playNotificationSound = (type: NotificationType = 'message'): void => {
  try {
    const audio = new Audio(`/sounds/${type}.mp3`);
    audio.play().catch(error => {
      // Browsers often block autoplay without user interaction
      console.warn('Could not play notification sound:', error);
    });
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
}; 