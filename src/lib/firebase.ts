
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics"; // Import isSupported for Analytics

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAnWkVeFPvYTuEsfAjn9JInlLS7Q7eKmzw",
  authDomain: "study-with-charles.firebaseapp.com",
  projectId: "study-with-charles",
  storageBucket: "study-with-charles.firebasestorage.app",
  messagingSenderId: "153889575294",
  appId: "1:153889575294:web:0e8917b8f678f298bbe32f",
  measurementId: "G-WE20QXQRER"
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Analytics only if supported and on the client side
let analytics;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, googleProvider, analytics };
