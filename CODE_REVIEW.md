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

## 3. Remaining findings

> **Status update (second pass, same branch):** items 1, 3, 4, 5 (partially),
> 6, 7, 9, 10, 12, 13, 18, 19, 22 are now **implemented** — see
> `DEPLOYMENT_NOTES.md` for the required deploy/migration ordering. Statuses
> are marked inline below.

### High priority — security & privacy

1. ✅ **DONE — Every event was readable by every signed-in user.**
   Events now carry a flat `participantIds` array; `subscribeToMyEvents` uses an
   `array-contains` query (composite index in `firestore.indexes.json`), rules
   restrict reads to participants or `isPublic == true`, event drinks follow the
   parent event's visibility, joins are transactional (also fixing duplicate
   participants), legacy events self-heal on open and
   `scripts/backfill-participant-ids.js` migrates the rest. **Backfill must run
   before the new rules are deployed.**

2. **PARTIAL — Anyone can join / mutate any event by ID.** Joining by link is
   an intentional product behavior, so event updates remain open to signed-in
   users (creator identity is pinned, and private events are no longer
   discoverable). Remaining exposure: a participant of an event (or anyone with
   the id of a public event) can still toggle others' statuses or skew
   aggregates. Full fix needs participant-scoped update rules with field-level
   diffs, or moving aggregation into a Cloud Function trigger.

3. ✅ **DONE — `fcmToken` was readable by all signed-in users.** Tokens now live
   in owner-only `users/{uid}/private/push`; the client scrubs the legacy field
   on next registration and the Cloud Functions read the new location with a
   legacy fallback.

4. ✅ **DONE — Account deletion left orphaned data.** New `onUserDeleted` Cloud
   Function recursively deletes the user tree, username reservations,
   friends-list entries, sent friend requests, drinks tagged into buddies' logs,
   and event membership. The client now deletes the Auth user first, so a
   `requires-recent-login` failure leaves the account intact instead of
   half-deleted. Requires the collection-group index overrides in
   `firestore.indexes.json`.

5. ✅/⚠️ **PARTIAL — App Check & CSP.** App Check initializes automatically when
   `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` is set (still needs the site key to be
   created and the env var configured — see DEPLOYMENT_NOTES). `unsafe-eval`
   removed from both CSPs and ReCaptcha hosts added; `unsafe-inline` remains in
   `script-src` (needed by the PWA register snippet and Google auth) — hash-based
   allowlisting would be the next step.

6. ✅ **DONE — Debug keystore was used for released APKs.** `build.gradle` now
   has a release `signingConfig` fed by env vars, and CI builds a signed
   `assembleRelease` when the `ANDROID_*` keystore secrets exist (explicit debug
   fallback otherwise). Existing sideloaded installs must reinstall once when
   switching signatures.

### Medium priority — correctness & robustness

7. ✅ **DONE — Multi-doc writes were non-atomic.** `addDrink` writes the drink +
   all buddy mirrors + `syncedIds` in a single `writeBatch`; `deleteDrink` does
   the same for mirror deletion/buddy-list updates; `addEventDrink` and
   `removeEventDrink` commit the drink doc and aggregate counters atomically
   (and `removeEventDrink` now handles duplicate matches and surfaces errors).

8. **Notification fan-out runs on the client** (`addDrink` writes one
   notification doc per friend). With N friends that's N writes from a phone on
   bar Wi-Fi. A single Cloud Function trigger on drink creation could do the
   fan-out server-side (a function already exists for pushes, so the pattern is
   in place).

9. ✅ **DONE — `getDistanceFromLatLonInM` treated coordinate `0` as missing.**
   Now uses explicit `== null` checks (with a regression test).

10. ✅ **DONE — `removeEventDrink` swallowed errors and only deleted the first
    match.** Now deletes all matching docs, decrements aggregates by the actual
    removed amounts in the same batch, and rethrows errors.

11. **Nominatim custom `User-Agent` header doesn't work from browsers** (it's a
    forbidden header name) and the app hits Nominatim's public API directly at
    click-frequency. Fine at current scale; consider debouncing and honoring
    their usage policy if the user base grows.

12. ✅ **DONE — `compareVersions` hardened** with `|| 0` defaults for missing
    segments, exported, and unit-tested.

13. ✅ **DONE — Duplicate service-worker registration removed** from
    `index.html`; `vite-plugin-pwa` owns registration.

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
18. ✅ **DONE (mostly) — Duplicated logic**: `getLastNightVolume`/volume math now
    live in `src/utils/stats.js`; share-sheet + base-URL logic in
    `src/utils/share.js` (used by Friends & EventDetails). Still open: the
    merged multi-user drink subscription pattern exists in both
    `subscribeToFriendsDrinks` and the map effect in `App.jsx`.
19. ✅ **DONE — README rewritten** with real setup/build/deploy instructions;
    added `DEPLOYMENT_NOTES.md` for the migration ordering.
20. **PARTIAL — Test coverage**: added unit tests for `stats`,
    `compareVersions` and the haversine distance (30 tests total). The
    Firestore-coupled logic (`storage.js` mirroring, event aggregates, feed
    merging) still has none — needs `firebase/firestore` module mocks or the
    emulator.
21. **PARTIAL — CI**: actions bumped to v4. `npm install --legacy-peer-deps`
    remains — the conflict comes from `@codetrix-studio/capacitor-google-auth`
    (pre-release peer range); resolving it means switching Google auth plugins.
22. ✅ **DONE — `AppMinimal.jsx` deleted** (debug harness imported nowhere).
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
