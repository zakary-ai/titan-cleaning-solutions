# App Store readiness audit

I went through the iOS wrapper, Capacitor config, web app, and privacy surfaces. The previous rejection (missing camera usage string) is already fixed. One more concrete issue stands out; everything else looks compliant.

## Issue found: `UIRequiredDeviceCapabilities` lists `armv7`

`ios/App/App/Info.plist` currently declares:

```xml
<key>UIRequiredDeviceCapabilities</key>
<array>
    <string>armv7</string>
</array>
```

Problems:
- `armv7` is the **32-bit** ARM instruction set. No iPhone sold since the iPhone 5s (2013) runs 32-bit, and iOS itself dropped 32-bit support in iOS 11. The reviewer's iPhone 17 Pro Max is **arm64-only**.
- App Store Connect now rejects (or at minimum warns on) binaries that declare `armv7` as a hard install requirement, because it makes the app appear incompatible with every modern device.
- Capacitor's official template uses `arm64` here. Our value is leftover boilerplate.

Fix: replace `armv7` with `arm64` in that array.

## Things I checked and are fine — no change needed

- `NSCameraUsageDescription`, `NSMicrophoneUsageDescription`, `NSPhotoLibraryUsageDescription` are present with clear, purpose-specific strings (Guideline 5.1.1).
- `ITSAppUsesNonExemptEncryption=false` is set — avoids the export-compliance question on every upload.
- `LSRequiresIPhoneOS=true`, supported orientations, status bar style, launch storyboard, and bundle metadata are all populated.
- A `/privacy` route exists for the App Store "Privacy Policy URL" field.
- `capacitor.config.ts` uses `cleartext: false` (no ATS issue) and a valid HTTPS `server.url`.
- No undocumented privacy-sensitive APIs are touched in the web bundle (no geolocation, contacts, calendar, HealthKit, etc.).
- The PushNotifications Capacitor plugin is wired but unused at the JS layer; harmless without an `aps-environment` entitlement.

## Note on the live-URL wrapper (informational, no change)

`capacitor.config.ts` loads `https://titan-cleaning-solutions.lovable.app`. Apple sometimes flags pure WebView wrappers under Guideline 4.2 ("minimum functionality"). This build already passed initial intake on attempt 1 (it crashed mid-review, not at submission), so we're not changing it — just flagging it so you know what to push back on if a future reviewer cites 4.2: the app uses camera/photo APIs and native upload flows that go beyond a simple website.

## Resubmission steps (after I push the plist fix)

1. `git pull && npm run build && npx cap sync ios && npx cap open ios`
2. In Xcode bump **Build** (27 → 28) under Target → General.
3. Product → Archive → Distribute → App Store Connect.
4. Reply to the open review thread referencing the new build.
