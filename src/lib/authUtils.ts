import { toast } from 'react-hot-toast';
import { FirebaseError } from 'firebase/app';

// Handle authentication errors with specific messages for each error code
export const handleAuthError = (error: unknown): string => {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Invalid email or password';
      case 'auth/too-many-requests':
        return 'Too many failed login attempts, please try again later';
      case 'auth/email-already-in-use':
        return 'Email is already in use';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with the same email address but different sign-in credentials. Please sign in using your email and password, or reset your password.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed before completing the sign-in';
      case 'auth/cancelled-popup-request':
        return 'Sign-in process was cancelled';
      case 'auth/popup-blocked':
        return 'Sign-in popup was blocked by the browser. Please allow popups for this site';
      default:
        console.error('Authentication error:', error);
        return 'An error occurred during authentication. Please try again.';
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
    if (error.code === 'auth/account-exists-with-different-credential') {
      toast.error('Your account is linked to Google. Please sign in with Google instead.', {
        duration: 5000,
      });
      return true;
    }
  }
  return false;
}; 