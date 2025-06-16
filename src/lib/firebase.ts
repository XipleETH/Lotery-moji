/**
 * Firebase Configuration for LottoMoji Frontend
 * Initializes Firebase app and services
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Validate configuration
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Functions
export const functions = getFunctions(app);

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  // Uncomment these lines if you want to use Firebase emulators in development
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectFunctionsEmulator(functions, 'localhost', 5001);
}

// Firebase Functions - Callable
export const updateLotteryStats = httpsCallable(functions, 'updateLotteryStats');
export const processBlockchainEvent = httpsCallable(functions, 'processBlockchainEvent');

// Firebase Functions - HTTP endpoints
export const FIREBASE_FUNCTIONS_BASE_URL = 'https://us-central1-lottomoji-blockchain.cloudfunctions.net';

export const firebaseEndpoints = {
  getLotteryStats: `${FIREBASE_FUNCTIONS_BASE_URL}/getLotteryStats`,
  healthCheck: `${FIREBASE_FUNCTIONS_BASE_URL}/healthCheck`
};

// Helper function to call Firebase Functions from frontend
export const callFirebaseFunction = async (functionName: string, data: any) => {
  try {
    const callable = httpsCallable(functions, functionName);
    const result = await callable(data);
    return result.data;
  } catch (error) {
    console.error(`Error calling Firebase Function ${functionName}:`, error);
    throw error;
  }
};

// Helper function to fetch data from HTTP endpoints
export const fetchFromFirebase = async (endpoint: string) => {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from Firebase endpoint ${endpoint}:`, error);
    throw error;
  }
};

export default app;

// Export types for use in components
export type { 
  DocumentData,
  DocumentReference,
  CollectionReference,
  Query,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore'; 