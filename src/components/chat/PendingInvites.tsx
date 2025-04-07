'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAppStore } from '@/store/useAppStore';
import { updateInviteStatus, getUserById, createChat } from '@/lib/firebaseUtils';
import { XIcon, XCircleIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Avatar from '@/components/ui/Avatar';
import { formatTimestamp } from '@/lib/utils';

interface PendingInvitesProps {
  onClose: () => void;
}

export default function PendingInvites({ onClose }: PendingInvitesProps) {
  const { user } = useAuth();
  const { pendingInvites, addChat, setSelectedChatId } = useAppStore();
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);
  
  // If no invites, show a message
  if (pendingInvites.length === 0) {
    return (
      <>
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4"
          onClick={(e) => {
            // Close when clicking the backdrop
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Pending Invitations</h2>
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800 focus:outline-none"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-8 text-center">
              <div className="mb-4 text-blue-500">
                <XCircleIcon className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-gray-700 font-medium">No pending invitations</p>
              <p className="text-gray-500 text-sm mt-1 mb-6">
                When someone invites you to chat, it will appear here.
              </p>
              
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  const handleAcceptInvite = async (inviteId: string, senderId: string, senderName: string) => {
    if (!user) return;
    
    setProcessingInviteId(inviteId);
    
    try {
      // Update invite status
      await updateInviteStatus(inviteId, 'accepted');
      
      // Get sender user object
      const senderUser = await getUserById(senderId);
      
      if (senderUser) {
        // Create participant info with null instead of undefined for images
        const participantInfo = {
          [user.id]: {
            name: user.name,
            image: user.image || null, // Use null instead of undefined
          },
          [senderId]: {
            name: senderUser.name,
            image: senderUser.image || null, // Use null instead of undefined
          },
        };
        
        // Create the chat
        const chatId = await createChat(
          [user.id, senderId],
          participantInfo
        );
        
        // Add chat to store
        addChat({
          id: chatId,
          participants: [user.id, senderId],
          participantInfo: participantInfo,
          createdAt: { toDate: () => new Date() } as any,
          updatedAt: { toDate: () => new Date() } as any,
        });
        
        // Select the new chat
        setSelectedChatId(chatId);
        
        // Remove invite is now handled automatically by the real-time listener
        
        toast.success(`You are now connected with ${senderName}`);
        onClose();
      }
    } catch (error) {
      console.error('Error accepting invite:', error);
      toast.error('Failed to accept invitation. Please try again.');
    } finally {
      setProcessingInviteId(null);
    }
  };
  
  const handleDeclineInvite = async (inviteId: string) => {
    setProcessingInviteId(inviteId);
    
    try {
      // Update invite status
      await updateInviteStatus(inviteId, 'declined');
      
      // Remove invite is now handled automatically by the real-time listener
      
      toast.success('Invitation declined');
      
      // If no more invites, close the dialog - but check the actual state
      // since real-time updates may have already removed it
      if (pendingInvites.length <= 1) {
        onClose();
      }
    } catch (error) {
      console.error('Error declining invite:', error);
      toast.error('Failed to decline invitation. Please try again.');
    } finally {
      setProcessingInviteId(null);
    }
  };
  
  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4"
        onClick={(e) => {
          // Close when clicking the backdrop
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Pending Invitations
              {pendingInvites.length > 0 && (
                <span className="ml-2 text-sm bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full">
                  {pendingInvites.length}
                </span>
              )}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 focus:outline-none"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto">
            {processingInviteId ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : pendingInvites.length === 0 ? (
              <div className="text-center py-8">
                <div className="mb-4 text-blue-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                    />
                  </svg>
                </div>
                <p className="text-gray-700 font-medium">No pending invitations</p>
                <p className="text-gray-500 text-sm mt-1">
                  When someone invites you to chat, it will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start mb-3">
                      <Avatar
                        src={null}
                        name={invite.senderName || 'Unknown User'}
                        userId={invite.senderId}
                        size="lg"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium">
                          {invite.senderName || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">
                          Sent {formatTimestamp(invite.createdAt)}
                        </div>
                        <p className="text-sm text-gray-600">
                          would like to chat with you
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAcceptInvite(invite.id, invite.senderId, invite.senderName)}
                        disabled={processingInviteId === invite.id}
                        className={`flex-1 py-2 px-3 rounded-md text-white text-sm font-medium transition-colors ${
                          processingInviteId === invite.id
                            ? 'bg-blue-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {processingInviteId === invite.id ? (
                          <span className="flex items-center justify-center">
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Accepting...
                          </span>
                        ) : (
                          'Accept'
                        )}
                      </button>
                      <button
                        onClick={() => handleDeclineInvite(invite.id)}
                        disabled={processingInviteId === invite.id}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                          processingInviteId === invite.id
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {processingInviteId === invite.id ? (
                          <span className="flex items-center justify-center">
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Declining...
                          </span>
                        ) : (
                          'Decline'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 