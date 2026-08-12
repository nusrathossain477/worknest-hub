# Real email addresses + welcome email

Keep the switch to **real email addresses** (a person's own email like `runa.employee@gmail.com`, role read from the suffix before the `@`), and add a **welcome email** so each user is told their login email, role, and how to sign in. Sending any email requires a verified sending domain, which isn't set up yet.

## Prerequisite — email domain (blocking)

No sender domain is configured. Before any welcome email can go out:

1. You set up a real domain you own via the email setup dialog (`presentation-open-email-setup`). There is no free/shared sender domain.
2. After the domain is configured (DNS may still be verifying), I run the email infrastructure setup, then scaffold the auth email templates and the app (transactional) email templates.
3. Email sending activates once DNS verifies; you can monitor it in Cloud → Emails.

If you don't own a domain, the welcome-email part can't happen — you'd buy one first (Project Settings → Domains → Buy new domain, or any registrar). The real-email role rule still works without email.

## New role rule

The local part must end with a separator plus the role name:

```text
runa.employee@gmail.com   -> employee
runa_admin@outlook.com    -> admin
karim-staff@gmail.com     -> staff
nusrat.hr@gmail.com       -> hr
```

Accepted separators: `.` `_` `-`. Domain can be anything valid. No matching suffix means no role and signup is rejected.

## What changes

### 1. Database — role detection from suffix
- Rewrite `public.role_from_email(text)`: lowercase `split_part(email,'@',1)`, match `~ '[._-](hr|admin|employee|staff)$'`, return that enum; else NULL.
- `handle_new_user` and `guard_user_roles` call it unchanged (they already do).
- Old `*.worknest.bd` accounts stop being valid; those test accounts get cleaned out so HR can re-issue with real addresses.

### 2. Email setup + welcome email (after domain is configured)
- Infrastructure: `setup_email_infra` (queues, `enqueue_email` RPC, cron).
- Auth templates: `scaffold_auth_email_templates` so verification/password-reset mail is branded.
- App email: `scaffold_transactional_email`, then a new **welcome** React Email template in `src/lib/email-templates/welcome.tsx` containing: the person's name, their login email, their detected role, a "Sign in to WorkNest" button to `/login`, and a note that HR issued the account.
- Trigger: in `provisionAccount` (HR path), after `createUser`, enqueue the welcome email server-side via `supabaseAdmin.rpc('enqueue_email', …)` into the transactional queue — no browser JWT needed. Idempotency key `welcome-<userId>`.
- Self-signup path: the auth confirmation email already delivers the verification link; after confirmation, the same welcome email is enqueued from the `handle_new_user` flow (or a post-confirm hook) so self-activating users also get their role info. HR-created accounts skip verification (pre-confirmed) but still get the welcome email.

### 3. Auth config
- `auto_confirm_email: false` — self-signups must click the confirmation link before signing in.
- HR-created accounts stay pre-confirmed (`email_confirm: true` on `createUser`) — HR hands over the password, no extra click.
- `emailRedirectTo` stays `${origin}/dashboard`.

### 4. HR "Work accounts" page (`src/routes/_authenticated/people.tsx`)
- HR types the person's **full real email** (e.g. `runa.employee@gmail.com`) instead of a username + fixed domain.
- Page shows live which role that email maps to and blocks Create when the email doesn't match the rule.
- On success, toast says "Account created — welcome email sent".
- Reference block updates to show the new naming pattern per role.

### 5. Signup / activation page (`src/routes/signup.tsx`)
- Same suffix validation; error text explains the naming pattern, not a domain.
- After submit, switch to a "Check your inbox" state (confirmation pending) instead of jumping straight to `/dashboard`. Link to resend.

### 6. Types + server fn
- `src/lib/types.ts`: replace `ROLE_DOMAIN` / domain-based `roleFromEmail` with a suffix parser mirroring the SQL; add a `ROLE_SUFFIX_EXAMPLE` map for UI hints.
- `src/lib/people.functions.ts`: `provisionAccount` takes `email` (full) instead of `username`; server-side re-validates the suffix before `createUser({ email_confirm: true })`; then enqueues the welcome email.

## Technical notes
- `role_from_email` is `IMMUTABLE`; the regex is deterministic so that's fine.
- `enqueue_email` RPC signature is created by `setup_email_infra`; exact args confirmed at implementation time. The welcome send stays server-side (service role inside the handler), never in the browser.
- Auth confirmation mail goes out through the branded auth templates once scaffolded. If you later want a fully custom look, the templates live in `supabase/functions/_shared/email-templates/`.
- Old fake-domain accounts: delete via a one-off migration or HR re-issues; the `guard_user_roles` "always one HR" rule still holds, so re-issue an HR account first.

## Out of scope
- Marketing/newsletter/bulk email (not supported).
- SMS/phone notifications (separate, later).
- Per-admin dashboards.
