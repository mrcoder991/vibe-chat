'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  signInWithPopup, 
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { showAuthError } from '@/lib/authUtils';

interface GoogleAuthButtonProps {
  mode: 'login' | 'signup';
  disabled?: boolean;
  className?: string;
}

export default function GoogleAuthButton({ 
  mode, 
  disabled = false,
  className = ''
}: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    
    try {
      // Force account selection even if user is already signed in
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Sign in with popup (works on both web and mobile)
      const result = await signInWithPopup(auth, googleProvider);
      
      // The signed-in user info
      const user = result.user;
      
      // Check if this is a returning user
      const isNewUser = result.additionalUserInfo?.isNewUser;
      
      // Get a list of all sign-in methods for the user's email
      const signInMethods = await fetchSignInMethodsForEmail(auth, user.email || '');
      
      // If user previously signed in with email/password, show a message about the account link
      if (signInMethods.includes('password') && signInMethods.includes('google.com')) {
        toast.success(
          'Your email and Google accounts have been linked. You can now sign in with either method.', 
          { duration: 6000 }
        );
      }
      else {
        // Display appropriate message based on login/signup mode
        if (mode === 'login' || !isNewUser) {
          toast.success('Successfully logged in with Google!');
        } else {
          toast.success('Account created successfully!');
        }
      }
      
      router.push('/chat');
      router.replace('/chat');
    } catch (error) {
      showAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button
      type="button"
      variant="secondary"
      isLoading={isLoading}
      className={`w-full justify-center flex items-center space-x-2 ${className}`}
      onClick={handleGoogleAuth}
      disabled={disabled || isLoading}
    >
      {!isLoading && (
        <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
          <path
            d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0353 3.12C17.9503 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
            fill="#EA4335"
          />
          <path
            d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.08L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
            fill="#4285F4"
          />
          <path
            d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
            fill="#FBBC05"
          />
          <path
            d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.075C15.0054 18.825 13.6204 19.255 12.0004 19.255C8.8704 19.255 6.21537 17.145 5.2654 14.295L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
            fill="#34A853"
          />
        </svg>
      )}
      <span>{mode === 'login' ? 'Sign in' : 'Sign up'} with Google</span>
    </Button>
  );
} 