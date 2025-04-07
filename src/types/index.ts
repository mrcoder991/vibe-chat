import { Timestamp } from "firebase/firestore";

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  status?: "online" | "offline";
  lastActive?: Timestamp;
}

export interface ChatInvite {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: Timestamp;
}

export interface Chat {
  id: string;
  participants: string[]; // Array of user IDs
  participantInfo: {
    [key: string]: {
      name: string;
      image?: string | null;
    };
  };
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: Timestamp;
    type: "text" | "image";
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: "text" | "image";
  replyTo?: {
    id: string;
    content: string;
    senderId: string;
  };
  timestamp: Timestamp;
  read: boolean;
  deleted: boolean;
}

export type NotificationType = "invite" | "message" | "accepted"; 