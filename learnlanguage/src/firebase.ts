import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCKE2zrl6rACAUI6ku0E3gW8o-cjV9AOBs",
  authDomain: "language-61b3f.firebaseapp.com",
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
