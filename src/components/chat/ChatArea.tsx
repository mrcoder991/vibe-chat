'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAppStore } from '@/store/useAppStore';
import Avatar from '@/components/ui/Avatar';
import { formatMessageTime, truncateText } from '@/lib/utils';
import { sendTextMessage, sendImageMessage, deleteMessage } from '@/lib/firebaseUtils';
import { ImageIcon, SendIcon, XIcon, ReplyIcon, TrashIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Message } from '@/types';

export default function ChatArea() {
  const { user } = useAuth();
  const { 
    selectedChatId, 
    chats, 
    currentChatMessages, 
    replyingTo, 
    fetchMessages, 
    subscribeToSelectedChatMessages,
    setReplyingTo, 
    addMessage, 
    updateMessage 
  } = useAppStore();
  const [messageInput, setMessageInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const selectedChat = chats.find(chat => chat.id === selectedChatId);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChatMessages]);
  
  // Set up real-time subscription when selected chat changes
  useEffect(() => {
    if (selectedChatId && user) {
      // Replace the fetch with subscription
      subscribeToSelectedChatMessages(selectedChatId, user.id);
    }
    
    // This effect's cleanup will be handled by the store's setSelectedChatId method
    // which will unsubscribe from the previous chat when changing to a new one
  }, [selectedChatId, user, subscribeToSelectedChatMessages]);

  if (!selectedChat || !selectedChatId || !user) {
    return null;
  }

  // Find the other participant in the conversation
  const otherParticipantId = selectedChat.participants.find(id => id !== user.id) || '';
  const otherParticipantInfo = selectedChat.participantInfo[otherParticipantId] || { name: 'Unknown User' };

  const handleSendMessage = async () => {
    if (!messageInput.trim() && !replyingTo) return;
    
    setIsSubmitting(true);
    try {
      let replyToInfo = undefined;
      if (replyingTo) {
        replyToInfo = {
          id: replyingTo.id,
          content: replyingTo.content,
          senderId: replyingTo.senderId,
        };
      }
      
      const messageId = await sendTextMessage(
        selectedChatId,
        user.id,
        messageInput,
        replyToInfo
      );
      
      // Clear input and reply state
      setMessageInput('');
      setReplyingTo(null);
      
      // Optimistically add the message to UI
      addMessage({
        id: messageId,
        chatId: selectedChatId,
        senderId: user.id,
        content: messageInput,
        type: 'text',
        replyTo: replyToInfo,
        timestamp: { toDate: () => new Date() } as any,
        read: false,
        deleted: false,
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendImage = async (file: File) => {
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }
    
    setIsSubmitting(true);
    try {
      let replyToInfo = undefined;
      if (replyingTo) {
        replyToInfo = {
          id: replyingTo.id,
          content: replyingTo.content,
          senderId: replyingTo.senderId,
        };
      }
      
      const messageId = await sendImageMessage(
        selectedChatId,
        user.id,
        file,
        replyToInfo
      );
      
      // Clear reply state
      setReplyingTo(null);
      
      toast.success('Image sent successfully');
      
    } catch (error) {
      console.error('Error sending image:', error);
      toast.error('Failed to send image. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMessage = async (message: Message) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await deleteMessage(message.id, message.chatId);
      
      // Update message in UI
      updateMessage(message.id, { deleted: true, content: message.type === 'text' ? 'This message was deleted' : '' });
      
      // If replying to this message, cancel reply
      if (replyingTo?.id === message.id) {
        setReplyingTo(null);
      }
      
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message. Please try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSendImage(file);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="p-3 border-b border-gray-200 bg-white flex items-center">
        <Avatar 
          src={otherParticipantInfo.image}
          name={otherParticipantInfo.name}
          userId={otherParticipantId}
          size="md"
        />
        <div className="ml-3">
          <p className="font-medium">{otherParticipantInfo.name}</p>
        </div>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {currentChatMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Filter out duplicate messages by creating a new array with unique message IDs */}
            {Array.from(
              new Map(currentChatMessages.map(message => [message.id, message])).values()
            ).map((message) => {
              const isOwnMessage = message.senderId === user.id;
              const senderInfo = isOwnMessage 
                ? { name: user.name, image: user.image } 
                : selectedChat.participantInfo[message.senderId] || { name: 'Unknown User' };
              
              return (
                <div 
                  key={message.id} 
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} max-w-[80%]`}>
                    <div className={`flex-shrink-0 ${isOwnMessage ? 'ml-2' : 'mr-2'}`}>
                      <Avatar 
                        src={senderInfo.image}
                        name={senderInfo.name}
                        userId={message.senderId}
                        size="sm"
                      />
                    </div>
                    <div 
                      className={`
                        ${isOwnMessage 
                          ? 'bg-blue-600 text-white rounded-tl-lg rounded-tr-sm rounded-bl-lg rounded-br-lg' 
                          : 'bg-white text-gray-800 rounded-tl-sm rounded-tr-lg rounded-bl-lg rounded-br-lg'}
                        p-3 shadow-sm
                      `}
                    >
                      {/* Reply reference if exists */}
                      {message.replyTo && (
                        <div 
                          className={`
                            mb-2 text-xs p-2 border-l-2 rounded
                            ${isOwnMessage 
                              ? 'bg-blue-700 border-blue-400' 
                              : 'bg-gray-100 border-gray-300 text-gray-600'}
                          `}
                        >
                          <div className="font-medium">
                            {message.replyTo.senderId === user.id ? 'You' : selectedChat.participantInfo[message.replyTo.senderId]?.name || 'Unknown User'}
                          </div>
                          <div className="truncate">
                            {message.replyTo.content.length > 60 
                              ? message.replyTo.content.substring(0, 60) + '...' 
                              : message.replyTo.content}
                          </div>
                        </div>
                      )}
                      
                      {/* Message content */}
                      {message.type === 'text' ? (
                        <p className="whitespace-pre-wrap break-words">
                          {message.deleted ? (
                            <span className="italic opacity-70">{message.content}</span>
                          ) : (
                            message.content
                          )}
                        </p>
                      ) : (
                        message.deleted ? (
                          <span className="italic opacity-70">This image was deleted</span>
                        ) : (
                          <div className="relative">
                            <img 
                              src={message.content} 
                              alt="Message image" 
                              className="rounded max-w-full max-h-60 object-contain" 
                              onClick={() => window.open(message.content, '_blank')}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        )
                      )}
                      
                      {/* Message time */}
                      <div 
                        className={`
                          text-xs mt-1
                          ${isOwnMessage ? 'text-blue-100' : 'text-gray-600'}
                        `}
                      >
                        {formatMessageTime(message.timestamp)}
                      </div>
                    </div>
                    
                    {/* Message actions */}
                    {!message.deleted && (
                      <div 
                        className={`
                          flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity mb-2
                          ${isOwnMessage ? 'mr-2' : 'ml-2'}
                        `}
                      >
                        <button 
                          onClick={() => setReplyingTo(message)}
                          className="p-1 text-gray-600 hover:text-blue-600 rounded-full hover:bg-gray-100"
                        >
                          <ReplyIcon className="h-4 w-4" />
                        </button>
                        
                        {isOwnMessage && (
                          <button 
                            onClick={() => handleDeleteMessage(message)}
                            className="p-1 text-gray-600 hover:text-red-600 rounded-full hover:bg-gray-100 mt-1"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Reply indicator */}
      {replyingTo && (
        <div className="bg-gray-100 p-2 border-t border-gray-200 flex items-center">
          <div className="flex-1 flex items-center">
            <ReplyIcon className="h-4 w-4 text-gray-600 mr-2" />
            <div className="text-sm text-gray-700 truncate">
              <span className="font-medium">
                Replying to {replyingTo.senderId === user.id ? 'yourself' : selectedChat.participantInfo[replyingTo.senderId]?.name || 'Unknown User'}:
              </span>{' '}
              {replyingTo.type === 'text' 
                ? truncateText(replyingTo.content, 50)
                : 'an image'}
            </div>
          </div>
          <button 
            onClick={() => setReplyingTo(null)}
            className="p-1 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-200"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {/* Input area */}
      <div className="p-3 border-t border-gray-200 bg-white flex items-end">
        <button
          onClick={triggerFileInput}
          className="p-2 rounded-full text-gray-600 hover:text-gray-800 hover:bg-gray-100 mr-2"
        >
          <ImageIcon className="h-5 w-5" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        <div className="flex-1 relative">
          <textarea
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={1}
            style={{ minHeight: '42px', maxHeight: '120px' }}
          />
        </div>
        <button
          onClick={handleSendMessage}
          disabled={(!messageInput.trim() && !replyingTo) || isSubmitting}
          className={`ml-2 p-2 rounded-full ${
            (!messageInput.trim() && !replyingTo) || isSubmitting
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <SendIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
} 