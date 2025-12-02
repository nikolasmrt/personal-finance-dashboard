import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCTcuJW9LNSycG3hGgI1P3HAGKuZ9chmXM",
  authDomain: "nkn-tracker.firebaseapp.com",
  projectId: "nkn-tracker",
  storageBucket: "nkn-tracker.firebasestorage.app",
  messagingSenderId: "817007245914",
  appId: "1:817007245914:web:f637211fbcad3fd5913663"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);