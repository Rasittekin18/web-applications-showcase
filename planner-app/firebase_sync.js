import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: (typeof window !== "undefined" && window.FIREBASE_API_KEY) || "YOUR_FIREBASE_API_KEY",
  authDomain: "plan-933a3.firebaseapp.com",
  projectId: "plan-933a3",
  storageBucket: "plan-933a3.firebasestorage.app",
  messagingSenderId: "121093854154",
  appId: "1:121093854154:web:dc86a512afd3e62f8eb533",
  measurementId: "G-X9XH2XEWTD"
};

const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("YOUR_FIREBASE_API_KEY")
);

window.firebaseConfigured = isFirebaseConfigured;

const originalSetItem = localStorage.setItem;
const originalRemoveItem = localStorage.removeItem;

let app = null;
let auth = null;
let db = null;
let currentUid = null;
let syncTimeout = null;
let pendingUpdates = {};

const SYNC_EXCLUDE_KEYS = new Set(["gtk_guest_mode"]);

function isSyncableKey(key) {
  return Boolean(key && key.startsWith("gtk_") && !SYNC_EXCLUDE_KEYS.has(key));
}

function collectAllGtkStorage() {
  const fullData = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (isSyncableKey(k)) {
      fullData[k] = localStorage.getItem(k);
    }
  }
  return fullData;
}

function migrateNullSessionData(targetSession) {
  if (!targetSession || targetSession === "null") return;
  const legacyScores = localStorage.getItem("gtk_scores_null");
  if (legacyScores && !localStorage.getItem("gtk_scores_" + targetSession)) {
    originalSetItem.call(localStorage, "gtk_scores_" + targetSession, legacyScores);
    originalRemoveItem.call(localStorage, "gtk_scores_null");
    pendingUpdates[`storage.gtk_scores_${targetSession}`] = legacyScores;
    pendingUpdates["storage.gtk_scores_null"] = deleteField();
  }
}

async function flushSync(forceAll = false) {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
  if (!isFirebaseConfigured || !db || !currentUid) return;

  const updates = { ...pendingUpdates };
  pendingUpdates = {};

  if (!forceAll && Object.keys(updates).length === 0) return;

  try {
    if (forceAll) {
      await setDoc(doc(db, "users", currentUid), { storage: collectAllGtkStorage() }, { merge: true });
    } else {
      await updateDoc(doc(db, "users", currentUid), updates);
    }
  } catch (e) {
    if (e.code === "not-found") {
      try {
        await setDoc(doc(db, "users", currentUid), { storage: collectAllGtkStorage() }, { merge: true });
      } catch (err) {
        console.error("Error creating user doc:", err);
      }
    } else {
      console.error("Error updating Firestore:", e);
    }
  }
}

function scheduleSync() {
  if (!isFirebaseConfigured || !currentUid) return;
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    flushSync(false);
  }, 1200);
}

localStorage.setItem = function (key, value) {
  originalSetItem.apply(this, arguments);
  if (currentUid && isSyncableKey(key)) {
    pendingUpdates[`storage.${key}`] = value;
    scheduleSync();
  }
};

