import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyD5BOnegAqwK-BuSunAOyqeaybJFjKw-wk",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "review-flash.vercel.app",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "review-flash",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "review-flash.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "343016178947",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:343016178947:web:b69ce961ad1343e3235536",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-RFWN6LNB7E",
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== "your_api_key_here",
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

googleProvider.addScope("profile");
googleProvider.addScope("email");
googleProvider.setCustomParameters({ prompt: "select_account" });

facebookProvider.addScope("email");
facebookProvider.addScope("public_profile");

if (typeof window !== "undefined" || isFirebaseConfigured) {
  try {
    if (isFirebaseConfigured) {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);
      if (typeof window !== "undefined") {
        setPersistence(auth, browserLocalPersistence).catch((err) => {
          console.warn("Firebase persistence warning:", err);
        });
      }
    }
  } catch (error) {
    console.warn(
      "Firebase initialization skipped or failed, using local storage mode.",
      error,
    );
  }
}

export { app, db, auth, googleProvider, facebookProvider };
