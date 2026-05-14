# Titan Solutions — MVP Plan

A mobile-first, role-based web app for nightly cleaning proof-of-work, with admin oversight and hotel client review.

## Design system

- **Palette**: Noir & Gold (`#0d0d0d` bg, `#1a1a1a` surface, `#c9a84c` gold accent, `#f0d78c` gold light, off-white text).
- **Typography**: Libre Baskerville (headings) + IBM Plex Sans (body) — trustworthy, hospitality-grade.
- **Components**: cards w/ subtle gold borders, status badges (uploaded/missing/open/resolved), bottom-tab nav on mobile, sidebar on desktop.
- Mobile-first layouts; safe-area aware so it ports cleanly to a future native shell.

## Backend (Lovable Cloud)

Enable Lovable Cloud, then create:

**Tables** (all RLS-enabled):
- `profiles` (id → auth.users, full_name, email, organization_name, created_at) — no role column here
- `user_roles` (id, user_id, role enum: admin/supervisor/client) — separate table per security best practice
- `properties` (id, name, address, client_organization, active, created_at)
- `property_areas` (id, property_id, area_name, required_upload, display_order, active, created_at)
- `property_assignments` (id, property_id, user_id, role_on_property, created_at)
- `cleaning_uploads` (id, property_id, area_id, supervisor_id, service_date, file_url, file_type, notes, uploaded_at, status)
- `issues` (id, property_id, area_id, upload_id, client_user_id, title, initial_comment, status, created_at, resolved_at)
- `messages` (id, issue_id, sender_id, body, attachment_url, created_at)

**Security helpers**:
- `has_role(_user_id, _role)` SECURITY DEFINER function
- `is_assigned_to_property(_user_id, _property_id)` helper
- Trigger to auto-create `profiles` row on signup

**RLS rules** (summary):
- Admin: full read/write everywhere
- Supervisor: read/write only on properties in `property_assignments`; can insert uploads + reply messages
- Client: read uploads on properties matching their org / assignment; insert issues + messages

**Storage**: private `cleaning-media` bucket (up to 500MB), policies mirror RLS — supervisor uploads to own paths, admin/assigned client read.

**Auth**: Email/password, **admin-only invite flow** (no public signup — admin creates user via server function using service role, sets role + assignments).

## Routing (TanStack Start)

```
src/routes/
  __root.tsx              shell + auth-state subscription + invalidation
  index.tsx               landing → redirects based on role
  login.tsx               email/password
  _authenticated.tsx      gate
  _authenticated/
    admin/
      index.tsx           overview cards
      properties.tsx      list + create
      properties.$id.tsx  detail + areas + assignments
      users.tsx           invite + role mgmt
      analytics.tsx
      issues.tsx
    supervisor/
      index.tsx           assigned properties
      property.$id.tsx    nightly checklist + upload
      issues.tsx
    client/
      index.tsx           premium home dashboard
      property.$id.tsx    area cards + date picker + history
      issues.tsx
  api/public/             (reserved for future webhooks)
```

## Server functions (`src/lib/*.functions.ts`)

- `inviteUser` (admin) — service-role create, set role, assignments
- `createProperty`, `updateProperty`, `upsertArea`, `assignUserToProperty`
- `createUpload` (supervisor) — signed-URL upload then row insert
- `submitNightlyReport` — marks missing areas as `missing` for the date
- `getPropertyDashboard(propertyId, date?)` — areas + latest upload per area
- `createIssue` (client), `replyToIssue`, `setIssueStatus`
- `getAdminAnalytics` — completion rate, comments per property

All user-scoped fns use `requireSupabaseAuth`; admin-only ones additionally check `has_role`.

## Role dashboards

**Admin**
- Overview: totals (properties, uploads today, missing today, open issues, comments this week)
- Properties: list + create modal → detail page (areas CRUD, drag to reorder, assign supervisors/clients)
- Users: invite (email + role + org), list, deactivate
- Analytics: completion rate by property (last 30 days), comments per property
- Issues: filterable inbox

**Supervisor**
- Assigned properties list
- Property checklist for tonight: each area card with upload (camera/gallery), notes, status badge
- "Submit nightly report" CTA → marks missing
- Issues tab — reply to client comments

**Client**
- Premium hero: property name + last report date + completion %
- Area cards with thumbnail/poster, date, supervisor notes, "Leave a comment" → issue
- Date picker to view past service dates
- Area detail page: chronological history
- Issues tab — view + reply

## Tech notes

- Direct browser uploads to Storage via signed URLs (large videos, mobile-friendly progress).
- Video element uses `playsInline` + poster image for mobile.
- React Query for data; route loaders gated via `_authenticated` + `beforeLoad` session hydration.
- Mobile-first: bottom tab bar under `md`, sidebar from `md` up.

## Out of scope (next phase)

Swipe review UI, push notifications, advanced analytics, native shell wrap.

## Build order

1. Enable Cloud + migrations (tables, enums, RLS, storage, triggers)
2. Auth + role routing + `_authenticated` gate
3. Admin: properties + areas + assignments + user invites
4. Supervisor: nightly checklist + uploads
5. Client: dashboard + area cards + history + date picker
6. Issues + messaging across all roles
7. Admin analytics + overview
8. Mobile polish pass

After approval I'll start at step 1.