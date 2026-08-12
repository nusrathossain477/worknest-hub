# Real emails + HR-assigned roles + welcome email

Drop email-based role derivation entirely. A user's email is just their real address (any domain — Gmail, Outlook, company mail). **Role is a separate field HR chooses** when provisioning the account. Only HR can create accounts, so nobody can self-select a role. A **welcome email** tells each new user their login email, role, and a link to set their password.

## Prerequisite — email domain (blocking for the welcome email)

No sender domain is configured. Before any welcome email can go out:

1. You set up a real domain you own via the email setup dialog (`presentation-open-email-setup`). There is no free/shared sender domain.
2. After the domain is configured (DNS may still be verifying), I run email infrastructure setup, then scaffold the auth email templates and the app (transactional) email templates.
3. Sending activates once DNS verifies; monitor in Cloud → Emails.

If you don't own a domain, the welcome-email part can't happen — buy one first (Project Settings → Domains → Buy new domain, or any registrar). The role/HR-provisioning part works without email.

## The model

- **Email**: the person's real address (e.g. `runa@gmail.com`). No role suffix, no special domain.
- **Role**: chosen by HR from a dropdown when creating the account (admin / employee / staff / hr). Stored in `user_roles` as today.
- **Self-signup disabled.** Only HR provisions accounts. This removes the "anyone picks any role" problem at the root.
- **Bootstrap**: the very first account (when zero roles exist) auto-becomes HR, so the system can start. After that, only HR can create accounts.

## What changes

### 1. Database — remove email-based role logic
- Rewrite `handle_new_user()`: create the `profiles` row; if `user_roles` is empty, insert role `hr` (bootstrap); otherwise assign **no** role (HR assigns it via `provisionAccount`).
- Rewrite `guard_user_roles()`: keep the "cannot change your own role" and "always at least one HR" invariants; **remove** the email-match / work-email check.
- Drop `role_from_email(text)` — no longer used. `has_role`, `get_user_role`, `visible_members` stay unchanged.
- Clean out the old `*.worknest.bd` test accounts so HR re-issues real ones.

### 2. HR "Work accounts" page (`src/routes/_authenticated/people.tsx`)
- HR types the person's **full real email** (e.g. `runa@gmail.com`) and picks the **role** from a dropdown — role no longer comes from the email.
- Standard email format validation only; no suffix/domain rule.
- On success: "Account created — welcome email sent".
- Reference block updates: it now just lists the four roles and their meaning, not a naming pattern.

### 3. Server fn (`src/lib/people.functions.ts`)
- `provisionAccount` takes `email` (full real email) + explicit `role` + password (instead of `username`).
- Server-side validates email format and that `role` is one of the four.
- Creates the user with `email_confirm: true` (HR hands over access; no extra verification click).
- Inserts the `user_roles` row with the chosen role (the guard trigger allows it).
- Generates a password-set link via `admin.generateLink({ type: 'recovery', email })` and enqueues the **welcome email** (see below).

### 4. Welcome email (after the domain is configured)
- New React Email template `src/lib/email-templates/welcome.tsx`: greeting, the person's name, their **login email**, their **role** (plain word), a "Set your password" button (the recovery link), and a "Sign in to WorkNest" link to `/login`.
- Sent server-side from `provisionAccount` via the `enqueue_email` RPC into the transactional queue (service role inside the handler; no browser JWT). Idempotency key `welcome-<userId>`.
- Registered in `src/lib/email-templates/registry.ts`.
- Auth confirmation / password-reset mail goes out through branded auth templates once scaffolded.

### 5. Auth config
- `disable_signup: true` — self-signup closed; only HR creates accounts.
- `auto_confirm_email: false` for the default flow (HR-created accounts are pre-confirmed regardless).
- `password_hibp_enabled: true` (reject breached passwords).

### 6. Signup page (`src/routes/signup.tsx`)
- Since self-signup is disabled, replace the self-activation form with a short message: "Accounts are issued by HR. Ask HR to create your account, then check your inbox for a welcome email." Plus a link to `/login`.

### 7. Types (`src/lib/types.ts`)
- Remove `ROLE_DOMAIN` and the domain-based `roleFromEmail`. Keep `AppRole` and the rest. `roleFromEmail` is no longer referenced by the UI (role is shown from the `user_roles` row, as it already is).

## Technical notes
- Bootstrap safety: `handle_new_user` only auto-assigns `hr` when `user_roles` is empty, so it fires exactly once. All later accounts get their role from `provisionAccount`.
- `guard_user_roles` still blocks self-role-change and protects the last HR, so the system can't lock itself out.
- `enqueue_email` RPC is created by `setup_email_infra`; exact args confirmed at implementation. The welcome send stays server-side (service role inside the handler), never in the browser.
- `admin.generateLink({ type: 'recovery', email })` returns a one-time set-password link without sending its own email, so we embed it in the welcome email.

## Out of scope
- Marketing/newsletter/bulk email (not supported).
- SMS/phone notifications.
- Per-admin dashboards.
