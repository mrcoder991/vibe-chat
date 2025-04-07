'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

export default function FirebaseErrorHandler() {
  const [showWarning, setShowWarning] = useState(false);
  const [showPermissionWarning, setShowPermissionWarning] = useState(false);

  useEffect(() => {
    // Check for error messages in console that might indicate blocked requests
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError(...args);
      
      // Check for Firebase/Firestore connection errors in console messages
      const errorMessage = args.join(' ');
      
      // Check for general Firebase connection issues
      if (
        errorMessage.includes('ERR_BLOCKED_BY_CLIENT') ||
        (errorMessage.includes('Firebase') && 
         errorMessage.includes('error')) ||
        (errorMessage.includes('Firestore') && 
         (errorMessage.includes('failed') || errorMessage.includes('error')))
      ) {
        // Don't set warning for 404 errors on diagnostic requests
        if (!errorMessage.includes('google.firestore.v1.Firestore/Listen') || 
            !errorMessage.includes('404')) {
          setShowWarning(true);
        }
      }
      
      // Specifically check for permission errors with marking messages as read
      if (
        errorMessage.includes('Missing or insufficient permissions') &&
        (errorMessage.includes('markMessagesAsRead') || errorMessage.includes('Error marking messages as read'))
      ) {
        setShowPermissionWarning(true);
      }
    };
    
    // Restore original console.error on cleanup
    return () => {
      console.error = originalConsoleError;
    };
  }, []);
  
  // Show a toast notification if Firebase connections appear to be blocked
  useEffect(() => {
    if (showWarning) {
      toast.error(
        (t) => (
          <div>
            <p className="font-bold">Connection Issue Detected</p>
            <p className="text-sm mt-1">
              It appears an ad blocker or privacy extension might be blocking connections to Firebase.
              This can prevent the app from working properly.
            </p>
            <div className="mt-2">
              <button 
                className="bg-blue-600 text-white px-3 py-1 rounded text-xs mr-2"
                onClick={() => toast.dismiss(t.id)}
              >
                Dismiss
              </button>
              <button 
                className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-xs"
                onClick={() => {
                  window.open('https://console.firebase.google.com', '_blank');
                  toast.dismiss(t.id);
                }}
              >
                Learn More
              </button>
            </div>
          </div>
        ),
        {
          duration: 10000,
          style: {
            maxWidth: '500px',
          },
        }
      );
    }
  }, [showWarning]);
  
  // Show specific guidance for the permission error related to markMessagesAsRead
  useEffect(() => {
    if (showPermissionWarning) {
      toast(
        (t) => (
          <div>
            <p className="font-bold text-amber-600">Firestore Permissions Issue</p>
            <p className="text-sm mt-1">
              There&apos;s a permissions issue with marking messages as read. To fix this, update your Firestore rules:
            </p>
            <pre className="bg-gray-100 p-2 text-xs mt-2 rounded overflow-x-auto">
{`match /messages/{messageId} {
  // Allow read access if user is a participant in the chat
  allow read: if request.auth != null && 
    exists(/databases/$(database)/documents/chats/$(resource.data.chatId)) && 
    request.auth.uid in get(/databases/$(database)/documents/chats/$(resource.data.chatId)).data.participants;
  
  // Allow create if user is sender
  allow create: if request.auth != null && request.auth.uid == request.resource.data.senderId;
  
  // Allow update on own messages
  allow update: if request.auth != null && 
    (request.auth.uid == resource.data.senderId ||
    // Allow marking messages as read if user is a participant in the chat
    (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']) && 
     exists(/databases/$(database)/documents/chats/$(resource.data.chatId)) &&
     request.auth.uid in get(/databases/$(database)/documents/chats/$(resource.data.chatId)).data.participants));
}`}
            </pre>
            <div className="mt-2">
              <button 
                className="bg-amber-600 text-white px-3 py-1 rounded text-xs mr-2"
                onClick={() => {
                  toast.dismiss(t.id);
                  navigator.clipboard.writeText(`match /messages/{messageId} {
  // Allow read access if user is a participant in the chat
  allow read: if request.auth != null && 
    exists(/databases/$(database)/documents/chats/$(resource.data.chatId)) && 
    request.auth.uid in get(/databases/$(database)/documents/chats/$(resource.data.chatId)).data.participants;
  
  // Allow create if user is sender
  allow create: if request.auth != null && request.auth.uid == request.resource.data.senderId;
  
  // Allow update on own messages
  allow update: if request.auth != null && 
    (request.auth.uid == resource.data.senderId ||
    // Allow marking messages as read if user is a participant in the chat
    (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']) && 
     exists(/databases/$(database)/documents/chats/$(resource.data.chatId)) &&
     request.auth.uid in get(/databases/$(database)/documents/chats/$(resource.data.chatId)).data.participants));
}`);
                  toast.success("Rules copied to clipboard!");
                }}
              >
                Copy Rules
              </button>
              <button 
                className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-xs"
                onClick={() => toast.dismiss(t.id)}
              >
                Dismiss
              </button>
            </div>
          </div>
        ),
        {
          duration: 20000,
          style: {
            maxWidth: '600px',
          },
        }
      );
    }
  }, [showPermissionWarning]);
  
  // This component doesn't render anything
  return null;
} 