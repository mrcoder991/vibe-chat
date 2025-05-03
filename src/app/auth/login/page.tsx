'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { 
  signInWithEmailAndPassword, 
  setPersistence, 
  browserSessionPersistence, 
  browserLocalPersistence,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/components/providers/AuthProvider';
import { showAuthError, handleAccountLinkingError } from '@/lib/authUtils';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';

type LoginInputs = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInputs>({
    defaultValues: {
      rememberMe: true
    }
  });
  
  // Redirect if user is already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.push('/chat');
      router.replace('/chat'); // Replace history so back button won't work
    }
  }, [user, loading, router]);

  // Don't render form while checking auth state
  if (loading || user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const onSubmit: SubmitHandler<LoginInputs> = async (data) => {
    setIsLoading(true);
    
    try {
      // Check if this email is used with Google sign-in
      const signInMethods = await fetchSignInMethodsForEmail(auth, data.email);

      console.log("Sign in methods:", signInMethods);
      
      // If this email only uses Google sign-in, show a message and don't try email auth
      if (signInMethods.includes('google.com') && !signInMethods.includes('password')) {
        toast.error('This email is registered with Google. Please use the "Sign in with Google" button instead.', {
          duration: 5000,
        });
        setIsLoading(false);
        return;
      }
      
      // Set the persistence based on rememberMe checkbox
      const persistenceType = data.rememberMe 
        ? browserLocalPersistence // Remember user between sessions
        : browserSessionPersistence; // Forget user when browser is closed
      
      await setPersistence(auth, persistenceType);
      
      // Then sign in
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast.success('Successfully logged in!');
      router.push('/chat');
      router.replace('/chat'); // Replace history so back button won't work
    } catch (error) {
      if (!handleAccountLinkingError(error)) {
        showAuthError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-800 dark:text-gray-300">
          Or{' '}
          <Link href="/auth/signup" className="font-medium text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Google Sign-In Button */}
          <div className="space-y-6">
            <GoogleAuthButton mode="login" disabled={isLoading} />
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>
          </div>

          <form className="mt-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              fullWidth
              leftIcon={<EnvelopeIcon className="h-5 w-5" />}
              error={errors.email?.message}
              placeholder='Enter your email address'
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />

            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              fullWidth
              leftIcon={<LockClosedIcon className="h-5 w-5" />}
              error={errors.password?.message}
              placeholder='Enter your password'
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                  {...register('rememberMe')}
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm font-medium text-gray-800 dark:text-gray-200">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/auth/forgot-password" className="font-medium text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="w-full justify-center"
              >
                Sign in
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}