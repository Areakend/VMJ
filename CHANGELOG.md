# Changelog - Jäger Tracker 🦌🥃

## [0.1.0-beta] - 2026-01-28
### ✨ New Features
- **Address-based Location**: Human-readable addresses are now automatically captured. You can edit locations by searching for an address instead of using raw coordinates.
- **Drinking Buddies**: Tag your Crew when taking a shot! The drink is automatically synced to everyone's history.
- **Social Deletion**: Creators of shared drinks can delete them for the whole group.
- **Advanced Filtering**: New date range filters (From/To) and a redesigned horizontal buddy selector.
- **Shared Stats**: See exactly how many shots and liters you've shared with a specific buddy when filtering.
- **Drink Comments**: Add notes to your shots that appear in history and notifications.
- **Background Push Notifications**: FCM integration for social alerts when the app is closed.

### 🎨 UI & UX Improvements
- **Aesthetic Overhaul**: Implemented glassmorphism, modern highly-rounded corners (24px), and a more aerated layout for a premium feel.
- **Highlighted Stats**: Refined the stats dashboard with a special focal point for "Last Night" activity.
- **Map Header**: Moved map filters above the viewport for better visibility.
- **Language**: Standardized the entire experience (100% English).

### 🛠️ Technical Fixes
- **Geocoding Fix**: Added a mandatory User-Agent header to Nominatim API calls for reliable address resolution.
- **Version Parity**: Incremented `versionCode` to `2` to ensure proper Android update detection.
- **Security Patch**: Upgraded React to `19.2.1` (`CVE-2025-55182`).
- **Bottle Tracking**: Automated calculation of bottles consumed (0.7L equivalent).
- **Edit Mode**: Added the ability to correct volume or time for previous shots.
- **Native Android Polish**: Improved icon assets, splash screens, and safe area management for modern mobile displays.
- **Reliable Auth**: Fixed Google Sign-In persistence and username claim logic.
