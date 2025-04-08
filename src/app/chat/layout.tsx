'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'react-hot-toast';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { 
    fetchChats, 
    fetchInvites, 
    subscribeToUserChats,
    subscribeToUserInvites,
    reset,
    unsubscribeAll 
  } = useAppStore();
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only perform auth check when loading is complete
    if (!loading) {
      if (!user) {
        console.log('No user detected, redirecting to login');
        // Add a small delay before redirecting to allow auth state to be fully loaded
        const redirectTimer = setTimeout(() => {
          router.push('/auth/login');
        }, 500);
        
        return () => clearTimeout(redirectTimer);
      } else {
        console.log('User authenticated:', user.id);
        setAuthChecked(true);
        
        // Set up real-time subscriptions with error handling
        const setupSubscriptions = async () => {
          try {
            // Set a timeout to avoid infinite loading
            const timeout = setTimeout(() => {
              console.log('Firestore request timed out');
              setError('Request timed out. You may be using an adblocker that is blocking Firestore requests.');
            }, 10000);
            
            // Set up real-time subscriptions instead of one-time fetches
            subscribeToUserChats(user.id);
            subscribeToUserInvites(user.id);
            
            // Clear timeout if successful
            clearTimeout(timeout);
          } catch (err) {
            console.error('Error in chat data subscriptions:', err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
            toast.error('Failed to load chat data. This might be due to an adblocker or network issue.');
          }
        };
        
        setupSubscriptions();
      }
    }

    // Unsubscribe from all real-time listeners when component unmounts
    return () => {
      unsubscribeAll();
      reset();
    };
  }, [user, loading, router, fetchChats, fetchInvites, subscribeToUserChats, subscribeToUserInvites, reset, unsubscribeAll]);

  // Display error state
  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Error Loading Chat</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-gray-600 mb-6">This might be caused by an adblocker or extension blocking Firebase/Firestore requests.</p>
          <div className="flex space-x-4 justify-center">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
            <button 
              onClick={() => router.push('/auth/login')} 
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything while checking auth state
  if (loading || (!authChecked && !user)) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-700">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render the children if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {children}
    </div>
  );
} 