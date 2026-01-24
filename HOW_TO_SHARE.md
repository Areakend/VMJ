# How to Share Jäger Tracker

## Option 1: Local Wi-Fi (Quickest)
Use this if your friend is in the same room (connected to the same Wi-Fi).

1.  Open the terminal in this VS Code.
2.  Run the command: `npm run dev -- --host`
3.  Look for the **Network** URL in the output (e.g., `http://192.168.1.15:5173`).
4.  Tell your friend to open that exact URL on their phone.
5.  **Tip**: They can tap "Share" -> "Add to Home Screen" to install it like a real app!

## Option 2: Deploy to the Web (Best)
Use this to send a permanent link.

1.  Create a GitHub repository and push this code.
2.  Go to [Vercel.com](https://vercel.com) or [Netlify.com](https://netlify.com).
3.  "Add New Project" -> Import from GitHub.
4.  It will detect "Vite" automatically. Click Deploy.
5.  Send the resulting `.vercel.app` link to your friend.
