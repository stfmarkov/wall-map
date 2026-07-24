# Build Tasks

Phased task list for implementing Wall Map. Work through phases in order and check items off as completed. Technology choices and architecture are in [Tech Stack](./tech-stack.md); product scope is in [Project Goals](./project-goals.md).

Do not skip PostGIS or RLS setup — they are harder to bolt on later.

---

## Phase 0 — Project foundation

- [x] Add `@nuxtjs/supabase` and configure env vars (local `.env` + Render later)
- [x] Create Supabase project (free tier)
- [x] Enable PostGIS extension in Supabase SQL editor
- [x] Add `maplibre-gl`, `@tmcw/togeojson`, `@turf/turf`
- [x] Create a client-only `MapView` component with OpenFreeMap style URL
- [x] Verify map renders locally with pan/zoom
- [x] Set up Supabase CLI for migrations (`supabase init`, link project)
- [x] Decide image approach: **Supabase Storage + Nitro/`sharp` transforms** (see [Tech Stack — Images](./tech-stack.md#images-v1))



## Phase 1 — Auth & profiles

- [x] Supabase Auth: **email OTP** for v1 (see [Tech Stack — Auth](./tech-stack.md#auth-v1)); Resend SMTP + OTP template (see [Dev Flows](./dev-flows.md#auth-email-resend-smtp--otp))
- [x] `profiles` table + trigger to create profile on signup
- [x] RLS: users can read/update their own profile; public read for basic profile fields (for visiting maps)
- [x] Login / logout (`/login` OTP flow; sign out on map chrome) — signup is the same OTP path
- [x] Auth middleware: page (`auth` / `guest`) + Nitro (`server/middleware/auth.ts` for `/api/gpx`, `/api/images`, `/api/maps`)
- [x] Profile map shell at `/users/[id]` (empty state OK); `/users/me` redirects to the signed-in user’s map
- [x] Edit profile at `/profile` — display name, optional username, bio, public flag, avatar upload
- [x] Storage bucket `avatars` (public read; owner write) + RLS policies
- [x] Shared map chrome (`MapTopBar`, avatar link) and auth UI pieces (`AuthShell`, `UiField`, etc.)



## Phase 2 — Routes (GPX core)

- [x] `routes` table with PostGIS `geography(LineString)`, name, description, owner, country, region, `gpx_path`, `distance_m`
- [x] RLS: owner CRUD; others read if owner profile is public
- [x] Storage bucket `gpx` + upload policy (private; read for owner or public profiles; trailmates later)
- [x] Nitro route: accept GPX upload → parse with `@tmcw/togeojson` → validate → store geometry + original file (`POST /api/gpx`)
- [ ] Nitro route or DB function: reverse-geocode start point → store country/region
- [x] UI: “Upload GPX” in map top bar → file picker → save (name from filename for now)
- [x] Display routes on profile map (GeoJSON source + line layer)
- [ ] Route detail page: full map, description, metadata
- [ ] GPX export (download original or regenerated from stored geometry)
- [ ] Edit route: update name, description; replace GPX



## Phase 3 — Points of interest

- [ ] `points_of_interest` table with PostGIS `geography(Point)`
- [ ] RLS policies (same pattern as routes)
- [ ] UI: click map to place pin (or coordinate entry)
- [ ] POI detail page
- [ ] Edit POI: move pin, update name/description
- [ ] Map: pin layer + hover/click (shared interaction pattern with routes)



## Phase 4 — Images

- [ ] Storage bucket `photos` + RLS policies
- [ ] Nitro upload route: accept image → `sharp` display + thumbnail variants → Storage
- [ ] `route_images` / `poi_images` tables or JSON array on parent — pick one, stay consistent
- [ ] Attach photos on create/edit flows
- [ ] Image gallery on detail pages (display-sized files)
- [ ] Thumbnail in map hover preview (use `sharp` thumb variant)



## Phase 5 — Map UX & filters

- [ ] Hover preview: name, summary, thumbnail
- [ ] Click → navigate to detail
- [ ] Filter UI: country, region, content type (routes / POIs / both)
- [ ] Off-road filter: store a simple `tags` or `surface` field; manual tag or “TBD” default for v1
- [ ] Fit map bounds to filtered results



## Phase 6 — Social (trailmates & visiting)

- [ ] `trailmates` table (follow direction, pending vs accepted — decide for v1)
- [ ] Visit another user’s profile map (`/users/[id]`)
- [ ] Same hover / click / filter behavior as own map
- [ ] Trailmate list UI: add, remove, browse



## Phase 7 — Google Maps → GPX (v1, after GPX path is stable)

- [ ] Research reliable extraction from Google Maps share URLs
- [ ] Nitro route: accept URL → produce GPX → same pipeline as file upload
- [ ] UI: “Paste Google Maps link” on add-route flow
- [ ] Error handling for unsupported or broken links



## Phase 8 — Deploy & polish

- [ ] Render Web Service: build + deploy from main branch
- [ ] Production env vars on Render
- [ ] Supabase Auth redirect URLs for production domain
- [ ] Smoke test: signup → upload GPX → see route → add POI → attach photo → visit friend’s map
- [ ] Basic error states and loading indicators on map/data fetches



## Later — Route status & visibility

Mark routes as **plan** or **done**, and **personal** or **public**, so users can sketch future trips and keep private tracks off visitors' views. See [Project Goals — Route](./project-goals.md#route) and [Filters](./project-goals.md#filters).

- [ ] `routes` columns: `status` (`plan` | `done`), `visibility` (`personal` | `public`); sensible defaults (e.g. done + public)
- [ ] RLS: visitors see a route only if owner profile is public **and** route visibility is public; owner always sees own routes (including personal)
- [ ] Edit UI: set status and visibility on create/edit / route detail
- [ ] Map filter: plan only / done only / both (own map); visitors never see personal routes

## Later — Travelogues

Rich trip narratives as a **separate collection**, linked to routes by id (not embedded on `routes`). After core map/route/POI flows are solid.

- [ ] `travelogues` table (title, body/content, owner, `route_id` → `routes`)
- [ ] RLS aligned with route/profile visibility
- [ ] Create / edit / view travelogue UI; open from route detail when linked
- [ ] Travelogue media (separate from `route_images`)

---



## Related documents

- [Tech Stack](./tech-stack.md) — technology choices and architecture
- [Project Goals](./project-goals.md) — product vision, features, and user flows
- [README](./README.md) — documentation index

