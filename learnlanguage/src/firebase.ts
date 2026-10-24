import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_FIREBASE_API_KEY) || "YOUR_FIREBASE_API_KEY",
  authDomain: (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) || "language-61b3f.firebaseapp.com",
  projectId: "language-61b3f",
  storageBucket: "language-61b3f.firebasestorage.app",
  messagingSenderId: "344755434082",
  appId: "1:344755434082:web:a970ea2b821167aa27573b",
  measurementId: "G-53D4LJR839"
};

const app = initializeApp(firebaseConfig);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
