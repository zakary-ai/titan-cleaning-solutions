## 1. Edit sections from the property card

Add an **"Edit sections"** button to each property card on `/admin/properties` that opens a dialog letting the admin add, rename, toggle required, and remove areas — without leaving the list.

- New button on `PropertyCard` in `src/routes/_authenticated/admin/properties.tsx` (alongside the existing Add/Assign buttons).
- New `EditSectionsDialog` component that:
  - Fetches `getProperty({ id })` to load current areas
  - Inline-edit each area name (save on blur / Enter)
  - Toggle "required" switch
  - Delete with confirm
  - "Add section" input at the bottom
  - Uses existing `upsertArea` / `deleteArea` server fns — no backend changes needed
- Invalidate `["property", id]` and `["properties"]` on changes.

## 2. Night-shift service-date rollover (noon cutoff)

Right now `service_date` is set to `new Date().toISOString().slice(0,10)` (UTC) on the supervisor page. We'll change it so uploads done **before 12:00 PM (property timezone)** count toward the **previous calendar day**, keeping an 11pm→6am shift on a single report.

- New helper `getServiceDateForNow(tz)` → returns yesterday's date if local time is before 12:00, otherwise today's date.
- Use it in:
  - `src/routes/_authenticated/supervisor/property.$id.tsx` — replace the `today` constant. The page needs the property's timezone, so we'll either fetch the property first or accept the default `America/New_York` and refine once `getProperty` data arrives.
  - `src/lib/uploads.functions.ts` — replace `nowInTz(tz).date` usages that act as "today's service date" (in `getDailyChecklist` default and `recordUpload` fallback) with the rolled-back date.
  - `src/lib/special-projects.functions.ts` — apply the same rollback to `project_date` default so the photo album bucket matches.
- The daily-report release time (8am EST default on `properties.daily_report_time`) keeps working unchanged — it already operates on calendar `service_date`, which now naturally lines up with "the night that just ended."

### Worked example (America/New_York)
- Supervisor uploads at 2:00 AM Tuesday → service_date = **Monday** ✅
- Supervisor uploads at 6:30 AM Tuesday → service_date = **Monday** ✅
- Supervisor uploads at 11:45 AM Tuesday → service_date = **Monday** ✅
- Supervisor uploads at 12:30 PM Tuesday → service_date = **Tuesday**
- Supervisor uploads at 11:30 PM Tuesday (start of next shift) → service_date = **Tuesday** ✅

## Out of scope
- No DB schema changes.
- No changes to client/admin history calendars (they already read whatever `service_date` is stored, so they update automatically).
- No per-property cutoff setting (using a fixed noon as you chose).
