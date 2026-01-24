import { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider, db } from "../firebase";
import { signInWithRedirect, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initialize Native Google Auth
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            GoogleAuth.initialize();
        }
    }, []);

    // Login function
    async function login() {
        console.log("Login attempt. Platform:", Capacitor.getPlatform());
        if (Capacitor.isNativePlatform()) {
            try {
                console.log("Native platform detected. Initializing GoogleAuth...");
                const user = await GoogleAuth.signIn();
                console.log("Native login success, token received");
                alert("NATIVE SUCCESS: Got token for " + user.email);

                console.log("Linking with Firebase...");
                const credential = GoogleAuthProvider.credential(user.authentication.idToken);
                const result = await signInWithCredential(auth, credential);
                alert("FIREBASE SUCCESS: Logged in as " + result.user.displayName);
                return result;
            } catch (err) {
                console.error("Native Google Login error:", err);
                alert("DETAILED ERROR: " + JSON.stringify(err, Object.getOwnPropertyNames(err)));
                throw err;
            }
        } else {
            console.log("Web platform detected. Using Redirect flow...");
            return signInWithRedirect(auth, googleProvider);
        }
    }

    // Logout function
    async function logout() {
        if (Capacitor.isNativePlatform()) {
            await GoogleAuth.signOut();
        }
        return signOut(auth);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);

            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setUserData(docSnap.data());
                    } else {
                        setUserData(null);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching user profile:", error);
                    setLoading(false);
                });

                return () => unsubDoc();
            } else {
                setUserData(null);
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userData,
        loading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
