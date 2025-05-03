import { toast } from 'react-hot-toast';
import { FirebaseError } from 'firebase/app';

// Handle authentication errors with specific messages for each error code
export const handleAuthError = (error: unknown): string => {
  if (error instanceof FirebaseError) {
    console.error('Firebase error details:', { 
      code: error.code, 
      message: error.message,
      customData: error.customData 
    });
    
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No account found with this email. Please sign up first.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-credential':
        return 'Invalid login credentials. Please check your email and password and try again. If you signed up with Google, use the Google sign-in button instead.';
      case 'auth/too-many-requests':
        return 'Too many failed login attempts, please try again later';
      case 'auth/email-already-in-use':
        return 'Email is already in use';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with the same email address but different sign-in credentials. Please sign in using Google.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed before completing the sign-in';
      case 'auth/cancelled-popup-request':
        return 'Sign-in process was cancelled';
      case 'auth/popup-blocked':
        return 'Sign-in popup was blocked by the browser. Please allow popups for this site';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again.';
      default:
        console.error('Unhandled authentication error:', error);
        return `An error occurred during authentication (${error.code}). Please try again.`;
    }
  }
  
  console.error('Non-Firebase authentication error:', error);
  return 'An unexpected error occurred. Please try again.';
};

// Show appropriate error toast
export const showAuthError = (error: unknown): void => {
  const errorMessage = handleAuthError(error);
  toast.error(errorMessage);
};

// Handle account linking error and show appropriate message
export const handleAccountLinkingError = (error: unknown): boolean => {
  if (error instanceof FirebaseError) {
    // Handle Google-linked accounts
    if (error.code === 'auth/account-exists-with-different-credential') {
      toast.error('This email is linked to a Google account. Please sign in with Google instead.', {
        duration: 5000,
      });
      return true;
    }
  }
  return false;
};