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
    const normalizeTarget = targetUsername.toLowerCase();
    const usernameRef = doc(db, "usernames", normalizeTarget);

    try {
        const usernameSnap = await getDoc(usernameRef);
        if (!usernameSnap.exists()) {
            throw new Error("User not found");
        }

        const targetUid = usernameSnap.data().uid;
        if (targetUid === currentUserId) {
            throw new Error("You cannot add yourself");
        }

        // Add to my friends
        await setDoc(doc(db, "users", currentUserId, "friends", targetUid), {
            username: targetUsername, // We store valid case username? or we fetch it? 
            // Better to fetch user profile, but for simplicity we assume targetUsername is correct casing if we found it?
            // Actually the claimUsername stores exact casing in 'users' but lowercase in 'usernames'.
            // Let's just store the UID and we can fetch details, or store the search term.
            // Ideally we'd fetch the real casing from users/{uid}.
            uid: targetUid,
            addedAt: Date.now()
        });

        return true;
    } catch (e) {
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

