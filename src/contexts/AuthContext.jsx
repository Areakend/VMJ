import { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider, db } from "../firebase";
import { signInWithRedirect, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithCredential, getRedirectResult, signInWithPopup, deleteUser } from "firebase/auth";
import { doc, onSnapshot, runTransaction, getDoc, deleteDoc, collection } from "firebase/firestore";
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

                if (isMobile && !forcePopup) {
                    // Try popup first even on mobile, as redirects are flaky
                    // If popup fails, we can fallback or alert
                    return await signInWithPopup(auth, googleProvider);
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

    // Update Username
    async function updateUsername(newUsername) {
        if (!currentUser) throw new Error("No user logged in");

        // Import validation from storage
        const { validateUsername } = await import("../utils/storage");
        const error = validateUsername(newUsername);
        if (error) throw new Error(error);

        const lowerUsername = newUsername.toLowerCase().trim();
        const userRef = doc(db, "users", currentUser.uid);
        const newUsernameRef = doc(db, "usernames", lowerUsername);

        // We need to know the OLD username to free it up
        // We can get it from userData state, but safer to get from Transaction to avoid race conditions

        try {
            await runTransaction(db, async (transaction) => {
                // 1. Check if new username is taken
                const newUsernameDoc = await transaction.get(newUsernameRef);
                if (newUsernameDoc.exists()) {
                    throw new Error("Username already taken");
                }

                // 2. Get current user data to find old username
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) throw new Error("User profile not found");

                const oldUsernameLower = userDoc.data().usernameLower;

                // 3. Reserve new username
                transaction.set(newUsernameRef, { uid: currentUser.uid });

                // 4. Update user profile
                transaction.update(userRef, {
                    username: newUsername,
                    usernameLower: lowerUsername
                });

                // 5. Release old username (if different and exists)
                if (oldUsernameLower && oldUsernameLower !== lowerUsername) {
                    const oldUsernameRef = doc(db, "usernames", oldUsernameLower);
                    transaction.delete(oldUsernameRef);
                }
            });
            return true;
        } catch (error) {
            console.error("Error updating username:", error);
            throw error;
        }
    }

    // Delete Account
    async function deleteAccount() {
        if (!currentUser) throw new Error("No user logged in");

        const uid = currentUser.uid;

        try {
            // 1. Delete Firestore Data
            // Note: This is complex because we need to delete subcollections (drinks, friends, etc.)
            // Firestore doesn't support recursive delete from client SDK easily.
            // For now, we will just delete the main user document and let cloud functions (if any) or manual cleanup handle the rest.
            // OR we rely on the fact that if the user doc is gone, the app treats them as non-existent.
            // A better approach for client-side is to at least delete the user doc and username reservation.

            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                const usernameLower = userData.usernameLower;

                // Release username
                if (usernameLower) {
                    await deleteDoc(doc(db, "usernames", usernameLower));
                }

                // Delete user profile
                await deleteDoc(userRef);
            }

            // 2. Delete Auth Account
            // Important: This might fail if the user hasn't logged in recently.
            // We should catch that and ask them to re-login.
            await deleteUser(currentUser);

            return true;
        } catch (error) {
            console.error("Error deleting account:", error);
            if (error.code === 'auth/requires-recent-login') {
                throw new Error("Please log out and log back in to delete your account."); // Security requirement
            }
            throw error;
        }
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

        // Check if we are potentially in a redirect callback via sessionStorage flag
        const isRedirecting = sessionStorage.getItem('auth_redirect') === 'true';

        if (isRedirecting) {
            setSyncStatus("Syncing account...");
        }

        // Handle redirect results 
        getRedirectResult(auth)
            .then((result) => {
                sessionStorage.removeItem('auth_redirect'); // Clear flag
                if (result) {
                    setSyncStatus("Loading profile...");
                    // User is signed in, onAuthStateChanged will handle the rest
                } else {
                    // Redirect finished but no result (cancelled or error swallowed)
                    if (isRedirecting) {
                        console.warn("[AUTH] Redirect flag was set but no result. Clearing load state.");
                        setLoading(false);
                    }
                }
            })
            .catch((error) => {
                sessionStorage.removeItem('auth_redirect'); // Clear flag
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

                // Only stop loading if we are NOT waiting for a redirect check
                const stillRedirecting = sessionStorage.getItem('auth_redirect') === 'true';
                if (!stillRedirecting) {
                    setLoading(false);
                }
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
        logout,
        updateUsername,
        deleteAccount
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
