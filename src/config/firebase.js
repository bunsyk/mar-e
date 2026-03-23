// Firebase Configuration
// -------------------------------------------------------------
// 1. Idi na https://console.firebase.google.com/
// 2. Kreiraj novi projekt ili odaberi postojeći
// 3. Klikni na "Web" ikonu (</>)  da dodas web aplikaciju
// 4. Kopiraj konfiguraciju i zamijeni vrijednosti ispod
// 5. Za Android: preuzmi google-services.json i postavi ga
//    u root direktorij projekta
// 6. Za iOS: preuzmi GoogleService-Info.plist i postavi ga
//    u root direktorij projekta
// -------------------------------------------------------------

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Zamijeni ove vrijednosti sa stvarnim Firebase konfiguracijom
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
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
