I’ll make the spacing change in the places the phone build actually uses, not just the web config.

Plan:
1. Update the mobile shell layout so the header starts at the green top line by removing the extra safe-area/padding above the header content.
2. Move the bottom tab bar down toward the green bottom line by reducing/removing the extra safe-area padding that is keeping it too high.
3. Sync the iOS Capacitor config so the native app uses `contentInset: "never"` in both the source config and the generated iOS config file.
4. Update the iOS app version to `1.2` in `Info.plist` and the Xcode project marketing version.
5. Verify the changed files so the phone rebuild will pick up the corrected header/footer positioning and version number.

Technical files I expect to touch:
- `src/components/role-shell.tsx`
- `capacitor.config.ts`
- `ios/App/App/capacitor.config.json`
- `ios/App/App/Info.plist`
- `ios/App/App.xcodeproj/project.pbxproj`