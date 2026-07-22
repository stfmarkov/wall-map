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
- Prefer migrations over editing the dashboard for anything that should be reproducible.
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

## Related documents

- [Tech Stack](./tech-stack.md) — architecture and dependencies
- [Build Tasks](./tasks.md) — phased checklist
- [Project Goals](./project-goals.md) — product scope
