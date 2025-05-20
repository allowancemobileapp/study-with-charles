
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// import { getFirestore } from "firebase/firestore"; // Example if you add Firestore later
// import { getAnalytics } from "firebase/analytics"; // Example if you add Analytics later

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual Firebase project configuration!
// You can get this from the Firebase console:
// Project settings > General > Your apps > SDK setup and configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID" // Optional: if you use Google Analytics
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
// const db = getFirestore(app); // Example for Firestore
// const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null; // Example for Analytics

export { app, auth, googleProvider /*, db, analytics */ };
