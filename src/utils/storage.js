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
    where,
    increment
} from "firebase/firestore";

// ... (lines 16-439 omitted for brevity in replacement, but I must match exact target content for the tool)
// Actually, I can't easily jump lines in one replacement if they are far apart.
// I'll do two replacements. One for import, one for function.

// --- Validation Helpers ---
export const validateUsername = (username) => {
    if (!username) return "Username is required";
    const clean = username.trim();
    if (clean.length < 3) return "Username must be at least 3 characters";
    if (clean.length > 15) return "Username must be at most 15 characters";
    // Alphanumeric and underscores only, no spaces or special chars (prevents traversal)
    if (!/^[a-zA-Z0-9_]+$/.test(clean)) return "Username must be alphanumeric (letters, numbers, underscores)";
    return null;
};

export const validateComment = (comment) => {
    if (!comment) return null;
    if (comment.length > 100) return "Comment is too long (max 100 chars)";
    return null;
};

// Helper to get collection ref
const getDrinksCollection = (userId) => collection(db, "users", userId, "drinks");

export const addDrink = async (userId, drinkData, currentUsername = "A friend", buddies = []) => {
    // 0. Validate comment
    const commentError = validateComment(drinkData.comment);
    if (commentError) throw new Error(commentError);

    try {
        const enrichedDrink = {
            ...drinkData,
            creatorId: userId,
            creatorName: currentUsername,
            buddies: buddies, // Array of {uid, username}
            isShared: buddies.length > 0
        };

        const docRef = await addDoc(getDrinksCollection(userId), enrichedDrink);

        // 1. Save to buddies' collections
        const syncedIds = {}; // buddyUid -> buddyDocId
        if (buddies.length > 0) {
            const syncPromises = buddies.map(async (buddy) => {
                const bRef = await addDoc(getDrinksCollection(buddy.uid), {
                    ...enrichedDrink,
                    originalDrinkId: docRef.id
                });
                syncedIds[buddy.uid] = bRef.id;
            });
            await Promise.all(syncPromises);

            // Update original doc with the buddy doc IDs for future deletion sync
            await setDoc(docRef, { syncedIds }, { merge: true });
        }

        // 2. Background: Send notifications to friends NOT in the drinking session
        try {
            const friendsSnap = await getDocs(collection(db, "users", userId, "friends"));
            const allFriendIds = friendsSnap.docs.map(doc => doc.id);
            const buddyIds = buddies.map(b => b.uid);

            // Only notify friends who WEREN'T there
            const friendsToNotify = allFriendIds.filter(id => !buddyIds.includes(id));

            if (friendsToNotify.length > 0) {
                const now = Date.now();
                const { getRandomJagerMessage } = await import("./notifications");
                const message = getRandomJagerMessage();

                const batchPromises = friendsToNotify.map(friendId =>
                    addDoc(collection(db, "users", friendId, "notifications"), {
                        message: drinkData.comment
                            ? `${currentUsername}: ${message} ("${drinkData.comment}")`
                            : `${currentUsername}: ${message}`,
                        drinkName: drinkData.name || "Jäger",
                        timestamp: now,
                        fromUid: userId,
                        drinkId: docRef.id,
                        drinkOwnerId: userId
                    })
                );
                await Promise.all(batchPromises);
            }
        } catch (err) {
            console.warn("Failed to send social notifications:", err);
        }

        return { id: docRef.id, ...enrichedDrink };
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
        const drinkRef = doc(db, "users", userId, "drinks", drinkId);
        const drinkSnap = await getDoc(drinkRef);

        if (drinkSnap.exists()) {
            const data = drinkSnap.data();

            // Case 1: Creator deletes -> Delete everywhere (Existing logic)
            if (data.creatorId === userId && data.syncedIds) {
                const deletePromises = Object.entries(data.syncedIds).map(([buddyUid, buddyDocId]) =>
                    deleteDoc(doc(db, "users", buddyUid, "drinks", buddyDocId))
                );
                await Promise.all(deletePromises);
            }
            // Case 2: Buddy deletes -> Remove self from everyone's logs
            else if (data.creatorId && data.creatorId !== userId && data.originalDrinkId) {
                const originalDrinkRef = doc(db, "users", data.creatorId, "drinks", data.originalDrinkId);
                const originalSnap = await getDoc(originalDrinkRef);

                if (originalSnap.exists()) {
                    const originalData = originalSnap.data();
                    const updatedBuddies = (originalData.buddies || []).filter(b => b.uid !== userId);

                    // 1. Update Creator's doc
                    await setDoc(originalDrinkRef, { buddies: updatedBuddies }, { merge: true });

                    // 2. Update other Buddies' docs
                    if (originalData.syncedIds) {
                        const updatePromises = Object.entries(originalData.syncedIds)
                            .filter(([buddyUid]) => buddyUid !== userId) // Don't update self (about to delete)
                            .map(([buddyUid, buddyDocId]) =>
                                setDoc(doc(db, "users", buddyUid, "drinks", buddyDocId), { buddies: updatedBuddies }, { merge: true })
                            );
                        await Promise.all(updatePromises);
                    }
                }
            }
        }

        await deleteDoc(drinkRef);
        return true;
    } catch (error) {
        console.error("Error deleting drink:", error);
        throw error;
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
    const error = validateUsername(username);
    if (error) throw new Error(error);

    const normalizeUser = username.toLowerCase().trim();
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
    if (validateUsername(normalizeTarget)) throw new Error("Invalid username format");

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

// --- Social Feed Features ---

// Add a reaction to a friend's drink
export const addReaction = async (ownerId, drinkId, reactorUid, reactorUsername, emoji) => {
    try {
        const reactionRef = doc(db, "users", ownerId, "drinks", drinkId, "reactions", reactorUid);
        await setDoc(reactionRef, {
            uid: reactorUid,
            username: reactorUsername,
            emoji: emoji,
            timestamp: Date.now()
        });
        return true;
    } catch (error) {
        console.error("Error adding reaction:", error);
        throw error;
    }
};

// Remove a reaction from a drink
export const removeReaction = async (ownerId, drinkId, reactorUid) => {
    try {
        const reactionRef = doc(db, "users", ownerId, "drinks", drinkId, "reactions", reactorUid);
        await deleteDoc(reactionRef);
        return true;
    } catch (error) {
        console.error("Error removing reaction:", error);
        throw error;
    }
};

// Subscribe to reactions on a drink
export const subscribeToReactions = (ownerId, drinkId, callback) => {
    const q = collection(db, "users", ownerId, "drinks", drinkId, "reactions");
    return onSnapshot(q, (snapshot) => {
        const reactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(reactions);
    });
};

// Add a comment to a friend's drink
// Add a comment to a friend's drink
export const addComment = async (ownerId, drinkId, commenterUid, commenterUsername, text) => {
    if (!text || text.trim().length === 0) throw new Error("Comment cannot be empty");
    if (text.length > 200) throw new Error("Comment too long (max 200 chars)");

    try {
        await addDoc(collection(db, "users", ownerId, "drinks", drinkId, "comments"), {
            uid: commenterUid,
            username: commenterUsername,
            text: text.trim(),
            timestamp: Date.now()
        });

        // Update parent drink with comment stats
        const drinkRef = doc(db, "users", ownerId, "drinks", drinkId);
        await setDoc(drinkRef, {
            commentCount: increment(1),
            lastCommenterId: commenterUid,
            lastCommentTimestamp: Date.now()
        }, { merge: true });

        // Notify the owner if it's not their own comment
        if (ownerId !== commenterUid) {
            try {
                await addDoc(collection(db, "users", ownerId, "notifications"), {
                    message: `${commenterUsername} commented: "${text.trim()}"`,
                    type: 'comment',
                    drinkId: drinkId,
                    fromUid: commenterUid,
                    timestamp: Date.now()
                });
            } catch (err) {
                console.warn("Failed to send comment notification:", err);
            }
        }

        return true;
    } catch (error) {
        console.error("Error adding comment:", error);
        throw error;
    }
};

// Subscribe to comments on a drink
export const subscribeToComments = (ownerId, drinkId, callback) => {
    const q = query(
        collection(db, "users", ownerId, "drinks", drinkId, "comments"),
        orderBy("timestamp", "asc")
    );
    return onSnapshot(q, (snapshot) => {
        const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(comments);
    });
};

// Subscribe to drinks from all friends (merged timeline)
export const subscribeToFriendsDrinks = (userId, friends, callback) => {
    if (!friends || friends.length === 0) {
        callback([]);
        return () => { };
    }

    const unsubs = [];
    const collections = {}; // uid -> drinks[]

    friends.forEach(friend => {
        const unsub = subscribeToDrinks(friend.uid, (userDrinks) => {
            collections[friend.uid] = userDrinks.map(d => ({
                ...d,
                ownerId: friend.uid,
                ownerUsername: friend.username
            }));

            // Combine and sort all drinks by timestamp
            const combined = Object.values(collections)
                .flat()
                .sort((a, b) => b.timestamp - a.timestamp);
            callback(combined);
        });
        unsubs.push(unsub);
    });

    return () => unsubs.forEach(u => u());
};

