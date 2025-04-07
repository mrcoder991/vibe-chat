'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAppStore } from '@/store/useAppStore';
import Avatar from '@/components/ui/Avatar';
import { formatTimestamp, truncateText } from '@/lib/utils';
import { PlusIcon, BellIcon, LogOutIcon, UserIcon, TrashIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { deleteChat } from '@/lib/firebaseUtils';

interface SidebarProps {
  onNewChat: () => void;
  onShowInvites: () => void;
  pendingInvitesCount: number;
}

export default function Sidebar({ onNewChat, onShowInvites, pendingInvitesCount }: SidebarProps) {
  const { user, signOut } = useAuth();
  const { chats, selectedChatId, setSelectedChatId } = useAppStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();
  
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
    <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <Link href="/" className="text-blue-600 font-bold text-xl">VibeChat</Link>
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
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
              <div className="py-2 px-4 border-b border-gray-200">
                <p className="font-medium">{user?.name}</p>
                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <button 
                  onClick={handleSignOut}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <LogOutIcon className="h-4 w-4 mr-2" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="p-3 border-b border-gray-200 flex space-x-2">
        <button
          onClick={onNewChat}
          className="flex-1 flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Chat
        </button>
        <button
          onClick={onShowInvites}
          className="relative flex items-center justify-center bg-gray-100 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-200 transition-colors"
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
          <div className="p-4 text-center text-gray-600">
            <p>No conversations yet.</p>
            <p className="text-sm">Start a new chat to begin messaging.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {chats.map((chat) => {
              // Find the other participant (not the current user)
              const otherParticipantId = chat.participants.find(id => id !== user?.id) || '';
              const otherParticipantInfo = chat.participantInfo[otherParticipantId] || { name: 'Unknown User' };
              
              return (
                <div
                  key={chat.id}
                  className={`p-3 hover:bg-gray-50 cursor-pointer flex items-center ${
                    selectedChatId === chat.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedChatId(chat.id)}
                >
                  <Avatar 
                    src={otherParticipantInfo.image}
                    name={otherParticipantInfo.name}
                    userId={otherParticipantId}
                    size="md"
                  />
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="font-medium text-gray-900 truncate">
                        {otherParticipantInfo.name}
                      </p>
                      <p className="text-xs text-gray-700">
                        {formatTimestamp(chat.updatedAt)}
                      </p>
                    </div>
                    {chat.lastMessage && (
                      <p className="text-sm text-gray-600 truncate">
                        {chat.lastMessage.senderId === user?.id ? 'You: ' : ''}
                        {chat.lastMessage.type === 'text' 
                          ? truncateText(chat.lastMessage.content, 30) 
                          : 'Sent an image'}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                    className="ml-2 text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-200 focus:outline-none"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* User ID section */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center mb-1">
          <p className="text-sm font-medium text-gray-700">Your User ID</p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(user?.id || '');
              toast.success('User ID copied to clipboard!');
            }}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Copy
          </button>
        </div>
        <p className="text-xs text-gray-600 break-all bg-white p-2 rounded border border-gray-200">
          {user?.id}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Share this ID with friends to let them connect with you.
        </p>
      </div>
    </div>
  );
} 