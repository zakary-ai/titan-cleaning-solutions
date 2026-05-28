The header is overlapping the iPhone's Dynamic Island / status bar because all top padding was removed. The footer is correctly placed and will not change.

Plan:
1. `src/components/role-shell.tsx` — Add `env(safe-area-inset-top)` padding back to the mobile `<header>` so it sits just below the Dynamic Island. Leave the bottom `<nav>` exactly as it is now.
2. `ios/App/App/Info.plist` — Update `CFBundleShortVersionString` from `1.2` to `1.3`.
3. `ios/App/App.xcodeproj/project.pbxproj` — Update `MARKETING_VERSION` from `1.2` to `1.3` in both Debug and Release configurations.

Technical detail: the header style will become `paddingTop: calc(env(safe-area-inset-top) + 0.25rem)` while keeping the existing horizontal padding and bottom padding minimal, so content starts immediately below the status bar / Dynamic Island.