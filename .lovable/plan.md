## Goal
Let supervisors upload to previous service dates by adding a date picker on the supervisor property page.

## Changes

### 1. `src/routes/_authenticated/supervisor/property.$id.tsx`
- Replace the hardcoded `const today = getServiceDateForNow()` with state: `const [serviceDate, setServiceDate] = useState(getServiceDateForNow())`.
- Add a date picker (shadcn Popover + Calendar, per project convention) next to the "Service date:" label in the header. Default = rollover date; allow selection of any date up to today.
- Pass `serviceDate` (instead of `today`) into:
  - the `["checklist", id, serviceDate]` query
  - `submitNightlyReport` mutation
  - each `AreaCard`'s `service_date` prop
  - the localStorage submitted key
- Invalidate the correct query key on change.

### 2. `src/lib/service-date.ts` (small fix)
- The rollover currently hardcodes `America/New_York` and ignores the property's `daily_report_timezone`. Extend `getServiceDateForNow` usage in the supervisor page to accept the property's timezone once the checklist data loads (recompute default once `data.property.daily_report_timezone` is known, only if the user hasn't manually picked a date yet).

## Out of scope
- No backend/server function changes — `recordUpload`, `getNightlyChecklist`, and `submitNightlyReport` already accept an arbitrary `service_date`; storage paths already namespace by date.
- Special Projects tab (already date-independent).
- Admin/client views.

## Technical notes
- Storage was ruled out as the cause — `cleaning-media` uploads are keyed by `${property_id}/${service_date}/...` and the server functions accept any valid date string. The gap was purely UI.
- The date picker will follow the existing shadcn pattern (Popover + Calendar with `pointer-events-auto`).
