import { db } from "../firebase";
import {
    collection,
    doc,
    addDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    arrayUnion,
    arrayRemove,
    runTransaction,
    deleteDoc,
    increment,
    writeBatch
} from "firebase/firestore";

// --- Event Management ---

// Create a new event
export const createEvent = async (creatorUid, creatorUsername, title, date, isPublic = false, location = null) => {
    try {
        const eventsRef = collection(db, "events");
        const newEvent = {
            title,
            date: new Date(date).getTime(),
            creator: { uid: creatorUid, username: creatorUsername },
            createdAt: Date.now(),
            participants: [{
                uid: creatorUid,
                username: creatorUsername,
                role: 'knighted', // creator is always knighted (active)
                status: 'active',
                joinedAt: Date.now()
            }],
            // Flat uid list kept in sync with `participants` — this is what
            // queries and security rules use (array-contains / `in` checks).
            participantIds: [creatorUid],
            status: 'open', // open | closed (global)
            totalShots: 0,
            totalVolume: 0,
            isPublic: isPublic || false,
            location: location // { latitude, longitude, address }
        };
        const docRef = await addDoc(eventsRef, newEvent);
        return docRef.id;
    } catch (e) {
        console.error("Error creating event:", e);
        throw e;
    }
};

// Subscribe to events I am participating in
export const subscribeToMyEvents = (userId, callback) => {
    // Requires the composite index defined in firestore.indexes.json
    // (participantIds array-contains + date desc).
    // Legacy events created before participantIds existed won't match this
    // query — run scripts/backfill-participant-ids.js once to migrate them.
    const q = query(
        collection(db, "events"),
        where("participantIds", "array-contains", userId),
        orderBy("date", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        const events = [];
        snapshot.forEach(doc => {
            events.push({ id: doc.id, ...doc.data() });
        });
        callback(events);
    }, (error) => {
        console.error("Error listening to my events:", error);
    });
};

// Subscribe to ALL Public Events (Open)
export const subscribeToPublicEvents = (callback) => {
    const q = query(
        collection(db, "events"),
        where("isPublic", "==", true),
        where("status", "==", "open"),
        orderBy("date", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        const events = [];
        snapshot.forEach(doc => {
            events.push({ id: doc.id, ...doc.data() });
        });
        callback(events);
    });
};

