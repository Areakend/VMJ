import { db } from "../firebase";
import {
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
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
    increment
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
            status: 'open', // open | closed (global)
            totalShots: 0,
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
    // Firestore doesn't support array-contains-any for objects easily without specific structure
    // We'll iterate client side or filter if we change structure. 
    // For now, let's fetch all events and filter (not scalable but works for MVP)
    // OR: Store 'participantIds' array separately on the event doc for query.

    // Better Approach: Query where 'participantIds' array-contains userId
    // I need to ensure createEvent adds this field.

    // Re-doing createEvent simplified model for query:
    // We will assume 'participantIds' exists.

    const eventsRef = collection(db, "events");
    // const q = query(eventsRef, where("participantIds", "array-contains", userId), orderBy("date", "desc"));
    // Since we didn't add participantIds yet, let's use a simpler query for now 
    // or just listen to all events (dangerous for scale).

    // Let's rely on a 'participants' map or array check.
    // Actually, let's just create 'participantIds' in createEvent going forward.

    const q = query(collection(db, "events"), orderBy("date", "desc"));

    return onSnapshot(q, (snapshot) => {
        const events = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // detailed check
            const isParticipant = data.participants?.some(p => p.uid === userId);
            if (isParticipant) {
                events.push({ id: doc.id, ...data });
            }
        });
        callback(events);
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
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity; // Return infinite if coords missing
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
        // 1. Add to Event's Drink Subcollection
        const eventDrinkyRef = collection(db, "events", eventId, "drinks");
        await addDoc(eventDrinkyRef, {
            ...drinkData,
            uid: userUid,
            username: username
        });

        // 2. Update Event Aggregates (Atomic)
        const eventRef = doc(db, "events", eventId);
        await updateDoc(eventRef, {
            totalShots: increment(1),
            totalVolume: increment(drinkData.volume)
        });

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

// Invite a friend to an event
export const inviteToEvent = async (eventId, friendUid, friendUsername) => {
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, {
        participants: arrayUnion({
            uid: friendUid,
            username: friendUsername,
            role: 'guest',
            status: 'active', // Auto-active for simpler joining
            joinedAt: Date.now()
        })
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

        transaction.update(eventRef, { participants: updatedParticipants });
    });
};

// Remove a specific drink from an event
export const removeEventDrink = async (eventId, userUid, drinkTimestamp) => {
    try {
        const drinksRef = collection(db, "events", eventId, "drinks");
        const q = query(drinksRef, where("uid", "==", userUid), where("timestamp", "==", drinkTimestamp));
        const snap = await getDocs(q);

        if (!snap.empty) {
            const drinkDoc = snap.docs[0];
            const drinkData = drinkDoc.data();

            // 1. Delete the doc
            await deleteDoc(doc(db, "events", eventId, "drinks", drinkDoc.id));

            // 2. Decrement aggregates
            const eventRef = doc(db, "events", eventId);
            await updateDoc(eventRef, {
                totalShots: increment(-1),
                totalVolume: increment(-(drinkData.volume || 2))
            });
        }
    } catch (e) {
        console.error("Error removing event drink:", e);
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

