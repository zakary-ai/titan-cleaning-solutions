## Special Projects feature

A new ad-hoc upload type tied to a property, owned by the supervisor, instantly visible to the client, and reviewable by the admin. Supports video or photo with a caption, comments thread, no scheduling.

### Database (new migration)

- New table `special_projects`
  - `property_id` (uuid, indexed)
  - `supervisor_id` (uuid)
  - `caption` (text, required, e.g. "Power Washing")
  - `file_url` (text)
  - `file_type` ('image' | 'video') — reuse existing `file_type` enum
  - `project_date` (date, default today in property tz) — used for the calendar grouping
  - `created_at` timestamptz
- RLS (mirrors `cleaning_uploads`):
  - Admins: full manage
  - Supervisors: insert/select where assigned to property; update/delete own
  - Clients: select where `client_can_see_property(auth.uid(), property_id)` — no release delay
- Extend `issues` table usage: add nullable `special_project_id uuid` so the existing Comments system can thread on a special project the same way it threads on uploads. RLS on `issues` already scopes by `property_id`, which we still set.

### Server functions (`src/lib/special-projects.functions.ts`)

- `listSpecialProjects({ property_id })` — auth-gated; returns all visible projects ordered by `project_date desc`.
- `listSpecialProjectDates({ property_id })` — distinct dates for the client calendar.
- `getSpecialProjectsByDate({ property_id, project_date })` — projects for a single day.
- `createSpecialProject({ property_id, caption, file_url, file_type, project_date? })` — supervisor-only, assigned property required; defaults `project_date` to today.
- `deleteSpecialProject({ id })` — supervisor (own) or admin.

Uploads continue to use the existing `cleaning-media` storage bucket; client-side uploads via the current signed-URL flow.

### Supervisor UI

- In `src/routes/_authenticated/supervisor/property.$id.tsx`, add a **Special Projects** tab alongside the existing nightly checklist.
  - List of past special projects (caption, date, thumbnail, delete).
  - "New Special Project" button → modal/sheet with: caption input, camera/video capture or photo picker (reuse existing upload component), Submit.
  - On submit: upload file → `createSpecialProject`.

### Client UI

- New bottom-tab route `src/routes/_authenticated/client/special-projects.tsx` (calendar identical to `client/history.tsx`):
  - Lists assigned properties (or auto-selects if only one, matching existing client UX).
  - Calendar highlights days that have special projects.
  - Selecting a day renders the media + caption + Comments thread for each project that day.
- Add `Sparkles` icon tab to `client.tsx` RoleShell nav.

### Admin UI

- In `src/routes/_authenticated/admin/property.$id.view.tsx` (the property history view), add a **Special Projects** tab next to history. Same calendar/list as client view, plus a delete control.

### Comments integration

- `issues-inbox.tsx` and `issues.functions.ts`: allow creating an issue (comment thread) linked to a `special_project_id`. Render thread on the special project detail view for all three roles.

### Navigation / route tree

- Add new route files; `routeTree.gen.ts` regenerates automatically on dev.

### Out of scope

- No scheduling / release delay (always instant).
- No notifications beyond the existing comment unread-count system.
