// Firebase Configuration
// -------------------------------------------------------------
// Konfiguracija se čita iz .env fajla (nikad ne commituj .env!).
// Kopiraj .env.example -> .env i popuni stvarne vrijednosti.
//
// Za EAS Build (Google Play / App Store) postavi iste
// varijable u Expo dashboardu:
// https://expo.dev -> projekt -> Environment variables
// -------------------------------------------------------------

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const env = (value) => (value || '').trim().replace(/^"|"$/g, '');
const extraFirebase = Constants?.expoConfig?.extra?.firebase || {};

const firebaseApiKey = env(process.env.EXPO_PUBLIC_FIREBASE_API_KEY || extraFirebase.apiKey);
const firebaseAuthDomain = env(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || extraFirebase.authDomain);
const firebaseProjectId = env(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || extraFirebase.projectId);
const firebaseStorageBucket = env(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || extraFirebase.storageBucket);
const firebaseMessagingSenderId = env(
  process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || extraFirebase.messagingSenderId
);
const firebaseAppId = env(process.env.EXPO_PUBLIC_FIREBASE_APP_ID || extraFirebase.appId);

if (!firebaseApiKey) {
  throw new Error('Missing EXPO_PUBLIC_FIREBASE_API_KEY. Restart Expo with `npx expo start -c`.');
}

const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: firebaseAuthDomain,
  projectId: firebaseProjectId,
  storageBucket: firebaseStorageBucket,
  messagingSenderId: firebaseMessagingSenderId,
  appId: firebaseAppId,
};

// Inicijalizacija Firebase
const app = initializeApp(firebaseConfig);

// Auth sa perzistencijom (korisnik ostaje ulogovan)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore baza podataka
export const db = getFirestore(app);

// Storage za fajlove/slike
export const storage = getStorage(app);

export default app;
