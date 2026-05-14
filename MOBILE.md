# Titan Solutions — Mobile App (iOS & Android) Setup

This guide takes you from the Lovable web app to a real `.ipa` (App Store) and `.aab` (Google Play) using **Capacitor**.

The web app stays in Lovable. The native shell just loads your published Lovable URL, so all server functions, auth, and database access keep working with zero changes.

---

## Prerequisites (one-time setup)

| Requirement | Why |
|---|---|
| **Mac with macOS 13+** | Required for iOS builds. No way around this. |
| **Xcode 15+** (free, Mac App Store) | Builds + uploads iOS app |
| **Android Studio** (free) | Builds + uploads Android app |
| **Node.js 20+** | Runs Capacitor CLI |
| **Apple Developer account** ($99/yr) | https://developer.apple.com/programs/ |
| **Google Play Developer account** ($25 once) | https://play.google.com/console/signup |

---

## Step 1 — Get the code locally

In Lovable: top-right **GitHub** button → push to a new repo. Then:

```bash
git clone <your-repo-url> titan-app
cd titan-app
npm install
```

## Step 2 — Install Capacitor

```bash
npm i @capacitor/core
npm i -D @capacitor/cli
npm i @capacitor/ios @capacitor/android
```

(`capacitor.config.ts` is already in this repo — bundle ID `com.titancleaning.app`, app name "Titan Solutions".)

## Step 3 — Add native platforms

```bash
npx cap add ios
npx cap add android
npx cap sync
```

This creates `ios/` and `android/` folders. Commit them.

## Step 4 — Add app icons

Use `public/icon-1024.png` (already in repo) at https://icon.kitchen or https://www.appicon.co — drop it in, download both icon sets, and replace:
- iOS: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Android: `android/app/src/main/res/mipmap-*/`

## Step 5 — Build & open

```bash
npx cap open ios       # opens Xcode
npx cap open android   # opens Android Studio
```

### iOS (in Xcode)
1. Select the **App** target → **Signing & Capabilities** → pick your Team.
2. Set Bundle Identifier to `com.titancleaning.app` (already set).
3. Run on a simulator first: ▶️ button.
4. To submit: **Product → Archive** → Distribute App → App Store Connect.
5. Finish submission at https://appstoreconnect.apple.com (screenshots, description, demo login).

### Android (in Android Studio)
1. Wait for Gradle sync.
2. Run on emulator: ▶️ button.
3. To submit: **Build → Generate Signed Bundle / APK → Android App Bundle**.
4. Upload the `.aab` to https://play.google.com/console.

---

## Updating the app later

**Web/UI changes** (anything you change in Lovable):
- They go live the moment you click **Publish** in Lovable.
- The native app loads them on next launch — **no resubmission needed.**

**Native changes** (icon, splash, native plugins, permissions):
- Bump version in `ios/App/App.xcodeproj` and `android/app/build.gradle`.
- Re-run `npx cap sync` and re-archive/re-bundle.
- Resubmit to stores (1–3 day Apple review, ~hours for Google).

---

## App Store submission checklist

- ✅ Privacy policy URL (required) — host one at `/privacy` on your domain
- ✅ Demo account credentials for review (use `admin@titan.test` / your test password)
- ✅ Screenshots: 6.7" iPhone (1290×2796) and 6.5" iPhone (1284×2778) — at minimum
- ✅ App description, keywords, support URL
- ✅ Age rating questionnaire
- ✅ Export compliance: select "No" if you only use HTTPS (most apps)

---

## Troubleshooting

**"App can't be loaded" on launch** → Check `capacitor.config.ts` `server.url` matches your published URL. Update if you connect a custom domain.

**Camera/photo upload not working** → Add `@capacitor/camera`:
```bash
npm i @capacitor/camera
npx cap sync
```
Then add camera usage description to `ios/App/App/Info.plist` and `android/app/src/main/AndroidManifest.xml`.

**Push notifications** → Add `@capacitor/push-notifications` + Firebase setup. Out of scope for v1; ship without and add in v1.1.
