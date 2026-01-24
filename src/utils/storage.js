import { db } from "../firebase";
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    deleteDoc,
    doc,
    runTransaction,
    getDoc,
    setDoc,
    getDocs,
    where
} from "firebase/firestore";

// Helper to get collection ref
const getDrinksCollection = (userId) => collection(db, "users", userId, "drinks");

export const addDrink = async (userId, drinkData) => {
    try {
        const docRef = await addDoc(getDrinksCollection(userId), drinkData);
        return { id: docRef.id, ...drinkData };
    } catch (error) {
        console.error("Error adding drink: ", error);
        throw error;
    }
};

export const subscribeToDrinks = (userId, callback) => {
    if (!userId) return () => { };

    const q = query(getDrinksCollection(userId), orderBy("timestamp", "desc"));

    return onSnapshot(q, (snapshot) => {
        const drinks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(drinks);
    }, (error) => {
        console.error("Error listening to drinks:", error);
    });
};

export const deleteDrink = async (userId, drinkId) => {
    try {
        await deleteDoc(doc(db, "users", userId, "drinks", drinkId));
    } catch (error) {
        console.error("Error deleting drink:", error);
    }
}

export const updateDrink = async (userId, drinkId, data) => {
    try {
        const drinkRef = doc(db, "users", userId, "drinks", drinkId);
        await setDoc(drinkRef, data, { merge: true });
        return true;
    } catch (error) {
        console.error("Error updating drink:", error);
        throw error;
    }
}

// --- Social Features ---

// Check if a username is available
export const isUsernameAvailable = async (username) => {
    const q = doc(db, "usernames", username.toLowerCase());
    const snap = await getDoc(q);
    return !snap.exists();
};

// Claim a username for a user
export const claimUsername = async (userId, username) => {
    const normalizeUser = username.toLowerCase();
    const userRef = doc(db, "users", userId);
    const usernameRef = doc(db, "usernames", normalizeUser);

    try {
        await runTransaction(db, async (transaction) => {
            const usernameDoc = await transaction.get(usernameRef);
            if (usernameDoc.exists()) {
                throw new Error("Username already taken");
            }

            // Set user profile
            transaction.set(userRef, {
                username: username,
                usernameLower: normalizeUser,
                createdAt: Date.now()
            }, { merge: true });

            // Reserve username
            transaction.set(usernameRef, { uid: userId });
        });
        return true;
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }
};

// Add a friend by username
export const addFriend = async (currentUserId, currentUsername, targetUsername) => {
    const normalizeTarget = targetUsername.toLowerCase().trim();
    const usernameRef = doc(db, "usernames", normalizeTarget);

    try {
        console.log("Searching for friend:", normalizeTarget);
        let targetUid = null;
        let finalUsername = targetUsername;

        // Try lookup in 'usernames' collection first (fastest)
        const usernameSnap = await getDoc(usernameRef);

        if (usernameSnap.exists()) {
            targetUid = usernameSnap.data().uid;
        } else {
            // Backup: Search 'users' collection by 'usernameLower' field
            console.log("Not found in 'usernames', trying backup search in 'users'...");
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("usernameLower", "==", normalizeTarget));
            const querySnap = await getDocs(q);

            if (!querySnap.empty) {
                targetUid = querySnap.docs[0].id;
                finalUsername = querySnap.docs[0].data().username;
                // Self-heal: Add the missing mapping back to 'usernames'
                try {
                    await setDoc(usernameRef, { uid: targetUid });
                    console.log("Healed missing username mapping for:", normalizeTarget);
                } catch (e) {
                    console.warn("Failed to heal username mapping", e);
                }
            }
        }

        if (!targetUid) {
            throw new Error("User not found");
        }

        if (targetUid === currentUserId) {
            throw new Error("You cannot add yourself");
        }

        // Add to my friends
        await setDoc(doc(db, "users", currentUserId, "friends", targetUid), {
            username: finalUsername,
            uid: targetUid,
            addedAt: Date.now()
        });

        return true;
    } catch (e) {
        console.error("Error in addFriend:", e);
        throw e;
    }
};

export const subscribeToFriends = (userId, callback) => {
    const q = collection(db, "users", userId, "friends");
    return onSnapshot(q, (snapshot) => {
        const friends = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(friends);
    });
};

