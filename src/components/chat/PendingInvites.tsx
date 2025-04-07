'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAppStore } from '@/store/useAppStore';
import { updateInviteStatus, getUserById, createChat } from '@/lib/firebaseUtils';
import { XIcon, CheckIcon, XCircleIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <XIcon className="h-5 w-5" />
          </button>
          
          <h2 className="text-2xl font-bold mb-4">Chat Invitations</h2>
          
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircleIcon className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-gray-500 mb-6">You don&apos;t have any pending chat invitations.</p>
            
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        </div>
      </div>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <XIcon className="h-5 w-5" />
        </button>
        
        <h2 className="text-2xl font-bold mb-6">Chat Invitations</h2>
        
        <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto mb-4">
          {pendingInvites.map((invite) => (
            <div key={invite.id} className="py-3">
              <div className="flex items-center mb-2">
                <Avatar
                  name={invite.senderName}
                  userId={invite.senderId}
                  size="md"
                />
                <div className="ml-3 flex-1">
                  <p className="font-medium">{invite.senderName}</p>
                  <p className="text-xs text-gray-700">
                    {formatTimestamp(invite.createdAt)}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2 mt-3">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  leftIcon={<CheckIcon className="h-4 w-4" />}
                  onClick={() => handleAcceptInvite(invite.id, invite.senderId, invite.senderName)}
                  isLoading={processingInviteId === invite.id}
                  disabled={!!processingInviteId}
                >
                  Accept
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  leftIcon={<XIcon className="h-4 w-4" />}
                  onClick={() => handleDeclineInvite(invite.id)}
                  isLoading={processingInviteId === invite.id}
                  disabled={!!processingInviteId}
                >
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
} 