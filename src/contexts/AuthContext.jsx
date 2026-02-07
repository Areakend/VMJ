import { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider, db } from "../firebase";
import { signInWithRedirect, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithCredential, getRedirectResult, signInWithPopup } from "firebase/auth";
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
    const [syncStatus, setSyncStatus] = useState("Checking session...");

    // Initialize Native Google Auth
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            GoogleAuth.initialize({
                clientId: '626354913346-uvhlkjjiq2g1pjtss246qkhlrefcmskr.apps.googleusercontent.com',
            });
        }
    }, []);

    // Login function
    async function login(options = {}) {
        const { forcePopup = false } = options;

        if (Capacitor.isNativePlatform()) {
            try {
                const user = await GoogleAuth.signIn();
                const credential = GoogleAuthProvider.credential(user.authentication.idToken);
                return await signInWithCredential(auth, credential);
            } catch (err) {
                console.error("[AUTH] Native Login error:", err);
                alert("Native Error: " + (err.message || "Unknown error"));
                throw err;
            }
        } else {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            try {
                if (forcePopup) {
                    return await signInWithPopup(auth, googleProvider);
                }

                if (isMobile) {
                    setSyncStatus("Redirecting to Google...");
                    return await signInWithRedirect(auth, googleProvider);
                } else {
                    // Desktop: Use Popup (most reliable across domains/incognito)
                    try {
                        return await signInWithPopup(auth, googleProvider);
                    } catch (pErr) {
                        // Only fallback to redirect if popup is strictly blocked/failed systemically
                        console.error("[AUTH] Popup failed:", pErr);
                        if (pErr.code === 'auth/popup-blocked') {
                            alert("Popups are blocked. Please allow popups for this site or try again.");
                        } else if (pErr.code === 'auth/popup-closed-by-user') {
                            // User intentionally closed it, don't force redirect
                        } else {
                            // For other errors, we might alert or throw
                            alert("Login failed: " + pErr.message);
                        }
                        throw pErr;
                    }
                }
            } catch (err) {
                console.error("[AUTH] Web Sign-In error:", err);
                if (err.code !== 'auth/popup-closed-by-user') {
                    alert("Sign-in error: " + err.message);
                }
                throw err;
            }
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
        // Multi-phase sync status
        setSyncStatus("Checking session...");

        // Safety timeout: 10 seconds total to resolve or revert to login
        const safetyTimeout = setTimeout(() => {
            if (loading) {
                console.warn("[AUTH] Safety timeout reached. Forcing UI load.");
                setLoading(false);
            }
        }, 10000);

        // Check if we are potentially in a redirect callback
        const hasRedirectParams = window.location.search.includes('apiKey') ||
            window.location.search.includes('oobCode') ||
            window.location.hash.includes('access_token') ||
            window.location.search.includes('state=');


        if (hasRedirectParams) {
            setSyncStatus("Syncing account...");
        }

        // Handle redirect results 
        getRedirectResult(auth)
            .then((result) => {
                if (result) {
                    setSyncStatus("Loading profile...");
                } else {
                }
            })
            .catch((error) => {
                console.error("[AUTH] Redirect error:", error);
                const domain = window.location.hostname;
                if (error.code === 'auth/unauthorized-domain') {
                    alert(`ACCESS DENIED: ${domain} is not authorized in Firebase Console.`);
                } else if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
                    alert(`Sync Error: ${error.message}`);
                }
                setLoading(false);
            });

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);

            if (user) {
                setSyncStatus("Fetching profile...");
                const userDocRef = doc(db, "users", user.uid);
                const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setUserData(docSnap.data());
                    } else {
                        console.warn("[AUTH] User exists in Auth but not in Firestore");
                        setUserData(null);
                    }
                    setLoading(false);
                    clearTimeout(safetyTimeout);
                }, (error) => {
                    console.error("[AUTH] Firestore error:", error);
                    setLoading(false);
                    clearTimeout(safetyTimeout);
                });

                return () => unsubDoc();
            } else {
                setUserData(null);
                // Always stop loading if no user, regardless of redirect params
                setLoading(false);
                clearTimeout(safetyTimeout);
            }
        });

        return () => {
            unsubscribe();
            clearTimeout(safetyTimeout);
        };
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
            {loading ? (
                <div style={{
                    background: '#0c0c0c',
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--jager-orange)',
                    fontFamily: 'sans-serif',
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <div className="pulse-loader" style={{
                        width: '60px', height: '60px',
                        borderRadius: '50%', background: 'var(--jager-orange)',
                        marginBottom: '2rem',
                        boxShadow: '0 0 30px rgba(251, 177, 36, 0.4)'
                    }} />
                    <h2 style={{ margin: '0 0 0.5rem 0', letterSpacing: '2px' }}>SYNCHRONIZING</h2>
                    <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>{syncStatus}</p>

                    <button
                        onClick={() => {
                            clearTimeout(timeout);
                            logout().then(() => window.location.reload());
                        }}
                        style={{
                            marginTop: '3.5rem',
                            background: 'none',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#444',
                            padding: '10px 20px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            letterSpacing: '1px'
                        }}
                    >
                        RESET SESSION
                    </button>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
}
