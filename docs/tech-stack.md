# Tech Stack

Technology choices and architecture for Wall Map. For the phased implementation checklist, see [Build Tasks](./tasks.md). Product scope is defined in [Project Goals](./project-goals.md).

---

## Stack overview

| Layer | Choice | Role |
|-------|--------|------|
| **App framework** | Nuxt 4 | Vue UI, routing, SSR shell, Nitro server routes |
| **Map rendering** | MapLibre GL | Interactive map — routes as lines, POIs as pins |
| **Basemap tiles** | [OpenFreeMap](https://openfreemap.org/) | Free map tiles; no API key required |
| **Database** | Supabase (PostgreSQL + **PostGIS**) | Users, routes, POIs, trailmates, spatial queries |
| **Auth** | Supabase Auth | Sign up, sign in, session management |
| **File storage** | Supabase Storage + Nitro/`sharp` | GPX originals; photos stored in Storage, resized/thumbnailed with `sharp` on upload |
| **Nuxt ↔ Supabase** | `@nuxtjs/supabase` | Auth middleware, composables, SSR cookie handling |
| **GPX parsing** | `@tmcw/togeojson` | GPX → GeoJSON for map display and storage |
| **Geo utilities** | `@turf/turf` | Distance, bounding box, simplify, spatial helpers |
| **Hosting (app)** | Render (Web Service) | Cheapest practical option for a small private group |
| **Hosting (backend services)** | Supabase free tier | DB, auth, storage — separate from Render |

### Architecture

```
Browser (Nuxt client)
  ├── MapLibre GL + OpenFreeMap tiles
  ├── Supabase Auth (session)
  └── Direct Supabase reads/writes (protected by RLS)

Nitro server routes
  ├── GPX import & validation
  ├── Google Maps → GPX conversion (v1, after GPX upload works)
  ├── Image upload (`sharp` display + thumbnail → Storage)
  ├── Reverse geocoding (country/region on import)
  └── Any logic requiring secrets or heavy processing

Supabase
  ├── PostgreSQL + PostGIS (geometry, filters, indexes)
  ├── Auth (profiles linked to auth.users)
  ├── Storage (gpx/, photos/ buckets)
  └── Row Level Security (own data vs public/trailmate visibility)
```

### Key integration notes

- **MapLibre is client-only.** Wrap the map component in `<ClientOnly>` or use a dynamic import; do not SSR the map canvas.
- **PostGIS from day one.** Store route geometry as `geography(LineString)` and POI location as `geography(Point)`. Compute and store country/region at import time — do not reverse-geocode on every filter change.
- **Google Maps → GPX** is in v1 scope but built *after* the GPX upload path works. Weekend-travel use case means this can ship in the same release once core import/display is solid.
- **Render** runs `nuxt build` + `node .output/server/index.mjs` as a Web Service. Supabase stays on its own free tier. Total cost for 3–5 friends should be near zero.

---

## Decisions

### Images (v1)

**Decision: Supabase Storage + Nitro/`sharp` transforms.**

Photos live in a Supabase Storage bucket; upload goes through a Nitro route that uses `sharp` to produce a display-sized image and a thumbnail, then stores both (and records paths on the route/POI).

1. One Storage bucket (e.g. `photos`) with RLS: users can write only under their own `{user_id}/` prefix.
2. Nitro upload handler: accept image → `sharp` resize (e.g. max edge ~1920px for gallery + a small thumb for map hover) → upload variants to Storage.
3. Store Storage paths (and sort order) on `route_images` / `poi_images` (or equivalent).
4. Map hover previews use the thumbnail; detail galleries use the display-sized file.

Alternatives considered and rejected for v1: direct client upload with CSS-only thumbs; Supabase Image Transformations (plan-dependent).

---

## Dependencies (npm)

Core packages to add as we build:

```
@nuxtjs/supabase
maplibre-gl
@tmcw/togeojson
@turf/turf
```

Dev / tooling (add when needed):

```
supabase (CLI — local migrations & type generation)
zod (Nitro route input validation)
sharp (image resize / thumbnails on upload)
```

---

## Supabase schema (high level)

Tables to design in the first backend phase:

| Table | Purpose |
|-------|---------|
| `profiles` | Display name, avatar, slug/username; 1:1 with `auth.users` |
| `routes` | Name, description, owner, geometry (PostGIS), country, region, metadata |
| `points_of_interest` | Name, description, owner, location (PostGIS), country, region |
| `route_images` / `poi_images` | Storage path, sort order, linked to parent |
| `trailmates` | Follow relationship between users (exact mechanics TBD) |

Enable the **PostGIS** extension before creating geometry columns. Add spatial indexes on route geometry and POI location.

Storage buckets:

| Bucket | Contents | Access |
|--------|----------|--------|
| `gpx` | Original uploaded GPX files | Owner read/write; optional public read for export |
| `photos` | Route and POI images | Owner write; read per visibility rules |

---

## Hosting (Render)

1. Create a Render **Web Service** connected to the repo.
2. **Build command:** `npm install && npm run build`
3. **Start command:** `node .output/server/index.mjs`
4. Set environment variables: `SUPABASE_URL`, `SUPABASE_KEY` (anon), `SUPABASE_SERVICE_KEY` (server only, if needed), `NUXT_PUBLIC_*` as required by `@nuxtjs/supabase`.
5. Supabase project: allow Render origin in Auth redirect URLs / CORS if needed.
6. Optional: Render free tier spins down on idle — acceptable for a friends-only app; upgrade only if cold starts become annoying.

---

## Out of scope for v1

- Real-time GPS recording
- Turn-by-turn navigation
- Vector tile server / custom MVT pipeline (GeoJSON per user is fine at this scale)
- Dedicated image CDN beyond Supabase Storage (Storage + `sharp` on upload is enough)

---

## Related documents

- [Project Goals](./project-goals.md) — product vision, features, and user flows
- [Build Tasks](./tasks.md) — phased implementation checklist
- [README](./README.md) — documentation index
