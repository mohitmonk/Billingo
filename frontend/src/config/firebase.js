import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"
const firebaseConfig = {
    apiKey: "AIzaSyCHrk2B9RzzTDZUOOETMR0IQt0GXo7Hyfo",
    authDomain: "billingo-47713.firebaseapp.com",
    projectId: "billingo-47713",
    storageBucket: "billingo-47713.appspot.com", // Fixed storageBucket URL
    messagingSenderId: "515308381842",
    appId: "1:515308381842:web:ce7b29207f142844e3e84b",
    measurementId: "G-EW619Q1QYG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider(); // Added GoogleAuthProvider
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, googleProvider,db, storage};
