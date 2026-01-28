/**
 * Firebase Cloud Function to send Push Notifications to the Crew
 * when a notification document is added to a user's collection.
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { getFirestore } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");

initializeApp();

exports.onNotificationCreated = onDocumentCreated("users/{uid}/notifications/{notifId}", async (event) => {
    const data = event.data.data();
    const uid = event.params.uid;

    if (!data || !data.message) return null;

    try {
        // 1. Get the target user's FCM token
        const userSnap = await getFirestore().doc(`users/${uid}`).get();
        const userData = userSnap.data();
        const fcmToken = userData?.fcmToken;

        if (!fcmToken) {
            console.log(`No FCM token found for user ${uid}`);
            return null;
        }

        // 2. Prepare the push message
        const message = {
            notification: {
                title: "New Jäger! 🦌",
                body: data.message,
            },
            data: {
                click_action: "FLUTTER_NOTIFICATION_CLICK", // Standard for some plugins
                drinkName: data.drinkName || "Jäger"
            },
            token: fcmToken,
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

        // 3. Send the message via FCM
        const response = await getMessaging().send(message);
        console.log("Successfully sent message:", response);
        return response;

    } catch (error) {
        console.error("Error sending push notification:", error);
        return null;
    }
});
