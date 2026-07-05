# Codebase Review — Jäger Tracker (VMJ)

_Review date: 2026-07-05 · App version reviewed: 0.3.2_

## 1. What this app is

Jäger Tracker is a social drink-tracking app built with **React 19 + Vite**, wrapped
in **Capacitor 8** for Android/iOS, and deployed as a **PWA on Netlify**. Data lives in
**Firebase** (Google sign-in via Firebase Auth, Cloud Firestore with offline
persistence, two Cloud Functions that fan out FCM push notifications). Users log
shots (with GPS position reverse-geocoded via Nominatim), tag friends ("crew"),
react/comment on each other's drinks in a feed, see everything on a Leaflet map,
and run group **events** with a live leaderboard, public map pins (200 m join
radius) and a "roulette" mini-game. A GitHub Actions workflow builds a debug APK
on push and publishes it as a GitHub release, which the in-app version checker
polls for updates.

Data model (Firestore):

```
users/{uid}                      profile: username, usernameLower, fcmToken
  drinks/{drinkId}               personal log (+ mirrored copies for tagged buddies)
    reactions/{reactorUid}
    comments/{commentId}
  friends/{friendUid}
  friendRequests/{senderUid}
  notifications/{notifId}        triggers Cloud Function push
usernames/{usernameLower}        global uniqueness registry
events/{eventId}                 participants[], aggregates
  drinks/{drinkId}               per-event shot log
```

## 2. Fixed in this review (see commit)

### Crashes / broken features
| Issue | Location | Impact |
|---|---|---|
| `expandedReactions` / `toggleReactions` referenced but never defined | `TrackerView.jsx` | **App crash** ("App Crash" error screen) whenever a drink in your own history has a reaction |
| `Capacitor` used without being imported | `Friends.jsx`, `EventDetails.jsx` | Native share sheet never worked on Android/iOS (silently fell back to clipboard) |
| `clearTimeout(timeout)` on an undefined variable | `AuthContext.jsx` (RESET SESSION button) | ReferenceError — the escape hatch on a stuck loading screen did nothing |
| `saveFcmToken(uid)` called with no token, return value misused as a token | `App.jsx` | Wrote `fcmToken: undefined` (rejected by Firestore) on every login; real token registration already happens in the push listener |
| Duplicate `totalShots: 0` object key | `events.js` `createEvent` | Latent bug magnet (silent last-wins) |
| CSP `connect-src` missing `api.github.com` | `index.html`, `public/_headers` | The update checker was **blocked by CSP** on the web build; `_headers` was also missing `nominatim.openstreetmap.org`, blocking reverse geocoding on Netlify |
| Leftover AI-editing commentary committed as code comments | `storage.js` lines 19–21 | Dead noise in the file |

### Security
| Issue | Fix |
|---|---|
| **XSS via release notes**: GitHub release `body` was interpolated into HTML and rendered with `dangerouslySetInnerHTML` | Escape HTML entities before markdown-ish formatting (`UpdateModal.jsx`) |
| **`usernames/{name}` squatting/poisoning**: any signed-in user could create a reservation containing *someone else's* uid (breaking sendFriendRequest resolution) or mass-reserve names | Rules now require `request.resource.data.uid == request.auth.uid` on create/update, delete only by owner, and the doc id must be a valid username |
| **Notification spam/spoofing**: `notifications` create was open to any signed-in user with arbitrary content | Rules now require `fromUid == request.auth.uid` and a string message ≤ 500 chars |
| **`events` collection had no Firestore rules at all** | Added a baseline ruleset: signed-in read; create binds `creator.uid` to the authenticated user and validates title; updates cannot change the creator; only the creator can delete. Event drinks stay open to signed-in users because the buddy-tagging flow writes/deletes entries under other uids (TODO documented in the rules) |

> ⚠️ **Deploy note**: the events feature currently *works* in production even though
> `firestore.rules` in this repo has no `events` match — which means **the rules
> deployed to Firebase are not the rules in this repo**. Whatever is deployed is
> likely more permissive than this file. Re-deploy from the repo
> (`firebase deploy --only firestore:rules`) after reviewing, and treat the repo
> as the single source of truth going forward.

### Refactoring / hygiene
- `App.jsx` update check now reads the version from `package.json` instead of a
  hard-coded `'0.3.2'` string (it would silently drift on every release).
- Removed ~25 unused imports/variables/params across `App.jsx`, `AuthContext.jsx`,
  `firebase.js`, `storage.js`, `events.js`, `DrinkMap.jsx`, `EventDetails.jsx`,
  `EventsView.jsx`, `Friends.jsx`, `FriendsFeed.jsx`, `JagerRoulette.jsx`,
  `CustomVolumeSelector.jsx`, `TrackerView.jsx`.
