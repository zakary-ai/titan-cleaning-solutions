## Goal

When an admin creates a supervisor or client account, the new user receives a branded email containing:
- App Store download link (https://apps.apple.com/us/app/titan-solutions/id6772334128)
- Their login email
- A temporary password: **Titan!2026**

On their first login, the app forces them to set a new password before they can use it.

## How it will work

### 1. Switch admin-create flow from "magic-link invite" to "create with temp password"

Today, `admin-invite.server.ts` calls `supabaseAdmin.auth.admin.inviteUserByEmail(...)`, which sends Supabase's default magic-link invitation (no password). I'll change both `inviteUserAdmin` and `inviteUserForProperty` to:

1. Call `supabaseAdmin.auth.admin.createUser({ email, password: "Titan!2026", email_confirm: true, user_metadata: { full_name, organization_name, invited_role, password_set: false } })`.
2. If the email already exists, reuse the existing user (same fallback as today).
3. After the user is created and role/property assignment rows are written, send our branded "Welcome" email via the transactional email system.

The temporary password is stored as a constant on the server (`TEMP_PASSWORD = "Titan!2026"`) and inserted into the email by the template.

### 2. Force password reset on first login (already mostly built)

`src/components/set-password-prompt.tsx` already pops up a modal that blocks the app until the user sets a password, gated on `user.user_metadata?.password_set === true`. Because the new admin flow stamps `password_set: false` in `user_metadata`, every new supervisor/client will be prompted to change `Titan!2026` to a real password on their first login. No changes needed in that component beyond verifying it is mounted inside the authenticated layout (it already is).

### 3. Build the branded welcome email

I'll set up Lovable's email infrastructure (the verified domain `notify.conversionlab.company` is already in place) and scaffold the transactional email system. Then I'll add a new template `account-created.tsx` that renders:

- Titan Solutions header in brand gold/black
- "Your account is ready" heading
- Their login email
- The temporary password `Titan!2026`
- A primary "Download the app" button linking to the App Store URL
- A short note: "When you log in for the first time, you'll be asked to choose your own password."

The server-side invite handlers will trigger this template via the existing `send-transactional-email` route, with an idempotency key like `welcome-<user_id>` so retries don't duplicate emails.

### 4. Remove the old `/accept-invite` redirect path

Since new users now log in directly with email + temp password instead of clicking a magic link, the `/accept-invite` page is no longer part of the flow. I'll leave the file in place (harmless) but stop referencing it as a redirect target in the invite functions.

## Files touched

- `src/lib/admin-invite.server.ts` — switch to `admin.createUser` with temp password, set `password_set: false`, trigger welcome email.
- `src/lib/email-templates/account-created.tsx` *(new)* — branded React Email template.
- `src/lib/email-templates/registry.ts` — register the new template.
- `src/lib/email/send.ts` *(new, if not present)* — small client/server helper to POST to `/lovable/email/transactional/send`. Used server-side here.
- Email infrastructure setup + transactional scaffold tools (one-time, run automatically).

## Things worth confirming before I build

- The temporary password `Titan!2026` will be visible in plain text in the email inbox. That's standard for one-time credentials, and the forced reset on first login mitigates the risk, but flagging it explicitly.
- Supabase has leaked-password (HIBP) protection that can reject weak passwords on user-initiated changes. `Titan!2026` is set via the admin API (which bypasses HIBP) so the initial create will succeed; the user's chosen replacement will still go through HIBP if it's enabled.
