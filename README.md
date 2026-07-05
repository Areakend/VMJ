# Shot Tracker 🥃

**Current Version: v0.3.2** · [Changelog](CHANGELOG.md) · [Code Review](CODE_REVIEW.md) · [Publication stores](PUBLISHING.md)

Shot Tracker (working title) is a social drink-tracking app: log shots (with GPS), tag your
crew, react and comment on friends' drinks, and run group events with a live
leaderboard and map.

Built with **React 19 + Vite**, wrapped in **Capacitor 8** for Android/iOS,
deployed as a **PWA on Netlify**, backed by **Firebase** (Google Auth,
Firestore, Cloud Functions + FCM push notifications).

> This application is an independent fan project and has no affiliation with
> the beverage brand.

## Development

```bash
npm install --legacy-peer-deps   # peer conflict from the Google Auth plugin
npm run dev                      # Vite dev server
npm run test:run                 # vitest
npm run lint                     # eslint (0 errors expected)
npm run build                    # production web build -> dist/
```

### Android

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

CI (`.github/workflows/android_build.yml`) builds an APK on every push to
`main`/`master`/`dev-ui-overhaul` and attaches it to a GitHub release. Set the
`ANDROID_KEYSTORE_BASE64` / `ANDROID_KEYSTORE_PASSWORD` / `ANDROID_KEY_ALIAS` /
`ANDROID_KEY_PASSWORD` repository secrets to get properly **signed release
builds** — without them CI falls back to a debug build signed with the public
debug keystore (fine for testing, not for distribution).

## Firebase deployment

The repo is the source of truth for security rules, indexes and functions:

```bash
firebase deploy --only firestore:indexes   # composite indexes + collection-group overrides
firebase deploy --only functions           # push notifications + account-deletion cleanup
node scripts/backfill-participant-ids.js   # one-time events migration (see DEPLOYMENT_NOTES.md)
firebase deploy --only firestore:rules     # AFTER the backfill
```

See [DEPLOYMENT_NOTES.md](DEPLOYMENT_NOTES.md) for the exact ordering and the
environment variables (App Check key, etc.).

## Environment variables (web build)

| Variable | Purpose |
|---|---|
| `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` | Enables Firebase App Check (ReCaptcha Enterprise). Optional — App Check is skipped when unset. |

## Project layout

```
src/
  App.jsx            main shell: subscriptions, deep links, view routing
  components/        Tracker, Feed, Map, Friends, Events views + modals
  contexts/          AuthContext (Google sign-in, profile, account deletion)
  utils/             storage.js (drinks/social), events.js, stats.js, share.js,
                     location.js (GPS + Nominatim), versionChecker.js
functions/           Cloud Functions (push notifications, account cleanup)
firestore.rules      security rules   ·   firestore.indexes.json  indexes
scripts/             one-off migrations
android/ ios/        Capacitor native projects
```
