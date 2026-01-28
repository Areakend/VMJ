# Changelog - Jäger Tracker 🦌🥃

## [0.1.0-beta] - 2026-01-28
### ✨ Major Features
- **Map Friend Locations**: You can now toggle visibility of your "Crew" members on the map and see their recent activity via markers.
- **Background Push Notifications**: Using Firebase Cloud Messaging, you now receive alerts even when the app is closed.
- **Language Standardization**: The entire app (UI, alerts, and 20+ funny notifications) has been translated to **English**.
- **Drink Comments**: Add a note to your shots (e.g., "A toast to the host!") which appears in your history and notifications.
- **Address-based Location**: Human-readable addresses are now automatically captured. You can also edit locations by searching for an address instead of using coordinates.
- **Drinking Buddies**: Tag your Crew when taking a shot! The drink is automatically synced to everyone's history, and you can filter activity to see only the shots you took with specific friends.
 You can also edit locations by searching for an address instead of using coordinates.

### 🛠️ Improvements & Fixes
- **Security Patch**: Upgraded React to `19.2.1` to address the `CVE-2025-55182` vulnerability.
- **Bottle Tracking**: Automated calculation of bottles consumed (0.7L equivalent).
- **Edit Mode**: Added the ability to correct volume or time for previous shots.
- **Native Android Polish**: Improved icon assets, splash screens, and safe area management for modern mobile displays.
- **Reliable Auth**: Fixed Google Sign-In persistence and username claim logic.