localStorage.removeItem = function (key) {
  originalRemoveItem.apply(this, arguments);
  if (currentUid && isSyncableKey(key)) {
    pendingUpdates[`storage.${key}`] = deleteField();
    scheduleSync();
  }
};

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") flushSync(false);
});
window.addEventListener("pagehide", () => {
  flushSync(false);
});

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  onAuthStateChanged(auth, async (user) => {
    const path = window.location.pathname;
    const isAuthPage = path.includes("auth.html") || path.endsWith("/auth");
    const isGuest = localStorage.getItem("gtk_guest_mode") === "1";

    if (user) {
      currentUid = user.uid;
      originalRemoveItem.call(localStorage, "gtk_guest_mode");

      if (isAuthPage) {
        if (!window.__authManualRedirect) {
          window.location.replace("index.html");
        }
        return;
      }

      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        let changed = false;

        if (docSnap.exists()) {
          const data = docSnap.data().storage || {};
          for (const [k, v] of Object.entries(data)) {
            if (isSyncableKey(k) && localStorage.getItem(k) !== v) {
              originalSetItem.call(localStorage, k, v);
              changed = true;
            }
          }
        }

        // Ensure gtk_session always has a valid non-null identifier
        let activeSession = localStorage.getItem("gtk_session");
        if (!activeSession || activeSession === "null" || activeSession === "undefined") {
          const derived =
            (user.email ? user.email.split("@")[0].replace(/[^a-z0-9_]/gi, "_").toLowerCase() : "") ||
            user.uid;
          originalSetItem.call(localStorage, "gtk_session", derived);
          pendingUpdates["storage.gtk_session"] = derived;
          activeSession = derived;
          changed = true;
        }

        migrateNullSessionData(activeSession);

        if (!localStorage.getItem("gtk_profile") && user.email) {
          const fallbackProf = JSON.stringify({
            fn: user.displayName || user.email.split("@")[0],
            ln: "",
            email: user.email,
            bd: ""
          });
          originalSetItem.call(localStorage, "gtk_profile", fallbackProf);
          pendingUpdates["storage.gtk_profile"] = fallbackProf;
        }

        if (Object.keys(pendingUpdates).length > 0) {
          await flushSync(false);
        }

        if (changed && !window.__firebaseReloadedOnce) {
          window.__firebaseReloadedOnce = true;
          window.location.reload();
        }
      } catch (e) {
        console.error("Error pulling data from Firestore:", e);
      }
    } else {
      currentUid = null;
      if (!isAuthPage && !isGuest) {
        originalRemoveItem.call(localStorage, "gtk_session");
        window.location.replace("auth.html");
      }
    }
  });
} else {
  // Showcase / local mode without Firebase API key configured
  const path = window.location.pathname;
  const isAuthPage = path.includes("auth.html") || path.endsWith("/auth");
  if (!isAuthPage && !localStorage.getItem("gtk_session")) {
    originalSetItem.call(localStorage, "gtk_guest_mode", "1");
    originalSetItem.call(localStorage, "gtk_session", "guest");
  }
}

window.enterGuestMode = function () {
  originalSetItem.call(localStorage, "gtk_guest_mode", "1");
  if (!localStorage.getItem("gtk_session") || localStorage.getItem("gtk_session") === "null") {
    originalSetItem.call(localStorage, "gtk_session", "guest");
  }
  window.location.href = "index.html";
};

window.flushFirebaseSync = async function (forceAll = false) {
  if (auth && auth.currentUser) {
    currentUid = auth.currentUser.uid;
  }
  await flushSync(forceAll);
};

window.doFirebaseLogout = async function () {
  try {
    await flushSync(false);
    if (auth && auth.currentUser) {
      await signOut(auth);
    }
  } catch (e) {
    console.error("Error signing out:", e);
  } finally {
    originalRemoveItem.call(localStorage, "gtk_session");
    originalRemoveItem.call(localStorage, "gtk_guest_mode");
    window.location.href = "auth.html";
  }
};

window.firebaseResetPassword = async function (email) {
  if (!auth) throw new Error("Firebase yapilandirilmamis.");
  await sendPasswordResetEmail(auth, email);
};

window.firebaseChangePassword = async function (currentPw, newPw) {
  if (!auth || !auth.currentUser || !auth.currentUser.email) {
    throw new Error("Aktif bulut oturumu bulunamadi.");
  }
  const cred = EmailAuthProvider.credential(auth.currentUser.email, currentPw);
  await reauthenticateWithCredential(auth.currentUser, cred);
  await updatePassword(auth.currentUser, newPw);
};

window.firebaseDeleteAccount = async function (currentPw) {
  if (!auth || !auth.currentUser) {
    throw new Error("Aktif bulut oturumu bulunamadi.");
  }
  const user = auth.currentUser;
  if (currentPw && user.email) {
    const cred = EmailAuthProvider.credential(user.email, currentPw);
    await reauthenticateWithCredential(user, cred);
  }
  try {
    await deleteDoc(doc(db, "users", user.uid));
  } catch (e) {
    console.warn("Firestore user doc delete skipped:", e);
  }
  await deleteUser(user);
};

window.firebaseAuth = auth;
window.firebaseDb = db;
window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
window.signInWithEmailAndPassword = signInWithEmailAndPassword;
