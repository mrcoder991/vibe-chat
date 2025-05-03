'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { EnvelopeIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/components/providers/AuthProvider';
import { showAuthError } from '@/lib/authUtils';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';

type SignupInputs = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupInputs>();
  
  const password = watch('password');
  
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

  const onSubmit: SubmitHandler<SignupInputs> = async (data) => {
    setIsLoading(true);
    
    try {
      // Check if email is already used with Google
      const signInMethods = await fetchSignInMethodsForEmail(auth, data.email);
      if (signInMethods.includes('google.com')) {
        toast.error('This email is already associated with a Google account. Please sign in with Google.');
        setIsLoading(false);
        return;
      }
      
      console.log("Starting user creation with name:", data.name);
      
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      
      console.log("User created, updating profile with name:", data.name);
      
      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: data.name,
      });
      
      console.log("Profile updated successfully with name:", data.name);
      
      toast.success('Account created successfully!');
      
      // Redirect immediately without delay
      router.push('/chat');
      router.replace('/chat'); // Replace history so back button won't work
    } catch (error) {
      showAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Create a new account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-800 dark:text-gray-300">
          Or{' '}
          <Link href="/auth/login" className="font-medium text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Google Sign-Up Button */}
          <div className="space-y-6">
            <GoogleAuthButton mode="signup" disabled={isLoading} />
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
              label="Full Name"
              type="text"
              autoComplete="name"
              fullWidth
              leftIcon={<UserIcon className="h-5 w-5" />}
              error={errors.name?.message}
              {...register('name', {
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters',
                },
              })}
            />

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
              autoComplete="new-password"
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

            <Input
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              fullWidth
              leftIcon={<LockClosedIcon className="h-5 w-5" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: value => 
                  value === password || 'Passwords do not match',
              })}
            />

            <div>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="w-full justify-center"
              >
                Sign up
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}