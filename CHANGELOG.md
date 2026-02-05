# Changelog

All notable changes to the Jäger Tracker (ViteMonJager) project will be documented in this file.

## [0.3.1] - 2026-02-05 (Social & UX Update)

### Added
- **Social Feed**: Brand new "Feed" tab to see friends' shots in real-time.
- **Interactions**: Users can now react with emojis (🍻 🎉 🔥 😵) and comment on friends' drinks.
- **Deep Linking**: Push notifications now link directly to specific drinks in the feed, with auto-scroll and highlight.
- **Keyboard Optimization**: The navigation bar now automatically hides when the keyboard is open on mobile to prevent overlapping input fields.

### Fixed
- **UI Consistency**: Fixed the send icon shape in the feed to remain perfectly round on all devices.
- **Performance**: Optimized the social feed to only subscribe to comments when expanded.

## [0.2.0] - 2026-02-01 (Stable Release)

### Added
- **Unified Filtering UI**: Both Activity and Map views now use a consistent "Crew Selector" modal for multi-select filtering.
- **"Shared Only" Map Filter**: New toggle in the map filter to show only drinks shared with the selected crew members.
- **Custom Volume Selector**: New interactive virtual bottle UI allows users to select any volume from 1cl to 70cl.
- **Event**: Events are now live.
- **Deep Linking**: Enhanced Android App Links support (`vitemonjager://` and https links) for opening the app directly from shared links.
- **Security Hardening**: Explicit validation for shared URL parameters (`targetUsername`, `effectiveEventId`) and user confirmation for sharing-triggered actions.
- **Dynamic Sharing**: Share links now automatically use the Netlify production domain.

### Changed
- Refactored `CrewSelector` and `MapFilter` into a more generic, powerful component.
- Improved Map view to support real-time filtering of multiple crew members simultaneously.
- Enhanced "Bottle" stats calculation in Event view to round to 1 decimal place.

### Fixed
- **Chevron Fix**: Fixed a crash in `App.jsx` where `ChevronRight` (and other icons) were used before being imported or defined.
- **Icon Missing Crash**: Fixed a crash when opening the Crew Selector due to missing Lucide icon imports.
- **Login Reliability**: Removed premature timeout that was canceling logins, and added a troubleshooting mode with manual popup login for network-restricted environments.
- **Participant Removal Fix**: Resolved an issue where removing someone from an event would fail due to missing UID in the leaderboard object.
- **Tap Highlight Removal**: Removed the default blue overlay when clicking buttons/filters on mobile devices for a more native feel.
- **Animation Polish**: Optimized the Custom Volume filling animation to be smoother by disabling transitions during active dragging.

## [0.1.1] - 2026-01-30
- Initial deployment fixes for Netlify.
- Basic friend filtering for Activity history.

## [0.1.0] - 2026-01-15
- Core Tracker functionality (Shot counting, Volume tracking).
- Initial Map implementation.
- Personal drink history.
