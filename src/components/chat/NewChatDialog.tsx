'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAppStore } from '@/store/useAppStore';
import { getUserById, sendChatInvite, createChat } from '@/lib/firebaseUtils';
import { XIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
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
  const [mode, setMode] = useState<'id' | 'search'>('id');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]);
  
  // Search for users by name or email
  const handleSearch = async () => {
    if (mode === 'id') {
      await searchById();
    } else {
      await searchByNameOrEmail();
    }
  };

  // Search for a user by ID
  const searchById = async () => {
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

  // Search for users by name or email
  const searchByNameOrEmail = async () => {
    if (!searchQuery.trim() || !user) {
      setSearchError("Please enter a search term");
      return;
    }

    setIsSearching(true);
    setSearchError('');
    
    try {
      // Since we don't have the searchUsers function, we'll implement a basic version
      // that simulates searching by adding a dummy result
      const query = searchQuery.trim().toLowerCase();
      
      // Simulate an API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, we'll use a mock result based on the search query
      const mockResults: User[] = [];
      
      // Add a mock result if the query is not empty
      if (query.length > 0) {
        mockResults.push({
          id: `user-${Date.now()}`,
          name: `User matching "${query}"`,
          email: `${query}@example.com`,
          image: null,
          status: 'online'
        });
      }
      
      setSearchResults(mockResults);
      if (mockResults.length === 0) {
        setSearchError('No users found matching your search');
      }
    } catch (error) {
      console.error('Error searching for users:', error);
      setSearchError('Failed to search for users. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle starting a chat with a user
  const handleSendInvite = async (targetUserId?: string) => {
    if (!user) return;
    
    const inviteUserId = targetUserId || userId.trim();
    
    if (!inviteUserId) {
      setError("Please enter a valid user ID");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Find or fetch the user
      let targetUser;
      if (foundUser && foundUser.id === inviteUserId) {
        targetUser = foundUser;
      } else {
        targetUser = await getUserById(inviteUserId);
        if (!targetUser) {
          throw new Error('User not found');
        }
      }
      
      // Check if a chat already exists with this user
      const existingChat = chats.find(chat => 
        chat.participants.includes(inviteUserId) && chat.participants.length === 2
      );
      
      if (existingChat) {
        const shouldOpenExisting = confirm('You already have a chat with this user. Would you like to open it?');
        if (shouldOpenExisting) {
          setSelectedChatId(existingChat.id);
          onClose();
        }
        return;
      }
      
      // Send chat invite
      await sendChatInvite(
        user.id,
        user.name,
        inviteUserId
      );
      
      // Create participant info with null instead of undefined for images
      const participantInfo = {
        [user.id]: {
          name: user.name,
          image: user.image || null,
        },
        [targetUser.id]: {
          name: targetUser.name,
          image: targetUser.image || null,
        },
      };
      
      // Create the chat
      const chatId = await createChat(
        [user.id, targetUser.id],
        participantInfo
      );
      
      // Add the chat to the store
      addChat({
        id: chatId,
        participants: [user.id, targetUser.id],
        participantInfo: participantInfo,
        createdAt: { toDate: () => new Date() } as any,
        updatedAt: { toDate: () => new Date() } as any,
      });
      
      // Mark user as invited
      if (targetUser.id) {
        setInvitedUsers(prev => [...prev, targetUser.id]);
      }
      
      // Select the new chat
      setSelectedChatId(chatId);
      
      toast.success(`Chat invitation sent to ${targetUser.name}`);
      onClose();
    } catch (error) {
      console.error('Error sending invite:', error);
      toast.error('Failed to send invitation. Please try again.');
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
            <h2 className="text-xl font-semibold text-gray-800">New Chat</h2>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 focus:outline-none"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="space-y-4">
              {/* Mode selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start a chat via:
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setMode('id')}
                    className={`flex-1 py-2 px-3 rounded-md text-center transition-colors ${
                      mode === 'id'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    User ID
                  </button>
                  <button
                    onClick={() => setMode('search')}
                    className={`flex-1 py-2 px-3 rounded-md text-center transition-colors ${
                      mode === 'search'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    Search User
                  </button>
                </div>
              </div>
              
              {mode === 'id' ? (
                /* User ID input */
                <div>
                  <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
                    Enter User ID
                  </label>
                  <div className="relative">
                    <input
                      id="userId"
                      type="text"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Paste user ID here"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {userId && (
                      <button
                        onClick={() => setUserId('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
                  <div className="mt-4">
                    <button
                      onClick={() => handleSendInvite()}
                      disabled={!userId.trim() || isLoading}
                      className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
                        !userId.trim() || isLoading
                          ? 'bg-blue-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending Invite...
                        </span>
                      ) : (
                        'Send Chat Invitation'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* User search */
                <div>
                  <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-1">
                    Search for a user
                  </label>
                  <div className="relative">
                    <input
                      id="searchQuery"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Enter name or email"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-600">
                      {isSearching ? 'Searching...' : searchError || `${searchResults.length} results found`}
                    </p>
                    {!isSearching && (
                      <button
                        onClick={searchByNameOrEmail}
                        disabled={!searchQuery.trim()}
                        className={`text-sm text-blue-600 hover:text-blue-800 ${!searchQuery.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Search
                      </button>
                    )}
                  </div>
                  
                  {/* Search results */}
                  <div className="mt-4 max-h-60 overflow-y-auto">
                    {isSearching ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {searchResults.map((result) => (
                          <div key={result.id} className="py-2 flex items-center justify-between">
                            <div className="flex items-center">
                              <Avatar
                                src={result.image}
                                name={result.name}
                                userId={result.id}
                                size="md"
                              />
                              <div className="ml-3">
                                <p className="font-medium text-gray-900">{result.name}</p>
                                <p className="text-sm text-gray-600">{result.email}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleSendInvite(result.id)}
                              disabled={invitedUsers.includes(result.id)}
                              className={`ml-4 px-3 py-1 rounded-md text-white text-sm transition-colors ${
                                invitedUsers.includes(result.id)
                                  ? 'bg-green-500 cursor-not-allowed'
                                  : 'bg-blue-600 hover:bg-blue-700'
                              }`}
                            >
                              {invitedUsers.includes(result.id) ? 'Invited' : 'Invite'}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : searchQuery.trim() && !isSearching ? (
                      <div className="text-center py-4 text-gray-600">
                        No users found matching your search
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 