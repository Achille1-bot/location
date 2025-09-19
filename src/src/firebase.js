import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFunctions } from "firebase/functions";

// Config depuis Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBZ2IegdeGZ-C2SCLmi54mDd3g9C48PXyc",
  authDomain: "locationapp-ab325.firebaseapp.com",
  projectId: "locationapp-ab325",
  storageBucket: "locationapp-ab325.firebasestorage.app",
  messagingSenderId: "250027259784",
  appId: "1:250027259784:web:d97414c4f17bab2b75ec3d",
  measurementId: "G-QKEBJMXSPZ"
};
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// 👉 AJOUT : export des Cloud Functions (région par défaut us-central1)
export const functions = getFunctions(app);

// (optionnel) se connecter anonymement pour autoriser Storage/Functions si tes rules le requièrent
signInAnonymously(auth).catch(() => {});