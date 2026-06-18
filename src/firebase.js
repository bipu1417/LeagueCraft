// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB4pV8z6KqO0ixeuPClgY6fHDvm-o5ApjE",
  authDomain: "pundag-premier-league.firebaseapp.com",
  projectId: "pundag-premier-league",
  storageBucket: "pundag-premier-league.appspot.com",  // ✅ FIXED: corrected domain
  messagingSenderId: "318036804333",
  appId: "1:318036804333:web:e4df48962c2bf0b2edc2e4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore
export const db = getFirestore(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Storage
export const storage = getStorage(app);  // ✅ FIXED: Now available

// Export Firestore helpers
export { collection, addDoc, updateDoc, where, getDocs, query, orderBy, getDoc, onSnapshot, deleteDoc, doc, setDoc, serverTimestamp, Timestamp, storageRef, uploadBytes, getDownloadURL };
