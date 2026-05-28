## Plan: App Store Download Emails + First-Login Password Reset

### Summary
Replace the web-based invite flow with an App Store download flow. When an admin creates a supervisor or client account, the user receives an email prompting them to download the Titan Solutions iOS app, log in with a temporary password (Titan!2026), and set their own password on first login.

### Technical Details

#### 1. Fix existing build errors
The email scaffolding created `renderAsync` imports, but `@react-email/components` v1.0.12 exports `render` instead. Fix in 4 files:
- `src/routes/lovable/email/auth/webhook.ts`
- `src/routes/lovable/email/auth/preview.ts`
- `src/routes/lovable/email/transactional/send.ts`
- `src/routes/lovable/email/transactional/preview.ts`

#### 2. Add `password_reset_required` to `profiles` table
Create a migration to add `password_reset_required boolean NOT NULL DEFAULT false` to the `profiles` table.

#### 3. Change admin invite flow (`src/lib/admin-invite.server.ts`)
Replace `inviteUserByEmail` with `createUser`:
- Create the user with email, password `"Titan!2026"`, and `email_confirm: true`
- Set `password_reset_required = true` in the profile
- Render the welcome email template and enqueue it directly via `supabaseAdmin.rpc('enqueue_email', ...)` into the `transactional_emails` queue
- Remove the old `redirect_to` invite link logic

#### 4. Create welcome transactional email template (`src/lib/email-templates/welcome-app-download.tsx`)
Branded Noir & Gold email that includes:
- "Welcome to Titan Solutions" heading
- Instructions to download the app from the App Store (link: https://apps.apple.com/us/app/titan-solutions/id6772334128)
- Temporary password: `Titan!2026`
- Note that they'll be prompted to set their own password on first login
- Register in `registry.ts`

#### 5. Update auth context (`src/hooks/use-auth.tsx`)
- Load `password_reset_required` from the profile
- Expose it in the auth context

#### 6. First-login password reset flow
- In the authenticated layout/route tree, detect when `password_reset_required` is true
- Show a modal/screen that forces the user to set a new password before they can use the app
- On successful password update, set `password_reset_required = false` in the profile and refresh the session

#### 7. Create unsubscribe page (`src/routes/unsubscribe.tsx`)
Required by the transactional email scaffolding. Reads token from URL, validates, shows branded confirm button.

#### 8. Fix Vite config for server env vars
Add `loadEnv` call with empty prefix so `SUPABASE_SERVICE_ROLE_KEY` and `LOVABLE_API_KEY` are available in server routes.

#### 9. Fix `src/start.ts` middleware bypass
Add guard at top of `errorMiddleware` to skip processing for `/lovable/` and `/email/unsubscribe` routes.

### Files to modify/create
- `src/routes/lovable/email/auth/webhook.ts`
- `src/routes/lovable/email/auth/preview.ts`
- `src/routes/lovable/email/transactional/send.ts`
- `src/routes/lovable/email/transactional/preview.ts`
- `src/lib/admin-invite.server.ts`
- `src/lib/email-templates/welcome-app-download.tsx`
- `src/lib/email-templates/registry.ts`
- `src/hooks/use-auth.tsx`
- `src/routes/_authenticated.tsx` or layout component (for first-login check)
- `src/routes/unsubscribe.tsx`
- `vite.config.ts`
- `src/start.ts`
- New migration for `profiles.password_reset_required`

### Out of scope
- No changes to the client portal video behavior (already addressed in previous turns)
- No changes to the admin users UI (form stays the same, only the backend action changes)
- Marketing/bulk emails remain unsupported