- Replaced the 20-line "thinking out loud" comment block in
  `subscribeToMyEvents` with a concise TODO describing the `participantIds` fix.
- Restructured `FriendsFeed` effects to avoid synchronous `setState` in effect
  bodies (React 19 lint rule).
- ESLint config now covers `functions/` (Node/CommonJS) and test files (vitest
  globals), and ignores `android/`, `ios/`, `dev-dist/`.
- Deleted `test_reaction_sync.js` (one-off manual script at repo root that
  duplicated `addReaction` against the production database).

**Result: `npx eslint .` went from 55 errors to 0 (2 benign warnings left), all
21 tests pass, `npm run build` succeeds.**

## 3. Remaining findings (not changed — need product decisions)

### High priority — security & privacy

1. **Every event is readable by every signed-in user.**
   `subscribeToMyEvents` subscribes to the *entire* `events` collection and
   filters client-side. Besides the scale problem (every user downloads every
   event ever created, forever), it means *private* events — titles, participant
   lists, and via `events/{id}/drinks` the GPS positions of participants — are
   visible to any authenticated user. Fix: add `participantIds: [uid]` to event
   docs, query with `array-contains`, and restrict reads in rules to
   participants or `isPublic == true`.

2. **Anyone can join / mutate any event by ID.** `inviteToEvent` is also the
   "join" path, and event ids are shared in URLs. Any signed-in user who obtains
   an id can add themselves (or in principle any uid) to the participants array,
   toggle statuses, or inflate `totalShots`. The 200 m proximity check for public
   events is enforced only in the UI. Consider participant-scoped update rules
   once `participantIds` exists, and validate aggregate increments (or move
   aggregation to a Cloud Function trigger).

3. **`users/{uid}` profiles are readable by all signed-in users, including
   `fcmToken`.** Push tokens shouldn't be exposed to other users. Move
   `fcmToken` into a private subcollection (e.g. `users/{uid}/private/push`)
   readable only by the owner and the Cloud Functions (Admin SDK bypasses rules).

4. **Account deletion leaves orphaned data.** `deleteAccount` removes only the
   user doc and username reservation; all drinks, comments, reactions, friends
   links, notifications and event participation remain. Under GDPR-style
   expectations this is a data-retention problem. Recommended: a Cloud Function
   (`functions.auth.user().onDelete` or callable) doing a recursive delete, plus
   removing the user from friends' lists.

5. **App Check is commented out** (`firebase.js`) and the CSP still allows
   `unsafe-inline` + `unsafe-eval` in `script-src`. Both weaken the security
   posture of a publicly-reachable Firebase project. Enable App Check with
   ReCaptcha Enterprise, and try removing `unsafe-eval` (nothing in the current
   bundle obviously needs it).

6. **Debug keystore committed and used for released APKs.** The workflow builds
   `assembleDebug` signed with the repo's `android/debug.keystore` and publishes
   it as a GitHub release. Anyone can build an APK with the same signature
   (update-hijack risk for sideloaded installs), and debug builds are
   debuggable. Move to a release build signed with a keystore stored in GitHub
   Actions secrets.

### Medium priority — correctness & robustness

7. **Buddy-tagged drinks & deletions are multi-write without transactions**
   (`addDrink`/`deleteDrink` in `storage.js`). A network failure mid-way leaves
   half-synced mirrors (drink exists for the buddy but not the creator, stale
   `syncedIds`, etc.). Consider `writeBatch` for the mirror writes, and the same
   for `addEventDrink`'s doc + aggregate pair.

8. **Notification fan-out runs on the client** (`addDrink` writes one
   notification doc per friend). With N friends that's N writes from a phone on
   bar Wi-Fi. A single Cloud Function trigger on drink creation could do the
   fan-out server-side (a function already exists for pushes, so the pattern is
   in place).

9. **`getDistanceFromLatLonInM` treats latitude/longitude `0` as missing**
   (`if (!lat1 || ...) return Infinity`). Use explicit `== null` checks.

10. **`removeEventDrink` swallows all errors** (`console.error` only) and
    matches drinks by `(uid, timestamp)` — buddies' mirrored drinks share the
    creator's timestamp, which is what makes this work, but it deletes only
    `snap.docs[0]` if duplicates exist. Worth a comment or an id-based link.

