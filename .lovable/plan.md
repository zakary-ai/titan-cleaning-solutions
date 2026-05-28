# Post-approval iOS polish

Grouped frontend fixes for the issues found while QAing admin / supervisor / client on the App-Store build. All frontend; one small serverFn tweak for stuck "missing" rows.

## 1. History crashes on all three roles (React error #310)

Root cause confirmed by the screenshot: `src/components/client-report.tsx` calls `useQuery` then does `if (isLoading) return …` **before** calling `useState(searchOpen)` / `useState(query)`. The first render mounts fewer hooks than the second → "Rendered more hooks than during the previous render." → red error page.

Fix:
- Move all `useState` declarations in `ClientReport` to the top of the function, before any conditional return.
- Audit `AreaCard` and `ClientPropertyHeader` in the same file for the same pattern.
- Same audit in `src/routes/_authenticated/supervisor/history.tsx` and `client/history.tsx` (the calendar `useState` usages look fine, but verify after edits).

No data / RLS change needed — the GRANTs from the last migration are correct; the page was crashing in render, not in the network call.

## 2. Notification pop-up behavior (all roles)

Files: `src/hooks/use-message-notifications.ts`, `src/components/ui/sonner.tsx`.

- Sonner toasts with an `action` are sticky by default. Drop the `action: { label: "View" }` and replace with a 3 s toast (`duration: 3000`) whose body click navigates to the inbox.
- Configure `<Toaster />` with `swipeDirections={["down","right"]}`, `closeButton`, and a default `duration={3000}` so every toast (including the "Signed in as supervisor" one) auto-dismisses and can be swiped away.

## 3. Sticky top header + bottom nav

File: `src/components/role-shell.tsx`.

- Make the mobile `<header>` `sticky top-0 z-40` so the Titan logo + sign-out stays pinned while scrolling. Keep its `env(safe-area-inset-top)` padding.
- Bottom nav is already `fixed bottom-0` with `env(safe-area-inset-bottom)`; bump `<main>`'s bottom padding from `pb-20` to `pb-24` so the tab bar is fully visible above the home indicator on iPad.

## 4. Stuck "missing" status after premature Submit

Files: `src/lib/uploads.functions.ts` (`recordUpload`), `src/routes/_authenticated/supervisor/property.$id.tsx`.

- In `recordUpload`, before inserting the new "uploaded" row, also delete any existing row for the same `property_id` + `area_id` + `service_date` with `status = 'missing'` (regardless of supervisor_id). This clears the "missing" marker created by a premature Submit when the supervisor finally uploads the file.
- After upload, the existing `invalidateQueries` already refetches the checklist so the card shows "uploaded".

## 5. Client video: pause + fullscreen

File: `src/components/client-report.tsx` (`AreaCard`).

- **Pause loop**: the `useEffect` watching `upload?.file_url` re-runs when React Query refetches and re-signs the URL, swapping `<video src>` → resets playback. Move signing into `useQuery({ queryKey: ["sign", path], staleTime: 50*60_000 })` so the URL stays stable.
- **Fullscreen**: drop `playsInline` from the client `<video>` so iOS Safari/WebView allows native fullscreen on tap; keep `controls`. (The supervisor preview can keep `playsInline` since it's inline preview, not viewing.)

## 6. Verification

Reload on iPad preview and confirm per role:
- Admin/supervisor/client history pages load and a highlighted day opens its report (no red error page).
- Toasts vanish after 3 s and swipe down to dismiss.
- Mobile header stays pinned at the top; bottom tabs fully visible.
- Supervisor: submit → upload → card switches to "uploaded".
- Client: tap video → fullscreen; pause stays paused.

## Technical notes

- No DB migration required; the screenshot rules out a permission issue.
- All changes are presentation / data-fetching layer.
