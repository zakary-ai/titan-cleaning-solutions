# Submitting Titan Solutions to the iOS App Store

This app is wrapped with **Capacitor**. The native iOS shell loads the live
Lovable-hosted web app (`https://titan-cleaning-solutions.lovable.app`), so
every time you click **Publish → Update** in Lovable, your users get the new
version instantly — no Apple resubmission required for content/UI changes.

You only need to resubmit to Apple when you change native config (app icon,
splash, name, plugins, version number, etc.).

---

## What you need

- A Mac with macOS 14+
- **Xcode 15+** (free from the Mac App Store)
- An **Apple Developer Program** account ($99/year) — sign up at
  https://developer.apple.com/programs/
- **CocoaPods**: `sudo gem install cocoapods` (or `brew install cocoapods`)
- Node.js / Bun installed (same as for Lovable dev)

---

## One-time setup on your Mac

1. **Clone or download the project** from GitHub (connect the project to GitHub
   first from the Lovable Plus (+) menu).

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Add the iOS platform** (creates the `ios/` Xcode project)
   ```bash
   bunx cap add ios
   ```

4. **Generate icons and splash screens** from `resources/icon.png` and
   `resources/splash.png`
   ```bash
   bunx capacitor-assets generate --ios
   ```

5. **Sync the config into the native project**
   ```bash
   bunx cap sync ios
   ```

6. **Open in Xcode**
   ```bash
   bunx cap open ios
   ```

---

## Configure in Xcode

In the Xcode project navigator, click the **App** target, then:

1. **Signing & Capabilities tab**
   - Team: select your Apple Developer team
   - Bundle Identifier: `com.deleoai.titansolution` (already set)
   - Make sure "Automatically manage signing" is checked

2. **General tab**
   - Display Name: `Titan Solutions`
   - Version: `1.0.0`
   - Build: `1`
   - Deployment Target: iOS 14.0 or higher

3. **Test on a device or simulator** with the Play button (▶) in Xcode.

---

## Submitting to the App Store

1. In **App Store Connect** (https://appstoreconnect.apple.com):
   - Create a new app
   - Bundle ID: `com.deleoai.titansolution`
   - Name: `Titan Solutions`
   - Fill in the App Information (description, keywords, screenshots,
     privacy policy URL, support URL, etc.)

2. **Required screenshots** (take from a simulator or device):
   - 6.7" iPhone (e.g. iPhone 15 Pro Max): 1290 × 2796
   - 6.5" iPhone (e.g. iPhone 11 Pro Max): 1242 × 2688
   - (Optional but recommended) iPad Pro 12.9": 2048 × 2732

3. **Privacy policy URL** — required. Apple will reject without one.

4. **Archive and upload from Xcode**:
   - In Xcode menu: **Product → Destination → Any iOS Device (arm64)**
   - Then: **Product → Archive**
   - When the Organizer window opens: **Distribute App → App Store Connect → Upload**

5. **Submit for review** in App Store Connect after the build finishes
   processing (usually 10–30 min).

   Review typically takes **24–48 hours**.

---

## App Store review heads-up (important)

Because the app loads remote web content, Apple may scrutinize it under
**Guideline 4.2 (Minimum Functionality)**. To avoid rejection:

- Make sure the app provides **clear value beyond a website** — your
  three role-based workflows (admin, supervisor, client) with photo/video
  uploads, daily checklists, and special projects already qualify.
- Add a meaningful **app description** explaining the workflow.
- Have a working **test account** ready for the reviewer (admin or client
  login) and add the credentials in App Store Connect → App Review
  Information.

If Apple pushes back, the fallback is to switch from `server.url`
(remote) to `webDir: "dist"` (bundled static build) — that ships the web
content inside the binary and almost always passes 4.2.

---

## Pushing updates later

**For web/content changes** (most of your iterations):
- Just click **Publish → Update** in Lovable. Users see it immediately.

**For native changes** (icon, splash, name, version, new plugin):
1. Pull latest from GitHub on your Mac
2. `bunx cap sync ios`
3. Bump the **Build** number in Xcode (must increment every upload)
4. Archive → Upload → submit a new build in App Store Connect

---

## Files involved

- `capacitor.config.ts` — Capacitor configuration (bundle ID, server URL, plugins)
- `resources/icon.png` — source 1024×1024 app icon
- `resources/splash.png` — source splash image
- `ios/` — generated Xcode project (created by `cap add ios`, **do not edit by hand**)
