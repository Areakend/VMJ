/**
 * One-time migration: backfill the flat `participantIds` uid array on event
 * docs created before it existed. Run this BEFORE deploying the tightened
 * firestore.rules, otherwise legacy private events become unreadable for
 * their own participants.
 *
 * Usage (needs a service account with Firestore access):
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
 *   node scripts/backfill-participant-ids.js
 *
 * Idempotent: events that already have participantIds are skipped.
 */

const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

async function main() {
    const snap = await db.collection("events").get();
    console.log(`Scanning ${snap.size} events...`);

    let updated = 0;
    let skipped = 0;

    for (const doc of snap.docs) {
        const data = doc.data();
        if (Array.isArray(data.participantIds)) {
            skipped++;
            continue;
        }
        const participantIds = (data.participants || []).map(p => p.uid).filter(Boolean);
        await doc.ref.update({ participantIds });
        console.log(`  backfilled ${doc.id} (${participantIds.length} participants)`);
        updated++;
    }

    console.log(`Done. Updated ${updated}, skipped ${skipped} (already migrated).`);
}

main().catch((err) => {
    console.error("Backfill failed:", err);
    process.exitCode = 1;
});
