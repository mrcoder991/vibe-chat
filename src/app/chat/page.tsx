'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAppStore } from '@/store/useAppStore';
import Sidebar from '@/components/chat/Sidebar';
import ChatArea from '@/components/chat/ChatArea';
import NewChatDialog from '@/components/chat/NewChatDialog';
import PendingInvites from '@/components/chat/PendingInvites';

export default function ChatPage() {
  const { user } = useAuth();
  const { selectedChatId, chats, pendingInvites } = useAppStore();
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isInvitesOpen, setIsInvitesOpen] = useState(false);

  // Show invites notification on initial load if there are pending invites
  useEffect(() => {
    if (pendingInvites.length > 0) {
      setIsInvitesOpen(true);
    }
  }, [pendingInvites]);

  if (!user) return null;

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <Sidebar 
        onNewChat={() => setIsNewChatOpen(true)}
        onShowInvites={() => setIsInvitesOpen(true)}
        pendingInvitesCount={pendingInvites.length}
      />
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {selectedChatId ? (
          <ChatArea />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Welcome to VibeChat!</h2>
            <p className="text-gray-600 text-center max-w-md mb-6">
              {chats.length > 0
                ? 'Select a chat from the sidebar or start a new conversation.'
                : 'Start a new conversation by clicking the "New Chat" button.'}
            </p>
            <button
              onClick={() => setIsNewChatOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              New Chat
            </button>
          </div>
        )}
      </div>

      {/* New chat dialog */}
      {isNewChatOpen && (
        <NewChatDialog onClose={() => setIsNewChatOpen(false)} />
      )}

      {/* Pending invites dialog */}
      {isInvitesOpen && (
        <PendingInvites onClose={() => setIsInvitesOpen(false)} />
      )}
    </div>
  );
} 