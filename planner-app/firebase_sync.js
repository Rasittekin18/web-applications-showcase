// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteField } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: (typeof window !== "undefined" && window.FIREBASE_API_KEY) || "YOUR_FIREBASE_API_KEY",
  authDomain: "plan-933a3.firebaseapp.com",
  projectId: "plan-933a3",
  storageBucket: "plan-933a3.firebasestorage.app",
  messagingSenderId: "121093854154",
  appId: "1:121093854154:web:dc86a512afd3e62f8eb533",
  measurementId: "G-X9XH2XEWTD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUid = null;
let syncTimeout = null;
let pendingUpdates = {};

// When auth state changes
onAuthStateChanged(auth, async (user) => {
    const path = window.location.pathname;
    const isAuthPage = path.includes('auth.html') || path.includes('/auth');
    
    if (user) {
        currentUid = user.uid;
        
        if (isAuthPage) {
            window.location.href = 'index.html?cb=' + new Date().getTime();
            return;
        }
        
        try {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data().storage || {};
                let changed = false;
                
                // Sync Firestore -> localStorage
                for (const [k, v] of Object.entries(data)) {
                    if (localStorage.getItem(k) !== v) {
                        originalSetItem.call(localStorage, k, v);
                        changed = true;
                    }
                }
                
                // If data was updated from cloud, reload to reflect changes in UI
                if (changed && !window.__firebaseInitDone) {
                    window.__firebaseInitDone = true;
                    window.location.href = window.location.pathname + '?cb=' + new Date().getTime();
                }
            }
        } catch(e) {
            console.error("Error pulling data from Firestore:", e);
        }
    } else {
        currentUid = null;
        if (!isAuthPage) {
            // Unset session and redirect to login
            originalRemoveItem.call(localStorage, 'gtk_session');
            window.location.href = 'auth.html?cb=' + new Date().getTime();
        }
    }
});

// Hijack localStorage
const originalSetItem = localStorage.setItem;
const originalRemoveItem = localStorage.removeItem;

localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    if (currentUid && key.startsWith('gtk_')) {
        pendingUpdates[`storage.${key}`] = value;
        scheduleSync();
    }
};

localStorage.removeItem = function(key) {
    originalRemoveItem.apply(this, arguments);
    if (currentUid && key.startsWith('gtk_')) {
        pendingUpdates[`storage.${key}`] = deleteField();
        scheduleSync();
    }
};

function scheduleSync() {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
        if (!currentUid) return;
        const updates = { ...pendingUpdates };
        pendingUpdates = {};
        
        try {
            await updateDoc(doc(db, "users", currentUid), updates);
        } catch(e) {
            // If document doesn't exist (not-found), create it
            if (e.code === 'not-found') {
                const fullData = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && k.startsWith('gtk_')) {
                        fullData[k] = localStorage.getItem(k);
                    }
                }
                try {
                    await setDoc(doc(db, "users", currentUid), { storage: fullData }, { merge: true });
                } catch (err) {
                    console.error("Error creating user doc:", err);
                }
            } else {
                console.error("Error updating Firestore:", e);
            }
        }
    }, 1500); // Debounce sync by 1.5 seconds
}

// Global logout function for settings.html
window.doFirebaseLogout = async function() {
    try {
        await signOut(auth);
        window.location.href = 'auth.html?cb=' + new Date().getTime();
    } catch (e) {
        console.error("Error signing out:", e);
    }
};

import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Expose Auth instance to window for auth.html
window.firebaseAuth = auth;
window.firebaseDb = db;
window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
window.signInWithEmailAndPassword = signInWithEmailAndPassword;
