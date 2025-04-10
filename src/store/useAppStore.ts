'use client';

import { create } from 'zustand';
import { Chat, ChatInvite, Message } from '@/types';
import { 
  getUserChats, 
  getChatMessages,
  getPendingInvites,
  markMessagesAsRead,
  subscribeToMessages,
  subscribeToChats,
  subscribeToInvites,
  subscribeToReadStatus
} from '@/lib/firebaseUtils';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AppState {
  // Active selections
  selectedChatId: string | null;
  replyingTo: Message | null;

  // Data
  chats: Chat[];
  currentChatMessages: Message[];
  pendingInvites: ChatInvite[];
  unreadCounts: Record<string, number>;
  
  // Loading states
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  isLoadingInvites: boolean;
  
  // Subscription cleanup functions
  messageUnsubscribe: (() => void) | null;
  chatsUnsubscribe: (() => void) | null;
  invitesUnsubscribe: (() => void) | null;
  readStatusUnsubscribe: (() => void) | null;
  
  // Actions
  setSelectedChatId: (chatId: string | null) => void;
  setReplyingTo: (message: Message | null) => void;
  fetchChats: (userId: string) => Promise<void>;
  fetchMessages: (chatId: string, userId: string) => Promise<void>;
  fetchInvites: (userId: string) => Promise<void>;
  
  // Real-time subscription methods
  subscribeToSelectedChatMessages: (chatId: string, userId: string) => void;
  subscribeToUserChats: (userId: string) => void;
  subscribeToUserInvites: (userId: string) => void;
  subscribeToMessageReadStatus: (chatId: string, userId: string) => void;
  
  // Store manipulation methods
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  updateMessagesReadStatus: (messageIds: string[]) => void;
  calculateUnreadCounts: (userId: string) => void;
  removeInvite: (inviteId: string) => void;
  
  // Cleanup
  unsubscribeAll: () => void;
  reset: () => void;
}

