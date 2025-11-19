import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBn3VgZr53suaE1sTh2wGC1ZEQ9uHsyyFc",
  authDomain: "finance-tracker-5f18c.firebaseapp.com",
  projectId: "finance-tracker-5f18c",
  storageBucket: "finance-tracker-5f18c.firebasestorage.app",
  messagingSenderId: "573958035414",
  appId: "1:573958035414:web:911e1075e04e51fe57f677",
  measurementId: "G-N5ZZGZD6Q2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const analytics = getAnalytics(app);
export const db = getFirestore(app);