import { initializeApp, getApp, getApps } from 'firebase/app';

import {
  getAuth,
  GoogleAuthProvider
} from 'firebase/auth';

import { getFirestore } from 'firebase/firestore';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-aSfd6_tXERs9uZqfjUsZmv-iNYyY9Eg",
  authDomain: "photoai-studio-1ce76.firebaseapp.com",
  projectId: "photoai-studio-1ce76",
  storageBucket: "photoai-studio-1ce76.firebasestorage.app",
  messagingSenderId: "819218367030",
  appId: "1:819218367030:web:4eeacc48ca05bb862b8e97"
};

// Initialize Firebase
const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

// Firebase Authentication
export const auth = getAuth(app);

// Google Login Provider
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Cloud Firestore Database
export const db = getFirestore(app);

// Export Firebase App
export default app;