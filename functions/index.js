/**
 * Firebase Cloud Functions for the app:
 * - push notifications to the Crew (new drinks / friend requests)
 * - full data cleanup when a user deletes their account
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const functionsV1 = require("firebase-functions/v1");
const { getMessaging } = require("firebase-admin/messaging");
const { getFirestore } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");

initializeApp();

/**
 * Resolve a user's FCM token. Tokens live in the owner-only
 * users/{uid}/private/push doc; fall back to the legacy fcmToken field on the
 * user doc for clients that haven't re-registered since the migration.
 */
async function getFcmToken(uid) {
    const db = getFirestore();

    const privateSnap = await db.doc(`users/${uid}/private/push`).get();
    if (privateSnap.exists && privateSnap.data().fcmToken) {
        return privateSnap.data().fcmToken;
    }

    const userSnap = await db.doc(`users/${uid}`).get();
    return userSnap.data()?.fcmToken || null;
}

/** Shared Android/APNs delivery options */
const platformConfig = {
    android: {
        notification: {
            channel_id: "default",
            priority: "high",
            icon: "ic_stat_name" // You might need to add this icon asset later
        }
    },
    apns: {
        payload: {
            aps: {
                sound: "default",
                badge: 1
            }
        }
    }
};

exports.onNotificationCreated = onDocumentCreated("users/{uid}/notifications/{notifId}", async (event) => {
    const data = event.data.data();
    const uid = event.params.uid;

    if (!data || !data.message) return null;

    try {
        const fcmToken = await getFcmToken(uid);
        if (!fcmToken) {
            console.log(`No FCM token found for user ${uid}`);
            return null;
        }

        const message = {
            notification: {
                title: "Crew update 🍻",
                body: data.message,
            },
            data: {
                click_action: "FLUTTER_NOTIFICATION_CLICK", // Standard for some plugins
                drinkName: data.drinkName || "Shot",
                drinkId: data.drinkId || "",
                drinkOwnerId: data.drinkOwnerId || ""
            },
            token: fcmToken,
            ...platformConfig
        };

        const response = await getMessaging().send(message);
        console.log("Successfully sent message:", response);
        return response;
    } catch (error) {
        console.error("Error sending push notification:", error);
        return null;
    }
});

exports.onFriendRequestCreated = onDocumentCreated("users/{uid}/friendRequests/{requestId}", async (event) => {
    const data = event.data.data();
    const uid = event.params.uid;

    if (!data || !data.fromUsername) return null;

    try {
        const fcmToken = await getFcmToken(uid);
        if (!fcmToken) {
            console.log(`No FCM token found for user ${uid}`);
            return null;
        }

        const message = {
            notification: {
                title: "New Crew Request! 🍻",
                body: `${data.fromUsername} wants to join your crew!`,
            },
            data: {
                click_action: "FLUTTER_NOTIFICATION_CLICK",
                type: "friend_request",
                fromUid: data.fromUid
            },
            token: fcmToken,
            ...platformConfig
        };

        const response = await getMessaging().send(message);
        console.log("Successfully sent friend request notification:", response);
        return response;
    } catch (error) {
        console.error("Error sending friend request notification:", error);
        return null;
    }
});

/** Delete every doc in a query snapshot, chunked under the 500-write batch limit. */
async function deleteDocs(db, docs) {
    for (let i = 0; i < docs.length; i += 450) {
        const batch = db.batch();
        docs.slice(i, i + 450).forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
    }
}

/**
 * Full cleanup when an account is deleted from Firebase Auth (the client's
 * "Delete Account" only removes the user doc + username; everything else is
 * handled here so no orphaned personal data remains):
 * - the whole users/{uid} tree (drinks, comments, reactions, friends, ...)
 * - username reservations pointing at the uid
 * - the user's entry in other users' friends lists
 * - friend requests the user sent
 * - drinks the user created in buddies' logs (tagged rounds)
 * - membership in events (participants + participantIds)
 *
 * NOTE: the collection-group queries need the fieldOverrides declared in
 * firestore.indexes.json (deploy with `firebase deploy --only firestore:indexes`).
 */
exports.onUserDeleted = functionsV1.auth.user().onDelete(async (user) => {
    const uid = user.uid;
    const db = getFirestore();
    console.log(`Cleaning up data for deleted user ${uid}`);

    try {
        // 1. The user's own tree, subcollections included
        await db.recursiveDelete(db.doc(`users/${uid}`));

        // 2. Username reservations
        const usernames = await db.collection("usernames").where("uid", "==", uid).get();
        await deleteDocs(db, usernames.docs);

        // 3. Presence in other users' friends lists
        const friendEntries = await db.collectionGroup("friends").where("uid", "==", uid).get();
        await deleteDocs(db, friendEntries.docs);

        // 4. Friend requests the user sent
        const sentRequests = await db.collectionGroup("friendRequests").where("fromUid", "==", uid).get();
        await deleteDocs(db, sentRequests.docs);

        // 5. Drinks the user created in buddies' logs (their own were removed in step 1)
        const createdDrinks = await db.collectionGroup("drinks").where("creatorId", "==", uid).get();
        await deleteDocs(db, createdDrinks.docs);

        // 6. Remove the user from events they participated in
        const events = await db.collection("events").where("participantIds", "array-contains", uid).get();
        for (const eventDoc of events.docs) {
            const data = eventDoc.data();
            await eventDoc.ref.update({
                participants: (data.participants || []).filter((p) => p.uid !== uid),
                participantIds: (data.participantIds || []).filter((id) => id !== uid)
            });
        }

        console.log(`Cleanup complete for ${uid}`);
        return null;
    } catch (error) {
        console.error(`Cleanup failed for ${uid}:`, error);
        throw error; // let Cloud Functions retry
    }
});
