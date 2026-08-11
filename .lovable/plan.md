# Real email addresses with role suffix

Right now roles come from made-up domains (`name@employee.worknest.bd`). Those domains don't exist, so no real person can receive mail there and sign-in feels broken. We switch to real email addresses (Gmail, Outlook, company mail — anything), and read the role from the part before the `@`.

## New rule

The local part must end with a separator plus the role name:

```text
runa.employee@gmail.com   -> employee
runa_admin@outlook.com    -> admin
karim-staff@gmail.com     -> staff
nusrat.hr@gmail.com       -> hr
```

Accepted separators: `.` `_` `-`. Domain can be anything valid. No separator or an unknown suffix means the account gets no role and is rejected at signup.

## What changes

**Database**
- Rewrite the role-detection function to parse the local part suffix instead of the domain.
- Signup trigger and the role-guard trigger keep working, just against the new rule.
- Old `*.worknest.bd` accounts stop being valid; those test accounts get cleaned out so HR can re-issue with real addresses.

**HR "Work accounts" page**
- Instead of typing a username and getting a fixed fake domain, HR types the person's **full real email** (for example `runa.employee@gmail.com`).
- The page shows live which role that email maps to, and blocks the create button when the email doesn't match the rule.
- Reference block updates to show the new naming pattern per role.

**Signup / activation page**
- Same validation against the new rule; error text updated to explain the naming pattern rather than the domain.

**Email verification (new)**
- Auto-confirm gets turned off, so people who self-activate must click a confirmation link before they can sign in.
- Signup page changes to a "check your inbox" state instead of jumping to the dashboard.
- Accounts HR creates directly stay pre-confirmed — HR hands over the password, no extra click needed.

## Technical notes

- `public.role_from_email(text)` rewritten: lowercase `split_part(email,'@',1)`, match `~ '[._-](hr|admin|employee|staff)$'`, return that enum. `handle_new_user` and `guard_user_roles` call it unchanged.
- `src/lib/types.ts`: replace `ROLE_DOMAIN` / domain-based `roleFromEmail` with a suffix parser mirroring the SQL exactly, plus a `ROLE_SUFFIX_EXAMPLE` map for UI hints.
- `src/lib/people.functions.ts`: `provisionAccount` takes `email` instead of `username`; server-side re-validates the suffix before `admin.createUser({ email_confirm: true })`.
- `src/routes/_authenticated/people.tsx` and `src/routes/signup.tsx`: form + copy updates only.
- Auth config: `auto_confirm_email: false`; `emailRedirectTo` stays `${origin}/dashboard`.
- Confirmation mail goes out through the built-in default template. Custom-branded auth emails would need a verified sending domain — say the word and I'll set that up separately.
