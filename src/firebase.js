import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// TODO: Replace with your Firebase configuration
// Get this from: https://console.firebase.google.com
const firebaseConfig = {
    apiKey: "AIzaSyAEmt8bCysUHrjIWikZXFymXU6jfnM2brw",
    authDomain: "jager-tracking.firebaseapp.com",
    projectId: "jager-tracking",
    storageBucket: "jager-tracking.firebasestorage.app",
    messagingSenderId: "626354913346",
    appId: "1:626354913346:web:aa7398d40228359166eddb",
    measurementId: "G-HNGR00TETB"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Enable offline persistence
try {
    enableIndexedDbPersistence(db)
        .catch((err) => {
            if (err.code == 'failed-precondition') {
                // Multiple tabs open, persistence can only be enabled in one tab at a a time.
                console.log('Persistence failed: Multiple tabs open');
            } else if (err.code == 'unimplemented') {
                // The current browser does not support all of the features required to enable persistence
                console.log('Persistence failed: Browser not supported');
            }
        });
} catch (e) {
    console.warn("Offline persistence not enabled (may be already enabled or not supported in this env)", e);
}
