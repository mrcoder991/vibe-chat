"use client";

import React from "react";
import Image from "next/image";
import { CheckIcon, CheckCheckIcon } from "lucide-react";
import Avatar from "./Avatar";
import { formatMessageTime } from "@/lib/utils";
import { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  senderInfo: { name: string; image?: string | null };
  selectedMessageId: string | null;
  onTouchStart: (messageId: string) => void;
  onTouchEnd: () => void;
  onTouchMove: () => void;
  onSetReplyingTo: (message: Message) => void;
  onDelete: (message: Message) => void;
  onImageClick: (imageUrl: string) => void;
  chatParticipantInfo: Record<string, { name: string; image?: string | null }>;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  senderInfo,
  selectedMessageId,
  onTouchStart,
  onTouchEnd,
  onTouchMove,
  onSetReplyingTo,
  onDelete,
  onImageClick,
  chatParticipantInfo,
}) => {
  const isMessageSelected = selectedMessageId === message.id;

  return (
    <div
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex ${
          isOwnMessage ? "flex-row-reverse" : "flex-row"
        } max-w-[90%] md:max-w-[80%] group relative`}
        onTouchStart={() => onTouchStart(message.id)}
        onTouchEnd={onTouchEnd}
        onTouchMove={onTouchMove}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          className={`flex-shrink-0 ${
            isOwnMessage ? "ml-2" : "mr-2"
          } self-end hidden sm:block`}
        >
          <Avatar
            src={senderInfo.image}
            name={senderInfo.name}
            userId={message.senderId}
            size="sm"
          />
        </div>
        <div
          className={`
            ${
              isOwnMessage
                ? "bg-blue-600 dark:bg-blue-700 text-white rounded-tl-lg rounded-tr-sm rounded-bl-lg rounded-br-lg"
                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-sm rounded-tr-lg rounded-bl-lg rounded-br-lg"
            }
            p-3 shadow-sm
          `}
        >
          {/* Reply reference if exists */}
          {message.replyTo && (
            <div
              className={`
                mb-2 pt-1 pb-1 pr-2 border-l-4 rounded relative overflow-hidden
                ${
                  isOwnMessage
                    ? "border-blue-300 bg-blue-700 dark:bg-blue-800"
                    : "border-gray-300 bg-gray-100 dark:bg-gray-700"
                }
              `}
            >
              <div className="pl-2">
                <div className={`font-medium text-xs ${isOwnMessage ? "text-blue-200" : "text-gray-600 dark:text-gray-300"} select-none`}>
                  {message.replyTo.senderId === message.senderId
                    ? "You"
                    : chatParticipantInfo[message.replyTo.senderId]?.name || "Unknown User"}
                </div>
                {message.replyTo.type === "image" ||
                (message.replyTo.content &&
                  message.replyTo.content.startsWith(
                    "https://ik.imagekit.io/"
                  )) ? (
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded overflow-hidden mr-2">
                      <Image
                        src={message.replyTo.content}
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
                    <span className={`text-xs ${isOwnMessage ? "text-blue-100" : "text-gray-500 dark:text-gray-400"} select-none`}>Photo</span>
                  </div>
                ) : (
                  <div className={`text-xs ${isOwnMessage ? "text-blue-100" : "text-gray-500 dark:text-gray-400"} line-clamp-3 pr-4 select-none`}>
                    {message.replyTo.content}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Message content */}
          {message.type === "text" ? (
            <p className="whitespace-pre-wrap break-words">
              {message.deleted ? (
                <span className="italic opacity-70 select-none">
                  {message.content}
                </span>
              ) : (
                message.content
              )}
            </p>
          ) : message.deleted ? (
            <span className="italic opacity-70 select-none">
              This image was deleted
            </span>
          ) : (
            <div
              className={`
                rounded-md overflow-hidden 
                ${isOwnMessage ? "bg-blue-700 dark:bg-blue-800" : "bg-gray-100 dark:bg-gray-700"} 
                p-1 max-w-[240px]
              `}
            >
              <div className="relative aspect-auto select-none">
                <Image
                  src={message.content}
                  alt="Message image"
                  className="object-contain rounded-md w-full h-auto cursor-pointer"
                  width={240}
                  height={180}
                  onClick={() => onImageClick(message.content)}
                  onContextMenu={(e) => e.preventDefault()}
                  onError={(e) => {
                    console.error("Error loading image:", e);
                    // Replace with error placeholder
                    const target = e.target as HTMLImageElement;
                    target.src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E';
                    // Add padding and styling for error state
                    target.parentElement?.classList.add(
                      "p-8",
                      "flex",
                      "justify-center",
                      "items-center",
                      "bg-gray-200",
                      "dark:bg-gray-600"
                    );
                    // Add error message below
                    const errorMsg = document.createElement("div");
                    errorMsg.innerText = "Image failed to load";
                    errorMsg.className =
                      "text-xs text-red-500 dark:text-red-400 text-center mt-1";
                    target.parentElement?.parentElement?.appendChild(
                      errorMsg
                    );
                  }}
                />
              </div>
            </div>
          )}

          {/* Message time and read receipt */}
          <div
            className={`
              text-xs mt-1 flex items-center space-x-1 justify-end
              ${isOwnMessage ? "text-blue-100" : "text-gray-600 dark:text-gray-400"}
            `}
          >
            <span className="select-none">{formatMessageTime(message.timestamp)}</span>
            {isOwnMessage && (
              <span
                className="ml-1 flex items-center transition-opacity"
                title={message.read ? "Read" : "Delivered"}
              >
                {message.read ? (
                  <CheckCheckIcon
                    className="h-4 w-4 text-green-300 dark:text-green-400"
                    aria-label="Read"
                  />
                ) : (
                  <CheckIcon
                    className="h-4 w-4 text-blue-200 dark:text-blue-300 opacity-70"
                    aria-label="Delivered"
                  />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Message actions - now visible on hover AND when selected */}
        {!message.deleted && (
          <div
            className={`
              flex items-end transition-opacity mb-2 sm:mb-0
              ${isOwnMessage ? "mr-2" : "ml-2"}
              ${
                isMessageSelected
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              }
            `}
          >
            <div className="bg-white dark:bg-gray-800 rounded-full shadow p-1 flex flex-row sm:flex-col space-x-1 sm:space-x-0 sm:space-y-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSetReplyingTo(message);
                }}
                className="p-1 sm:p-1 md:p-1 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Reply to message"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="h-5 w-5 sm:h-4 sm:w-4"
                >
                  <polyline points="9 17 4 12 9 7"></polyline>
                  <path d="M20 18v-2a4 4 0 0 0-4-4H4"></path>
                </svg>
              </button>

              {isOwnMessage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(message);
                  }}
                  className="p-1 sm:p-1 md:p-1 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 mt-0 sm:mt-1"
                  aria-label="Delete message"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="h-5 w-5 sm:h-4 sm:w-4"
                  >
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble; 