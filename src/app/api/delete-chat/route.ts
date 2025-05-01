import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import imagekit from '@/lib/imagekit';
import * as admin from 'firebase-admin';

export async function POST(request: Request) {
  try {
    const { chatId } = await request.json();
    
    if (!chatId) {
      return NextResponse.json(
        { success: false, message: 'Chat ID is required' },
        { status: 400 }
      );
    }
    
    // Batch deletes for better performance
    const batchSize = 500;
    
    // 1. Get all messages in the chat
    const messagesQuery = adminDb.collection('messages').where('chatId', '==', chatId);
    const messagesSnapshot = await messagesQuery.get();
    
    if (messagesSnapshot.empty) {
      // No messages to delete
      
      // Update the chat's lastMessage to indicate empty chat
      await adminDb.collection('chats').doc(chatId).update({
        lastMessage: {
          content: "No messages",
          senderId: "",
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          type: "system"
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return NextResponse.json({ success: true, count: 0 });
    }
    
    console.log(`Found ${messagesSnapshot.size} messages to delete in chat ${chatId}`);
    
    // Delete image attachments first
    const imagePromises: Promise<any>[] = [];
    
    messagesSnapshot.docs.forEach(doc => {
      const messageData = doc.data();
      if (messageData.type === 'image' && messageData.imageId) {
        // Delete from ImageKit - we don't need to await each one
        imagePromises.push(
          imagekit.deleteFile(messageData.imageId)
            .catch(err => console.warn(`Failed to delete image ${messageData.imageId}:`, err))
        );
      }
    });
    
    // Wait for all image deletions to complete
    await Promise.allSettled(imagePromises);
    
    // Delete messages in batches
    let batch = adminDb.batch();
    let batchCount = 0;
    let totalDeleted = 0;
    
    for (const doc of messagesSnapshot.docs) {
      batch.delete(doc.ref);
      batchCount++;
      totalDeleted++;
      
      // Commit when batch reaches limit
      if (batchCount >= batchSize) {
        await batch.commit();
        batch = adminDb.batch();
        batchCount = 0;
      }
    }
    
    // Commit any remaining deletes
    if (batchCount > 0) {
      await batch.commit();
    }
    
    // Update the chat's lastMessage to indicate empty chat
    await adminDb.collection('chats').doc(chatId).update({
      lastMessage: {
        content: "No messages",
        senderId: "",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        type: "system"
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return NextResponse.json({ success: true, count: totalDeleted });
  } catch (error) {
    console.error('Error in delete-chat route:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete chat messages' },
      { status: 500 }
    );
  }
} 