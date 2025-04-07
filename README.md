# Vibe Chat

A modern real-time chat application with user invitations and multimedia support. Built with Next.js, Firebase, and TypeScript.

## Features

- **User Authentication**: Secure email and password authentication
- **User Invitation System**: Connect with other users by sharing and accepting user IDs
- **Real-time Messaging**: Instant message delivery with read receipts
- **Image Sharing**: Send and receive images in your conversations
- **Message Quoting**: Reply to specific messages with context
- **Message & Chat Management**: Delete messages or entire conversations
- **Online Status**: See when your contacts are online or offline
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore)
- **Image Storage**: ImageKit
- **State Management**: Zustand
- **Form Handling**: React Hook Form
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account
- ImageKit account (free tier available)

### Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/vibe-chat.git
cd vibe-chat
```

2. Install dependencies:

```bash
npm install
```

3. Create a Firebase project:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Set up Authentication with Email/Password
   - Create a Firestore database
   - Get your Firebase config from Project Settings

4. Create an ImageKit account:
   - Go to [ImageKit.io](https://imagekit.io/)
   - Sign up for a free account
   - Get your Public Key, Private Key, and URL Endpoint from the Developer section

5. Create a `.env.local` file in the root directory with your configurations:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Next Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# ImageKit Configuration
IMAGEKIT_PUBLIC_KEY=your-public-key
IMAGEKIT_PRIVATE_KEY=your-private-key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

6. Update Firestore rules:

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /chats/{chatId} {
      allow read, write: if request.auth != null && request.auth.uid in resource.data.participants;
      allow create: if request.auth != null && request.auth.uid in request.resource.data.participants;
    }
    
    match /messages/{messageId} {
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/chats/$(resource.data.chatId)) && 
        request.auth.uid in get(/databases/$(database)/documents/chats/$(resource.data.chatId)).data.participants;
      
      allow create: if request.auth != null && request.auth.uid == request.resource.data.senderId;
      
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.senderId ||
        (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']) && 
         exists(/databases/$(database)/documents/chats/$(resource.data.chatId)) &&
         request.auth.uid in get(/databases/$(database)/documents/chats/$(resource.data.chatId)).data.participants));
      
      allow delete: if request.auth != null && request.auth.uid == resource.data.senderId;
    }
    
    match /invites/{inviteId} {
      allow read: if request.auth != null && (request.auth.uid == resource.data.senderId || request.auth.uid == resource.data.recipientId);
      allow create: if request.auth != null && request.auth.uid == request.resource.data.senderId;
      allow update: if request.auth != null && request.auth.uid == resource.data.recipientId;
    }
  }
}
```

7. Run the development server:

```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

This application can be easily deployed to Vercel:

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Configure the environment variables in the Vercel project settings
4. Deploy

## How to Use

1. Create an account or log in
2. Find your user ID in the bottom of the sidebar
3. Share your user ID with a friend
4. Start a new chat by clicking "New Chat" and entering a friend's user ID
5. Accept chat invitations from others
6. Exchange messages, images, and enjoy chatting!

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.