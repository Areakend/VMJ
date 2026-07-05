# Deployment notes — 0.3.x security & events migration

The changes on this branch include a Firestore data migration and tightened
security rules. **Order matters** — follow these steps top to bottom.

## 1. Deploy indexes (safe anytime)

```bash
firebase deploy --only firestore:indexes
```

Creates:
- `events(participantIds array-contains, date desc)` — used by "My Events"
- `events(isPublic, status, date desc)` — used by the public events map (may
  already exist in the console if it was created by hand)
- collection-group single-field indexes on `friends.uid`,
  `friendRequests.fromUid`, `drinks.creatorId` — used by the account-deletion
  cleanup function

Wait for the indexes to finish building in the Firebase console before step 4.

## 2. Deploy Cloud Functions

```bash
cd functions && npm install && cd ..
firebase deploy --only functions
```

New/changed:
- `onNotificationCreated` / `onFriendRequestCreated`: now read the FCM token
  from `users/{uid}/private/push` (falling back to the legacy `fcmToken` field).
- `onUserDeleted` (new): full data cleanup when an Auth account is deleted —
  user tree, username reservation, friends-list entries, sent requests,
  drinks tagged into buddies' logs, event membership.

## 3. Ship the new app build

Deploy the web build (Netlify) and/or release the APK. The new client:
- writes `participantIds` on new events and self-heals events it opens,
- registers push tokens in the private subcollection and scrubs the legacy
  public `fcmToken` field on next login,
- relies on `deleteUser` + `onUserDeleted` for account deletion.

## 4. Backfill legacy events

**Required before step 5**, otherwise participants of old private events lose
access to them (the new rules check `participantIds`).

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
node scripts/backfill-participant-ids.js
```

Idempotent — safe to run multiple times.

## 5. Deploy the tightened rules

```bash
firebase deploy --only firestore:rules
```

Effect summary:
- `events`: private events readable only by participants; public events by any
  signed-in user; creator pinned on update; creator-only delete.
- `usernames`: reservations can only be created/updated/released by the uid
  they point to.
- `notifications`: senders must identify themselves (`fromUid`), bounded size.
- `users/{uid}/private/*`: owner-only (push tokens live here now).

## 6. Optional hardening

- **App Check**: create a ReCaptcha Enterprise site key in Firebase console →
  App Check, set `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` in Netlify env (and
  `.env.local` for dev), redeploy the web app, watch the App Check metrics in
  "monitor" mode, then switch Firestore/Auth to **enforce**.
- **Release signing**: generate a release keystore
  (`keytool -genkeypair -v -keystore release.keystore -alias vmj -keyalg RSA -keysize 2048 -validity 10000`),
  add the four `ANDROID_*` secrets to the GitHub repo, and CI will produce
  signed release APKs. Note: existing sideloaded installs signed with the debug
  key cannot upgrade in place to the release-signed APK (uninstall/reinstall
  once).