11. **Nominatim custom `User-Agent` header doesn't work from browsers** (it's a
    forbidden header name) and the app hits Nominatim's public API directly at
    click-frequency. Fine at current scale; consider debouncing and honoring
    their usage policy if the user base grows.

12. **`versionChecker.compareVersions` NaNs on tags like `v1.0`** (missing
    patch): `v1[i] > v2[i]` with `undefined` is always false — harmless today
    but easy to harden with `|| 0` defaults.

13. **Duplicate service-worker registration**: `index.html` manually registers
    `/sw.js` while `vite-plugin-pwa` (`registerType: 'autoUpdate'`) also injects
    registration. Keep one (prefer the plugin's).

14. **Web deep-link handler runs only on mount** (`App.jsx` `handleWebLink`)
    and `confirm()`/`alert()` block the main thread; also the
    `vitemonjager://` redirect attempt on mobile web fires unconditionally
    before the confirm dialog. Consider an in-app modal instead of native
    dialogs.

15. **`AuthContext` renders its loading screen and the app's providers around a
    `logout` closure that's recreated per render** — fine, but the file mixes
    auth API, profile subscription, username transactions and account deletion.
    Splitting profile mutations (`updateUsername`, `deleteAccount`) into a
    `useProfile` hook/module would shrink the context surface.

### Lower priority — code quality & DX

16. **`App.jsx` (770 lines) is doing too much**: subscriptions, notifications,
    deep links, import/export, stats *and* view routing, with ~30 `useState`
    hooks and 25+ props drilled into `TrackerView`. Natural next steps:
    - extract `useDrinks`, `useEvents`, `useNotifications`, `useDeepLinks` hooks;
    - move filter state (dates, buddies) into the views that own it — note that
      the Tracker and Map views currently *share* `startDate`/`endDate`, which
      is surprising UX;
    - a `DrinksContext` would eliminate most prop drilling.
17. **Inline styles everywhere** (thousands of lines of style objects). Moving
    the repeated modal/card/button patterns into `index.css` classes (which
    already exist for some, e.g. `premium-button`) or a tiny styled system
    would cut component size by a third and make theme changes possible.
18. **Duplicated logic**: `getLastNightVolume` exists in both `App.jsx` and
    `Friends.jsx`; the share-link builders in `Friends.jsx`/`EventDetails.jsx`
    are near-identical (incl. the hard-coded Netlify fallback domain — move to a
    constant/env); the merged multi-user drink subscription pattern appears in
    both `subscribeToFriendsDrinks` and the map effect in `App.jsx`.
19. **README is still the Vite template** with two project lines pasted on top.
    Worth replacing with setup steps (Firebase config, `firebase deploy`,
    `npx cap sync`) — `APP_LINKS_SETUP.md` and `HOW_TO_SHARE.md` already show
    the right spirit.
20. **Test coverage is thin**: 21 tests over 3 files (validation, location,
    Sidebar). The riskiest logic — `storage.js` mirroring/deletion sync,
    `events.js` aggregates, feed merging — has none. These are pure functions
    over the Firestore SDK and mock well.
21. **CI installs with `npm install --legacy-peer-deps`** (and `.npmrc` pins
    it). The underlying conflict is worth resolving so `npm ci` works — lockfile
    installs are reproducible and faster in CI. Also `actions/checkout@v3` /
    `setup-node@v3` are a major behind (v4/v5).
22. **`AppMinimal.jsx`** is a leftover debug harness imported nowhere (kept, as
    it may be intentional for debugging — delete if not).
23. **Firebase web config committed** (`firebase.js`, and previously
    `test_reaction_sync.js`): this is *by design* public for Firebase web apps —
    not a leak — but it's another reason the rules + App Check items above are
    the real perimeter.

## 4. Suggested feature/UX additions

- **Event `participantIds` migration** (unlocks items 1–2 above and a "My events"
  query that doesn't scan the world).
- **Push for comments/reactions** already half-exists: reactions update the
  parent doc but don't notify; a `onDocumentCreated` trigger on
  `drinks/{id}/reactions/{uid}` would complete the loop.
- **Rate limiting** drink logging (e.g. min 30 s between shots) both as a data
  sanity measure and a nod to responsible-drinking UX; a "drink water" nudge
  after N shots/night would fit the app's tone.
- **Offline UX**: Firestore persistence is on, but the UI never tells the user
  they're offline; a small banner driven by `navigator.onLine` would prevent
  "my shot disappeared" confusion.
- **iOS**: the `ios/` folder exists but the workflow only builds Android; if iOS
  is a target, add a build lane and APNs config for pushes.
