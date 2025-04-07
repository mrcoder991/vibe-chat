'use client';

import { create } from 'zustand';
import { User, Chat, ChatInvite, Message } from '@/types';
import { 
  getUserChats, 
  getChatMessages,
  getPendingInvites,
  markMessagesAsRead,
  subscribeToMessages,
  subscribeToChats,
  subscribeToInvites
} from '@/lib/firebaseUtils';

interface AppState {
  // Active selections
  selectedChatId: string | null;
  replyingTo: Message | null;

  // Data
  chats: Chat[];
  currentChatMessages: Message[];
  pendingInvites: ChatInvite[];
  
  // Loading states
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  isLoadingInvites: boolean;
  
  // Subscription cleanup functions
  messageUnsubscribe: (() => void) | null;
  chatsUnsubscribe: (() => void) | null;
  invitesUnsubscribe: (() => void) | null;
  
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
  
  // Store manipulation methods
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
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
  isLoadingChats: false,
  isLoadingMessages: false,
  isLoadingInvites: false,
  messageUnsubscribe: null,
  chatsUnsubscribe: null,
  invitesUnsubscribe: null,
};

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,

  setSelectedChatId: (chatId) => {
    const currentSelectedChatId = get().selectedChatId;
    
    // Only unsubscribe if we're changing chats
    if (currentSelectedChatId !== chatId && get().messageUnsubscribe) {
      get().messageUnsubscribe();
    }
    
    set({ selectedChatId: chatId });
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
      get().messageUnsubscribe();
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
        
        set({ 
          currentChatMessages: uniqueMessages,
          isLoadingMessages: false
        });
        
        // Mark messages as read whenever new messages come in
        markMessagesAsRead(chatId, userId).catch(error => {
          console.warn('Non-critical error marking messages as read:', error);
        });
      },
      (error) => {
        console.error('Error in messages subscription:', error);
        set({ isLoadingMessages: false });
      }
    );
    
    set({ messageUnsubscribe: unsubscribe });
  },
  
  subscribeToUserChats: (userId) => {
    // Clear any previous subscription
    if (get().chatsUnsubscribe) {
      get().chatsUnsubscribe();
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
      get().invitesUnsubscribe();
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
  
  removeInvite: (inviteId) => {
    set((state) => ({
      pendingInvites: state.pendingInvites.filter((invite) => invite.id !== inviteId),
    }));
  },
  
  unsubscribeAll: () => {
    const { messageUnsubscribe, chatsUnsubscribe, invitesUnsubscribe } = get();
    
    if (messageUnsubscribe) messageUnsubscribe();
    if (chatsUnsubscribe) chatsUnsubscribe();
    if (invitesUnsubscribe) invitesUnsubscribe();
    
    set({
      messageUnsubscribe: null,
      chatsUnsubscribe: null,
      invitesUnsubscribe: null
    });
  },
  
  reset: () => {
    // Clean up subscriptions before resetting
    get().unsubscribeAll();
    set(initialState);
  },
})); 