import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Fallback empty config to prevent crashes when env vars are missing locally
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-key",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-domain",
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://mock-db.firebaseio.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock-project",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock-bucket",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "mock-sender",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "mock-app-id"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);

// Check if valid config exists
export const hasFirebaseConfig = process.env.NODE_ENV === "production"
    ? true // Strictly require Firebase in production (disables broadcast fallback)
    : !!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
