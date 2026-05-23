# Demo Page Plan

## Goal
A public, read-only demo at `/demo` that lets website visitors experience the client portal without an account or backend access. All data is hardcoded in the frontend — nothing touches the database.

## Flow
1. Visitor lands on `/demo` → sees a styled "Login" screen with a single button: **Login as Client (Demo)**.
2. Clicking the button routes to `/demo/client` (the Today view).
3. Inside the demo shell, the bottom nav has the same 4 tabs as a real client: **Today · History · Specials · Comments**.
4. Everything is read-only. No forms submit, no comments can be sent, no buttons mutate anything. Any "new comment" affordances are removed or disabled with a small "Demo — read only" hint.

## Demo content

**Property:** Demo Hotel
**Areas:** Lobby, Locker Room, Bathroom

**Today tab — videos** (user-uploaded .mov files copied into `src/assets/demo/`):
- Bathroom → `460E3F4B-2E75-4216-92D6-2DF94F69CA80.mov` (upload #1)
- Locker Room → `B2B3FC96-FFDB-471F-BB1D-B02DA1EECA08.mov` (upload #2)
- Lobby → `26CEDB5C-9BB1-4ECE-9846-05A214380537.mov` (upload #3)

Each area card shows the video, "Completed" status, and a caption like "This is an example video."

**History tab:**
- Calendar with 3–4 highlighted past dates.
- Selecting a date shows the same 3 areas with example stock photos (sourced from Unsplash or generated placeholders) and the caption "This is an example picture."

**Specials tab:**
- Calendar with 2 highlighted dates.
- Each date shows 1–2 example special-project photos with captions like "This is an example special project — deep carpet clean."

**Comments tab:**
- 2–3 example threads (e.g., "Lobby chandelier dusty", "Locker room mirror smudges") with mock back-and-forth between "Client" and "Supervisor".
- Threads open and display messages but the reply input is removed and the "New comment" button is hidden.

## Technical notes

**New files (all frontend, no DB):**
- `src/routes/demo.tsx` — public route, layout wrapper using existing `RoleShell` styling, no auth checks.
- `src/routes/demo.index.tsx` — the "demo login" landing card with the single button.
- `src/routes/demo.client.tsx` — layout for the 4 demo tabs (mirrors `_authenticated/client.tsx` but points links at `/demo/client/*`).
- `src/routes/demo.client.index.tsx` — Today view
- `src/routes/demo.client.history.tsx` — History
- `src/routes/demo.client.specials.tsx` — Specials
- `src/routes/demo.client.comments.tsx` — Comments
- `src/lib/demo-data.ts` — central mock data (areas, uploads per date, specials per date, comment threads).
- `src/components/demo/*` — read-only variants of `ClientReport`, `SpecialProjectsCalendar`, and `IssuesInbox` that accept mock data as props instead of calling server functions. This avoids touching production components (less regression risk) and avoids the auth/RLS path entirely.

**Assets:**
- Copy the 3 uploaded `.mov` files into `src/assets/demo/` and import them as ES modules so Vite bundles + hashes them. They serve directly from the static asset URL — no Supabase storage needed.
- For history stock photos, use 3–4 royalty-free Unsplash hotel images referenced by URL, or generate simple placeholder images. (I'll use Unsplash URLs to keep bundle size small unless you want generated ones.)

**Login screen tweak:**
- Add a small "View Demo" link at the bottom of `/login` pointing to `/demo` so it's easy to find, in addition to the standalone `/demo` URL used for website embeds.

**Embedding:**
- `/demo` is a normal public route, so the website can embed it via an `<iframe src="https://titan-cleaning-solutions.lovable.app/demo">`. No CSP or CORS config needed.

## Out of scope
- No supervisor or admin demo views.
- No database seeding, no demo user account, no Supabase calls from any demo route.
- No ability for visitors to send comments, upload, or mutate anything.
