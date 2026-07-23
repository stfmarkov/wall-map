# Dev Flows

Repeatable workflows for local development against the **cloud** Supabase project. This app does not use local Supabase (`supabase start`).

---

## Schema change (tables, RLS, indexes, extensions)

Migrations are the source of truth for the database. Do not rely on one-off dashboard SQL for schema you want versioned (except for quick experiments).

### Loop

1. Create a migration file:

   ```bash
   npx supabase migration new <descriptive_name>
   ```

2. Edit the new file under `supabase/migrations/` with the SQL you need (`create table`, indexes, RLS policies, etc.).

3. Apply it to the linked cloud project:

   ```bash
   npx supabase db push
   ```

4. Regenerate TypeScript types from the live schema:

   ```bash
   npx supabase gen types typescript --linked > app/types/database.types.ts
   ```

`db push` and `gen types` are separate steps. Push updates Postgres; gen types updates `app/types/database.types.ts`.

### Notes

- The CLI must be logged in (`npx supabase login`) and the repo linked (`npx supabase link --project-ref <ref>`).
- Prefer migrations over editing the dashboard for anything that should be reproducible (including Storage buckets and storage RLS policies).
- Do not hand-edit generated table types in `database.types.ts` — regenerate after schema changes.

---

## Types vs Zod

| Layer | Role | How it gets created |
|-------|------|---------------------|
| **SQL migration** | Real Postgres schema | You write it |
| **`database.types.ts`** | Compile-time DB shape for the Supabase client | `supabase gen types` |
| **Zod schemas** | Runtime validation of form / Nitro request bodies | You write them when building those endpoints |

Zod is not generated from Postgres. DB types describe what is stored; Zod describes what an API or form accepts (they often overlap but are not the same).

---

## Env / Nuxt ↔ Supabase

App credentials live in `.env` (see `.env.example`):

- `NUXT_PUBLIC_SUPABASE_URL`
- `NUXT_PUBLIC_SUPABASE_KEY` (publishable / anon key)
- Optional later: `NUXT_SUPABASE_SECRET_KEY` (server-only, bypasses RLS)

Project ref is the subdomain of the Supabase URL: `https://<project-ref>.supabase.co`.

---

## Auth email (Resend SMTP + OTP)

Wall Map uses **email OTP** (6-digit code), not magic links. On new free-tier Supabase projects, auth email templates are **read-only** until custom SMTP is configured. We use [Resend](https://resend.com) for that.

### One-time Supabase + Resend setup

1. Create a Resend account and an API key.
2. In Supabase: **Authentication → Emails → SMTP Settings** — enable custom SMTP:

   | Field | Value |
   |-------|--------|
   | Host | `smtp.resend.com` |
   | Port | `587` |
   | Username | `resend` |
   | Password | Resend API key |
   | Sender name | e.g. `Wall Map` |
   | Sender email | see below |

3. After SMTP is saved, template editing unlocks. Edit **Magic Link** (same template as OTP) so the body includes `{{ .Token }}` (the 6-digit code). The dashboard **preview** shows the literal `{{ .Token }}` — that is normal; the real email substitutes digits.

### Sender email and domains

- **Without a verified domain:** use Resend’s test sender `onboarding@resend.dev`. It is fine for unlocking templates and testing OTP on **your own** Resend account email. It generally cannot send reliably to other people.
- **To send login emails to friends / normal addresses:** add and verify a **domain** in Resend (DNS records), then change the Supabase SMTP sender to an address on that domain (e.g. `login@yourdomain.com`).

Default Supabase mail (no custom SMTP) is also limited (~2 emails/hour, team-member addresses only). Custom SMTP is required for real invite/login use, not only for OTP templates.

---

## Related documents

- [Tech Stack](./tech-stack.md) — architecture and dependencies
- [Build Tasks](./tasks.md) — phased checklist
- [Project Goals](./project-goals.md) — product scope
