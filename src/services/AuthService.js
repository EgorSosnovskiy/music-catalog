import { initializeAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Remove circular dependency by getting Firebase app directly
import { initializeApp, getApp } from 'firebase/app';

let auth;
let db;
let isAuthInitialized = false;

export const initializeAuthService = async () => {
  if (isAuthInitialized) return true;

  try {
    // Get or initialize Firebase app directly
    let app;
    try {
      app = getApp();
    } catch (e) {
      // App not initialized yet, initialize it
      const firebaseConfig = {
        apiKey: "AIzaSyDPFZq2shneQP-wgbYkNvZKx353DO2TlXQ",
        authDomain: "music-catalog-d097b.firebaseapp.com",
        projectId: "music-catalog-d097b",
        storageBucket: "music-catalog-d097b.firebasestorage.app",
        messagingSenderId: "462418347697",
        appId: "1:462418347697:web:e74f2ffd4a2747d0358490"
      };
      app = initializeApp(firebaseConfig);
    }

    auth = initializeAuth(app);
    db = getFirestore(app);
    isAuthInitialized = true;
    console.log('Firebase Auth initialized');
    return true;
  } catch (error) {
    console.error('Firebase Auth init error:', error.message);
    isAuthInitialized = false;
    auth = null;
    db = null;
    return false;
  }
};

export const getCurrentUser = () => auth?.currentUser ?? null;
export const getCurrentUserId = () => {
  const user = getCurrentUser();
  return user?.uid ?? null;
};

export const registerUser = async (email, password, displayName = '') => {
  if (!auth) throw new Error('auth/not-initialized');
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await initializeUserProfile(user.uid, displayName || email.split('@')[0]);
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.code };
  }
};

export const loginUser = async (email, password) => {
  if (!auth) throw new Error('auth/not-initialized');
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.code };
  }
};

export const logoutUser = async () => {
  if (!auth) throw new Error('auth/not-initialized');
  await signOut(auth);
  return { success: true };
};

export const resetPassword = async (email) => {
  if (!auth) throw new Error('auth/not-initialized');
  await sendPasswordResetEmail(auth, email);
  return { success: true };
};

export const onAuthStateChangedListener = (callback) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

const initializeUserProfile = async (userId, displayName) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    displayName,
    createdAt: new Date(), // Firestore Timestamp
  }, { merge: true });
};

export const getUserProfile = async (userId) => {
  const docSnap = await getDoc(doc(db, 'users/' + userId));
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const isAuthReady = () => isAuthInitialized && auth !== undefined;

export default {
  initializeAuthService,
  getCurrentUser,
  getCurrentUserId,
  registerUser,
  loginUser,
  logoutUser,
  resetPassword,
  onAuthStateChangedListener,
  getUserProfile,
  isAuthReady,
};
