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

- [ ] Supabase Auth: email/password or magic link (pick one for v1)
- [ ] `profiles` table + trigger to create profile on signup
- [ ] RLS: users can read/update their own profile; public read for basic profile fields (for visiting maps)
- [ ] Login / signup / logout pages
- [ ] Auth middleware: protect “my map” and edit routes
- [ ] Profile page shell at `/u/[username]` — map as main content (empty state OK)



## Phase 2 — Routes (GPX core)

- [ ] `routes` table with PostGIS `geography(LineString)`, name, description, owner, country, region
- [ ] RLS: owner CRUD; others read if profile is public (or always public for v1)
- [ ] Storage bucket `gpx` + upload policy
- [ ] Nitro route: accept GPX upload → parse with `@tmcw/togeojson` → validate → store geometry + original file
- [ ] Nitro route or DB function: reverse-geocode start point → store country/region
- [ ] UI: “Add route” → GPX file picker → name → save
- [ ] Display routes on profile map (GeoJSON source + line layer)
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
- [ ] Visit another user’s profile map (`/u/[username]`)
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

---



## Related documents

- [Tech Stack](./tech-stack.md) — technology choices and architecture
- [Project Goals](./project-goals.md) — product vision, features, and user flows
- [README](./README.md) — documentation index

