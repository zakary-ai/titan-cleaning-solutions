# Fix: App Store rejection — camera crash on iPhone 17 Pro Max

## Root cause

The crash log (`termination.namespace = "TCC"`) states it explicitly:

> "This app has crashed because it attempted to access privacy-sensitive data without a usage description. The app's Info.plist must contain an NSCameraUsageDescription key with a string value explaining to the user how the app uses this data."

iOS force-terminates any app the instant it touches the camera/mic/photo library without the matching purpose string in `Info.plist`. The supervisor upload flow uses `<input type="file" accept="image/*,video/*" capture="environment">`, which triggers the camera — and our current `ios/App/App/Info.plist` has none of the required keys.

This is a 100% reproducible crash on every iOS device, not specific to the iPhone 17 Pro Max. Adding the keys fixes it; no Xcode/native code changes needed beyond the plist.

## Change

Edit **`ios/App/App/Info.plist`** to add three privacy strings (camera is the one Apple cited, but we also touch the photo library and record video with audio, so we add all three to avoid a follow-up rejection):

- `NSCameraUsageDescription` — "Titan Solutions uses the camera so supervisors can capture cleaning verification photos and videos of each area at the property."
- `NSMicrophoneUsageDescription` — "Titan Solutions uses the microphone to record audio with verification videos taken on-site."
- `NSPhotoLibraryUsageDescription` — "Titan Solutions accesses your photo library so supervisors can attach existing photos or videos to a cleaning report."

That's the entire code change.

## Resubmission steps (you run these on your Mac)

After I merge the plist change:

1. `git pull`
2. `npm install` (if needed)
3. `npm run build`
4. `npx cap sync ios`
5. `npx cap open ios`
6. In Xcode: bump **Build** number (e.g. 26 → 27) under Target → General, then **Product → Archive → Distribute → App Store Connect**.
7. Submit the new build for review in App Store Connect — reply to the rejection referencing the new build number and noting that the missing `NSCameraUsageDescription` (plus mic/photo library) has been added.

## Why this is the whole fix

- Exception `EXC_CRASH / SIGABRT` with `TCC` namespace = privacy-prompt violation, not a logic bug.
- Apple's reviewer hit it the moment they tapped "Upload" on the supervisor screen.
- No other code path in the app needs changes; the web upload flow already works once the OS allows camera access.
