'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAppStore } from '@/store/useAppStore';
import { getUserById, sendChatInvite, createChat } from '@/lib/firebaseUtils';
import { XIcon, SendIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import { User } from '@/types';

interface NewChatDialogProps {
  onClose: () => void;
}

export default function NewChatDialog({ onClose }: NewChatDialogProps) {
  const { user } = useAuth();
  const { chats, addChat, setSelectedChatId } = useAppStore();
  const [userId, setUserId] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Handle search for user by ID
  const handleSearch = async () => {
    if (!userId.trim() || !user) {
      setError("Please enter a valid user ID");
      return;
    }
    
    // Trim the userId to remove any accidental whitespace
    const trimmedUserId = userId.trim();
    
    // Validation: don't allow searching for own ID
    if (trimmedUserId === user.id) {
      setError("You can't start a chat with yourself");
      setFoundUser(null);
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log(`Searching for user with ID: ${trimmedUserId}`);
      const result = await getUserById(trimmedUserId);
      
      if (!result) {
        console.warn(`No user found with ID: ${trimmedUserId}`);
        setError('No user found with this ID');
        setFoundUser(null);
      } else {
        console.log(`User found:`, result);
        
        // Check if a chat already exists with this user
        const existingChat = chats.find(chat => 
          chat.participants.includes(trimmedUserId) && chat.participants.length === 2
        );
        
        if (existingChat) {
          setError('You already have a chat with this user');
          setFoundUser(null);
          
          // Option to open the existing chat
          const shouldOpenExisting = confirm('You already have a chat with this user. Would you like to open it?');
          if (shouldOpenExisting) {
            setSelectedChatId(existingChat.id);
            onClose();
          }
        } else {
          setFoundUser(result);
          setError('');
        }
      }
    } catch (error) {
      console.error('Error searching for user:', error);
      setError('Failed to search for user. Please try again.');
      setFoundUser(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle starting a chat with the found user
  const handleStartChat = async () => {
    if (!foundUser || !user) return;
    
    setIsLoading(true);
    
    try {
      // Send chat invite
      await sendChatInvite(
        user.id,
        user.name,
        foundUser.id
      );
      
      // Create participant info with null instead of undefined for images
      const participantInfo = {
        [user.id]: {
          name: user.name,
          image: user.image || null, // Use null instead of undefined
        },
        [foundUser.id]: {
          name: foundUser.name,
          image: foundUser.image || null, // Use null instead of undefined
        },
      };
      
      // Create the chat
      const chatId = await createChat(
        [user.id, foundUser.id],
        participantInfo
      );
      
      // Add the chat to the store
      addChat({
        id: chatId,
        participants: [user.id, foundUser.id],
        participantInfo: participantInfo,
        createdAt: { toDate: () => new Date() } as any,
        updatedAt: { toDate: () => new Date() } as any,
      });
      
      // Select the new chat
      setSelectedChatId(chatId);
      
      toast.success(`Chat invitation sent to ${foundUser.name}`);
      onClose();
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle keydown in search input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
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
        
        <h2 className="text-2xl font-bold mb-6">Start a New Chat</h2>
        
        <div className="mb-6">
          <div className="flex space-x-2">
            <Input
              label="Enter User ID"
              placeholder="Paste the user ID here"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyDown={handleKeyDown}
              fullWidth
              error={error}
            />
            <Button
              onClick={handleSearch}
              variant="primary"
              isLoading={isLoading}
              className="self-end"
            >
              Search
            </Button>
          </div>
          
          <p className="text-xs text-gray-700 mt-2 font-medium">
            Ask your friend to share their User ID from their chat profile.
          </p>
        </div>
        
        {foundUser && (
          <div className="border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Avatar
                src={foundUser.image}
                name={foundUser.name}
                userId={foundUser.id}
                size="lg"
                status={foundUser.status}
              />
              <div className="ml-4">
                <h3 className="font-medium text-lg">{foundUser.name}</h3>
                <p className="text-sm text-gray-500">{foundUser.status === 'online' ? 'Online' : 'Offline'}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          {foundUser && (
            <Button
              variant="primary"
              onClick={handleStartChat}
              isLoading={isLoading}
              leftIcon={<SendIcon className="h-4 w-4" />}
            >
              Send Invitation
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 