import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  deleteDoc,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { User, Chat, Message, ChatInvite } from '@/types';

// User Functions
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    console.log(`Searching for user with ID: ${userId}`);
    
    if (!userId || userId.trim() === '') {
      console.error("getUserById called with empty userId");
      return null;
    }
    
    const userRef = doc(db, 'users', userId);
    console.log(`User reference created for path: ${userRef.path}`);
    
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      console.log(`User found with ID: ${userId}`);
      return { id: userDoc.id, ...userDoc.data() } as User;
    } else {
      console.warn(`No user document found with ID: ${userId}`);
      return null;
    }
  } catch (error) {
    console.error(`Error getting user with ID ${userId}:`, error);
    return null;
  }
};

export const searchUsersByEmail = async (email: string): Promise<User[]> => {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', email)
    );
    const usersSnapshot = await getDocs(usersQuery);
    return usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as User));
  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
};

/**
 * Search for users by name or email
 * @param searchTerm - The term to search for (name or email)
 * @param currentUserId - The ID of the current user (to exclude from results)
 * @returns Promise<User[]> - A list of matching users
 */
export const searchUsers = async (searchTerm: string, currentUserId: string): Promise<User[]> => {
  try {
    console.log(`Searching for users with term: ${searchTerm}`);
    
    // Convert search term to lowercase for case-insensitive search
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    // Get all users from the database
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    // Convert the snapshot to an array of users
    const users: User[] = [];
    
    snapshot.forEach(doc => {
      const userData = doc.data();
      const user: User = {
        id: doc.id,
        name: userData.name || 'Unknown',
        email: userData.email || '',
        image: userData.image || null,
        status: userData.status || 'offline'
      };
      
      // Add the user to the array if it's not the current user
      if (user.id !== currentUserId) {
        users.push(user);
      }
    });
    
    // Filter users by search term (name or email containing the search term)
    const filteredUsers = users.filter(user => {
      const nameMatch = user.name.toLowerCase().includes(lowerSearchTerm);
      const emailMatch = user.email.toLowerCase().includes(lowerSearchTerm);
      return nameMatch || emailMatch;
    });
    
    console.log(`Found ${filteredUsers.length} users matching "${searchTerm}"`);
    
    return filteredUsers;
  } catch (error) {
    console.error('Error searching for users:', error);
    return [];
  }
};

// Chat Invitation Functions
export const sendChatInvite = async (
  senderId: string, 
  senderName: string,
  recipientId: string
): Promise<string> => {
  try {
    // Check if an invite already exists
    const invitesQuery = query(
      collection(db, 'invites'),
      where('senderId', '==', senderId),
      where('recipientId', '==', recipientId),
      where('status', '==', 'pending')
    );
    const existingInvites = await getDocs(invitesQuery);
    
    if (!existingInvites.empty) {
      return existingInvites.docs[0].id;
    }
    
    // Make sure we have a valid sender name
    let finalSenderName = senderName;
    if (!finalSenderName || finalSenderName.trim() === '') {
      // If senderName is empty, fetch it from the user document
      const senderDoc = await getDoc(doc(db, 'users', senderId));
      if (senderDoc.exists()) {
        finalSenderName = senderDoc.data().name || 'Unknown User';
      } else {
        finalSenderName = 'Unknown User';
      }
      console.log(`Retrieved sender name from user document: ${finalSenderName}`);
    }
    
    console.log(`Creating chat invite from ${finalSenderName} (${senderId}) to ${recipientId}`);
    
    // Create new invite
    const inviteRef = await addDoc(collection(db, 'invites'), {
      senderId,
      senderName: finalSenderName,
      recipientId,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    
    return inviteRef.id;
  } catch (error) {
    console.error("Error sending chat invite:", error);
    throw error;
  }
};

export const getPendingInvites = async (userId: string): Promise<ChatInvite[]> => {
  try {
    const invitesQuery = query(
      collection(db, 'invites'),
      where('recipientId', '==', userId),
      where('status', '==', 'pending')
    );
    const invitesSnapshot = await getDocs(invitesQuery);
    
    return invitesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as ChatInvite));
  } catch (error) {
    console.error("Error getting pending invites:", error);
    return [];
  }
};

export const updateInviteStatus = async (
  inviteId: string, 
  status: 'accepted' | 'declined'
): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'invites', inviteId), {
      status,
    });
    
    return true;
  } catch (error) {
    console.error("Error updating invite status:", error);
    return false;
  }
};

