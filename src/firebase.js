import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import {
    getFirestore,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager
} from "firebase/firestore";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

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
// Explicitly set persistence ensures mobile web works correctly
setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Auth Persistence Error:", error);
});

export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with modern persistence settings
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
});

// --- Security: Firebase App Check ---
// To prevent unauthorized traffic and DDoS, initialize App Check.
// NOTE: You need to get a ReCaptcha Enterprise Site Key from the Firebase Console.
/*
initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider('YOUR_SITE_KEY_HERE'),
    isTokenAutoRefreshEnabled: true
});
*/
