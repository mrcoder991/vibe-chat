'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAppStore } from '@/store/useAppStore';
import Avatar from '@/components/ui/Avatar';
import { formatTimestamp, truncateText } from '@/lib/utils';
import { PlusIcon, BellIcon, LogOutIcon, TrashIcon, X, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { deleteChat } from '@/lib/firebaseUtils';
import NotificationToggle from '@/components/ui/NotificationToggle';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface SidebarProps {
  onNewChat: () => void;
  onShowInvites: () => void;
  pendingInvitesCount: number;
  onCloseMobileSidebar?: () => void;
}

export default function Sidebar({ onNewChat, onShowInvites, pendingInvitesCount, onCloseMobileSidebar }: SidebarProps) {
  const { user, signOut } = useAuth();
  const { chats, selectedChatId, setSelectedChatId, unreadCounts, calculateUnreadCounts } = useAppStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const router = useRouter();
  
  // Calculate unread counts when component mounts or chats change
  useEffect(() => {
    if (user) {
      calculateUnreadCounts(user.id);
    }
  }, [user, calculateUnreadCounts, chats.length]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat?')) return;
    
    try {
      await deleteChat(chatId);
      
      // If the deleted chat was selected, clear selection
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
      }
      
      // Re-fetch chats from the store
      if (user) {
        useAppStore.getState().fetchChats(user.id);
      }
      
      toast.success('Chat deleted successfully.');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat. Please try again.');
    }
  };

  return (
    <div className="w-full h-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="text-blue-600 dark:text-blue-400 font-bold text-xl">VibeChat</Link>
        </div>
        <div className="flex items-center space-x-2">
          {/* Mobile close button */}
          {onCloseMobileSidebar && (
            <button 
              onClick={onCloseMobileSidebar}
              className="md:hidden p-2 mr-2 rounded-full text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="focus:outline-none"
            >
              <Avatar 
                src={user?.image}
                name={user?.name || ''}
                userId={user?.id || ''}
                status={user?.status}
                size="md"
              />
            </button>
            
            {/* User menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                <div className="py-2 px-4 border-b border-gray-200 dark:border-gray-700">
                  <p className="font-medium dark:text-white">{user?.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button 
                    onClick={handleSignOut}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                  >
                    <LogOutIcon className="h-4 w-4 mr-2" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex space-x-2">
        <button
          onClick={onNewChat}
          className="flex-1 flex items-center justify-center bg-blue-600 dark:bg-blue-700 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Chat
        </button>
        <button
          onClick={onShowInvites}
          className="relative flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-2 px-3 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <BellIcon className="h-5 w-5" />
          {pendingInvitesCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {pendingInvitesCount}
            </span>
          )}
        </button>
      </div>
      
      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-4 text-center text-gray-600 dark:text-gray-400">
            <p>No conversations yet.</p>
            <p className="text-sm">Start a new chat to begin messaging.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {chats.map((chat) => {
              // Find the other participant (not the current user)
              const otherParticipantId = chat.participants.find(id => id !== user?.id) || '';
              const otherParticipantInfo = chat.participantInfo[otherParticipantId] || { name: 'Unknown User' };
              
              // Get unread count for this chat
              const unreadCount = unreadCounts[chat.id] || 0;
              
              // Don't show unread count for messages sent by the current user
              // Only show for messages received from others that are unread
              const shouldShowUnreadBadge = unreadCount > 0 && (
                chat.lastMessage?.senderId !== user?.id // Only show if last message was not sent by current user
              );
              
              return (
                <div
                  key={chat.id}
                  className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center ${
                    selectedChatId === chat.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                  }`}
                  onClick={() => setSelectedChatId(chat.id)}
                >
                  <div className="relative">
                    <Avatar 
                      src={otherParticipantInfo.image}
                      name={otherParticipantInfo.name}
                      userId={otherParticipantId}
                      size="md"
                    />
                    {shouldShowUnreadBadge && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className={`font-medium truncate ${shouldShowUnreadBadge ? 'text-black dark:text-white font-semibold' : 'text-gray-900 dark:text-gray-100'}`}>
                        {otherParticipantInfo.name}
                      </p>
                      <p className="text-xs text-gray-700 dark:text-gray-400">
                        {formatTimestamp(chat.updatedAt)}
                      </p>
                    </div>
                    {chat.lastMessage && (
                      <p className={`text-sm truncate ${shouldShowUnreadBadge ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                        {chat.lastMessage.type === 'image' ? '🌄 Photo' : truncateText(chat.lastMessage.content, 40)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ml-2 opacity-0 group-hover:opacity-100"
                    aria-label="Delete chat"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Settings button */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between relative">
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <Settings className="h-5 w-5" />
          <span className="text-sm font-medium">Settings</span>
        </button>
        {showSettings && (
          <div className="absolute bottom-full left-0 mb-2 w-full md:w-80 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 z-50 rounded-md">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-medium text-gray-900 dark:text-white">Settings</h3>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Theme</span>
                  <ThemeToggle />
                </div>
                
                {/* Notifications Settings */}
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Notifications</span>
                  <NotificationToggle />
                </div>
                
                {/* We can add more settings here in the future */}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* User ID section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-between items-center mb-1">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Your User ID</p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(user?.id || '');
              toast.success('User ID copied to clipboard!');
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            Copy
          </button>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 break-all bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
          {user?.id}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          Share this ID with friends to let them connect with you.
        </p>
      </div>
    </div>
  );
} 