'use client';

import { auth, db } from '@/lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { User } from '@/types';
import { toast } from 'react-hot-toast';
import { saveCurrentUserToLocalStorage } from '@/lib/notificationUtils';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | undefined;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Initialize with true to prevent flashing of unauthenticated state
  const [initialLoading, setInitialLoading] = useState(true);
  const [firebaseUser, loading, error] = useAuthState(auth);
  const [firestoreError, setFirestoreError] = useState<Error | null>(null);

  // Handle initial loading state
  useEffect(() => {
    // After first auth check completes, set initialLoading to false
    if (!loading) {
      // Add a small delay to ensure Firebase has time to fully initialize
      const timer = setTimeout(() => {
        setInitialLoading(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [loading]);
  
  useEffect(() => {
    const setupUser = async (fbUser: FirebaseUser) => {
      try {
        console.log("Setting up user from Firebase auth:", fbUser.uid);
        
        // Create user data structure even if Firestore operations fail
        // This ensures basic app functionality without Firestore
        const userData: User = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Anonymous User',
          email: fbUser.email || '',
          image: fbUser.photoURL || '',
          status: 'online',
        };

        // Store in state immediately to allow app to function
        setUser(userData);
        
        // Save user info to localStorage for notification filtering
        saveCurrentUserToLocalStorage(userData);

        // Set a timeout for Firestore operations
        const firestoreTimeout = setTimeout(() => {
          console.warn("Firestore operations timed out");
          setFirestoreError(new Error("Firestore operations timed out. You may have an adblocker preventing connections."));
        }, 10000);

        try {
          // Check if user exists in database, if not create
          const userRef = doc(db, 'users', fbUser.uid);
          const userSnap = await getDoc(userRef);

          clearTimeout(firestoreTimeout);

          // Create a Firestore-safe version of userData
          const firestoreUserData = {
            ...userData,
            // Ensure no undefined values
            image: userData.image || null, // Firestore accepts null but not undefined
          };

          // Use batch writes for better error handling
          const batch = writeBatch(db);

          if (!userSnap.exists()) {
            console.log("Creating new user document in Firestore");
            // Prepare batch operation to create new user document
            batch.set(userRef, {
              ...firestoreUserData,
              createdAt: serverTimestamp(),
              lastActive: serverTimestamp(),
            });
          } else {
            console.log("User already exists, updating online status");
            // Prepare batch operation to update online status
            batch.update(userRef, {
              status: 'online',
              lastActive: serverTimestamp(),
            });
          }

          // Execute the batch
          await batch.commit().catch(err => {
            console.error("Batch commit error:", err);
            throw new Error("Could not update user data in Firestore.");
          });

        } catch (firestoreError) {
          console.error("Firestore error:", firestoreError);
          clearTimeout(firestoreTimeout);
          setFirestoreError(firestoreError instanceof Error ? firestoreError : new Error("Unknown Firestore error"));
          
          // Show a warning to the user but still allow app to function
          toast.error("Could not update user profile. Some features may be limited.");
        }
      } catch (error) {
        console.error("Error setting up user:", error);
        // Still keep the user logged in with basic data
      }
    };

    if (firebaseUser) {
      setupUser(firebaseUser).catch(err => {
        console.error("Setup user failed:", err);
        // Still set basic user data
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Anonymous User',
          email: firebaseUser.email || '',
          image: firebaseUser.photoURL || '',
          status: 'online',
        });
      });
    } else {
      if (!loading) {
        console.log("No Firebase user detected, setting user to null");
        setUser(null);
      }
    }

    // Handle user going offline
    return () => {
      if (firebaseUser) {
        try {
          // Don't await this operation to avoid blocking unmount
          // If it fails, it's not critical
          const userRef = doc(db, 'users', firebaseUser.uid);
          setDoc(userRef, {
            status: 'offline',
            lastActive: serverTimestamp(),
          }, { merge: true }).catch(err => {
            console.error("Error setting offline status:", err);
          });
        } catch (error) {
          console.error("Error in cleanup function:", error);
        }
      }
    };
  }, [firebaseUser, loading]);

  const signOut = async () => {
    if (firebaseUser) {
      try {
        // Set user as offline before signing out
        const userRef = doc(db, 'users', firebaseUser.uid);
        await setDoc(userRef, {
          status: 'offline',
          lastActive: serverTimestamp(),
        }, { merge: true }).catch(err => {
          console.error("Error setting offline status during signout:", err);
          // Continue with sign out even if setting offline fails
        });
      } catch (error) {
        console.error("Error setting offline status during signout:", error);
        // Continue with sign out even if setting offline status fails
      }
    }
    return auth.signOut();
  };

  // Combine Firebase loading state with our initialLoading state
  const isLoading = loading || initialLoading;

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading: isLoading, 
        error: error || firestoreError || undefined, 
        signOut 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 