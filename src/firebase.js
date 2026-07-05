import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import {
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
// Blocks traffic that doesn't come from the real app. Activates automatically
// once VITE_RECAPTCHA_ENTERPRISE_SITE_KEY is set (get a ReCaptcha Enterprise
// site key from the Firebase Console > App Check, then set the env var in
// Netlify / .env.local). Remember to switch App Check from "monitor" to
// "enforce" in the console only after confirming clients send valid tokens.
const appCheckSiteKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY;
if (appCheckSiteKey) {
    try {
        initializeAppCheck(app, {
            provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
            isTokenAutoRefreshEnabled: true
        });
    } catch (e) {
        console.error("App Check initialization failed:", e);
    }
}
