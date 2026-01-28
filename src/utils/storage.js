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

export const addDrink = async (userId, drinkData, currentUsername = "A friend") => {
    try {
        const docRef = await addDoc(getDrinksCollection(userId), drinkData);

        // Background: Send notifications to friends
        try {
            const friendsSnap = await getDocs(collection(db, "users", userId, "friends"));
            const friends = friendsSnap.docs.map(doc => doc.id);

            if (friends.length > 0) {
                // Ensure timestamp is present for delivery
                const now = Date.now();
                const { getRandomJagerMessage } = await import("./notifications");
                const message = getRandomJagerMessage();

                const batchPromises = friends.map(friendId =>
                    addDoc(collection(db, "users", friendId, "notifications"), {
                        message: `${currentUsername}: ${message}`,
                        drinkName: drinkData.name || "Jäger",
                        timestamp: now,
                        fromUid: userId
                    })
                );
                await Promise.all(batchPromises);
            }
        } catch (err) {
            console.warn("Failed to send social notifications:", err);
        }

        return { id: docRef.id, ...drinkData };
    } catch (error) {
        console.error("Error adding drink: ", error);
        throw error;
    }
};

export const subscribeToIncomingNotifications = (userId, callback) => {
    if (!userId) return () => { };

    // Simplify: Listen for ALL recent changes in the collection
    // Complex filters (where + orderBy) often fail without manually created indexes in Firebase dashboard
    const q = query(
        collection(db, "users", userId, "notifications"),
        orderBy("timestamp", "desc")
    );

    const startTime = Date.now();

    return onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            // Only process NEWLY added notifications that happened AFTER we started listening
            if (change.type === "added") {
                const data = change.doc.data();
                if (data.timestamp > startTime - 5000) { // 5s grace period
                    callback(data);
                }
            }
        });
    });
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

// Send a friend request
export const sendFriendRequest = async (currentUserId, currentUsername, targetUsername) => {
    const normalizeTarget = targetUsername.toLowerCase().trim();
    const usernameRef = doc(db, "usernames", normalizeTarget);

    try {
        let targetUid = null;
        let finalTargetUsername = targetUsername;

        const usernameSnap = await getDoc(usernameRef);
        if (usernameSnap.exists()) {
            targetUid = usernameSnap.data().uid;
        } else {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("usernameLower", "==", normalizeTarget));
            const querySnap = await getDocs(q);
            if (!querySnap.empty) {
                targetUid = querySnap.docs[0].id;
                finalTargetUsername = querySnap.docs[0].data().username;
            }
        }

        if (!targetUid) throw new Error("User not found");
        if (targetUid === currentUserId) throw new Error("You cannot add yourself");

        // Check if already friends
        const friendSnap = await getDoc(doc(db, "users", currentUserId, "friends", targetUid));
        if (friendSnap.exists()) throw new Error("Already friends");

        // Send request to target's inbox
        await setDoc(doc(db, "users", targetUid, "friendRequests", currentUserId), {
            fromUid: currentUserId,
            fromUsername: currentUsername,
            timestamp: Date.now()
        });

        return true;
    } catch (e) {
        console.error("Error sending friend request:", e);
        throw e;
    }
};

// Subscribe to incoming friend requests
export const subscribeToRequests = (userId, callback) => {
    const q = collection(db, "users", userId, "friendRequests");
    return onSnapshot(q, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(requests);
    });
};

// Accept friend request
export const acceptFriendRequest = async (currentUserId, currentUsername, request) => {
    const senderRef = doc(db, "users", request.fromUid);
    const currentUserRef = doc(db, "users", currentUserId);

    try {
        await runTransaction(db, async (transaction) => {
            const senderSnap = await transaction.get(senderRef);
            if (!senderSnap.exists()) throw new Error("Sender no longer exists");

            const senderData = senderSnap.data();

            // 1. Add sender to my friends
            transaction.set(doc(db, "users", currentUserId, "friends", request.fromUid), {
                uid: request.fromUid,
                username: request.fromUsername,
                addedAt: Date.now()
            });

            // 2. Add me to sender's friends
            transaction.set(doc(db, "users", request.fromUid, "friends", currentUserId), {
                uid: currentUserId,
                username: currentUsername,
                addedAt: Date.now()
            });

            // 3. Delete the request
            transaction.delete(doc(db, "users", currentUserId, "friendRequests", request.fromUid));
        });
        return true;
    } catch (e) {
        console.error("Error accepting friend request:", e);
        throw e;
    }
};

// Decline friend request
export const declineFriendRequest = async (currentUserId, senderUid) => {
    try {
        await deleteDoc(doc(db, "users", currentUserId, "friendRequests", senderUid));
        return true;
    } catch (e) {
        console.error("Error declining friend request:", e);
        throw e;
    }
};

// Remove a friend
export const removeFriend = async (currentUserId, friendUid) => {
    const myFriendRef = doc(db, "users", currentUserId, "friends", friendUid);
    const theirFriendRef = doc(db, "users", friendUid, "friends", currentUserId);

    try {
        await runTransaction(db, async (transaction) => {
            transaction.delete(myFriendRef);
            transaction.delete(theirFriendRef);
        });
        return true;
    } catch (e) {
        console.error("Error removing friend:", e);
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

export const saveFcmToken = async (userId, token) => {
    try {
        const userRef = doc(db, "users", userId);
        await setDoc(userRef, { fcmToken: token }, { merge: true });
        return true;
    } catch (e) {
        console.error("Error saving FCM token:", e);
        return false;
    }
};

