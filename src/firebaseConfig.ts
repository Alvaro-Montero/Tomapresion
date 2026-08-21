// Firebase configuration using environment variables
// Store sensitive credentials in .env.local (DO NOT COMMIT)
// See .env.local.example for required variables

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || ""
};

// Validate that required environment variables are set
if (!firebaseConfig.apiKey) {
  console.warn('⚠️ Firebase apiKey not configured. Set EXPO_PUBLIC_FIREBASE_API_KEY in .env.local');
}
