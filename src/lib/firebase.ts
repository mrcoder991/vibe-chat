import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Google provider
const googleProvider = new GoogleAuthProvider();
// Add scopes for better user info access
googleProvider.addScope('profile');
googleProvider.addScope('email');
// Force prompt each time to avoid login issues
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Set persistence to LOCAL - this keeps the user logged in even after browser refresh
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('Firebase authentication persistence set to LOCAL');
      
      // Log auth state changes to help with debugging
      onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log('User is signed in with UID:', user.uid);
          console.log('User email:', user.email);
          console.log('Provider data:', user.providerData);
          
          // Show all auth providers for this user
          user.providerData.forEach((profile, i) => {
            console.log(`Auth provider ${i}:`, profile.providerId);
          });
          
          // Check if specific providers are available
          const hasEmailProvider = user.providerData.some(p => p.providerId === 'password');
          const hasGoogleProvider = user.providerData.some(p => p.providerId === 'google.com');
          
          console.log('Has email provider:', hasEmailProvider);
          console.log('Has Google provider:', hasGoogleProvider);
        } else {
          console.log('User is signed out');
        }
      });
    })
    .catch((error) => {
      console.error('Error setting authentication persistence:', error);
    });
}

export { app, auth, db, storage, googleProvider }; 