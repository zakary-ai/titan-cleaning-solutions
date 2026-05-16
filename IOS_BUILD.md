# iOS / App Store Build Guide

This project is wrapped with Capacitor so it can ship to the App Store.
The wrap was scaffolded in Lovable, but the native iOS build must run on a Mac with Xcode.

## One-time setup (on your Mac)

1. Export the project to GitHub from Lovable, then `git clone` it locally.
2. Install deps: `npm install` (or `bun install`).
3. Build the web app: `npm run build` — produces `dist/`.
4. Add the iOS platform (only once): `npx cap add ios`
5. Open Xcode: `npx cap open ios`
6. In Xcode: set your Team (Signing & Capabilities), bundle id is `com.titansolutions.cleaning`.

## Each time you change the web app

```
npm run build
npx cap sync ios
npx cap open ios   # then Product → Archive in Xcode
```

## Push notifications (when you're ready)

1. Apple Developer account ($99/yr) → create an APNs Auth Key.
2. Create a Firebase project, enable Cloud Messaging, upload the APNs key.
3. In Xcode, enable **Push Notifications** + **Background Modes → Remote notifications** under Signing & Capabilities.
4. Add `GoogleService-Info.plist` from Firebase to the iOS project.
5. In the app, call `PushNotifications.register()` after sign-in and POST the device token to a server function that stores it on the user's profile.
6. Add a server function (or DB trigger + webhook) that calls FCM when a new `messages` row is inserted.

Ask Lovable to wire steps 5–6 once you have the Firebase server key — store it as a secret.

## App icons / splash

Use https://capacitorjs.com/docs/guides/splash-screens-and-icons or `@capacitor/assets` to generate iOS assets from a single 1024x1024 source image.
