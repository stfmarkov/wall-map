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
| **File storage** | Supabase Storage | GPX originals, route/POI photos |
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

## Open decisions

### Images (v1 — decide before building upload UI)

For a small group (you + 3–5 friends), keep it simple:

| Approach | Pros | Cons |
|----------|------|------|
| **A. Supabase Storage, direct upload** *(recommended)* | Minimal code; RLS on buckets; no extra service | No automatic thumbnails; full-size files if not resized client-side |
| B. Nitro + `sharp` thumbnails | Consistent thumb sizes for map hover previews | Extra server processing; more moving parts on Render |
| C. Supabase image transforms | CDN-style resizing via URL params | Depends on Supabase plan/features |

**Recommended v1 decision: Option A + client-side resize.**

1. One Storage bucket (e.g. `photos`) with RLS: users can write only under their own `{user_id}/` prefix.
2. Before upload, resize in the browser to a max edge of ~1920px (Canvas API or a small helper). Good enough for trip photos on a wall map.
3. Store the public/signed URL on the route or POI record.
4. Map hover previews use the same image at reduced CSS size; add server thumbnails in v2 if load times matter.

**Open:** confirm Option A or pick B/C before implementing the photo attach flow.

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
- Dedicated image CDN beyond Supabase Storage
- Heavy server-side image pipeline unless Option B is chosen

---

## Related documents

- [Project Goals](./project-goals.md) — product vision, features, and user flows
- [Build Tasks](./tasks.md) — phased implementation checklist
- [README](./README.md) — documentation index
