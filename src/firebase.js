// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

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

// Initialisation
const app = initializeApp(firebaseConfig);

// Exports pour utiliser partout dans ton app
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
