"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAppStore } from "@/store/useAppStore";
import Avatar from "@/components/ui/Avatar";
import {
  deleteMessage,
  sendImageMessage,
  sendTextMessage,
  markMessagesAsRead,
  deleteAllChatMessages,
} from "@/lib/firebaseUtils";
import {
  ImageIcon,
  SendIcon,
  XIcon,
  ReplyIcon,
  Menu,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Message } from "@/types";
import Image from "next/image";
import ImageModal from "../ui/ImageModal";
import ConfirmModal from "../ui/ConfirmModal";
import MenuDropdown from "../ui/MenuDropdown";
import { Timestamp } from "firebase/firestore";
import MessageBubble from "../ui/MessageBubble";
import { isToday, isYesterday, format } from "date-fns";

// Helper function to format message date for grouping
const formatMessageDate = (timestamp: Timestamp | null | undefined) => {
  if (!timestamp) return "Unknown Date";
  
  try {
    const date = timestamp.toDate();
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  } catch (error) {
    console.warn("Error formatting date:", error);
    return "Unknown Date";
  }
};

export default function ChatArea() {
  const { user } = useAuth();
  const {
    selectedChatId,
    chats,
    currentChatMessages,
    replyingTo,
    subscribeToSelectedChatMessages,
    setReplyingTo,
    addMessage,
    updateMessage,
    clearCurrentChatMessages,
  } = useAppStore();
  const [messageInput, setMessageInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null
  );
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isLoadingMore = false; // Using a constant instead of state since it's not being updated
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteMessageConfirm, setShowDeleteMessageConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);

  // Clear selected message when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setSelectedMessageId(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Show mobile gesture hint for first-time users
  useEffect(() => {
    const hasShownMobileHint = localStorage.getItem(
      "hasShownMobileMessageHint"
    );

    // Only show on mobile/touch devices and if we haven't shown it before
    if (
      !hasShownMobileHint &&
      currentChatMessages.length > 0 &&
      "ontouchstart" in window
    ) {
      setTimeout(() => {
        toast("💡 Tip: Long-press on any message to reply or delete.", {
          duration: 5000,
        });
        localStorage.setItem("hasShownMobileMessageHint", "true");
      }, 2000);
    }
  }, [currentChatMessages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  // Mark messages as read when document becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && selectedChatId && user) {
        // Add a small delay to make sure the user is actually looking at the chat
        // and not just switching between tabs briefly
        setTimeout(() => {
          // Check again if document is still visible and chat is still selected
          if (document.visibilityState === "visible" && selectedChatId) {
            markMessagesAsRead(selectedChatId, user.id).catch((error) => {
              console.warn(
                "Non-critical error marking messages as read on visibility change:",
                error
              );
            });
          }
        }, 2000); // 2 second delay to ensure user is actually looking at the chat
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Initial check when component mounts - only mark as read after a delay
    if (document.visibilityState === "visible" && selectedChatId && user) {
      // Add a delay to ensure user has time to actually look at the messages
      setTimeout(() => {
        if (document.visibilityState === "visible" && selectedChatId) {
          markMessagesAsRead(selectedChatId, user.id).catch((error) => {
            console.warn(
              "Non-critical error marking messages as read on initial load:",
              error
            );
          });
        }
      }, 3000); // 3 second delay on initial load
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [selectedChatId, user]);

  if (!selectedChat || !selectedChatId || !user) {
    return null;
  }

  // Find the other participant in the conversation
  const otherParticipantId =
    selectedChat.participants.find((id) => id !== user.id) || "";
  const otherParticipantInfo = selectedChat.participantInfo[
    otherParticipantId
  ] || { name: "Unknown User" };

  const handleSendMessage = async () => {
    if (!messageInput.trim() && !replyingTo) return;

    setIsSubmitting(true);
    try {
      let replyToInfo:
        | {
            id: string;
            content: string;
            senderId: string;
            type?: "text" | "image";
          }
        | undefined = undefined;
      if (replyingTo) {
        replyToInfo = {
          id: replyingTo.id,
          content: replyingTo.content,
          senderId: replyingTo.senderId,
          type: replyingTo.type,
        };
      }

      const messageId = await sendTextMessage(
        selectedChatId,
        user.id,
        messageInput,
        replyToInfo
      );

      // Clear input and reply state
      setMessageInput("");
      setReplyingTo(null);

      // Optimistically add the message to UI
      addMessage({
        id: messageId,
        chatId: selectedChatId,
        senderId: user.id,
        content: messageInput,
        type: "text",
        replyTo: replyToInfo,
        timestamp: Timestamp.now(),
        read: false,
        deleted: false,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendImage = async (file: File) => {
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    setIsSubmitting(true);
    try {
      let replyToInfo:
        | {
            id: string;
            content: string;
            senderId: string;
            type?: "text" | "image";
          }
        | undefined = undefined;
      if (replyingTo) {
        replyToInfo = {
          id: replyingTo.id,
          content: replyingTo.content,
          senderId: replyingTo.senderId,
          type: replyingTo.type,
        };
      }

      await sendImageMessage(selectedChatId, user.id, file, replyToInfo);

      // Clear reply state
      setReplyingTo(null);

      toast.success("Image sent successfully");
    } catch (error) {
      console.error("Error sending image:", error);
      toast.error("Failed to send image. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMessage = async (message: Message) => {
    setMessageToDelete(message);
    setShowDeleteMessageConfirm(true);
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;
    
    try {
      await deleteMessage(messageToDelete.id);

      // Update message in UI
      updateMessage(messageToDelete.id, {
        deleted: true,
        content: messageToDelete.type === "text" ? "This message was deleted" : "",
      });

      // If replying to this message, cancel reply
      if (replyingTo?.id === messageToDelete.id) {
        setReplyingTo(null);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message. Please try again.");
    } finally {
      setShowDeleteMessageConfirm(false);
      setMessageToDelete(null);
    }
  };

  const cancelDeleteMessage = () => {
    setShowDeleteMessageConfirm(false);
    setMessageToDelete(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
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
      fileInputRef.current.value = "";
    }
  };

  // Handle opening an image in the modal
  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  // Handle closing the image modal
  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  // Handle long press for mobile devices
  const handleTouchStart = (messageId: string) => {
    touchStartTimeRef.current = Date.now();
    touchTimeoutRef.current = setTimeout(() => {
      setSelectedMessageId(messageId);
      // Add haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms long press
  };

  const handleTouchEnd = () => {
    if (touchTimeoutRef.current) {
      // If touch ended before the long press timeout, clear it
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
  };

  const handleTouchMove = () => {
    // Cancel long press if user moves finger
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
  };

  // Handle deleting all messages in the chat
  const handleDeleteChat = async () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteChat = async () => {
    try {
      setIsSubmitting(true);
      const success = await deleteAllChatMessages(selectedChatId);
      
      if (success) {
        // This will trigger a refresh via the real-time listener,
        // but we'll also clear locally just to be immediate
        clearCurrentChatMessages();
        toast.success("All messages have been permanently deleted");
      } else {
        toast.error("Failed to delete messages");
      }
    } catch (error) {
      console.error("Error deleting chat messages:", error);
      toast.error("An error occurred while deleting messages");
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  const cancelDeleteChat = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() =>
              document.dispatchEvent(new CustomEvent("toggle-sidebar"))
            }
            className="md:hidden mr-3 p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Avatar
            src={otherParticipantInfo.image}
            name={otherParticipantInfo.name}
            userId={otherParticipantId}
            size="md"
          />
          <div className="ml-3">
            <p className="font-medium dark:text-white">{otherParticipantInfo.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MenuDropdown 
            items={[
              {
                label: "Delete all messages", 
                icon: <Trash2 className="h-4 w-4" />,
                onClick: handleDeleteChat,
                isDestructive: true,
                disabled: isSubmitting
              }
              // Add more menu items here in the future
            ]} 
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Messages area with virtualization */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 md:p-4 p-2 bg-gray-50 dark:bg-gray-900 relative"
      >
        {currentChatMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {/* Loading indicator at the top */}
            {isLoadingMore && (
              <div className="flex justify-center py-4 sticky top-0">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 dark:border-blue-400"></div>
              </div>
            )}
            
            <div className="space-y-3">
              {currentChatMessages
                .filter(message => message && message.id) // Filter out any invalid messages
                .reduce((elements: React.ReactElement[], message, index, array) => {
                // Add date separator if needed
                if (index === 0 || 
                    formatMessageDate(message.timestamp) !== 
                    formatMessageDate(array[index - 1].timestamp)) {
                  elements.push(
                    <div key={`date-${message.id}`} className="flex justify-center my-4">
                      <div className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full text-sm text-gray-600 dark:text-gray-300">
                        {formatMessageDate(message.timestamp)}
                      </div>
                    </div>
                  );
                }
                
                // Add the message bubble
                elements.push(
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwnMessage={message.senderId === user.id}
                    senderInfo={
                      message.senderId === user.id
                        ? { name: user.name, image: user.image }
                        : selectedChat.participantInfo[message.senderId] || {
                            name: "Unknown User",
                          }
                    }
                    selectedMessageId={selectedMessageId}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchMove}
                    onSetReplyingTo={setReplyingTo}
                    onDelete={handleDeleteMessage}
                    onImageClick={handleImageClick}
                    chatParticipantInfo={selectedChat.participantInfo}
                  />
                );
                
                return elements;
              }, [])}
              <div ref={messagesEndRef} style={{ height: 20 }} />
            </div>
          </>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          isOpen={!!selectedImage}
          onClose={handleCloseModal}
        />
      )}

      {/* Confirm Delete All Messages Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete All Messages"
        message="Are you sure you want to permanently delete all messages? This action cannot be undone and will remove all messages for both users."
        confirmText="Delete All"
        cancelText="Cancel"
        onConfirm={confirmDeleteChat}
        onCancel={cancelDeleteChat}
        isDestructive={true}
      />

      {/* Confirm Delete Single Message Modal */}
      <ConfirmModal
        isOpen={showDeleteMessageConfirm}
        title="Delete Message"
        message="Are you sure you want to delete this message?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteMessage}
        onCancel={cancelDeleteMessage}
        isDestructive={true}
      />

      {/* Reply indicator */}
      {replyingTo && (
        <div className="bg-gray-100 dark:bg-gray-800 p-2 border-t border-gray-200 dark:border-gray-700 flex items-center">
          <div className="flex-1 flex bg-gray-200 dark:bg-gray-700 h-full rounded">
            <div className="pl-2 rounded border-l-4 border-blue-500 flex-1">
              <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium text-sm">
                <ReplyIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                {replyingTo.senderId === user.id
                  ? "You"
                  : selectedChat.participantInfo[replyingTo.senderId]?.name ||
                    "Unknown User"}
              </div>
              {replyingTo.type === "image" ||
              (replyingTo.content &&
                replyingTo.content.startsWith("https://ik.imagekit.io/")) ? (
                <div className="flex items-center justify-between gap-2 mt-1 w-full">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">🌃 Photo</span>
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400 text-sm line-clamp-3 pr-4">
                  {replyingTo.content}
                </div>
              )}
            </div>
          </div>
          {replyingTo.type === "image" ||
          (replyingTo.content &&
            replyingTo.content.startsWith("https://ik.imagekit.io/")) ? (
            <div className="w-15 h-15 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
              <Image
                src={replyingTo.content}
                alt="Photo"
                width={32}
                height={32}
                className="object-cover w-full h-full"
                onError={(e) => {
                  // Replace with placeholder on error
                  const target = e.target as HTMLImageElement;
                  target.src =
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E';
                }}
              />
            </div>
          ) : null}
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full flex-shrink-0 ml-2"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-end">
        <button
          onClick={triggerFileInput}
          className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 mr-2 flex-shrink-0"
          aria-label="Send image"
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
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-600 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-800"
            rows={1}
            style={{ minHeight: "42px", maxHeight: "120px" }}
          />
        </div>
        <button
          onClick={handleSendMessage}
          disabled={(!messageInput.trim() && !replyingTo) || isSubmitting}
          className={`ml-2 p-2 rounded-full flex-shrink-0 ${
            (!messageInput.trim() && !replyingTo) || isSubmitting
              ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              : "bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800"
          }`}
          aria-label="Send message"
        >
          <SendIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
