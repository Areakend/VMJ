import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, deleteField } from "firebase/firestore";

// Config from src/firebase.js
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
const db = getFirestore(app);

// Mock addReaction function from storage.js
const addReaction = async (ownerId, drinkId, reactorUid, reactorUsername, emoji) => {
    try {
        const reactionRef = doc(db, "users", ownerId, "drinks", drinkId, "reactions", reactorUid);
        await setDoc(reactionRef, {
            uid: reactorUid,
            username: reactorUsername,
            emoji: emoji,
            timestamp: Date.now()
        });

        // Sync to parent for preview
        const drinkRef = doc(db, "users", ownerId, "drinks", drinkId);
        await setDoc(drinkRef, {
            [`reactions.${reactorUid}`]: emoji
        }, { merge: true });

        console.log("Reaction added and synced to parent.");
        return true;
    } catch (error) {
        console.error("Error adding reaction:", error);
        throw error;
    }
};

const test = async () => {
    const ownerId = "test_user_owner";
    const drinkId = "test_drink_id";
    const reactorUid = "test_user_reactor";

    // Create dummy drink
    await setDoc(doc(db, "users", ownerId, "drinks", drinkId), {
        name: "Test Jager",
        timestamp: Date.now()
    });

    // Add reaction
    await addReaction(ownerId, drinkId, reactorUid, "TestUser", "🔥");

    // Verify parent doc
    const snap = await getDoc(doc(db, "users", ownerId, "drinks", drinkId));
    const data = snap.data();
    console.log("Drink Data:", JSON.stringify(data, null, 2));

    if (data.reactions && data.reactions[reactorUid] === "🔥") {
        console.log("SUCCESS: Reaction synced correctly!");
    } else {
        console.error("FAILURE: Reaction NOT synced.");
    }

    // Cleanup
    await deleteDoc(doc(db, "users", ownerId, "drinks", drinkId));
    process.exit(0);
};

test();
