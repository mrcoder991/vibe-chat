import { db, storage } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
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
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
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
    
    // Create new invite
    const inviteRef = await addDoc(collection(db, 'invites'), {
      senderId,
      senderName,
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
    // Upload image to ImageKit via API
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', `${uuidv4()}_${file.name}`);
    formData.append('folder', `chat_images/${chatId}`);
    
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: JSON.stringify({
        image: await fileToBase64(file),
        fileName: `${uuidv4()}_${file.name}`,
        folder: `chat_images/${chatId}`
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload image');
    }
    
    const uploadResult = await response.json();
    const downloadUrl = uploadResult.url;
    const fileId = uploadResult.fileId;
    
    // Create message data without the replyTo field initially
    const messageData: any = {
      chatId,
      senderId,
      content: downloadUrl,
      type: 'image',
      timestamp: serverTimestamp(),
      read: false,
      deleted: false,
      imageId: fileId, // Store ImageKit fileId instead
    };
    
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

export const deleteMessage = async (messageId: string, chatId: string): Promise<boolean> => {
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
    
    // Get unread messages
    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      where('senderId', '!=', userId),
      where('read', '==', false)
    );
    const messagesSnapshot = await getDocs(messagesQuery);
    
    if (messagesSnapshot.empty) {
      return true; // No messages to mark as read
    }
    
    // Instead of updating all messages at once, do it one by one with error handling
    let successCount = 0;
    const totalMessages = messagesSnapshot.docs.length;
    
    for (const doc of messagesSnapshot.docs) {
      try {
        await updateDoc(doc.ref, { read: true });
        successCount++;
      } catch (updateError) {
        console.warn(`Could not mark message ${doc.id} as read:`, updateError);
        // Continue with other messages even if one fails
      }
    }
    
    // Return true if at least some messages were marked as read
    console.log(`Marked ${successCount}/${totalMessages} messages as read`);
    return successCount > 0;
    
  } catch (error) {
    console.error("Error marking messages as read:", error);
    // Don't throw the error, just return false
    return false;
  }
}; 