const initialState = {
  selectedChatId: null,
  replyingTo: null,
  chats: [],
  currentChatMessages: [],
  pendingInvites: [],
  unreadCounts: {},
  isLoadingChats: false,
  isLoadingMessages: false,
  isLoadingInvites: false,
  messageUnsubscribe: null,
  chatsUnsubscribe: null,
  invitesUnsubscribe: null,
  readStatusUnsubscribe: null,
};

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,

  setSelectedChatId: (chatId) => {
    const currentSelectedChatId = get().selectedChatId;
    
    // Only unsubscribe if we're changing chats
    if (currentSelectedChatId !== chatId && get().messageUnsubscribe) {
      // Add optional chaining to safely call the function
      get().messageUnsubscribe?.();
    }
    
    set({ selectedChatId: chatId });
    
    // If we're selecting a new chat, update unread counts after a brief delay
    // This will handle the case where selecting a chat marks messages as read
    if (chatId && currentSelectedChatId !== chatId) {
      const chat = get().chats.find(c => c.id === chatId);
      if (chat && chat.participants.length > 0) {
        // Find a user ID to recalculate unread counts with
        // This is a simplification - should be the current user ID
        const userId = chat.participants[0];
        
        // Delay to ensure any read status updates have time to process
        setTimeout(() => {
          get().calculateUnreadCounts(userId);
        }, 1000);
      }
    }
  },
  
  setReplyingTo: (message) => set({ replyingTo: message }),
  
  fetchChats: async (userId) => {
    set({ isLoadingChats: true });
    try {
      const chats = await getUserChats(userId);
      set({ chats, isLoadingChats: false });
    } catch (error) {
      console.error('Error fetching chats:', error);
      set({ isLoadingChats: false });
    }
  },
  
  fetchMessages: async (chatId, userId) => {
    set({ isLoadingMessages: true });
    try {
      const messages = await getChatMessages(chatId);
      set({ currentChatMessages: messages, isLoadingMessages: false });
      
      // Mark messages as read - don't await this operation to prevent blocking
      // and handle any errors silently
      markMessagesAsRead(chatId, userId).catch(error => {
        // Just log the error without breaking the app flow
        console.warn('Non-critical error marking messages as read:', error);
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      set({ isLoadingMessages: false });
    }
  },
  
  fetchInvites: async (userId) => {
    set({ isLoadingInvites: true });
    try {
      const invites = await getPendingInvites(userId);
      set({ pendingInvites: invites, isLoadingInvites: false });
    } catch (error) {
      console.error('Error fetching invites:', error);
      set({ isLoadingInvites: false });
    }
  },
  
  subscribeToSelectedChatMessages: (chatId, userId) => {
    // Clear any previous subscription
    if (get().messageUnsubscribe) {
      get().messageUnsubscribe?.();
    }
    
    set({ isLoadingMessages: true });
    
    // Set up new subscription
    const unsubscribe = subscribeToMessages(
      chatId,
      (messages) => {
        // Ensure unique messages by ID
        const uniqueMessages = Array.from(
          new Map(messages.map(message => [message.id, message])).values()
        );
        
        // Find unread messages not sent by current user
        const unreadMessages = uniqueMessages.filter(
          msg => !msg.read && msg.senderId !== userId
        );
        
        set({ 
          currentChatMessages: uniqueMessages,
          isLoadingMessages: false
        });
        
        // Only mark messages as read if:
        // 1. Document is visible (user is actively viewing the chat)
        // 2. There are unread messages sent by the other user
        // 3. Chat is currently selected (user has explicitly opened this chat)
        if (document.visibilityState === 'visible' && 
            unreadMessages.length > 0 && 
            get().selectedChatId === chatId) {
          
          // Add a short delay to ensure user has actually seen the messages
          // This avoids messages being marked as read as soon as they appear
          setTimeout(() => {
            if (document.visibilityState === 'visible' && get().selectedChatId === chatId) {
              markMessagesAsRead(chatId, userId).catch(error => {
                console.warn('Non-critical error marking messages as read:', error);
              });
            }
          }, 1000); // 1 second delay
        }
      },
      (error) => {
        console.error('Error in messages subscription:', error);
        set({ isLoadingMessages: false });
      }
    );
    
    set({ messageUnsubscribe: unsubscribe });
    
    // Also subscribe to read status updates for this chat
    get().subscribeToMessageReadStatus(chatId, userId);
  },
  
  subscribeToUserChats: (userId) => {
    // Clear any previous subscription
    if (get().chatsUnsubscribe) {
      get().chatsUnsubscribe?.();
    }
    
    set({ isLoadingChats: true });
    
    // Set up new subscription
    const unsubscribe = subscribeToChats(
      userId,
      (chats) => {
        // Ensure unique chats by ID
        const uniqueChats = Array.from(
          new Map(chats.map(chat => [chat.id, chat])).values()
        );
        
        set({ 
          chats: uniqueChats,
          isLoadingChats: false
        });
        
        // Calculate unread counts when chats are updated
        get().calculateUnreadCounts(userId);
      },
      (error) => {
        console.error('Error in chats subscription:', error);
        set({ isLoadingChats: false });
      }
    );
    
    set({ chatsUnsubscribe: unsubscribe });
  },
  
  subscribeToUserInvites: (userId) => {
    // Clear any previous subscription
    if (get().invitesUnsubscribe) {
      get().invitesUnsubscribe?.();
    }
    
    set({ isLoadingInvites: true });
    
    // Set up new subscription
    const unsubscribe = subscribeToInvites(
      userId,
      (invites) => {
        // Ensure unique invites by ID
        const uniqueInvites = Array.from(
          new Map(invites.map(invite => [invite.id, invite])).values()
        );
        
        set({ 
          pendingInvites: uniqueInvites,
          isLoadingInvites: false
        });
      },
      (error) => {
        console.error('Error in invites subscription:', error);
        set({ isLoadingInvites: false });
      }
    );
    
    set({ invitesUnsubscribe: unsubscribe });
  },
  
  subscribeToMessageReadStatus: (chatId, userId) => {
    // Clear any previous read status subscription
    if (get().readStatusUnsubscribe) {
      get().readStatusUnsubscribe?.();
    }
    
    // Set up new subscription to track when our messages get read
    const unsubscribe = subscribeToReadStatus(
      chatId,
      userId,
      (messageIds) => {
        // Update read status for these messages
        get().updateMessagesReadStatus(messageIds);
      },
      (error) => {
        console.error('Error in read status subscription:', error);
      }
    );
    
    set({ readStatusUnsubscribe: unsubscribe });
  },
  
  addChat: (chat) => {
    set((state) => ({
      chats: [chat, ...state.chats],
    }));
  },
  
  updateChat: (chatId, updates) => {
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId ? { ...chat, ...updates } : chat
      ),
    }));
  },
  
  addMessage: (message) => {
    set((state) => {
      // Check if message with this ID already exists
      const messageExists = state.currentChatMessages.some(
        existing => existing.id === message.id
      );
      
      // Only add if it doesn't exist
      if (!messageExists) {
        return {
          currentChatMessages: [...state.currentChatMessages, message],
        };
      }
      
      // Return unchanged state if message already exists
      return state;
    });
  },
  
  updateMessage: (messageId, updates) => {
    set((state) => ({
      currentChatMessages: state.currentChatMessages.map((message) =>
        message.id === messageId ? { ...message, ...updates } : message
      ),
    }));
  },
  
  calculateUnreadCounts: (userId) => {
    // Create a promise to get all unread messages for all chats
    const getUnreadCounts = async () => {
      const { chats } = get();
      const unreadCounts: Record<string, number> = {};
      
      // We need to query Firestore for unread messages in each chat
      for (const chat of chats) {
        try {
          // Query for messages RECEIVED by the current user that they haven't read yet
          const messagesQuery = query(
            collection(db, 'messages'),
            where('chatId', '==', chat.id),
            where('senderId', '!=', userId), // Messages FROM others (not from current user)
            where('read', '==', false) // Unread by the current user
          );
          
          const snapshot = await getDocs(messagesQuery);
          const count = snapshot.docs.length;
          
          // Only add to unreadCounts if there are unread messages
          if (count > 0) {
            unreadCounts[chat.id] = count;
          }
        } catch (error) {
          console.error(`Error getting unread count for chat ${chat.id}:`, error);
        }
      }
      
      // Update the state with the unread counts
      set({ unreadCounts });
    };
    
    // Execute the async function
    getUnreadCounts();
  },
  
  updateMessagesReadStatus: (messageIds) => {
    set((state) => {
      // Only update if there are actual message IDs
      if (messageIds.length === 0) {
        return state;
      }
      
      // Update the messages with the provided IDs
      const updatedMessages = state.currentChatMessages.map((message) => {
        if (messageIds.includes(message.id)) {
          return { ...message, read: true };
        }
        return message;
      });
      
      // Get the current user ID from the current chat
      const currentChatId = get().selectedChatId;
      if (currentChatId) {
        // Find current user's ID by using the participants of the chat
        const currentChat = get().chats.find(chat => chat.id === currentChatId);
        if (currentChat && currentChat.participants.length > 0) {
          // We'll recalculate unread counts with a small delay to ensure Firestore has updated
          setTimeout(() => {
            const userId = currentChat.participants[0]; // This is a simplification - should be the current user ID
            get().calculateUnreadCounts(userId);
          }, 500);
        }
      }
      
      return { currentChatMessages: updatedMessages };
    });
  },
  
  removeInvite: (inviteId) => {
    set((state) => ({
      pendingInvites: state.pendingInvites.filter((invite) => invite.id !== inviteId),
    }));
  },
  
  unsubscribeAll: () => {
    const { messageUnsubscribe, chatsUnsubscribe, invitesUnsubscribe, readStatusUnsubscribe } = get();
    
    if (messageUnsubscribe) messageUnsubscribe();
    if (chatsUnsubscribe) chatsUnsubscribe();
    if (invitesUnsubscribe) invitesUnsubscribe();
    if (readStatusUnsubscribe) readStatusUnsubscribe();
    
    set({
      messageUnsubscribe: null,
      chatsUnsubscribe: null,
      invitesUnsubscribe: null,
      readStatusUnsubscribe: null
    });
  },
  
  reset: () => {
    // Clean up subscriptions before resetting
    get().unsubscribeAll();
    set(initialState);
  },
})); 