// Helper: Haversine Distance in Meters
export const getDistanceFromLatLonInM = (lat1, lon1, lat2, lon2) => {
    // Explicit null/undefined checks: 0 is a valid coordinate (equator/prime meridian)
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d * 1000; // Distance in meters
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

// Add a drink to an event (AND update user's personal log)
// This is called from the main App flow
export const addEventDrink = async (eventId, userUid, username, drinkData) => {
    try {
        // Drink doc + aggregate counters commit atomically so totals can't
        // drift from the actual drink log on a partial failure.
        const batch = writeBatch(db);

        const drinkRef = doc(collection(db, "events", eventId, "drinks"));
        batch.set(drinkRef, {
            ...drinkData,
            uid: userUid,
            username: username
        });

        batch.update(doc(db, "events", eventId), {
            totalShots: increment(1),
            totalVolume: increment(drinkData.volume || 0)
        });

        await batch.commit();

        // Note: The caller is responsible for adding to the User's personal log
        // to keep the architecture clean (Event logic vs Personal logic).
        return true;
    } catch (e) {
        console.error("Error adding event drink:", e);
        throw e;
    }
};

// Toggle my status in an event (Contributing / Not Contributing)
// "User can open or close it for himself"
export const toggleEventStatus = async (eventId, userId, isActive) => {
    // We need to find the participant object and update it.
    // Firestore arrayUnion/Remove is tricky for updating properties.
    // Best way: Read, modify array, Write.
    const eventRef = doc(db, "events", eventId);

    await runTransaction(db, async (transaction) => {
        const eventDoc = await transaction.get(eventRef);
        if (!eventDoc.exists()) throw "Event does not exist";

        const data = eventDoc.data();
        const participants = data.participants || [];
        const index = participants.findIndex(p => p.uid === userId);

        if (index !== -1) {
            participants[index].status = isActive ? 'active' : 'inactive'; // 'active' means "I am adding drinks here"
            transaction.update(eventRef, { participants });
        }
    });
};

// Invite a friend to an event (also the self-join path for shared links).
// Runs in a transaction so joining twice can't create duplicate participants
// (arrayUnion would treat two objects with different joinedAt as distinct).
export const inviteToEvent = async (eventId, friendUid, friendUsername) => {
    const eventRef = doc(db, "events", eventId);
    await runTransaction(db, async (transaction) => {
        const eventDoc = await transaction.get(eventRef);
        if (!eventDoc.exists()) throw new Error("Event does not exist");

        const data = eventDoc.data();
        const participants = data.participants || [];
        if (participants.some(p => p.uid === friendUid)) return; // already in

        transaction.update(eventRef, {
            participants: [...participants, {
                uid: friendUid,
                username: friendUsername,
                role: 'guest',
                status: 'active', // Auto-active for simpler joining
                joinedAt: Date.now()
            }],
            participantIds: arrayUnion(friendUid)
        });
    });
};

// Remove a participant from an event
export const removeParticipant = async (eventId, participantUid) => {
    const eventRef = doc(db, "events", eventId);
    await runTransaction(db, async (transaction) => {
        const eventDoc = await transaction.get(eventRef);
        if (!eventDoc.exists()) throw "Event does not exist";

        const data = eventDoc.data();
        const participants = data.participants || [];
        const updatedParticipants = participants.filter(p => p.uid !== participantUid);

        transaction.update(eventRef, {
            participants: updatedParticipants,
            participantIds: arrayRemove(participantUid)
        });
    });
};

// One-time self-heal for events created before `participantIds` existed:
// rebuild the flat uid list from the participants array. Safe to call on
// every event load — it no-ops when the field is already present.
export const ensureParticipantIds = async (eventId, eventData) => {
    if (eventData.participantIds || !eventData.participants?.length) return;
    try {
        await updateDoc(doc(db, "events", eventId), {
            participantIds: eventData.participants.map(p => p.uid)
        });
    } catch (e) {
        console.warn("Could not backfill participantIds for event", eventId, e);
    }
};

// Remove a specific drink from an event
export const removeEventDrink = async (eventId, userUid, drinkTimestamp) => {
    try {
        const drinksRef = collection(db, "events", eventId, "drinks");
        const q = query(drinksRef, where("uid", "==", userUid), where("timestamp", "==", drinkTimestamp));
        const snap = await getDocs(q);

        if (snap.empty) return;

        // Delete every matching doc and decrement the aggregates in the same
        // atomic batch so the counters stay consistent with the drink log.
        const batch = writeBatch(db);
        let removedShots = 0;
        let removedVolume = 0;

        snap.docs.forEach((drinkDoc) => {
            batch.delete(drinkDoc.ref);
            removedShots += 1;
            removedVolume += drinkDoc.data().volume || 2;
        });

        batch.update(doc(db, "events", eventId), {
            totalShots: increment(-removedShots),
            totalVolume: increment(-removedVolume)
        });

        await batch.commit();
    } catch (e) {
        console.error("Error removing event drink:", e);
        throw e;
    }
};

// Delete an entire event
export const deleteEvent = async (eventId) => {
    try {
        await deleteDoc(doc(db, "events", eventId));
        return true;
    } catch (e) {
        console.error("Error deleting event:", e);
        throw e;
    }
};

// Toggle event open/closed status
export const setEventStatus = async (eventId, status) => {
    try {
        const eventRef = doc(db, "events", eventId);

        await runTransaction(db, async (transaction) => {
            const eventDoc = await transaction.get(eventRef);
            if (!eventDoc.exists()) throw "Event does not exist";

            const data = eventDoc.data();
            const updateData = { status };

            // Cascade set participants to 'inactive' if closing globally
            if (status === 'closed' && data.participants) {
                updateData.participants = data.participants.map(p => ({
                    ...p,
                    status: 'inactive'
                }));
            }

            transaction.update(eventRef, updateData);
        });

        return true;
    } catch (e) {
        console.error("Error updating event status:", e);
        throw e;
    }
};