// Chat Functions
export const createChat = async (
  participants: string[],
  participantInfo: Chat['participantInfo']
): Promise<string> => {
  try {
    const chatRef = await addDoc(collection(db, 'chats'), {
      participants,
      participantInfo,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return chatRef.id;
  } catch (error) {
    console.error("Error creating chat:", error);
    throw error;
  }
};

export const getUserChats = async (userId: string): Promise<Chat[]> => {
  try {
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );
    const chatsSnapshot = await getDocs(chatsQuery);
    
    return chatsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Chat));
  } catch (error) {
    console.error("Error getting user chats:", error);
    return [];
  }
};

export const deleteChat = async (chatId: string): Promise<boolean> => {
  try {
    // First delete all messages in the chat
    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId)
    );
    const messagesSnapshot = await getDocs(messagesQuery);
    
    const messageDeletions = messagesSnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    
    await Promise.all(messageDeletions);
    
    // Then delete the chat itself
    await deleteDoc(doc(db, 'chats', chatId));
    
    return true;
  } catch (error) {
    console.error("Error deleting chat:", error);
    return false;
  }
};

// Message Functions
export const sendTextMessage = async (
  chatId: string,
  senderId: string,
  content: string,
  replyTo?: { id: string; content: string; senderId: string }
): Promise<string> => {
  try {
    // Create message data without the replyTo field initially
    const messageData: any = {
      chatId,
      senderId,
      content,
      type: 'text',
      timestamp: serverTimestamp(),
      read: false,
      deleted: false,
    };
    
    // Only add replyTo if all required fields are present and not undefined
    if (replyTo && replyTo.id && replyTo.content && replyTo.senderId) {
      messageData.replyTo = replyTo;
    }
    
    console.log('Sending new text message with read status: false');
    
    // Add message to messages collection
    const messageRef = await addDoc(collection(db, 'messages'), messageData);
    
    // Update chat's last message
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: {
        content,
        senderId,
        timestamp: Timestamp.now(),
        type: 'text',
      },
      updatedAt: serverTimestamp(),
    });
    
    return messageRef.id;
  } catch (error) {
    console.error("Error sending text message:", error);
    throw error;
  }
};

export const sendImageMessage = async (
  chatId: string,
  senderId: string,
  file: File,
  replyTo?: { id: string; content: string; senderId: string }
): Promise<string> => {
  try {
    // Generate a unique filename
    const uniqueFileName = `${uuidv4()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const folder = `chat_images/${chatId}`;
    
    console.log(`Uploading image: ${uniqueFileName} to folder: ${folder}`);
    
    // Convert file to base64
    const base64Image = await fileToBase64(file);
    
    // Upload image to ImageKit via API
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: JSON.stringify({
        image: base64Image,
        fileName: uniqueFileName,
        folder: folder
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Image upload failed:', errorData);
      throw new Error(`Failed to upload image: ${errorData}`);
    }
    
    const uploadResult = await response.json();
    
    if (!uploadResult.success) {
      throw new Error('Image upload was not successful');
    }
    
    const downloadUrl = uploadResult.url;
    const fileId = uploadResult.fileId;
    
    console.log(`Image uploaded successfully. URL: ${downloadUrl}, FileID: ${fileId}`);
    
    // Create message data with all necessary metadata
    const messageData: any = {
      chatId,
      senderId,
      content: downloadUrl,
      type: 'image',
      timestamp: serverTimestamp(),
      read: false,
      deleted: false,
      imageId: fileId,
      imageMeta: {
        originalName: file.name,
        size: file.size,
        type: file.type,
        width: 0, // We can't know this client-side easily
        height: 0, // We can't know this client-side easily
      }
    };
    
    console.log('Sending new image message with read status: false');
    
    // Only add replyTo if all required fields are present and not undefined
    if (replyTo && replyTo.id && replyTo.content && replyTo.senderId) {
      messageData.replyTo = replyTo;
    }
    
    // Add message to messages collection
    const messageRef = await addDoc(collection(db, 'messages'), messageData);
    
    // Update chat's last message
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: {
        content: 'Sent an image',
        senderId,
        timestamp: Timestamp.now(),
        type: 'image',
      },
      updatedAt: serverTimestamp(),
    });
    
    return messageRef.id;
  } catch (error) {
    console.error("Error sending image message:", error);
    throw error;
  }
};

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const getChatMessages = async (chatId: string): Promise<Message[]> => {
  try {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    );
    const messagesSnapshot = await getDocs(messagesQuery);
    
    return messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Message));
  } catch (error) {
    console.error("Error getting chat messages:", error);
    return [];
  }
};

// New function to subscribe to real-time message updates
export const subscribeToMessages = (
  chatId: string,
  callback: (messages: Message[]) => void,
  onError?: (error: Error) => void
): () => void => {
  try {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    );

    // Create a real-time listener
    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Message));
        callback(messages);
      },
      (error) => {
        console.error("Error in messages subscription:", error);
        if (onError) onError(error);
      }
    );

    // Return the unsubscribe function
    return unsubscribe;
  } catch (error) {
    console.error("Error setting up messages subscription:", error);
    if (onError) onError(error as Error);
    // Return a no-op function if setup failed
    return () => {};
  }
};

// New function to subscribe to real-time chat updates
export const subscribeToChats = (
  userId: string,
  callback: (chats: Chat[]) => void,
  onError?: (error: Error) => void
): () => void => {
  try {
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    // Create a real-time listener
    const unsubscribe = onSnapshot(
      chatsQuery,
      (snapshot) => {
        const chats = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Chat));
        callback(chats);
      },
      (error) => {
        console.error("Error in chats subscription:", error);
        if (onError) onError(error);
      }
    );

    // Return the unsubscribe function
    return unsubscribe;
  } catch (error) {
    console.error("Error setting up chats subscription:", error);
    if (onError) onError(error as Error);
    // Return a no-op function if setup failed
    return () => {};
  }
};

// New function to subscribe to real-time invites updates
export const subscribeToInvites = (
  userId: string,
  callback: (invites: ChatInvite[]) => void,
  onError?: (error: Error) => void
): () => void => {
  try {
    const invitesQuery = query(
      collection(db, 'invites'),
      where('recipientId', '==', userId),
      where('status', '==', 'pending')
    );

    // Create a real-time listener
    const unsubscribe = onSnapshot(
      invitesQuery,
      (snapshot) => {
        const invites = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as ChatInvite));
        callback(invites);
      },
      (error) => {
        console.error("Error in invites subscription:", error);
        if (onError) onError(error);
      }
    );

    // Return the unsubscribe function
    return unsubscribe;
  } catch (error) {
    console.error("Error setting up invites subscription:", error);
    if (onError) onError(error as Error);
    // Return a no-op function if setup failed
    return () => {};
  }
};

export const deleteMessage = async (messageId: string): Promise<boolean> => {
  try {
    const messageRef = doc(db, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (!messageDoc.exists()) {
      return false;
    }
    
    const messageData = messageDoc.data() as Message;
    
    // If it's an image, delete from ImageKit
    if (messageData.type === 'image' && 'imageId' in messageData) {
      const fileId = (messageData as any).imageId;
      
      // Call the ImageKit delete API
      const response = await fetch('/api/delete-image', {
        method: 'DELETE',
        body: JSON.stringify({ fileId }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.warn("Image deletion failed or already deleted:", await response.text());
      }
    }
    
    // Mark message as deleted in firestore
    await updateDoc(messageRef, {
      deleted: true,
      content: messageData.type === 'text' ? 'This message was deleted' : '',
    });
    
    return true;
  } catch (error) {
    console.error("Error deleting message:", error);
    return false;
  }
};

export const markMessagesAsRead = async (
  chatId: string, 
  userId: string
): Promise<boolean> => {
  try {
    console.log(`Marking messages as read in chat ${chatId} for user ${userId}`);
    
    // First, verify if the user is a participant in this chat
    // This is important to maintain security
    const chatRef = doc(db, 'chats', chatId);
    const chatDoc = await getDoc(chatRef);
    
    if (!chatDoc.exists()) {
      console.warn("Chat not found when marking messages as read");
      return false;
    }
    
    const chatData = chatDoc.data() as Chat;
    if (!chatData.participants.includes(userId)) {
      console.warn("User is not a participant in this chat");
      return false;
    }
    
    // Log the chat participants for debugging
    console.log(`Chat participants: ${chatData.participants.join(', ')}`);
    
    // Get unread messages sent by others (not by the current user)
    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      where('senderId', '!=', userId),  // Messages NOT sent by current user
      where('read', '==', false)        // Messages that haven't been read yet
    );
    const messagesSnapshot = await getDocs(messagesQuery);
    
    if (messagesSnapshot.empty) {
      console.log("No unread messages to mark as read");
      
      // For debugging: Let's also check if there are any messages at all in this chat
      const allMessagesQuery = query(
        collection(db, 'messages'),
        where('chatId', '==', chatId)
      );
      const allMessagesSnapshot = await getDocs(allMessagesQuery);
      console.log(`Total message count in chat: ${allMessagesSnapshot.docs.length}`);
      
      // Log details about each message in the chat for debugging
      if (allMessagesSnapshot.docs.length > 0) {
        console.log("Messages in this chat:");
        allMessagesSnapshot.docs.forEach(doc => {
          const message = doc.data();
          console.log(`- ID: ${doc.id}, Sender: ${message.senderId}, Read: ${message.read}, Content: ${message.content?.substring(0, 30)}${message.content?.length > 30 ? '...' : ''}`);
        });
      }
      
      return true; // No messages to mark as read
    }
    
    console.log(`Found ${messagesSnapshot.docs.length} unread messages to mark as read`);
    
    // Instead of updating all messages at once, do it one by one with error handling
    let successCount = 0;
    const totalMessages = messagesSnapshot.docs.length;
    
    for (const doc of messagesSnapshot.docs) {
      try {
        // Only mark messages as read if the document is actually visible
        // This ensures messages are only marked when user is actively viewing them
        if (document.visibilityState === 'visible') {
          await updateDoc(doc.ref, { read: true });
          successCount++;
          console.log(`Marked message ${doc.id} as read`);
        } else {
          console.log(`Skipping marking message ${doc.id} as read - document not visible`);
        }
      } catch (updateError) {
        console.warn(`Could not mark message ${doc.id} as read:`, updateError);
        // Continue with other messages even if one fails
      }
    }
    
    // Return true if at least some messages were marked as read
    console.log(`Marked ${successCount}/${totalMessages} messages as read`);
    
    // If we successfully marked any messages as read, try to update the unread count
    if (successCount > 0) {
      try {
        // This is assuming useAppStore has been imported - if it needs to be imported, do so at the top of the file
        // We use a small delay to ensure Firestore has time to update
        setTimeout(() => {
          import('@/store/useAppStore').then(({ useAppStore }) => {
            useAppStore.getState().calculateUnreadCounts(userId);
          });
        }, 200);
      } catch (countError) {
        console.warn("Could not update unread counts:", countError);
      }
    }
    
    return successCount > 0;
    
  } catch (error) {
    console.error("Error marking messages as read:", error);
    // Don't throw the error, just return false
    return false;
  }
};

// Subscribe to read status changes for messages sent by a specific user in a chat
export const subscribeToReadStatus = (
  chatId: string,
  userId: string,
  callback: (messageIds: string[]) => void,
  onError?: (error: Error) => void
): () => void => {
  try {
    // Query for messages sent by the user in the specified chat that have been read
    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      where('senderId', '==', userId),  // Messages sent by this user
      where('read', '==', true)         // That have been marked as read by recipient
    );

    console.log(`Setting up read status subscription for chat ${chatId}, user ${userId}`);

    // Create a real-time listener for read status changes
    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const readMessageIds = snapshot.docs.map(doc => doc.id);
        console.log(`Read status update: ${readMessageIds.length} messages marked as read`);
        if (readMessageIds.length > 0) {
          console.log(`Read message IDs: ${readMessageIds.join(', ')}`);
        }
        callback(readMessageIds);
      },
      (error) => {
        console.error("Error in read status subscription:", error);
        if (onError) onError(error);
      }
    );

    // Return the unsubscribe function
    return unsubscribe;
  } catch (error) {
    console.error("Error setting up read status subscription:", error);
    if (onError) onError(error as Error);
    // Return a no-op function if setup failed
    return () => {};
  }
};

// New function to update participant info in a chat
export const updateChatParticipantInfo = async (
  chatId: string,
  participantId: string,
  updates: Partial<{ name: string; image: string | null }>
): Promise<boolean> => {
  try {
    console.log(`Updating participant info for ${participantId} in chat ${chatId}:`, updates);
    
    // Get the current chat data
    const chatRef = doc(db, 'chats', chatId);
    const chatDoc = await getDoc(chatRef);
    
    if (!chatDoc.exists()) {
      console.error(`Chat ${chatId} not found`);
      return false;
    }
    
    const chatData = chatDoc.data() as Chat;
    
    // Verify the participant exists in this chat
    if (!chatData.participants.includes(participantId)) {
      console.error(`Participant ${participantId} not found in chat ${chatId}`);
      return false;
    }
    
    // Create the update object with the new participant info
    const updateObj = {
      [`participantInfo.${participantId}`]: {
        ...chatData.participantInfo[participantId],
        ...updates
      }
    };
    
    console.log('Updating with:', updateObj);
    
    // Update the chat document
    await updateDoc(chatRef, updateObj);
    
    console.log(`Successfully updated participant info for ${participantId} in chat ${chatId}`);
    return true;
  } catch (error) {
    console.error(`Error updating participant info in chat ${chatId}:`, error);
    return false;
  }
}; 