# Research: Google Maps → GPX

Notes for Phase 7 — converting Google Maps route / place share links into GPX (routes) or coordinates (POIs). Product intent is in [Project Goals](./project-goals.md); checklist is in [Build Tasks — Phase 7](./tasks.md#phase-7--google-maps-links-v1-after-gpx--pin-drop-are-stable).

Status: **open research**. Leading candidate below; nothing decided for implementation yet.

---

## Goal

Accept a pasted Google Maps URL and produce something our existing pipelines can ingest:

| Input | Desired output | Existing pipeline |
|-------|----------------|-------------------|
| Route / directions share URL | GPX track (or equivalent geometry) | Same as `POST /api/gpx` |
| Place / pin share URL | Lat/lng | Same as pin-drop POI |

We already parse GPX (and can parse KML) with `@tmcw/togeojson`.

---

## Leading idea — URL waypoints + Routes API polyline

Pipeline:

1. **Resolve** short links (`maps.app.goo.gl/…`, `goo.gl/maps/…`) via HTTP redirect to the full `google.com/maps/…` URL.
2. **Extract ordered waypoints** (origin, destination, intermediates) and, if possible, **travel mode** from that URL.
3. **Call Google Routes API** `computeRoutes` with those waypoints and request a **polyline**.
4. **Decode / convert** the polyline to GeoJSON LineString (and optionally write a GPX file for Storage).
5. Hand off to the same validate → PostGIS + Storage path as GPX upload.

This matches the product “paste a link” UX: fully server-side, no My Maps / Drive UI.

### Routes API (official)

| Item | Detail |
|------|--------|
| Endpoint | `POST https://routes.googleapis.com/directions/v2:computeRoutes` |
| Auth | Google Maps Platform API key (`X-Goog-Api-Key`); billing account required |
| Field mask | Required header, e.g. `routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline` (or GeoJSON polyline fields) |
| Input | `origin`, `destination`, optional `intermediates[]` (up to **25**), `travelMode` |
| Polyline | `polylineEncoding`: `ENCODED_POLYLINE` (default) or `GEO_JSON_LINESTRING` |
| Quality | `OVERVIEW` (fewer points, cheaper/faster) or `HIGH_QUALITY` (more points — better for stored tracks) |
| Modes | `DRIVE`, `WALK`, `BICYCLE`, `TWO_WHEELER`, `TRANSIT` (`WALK` / `BICYCLE` / `TWO_WHEELER` are beta; Google requires showing a warning in the UI) |

Docs:

- [Get a route](https://developers.google.com/maps/documentation/routes/compute_route_directions)
- [Request route polylines](https://developers.google.com/maps/documentation/routes/traffic_on_polylines)
- [Intermediate waypoints](https://developers.google.com/maps/documentation/routes/intermed_waypoints)
- [Usage and billing](https://developers.google.com/maps/documentation/routes/usage-and-billing)

Example shape (simplified):

```http
POST https://routes.googleapis.com/directions/v2:computeRoutes
X-Goog-Api-Key: …
X-Goog-FieldMask: routes.distanceMeters,routes.polyline.geoJsonLinestring
```

```json
{
  "origin": { "location": { "latLng": { "latitude": 48.8566, "longitude": 2.3522 } } },
  "destination": { "location": { "latLng": { "latitude": 48.8606, "longitude": 2.3376 } } },
  "intermediates": [],
  "travelMode": "WALK",
  "polylineQuality": "HIGH_QUALITY",
  "polylineEncoding": "GEO_JSON_LINESTRING"
}
```

`GEO_JSON_LINESTRING` is attractive for us: coordinates land close to what we already store from GPX → GeoJSON. Encoded polylines are fine too (decode → LineString → optional GPX write).

`routes.distanceMeters` from the response can populate `distance_m` the same way we do from uploaded GPX.

### Cost (as of research)

Pay-as-you-go Maps Platform SKUs (per request; confirm live pricing before shipping):

| SKU (Compute Routes) | Free monthly cap (approx.) | Notes |
|----------------------|----------------------------|--------|
| **Essentials** | ~10,000 | Basic route + polyline; ≤10 intermediate waypoints; avoid traffic-aware extras |
| **Pro** | ~5,000 | e.g. traffic-aware routing, **11–25** intermediates |
| **Enterprise** | ~1,000 | Higher features (e.g. two-wheeler / tolls depending on request) |

For Wall Map v1 we likely want **Essentials**: no traffic polyline, prefer ≤10 vias, `TRAFFIC_UNAWARE` (or omit traffic prefs). Keep the API key **server-only** (Nitro).

### Extracting coordinates from the URL

Google does **not** document a stable public schema for Maps share URLs. Extraction is the fragile step; the Routes API itself is solid.

Common patterns after resolving short links:

| URL shape | What we can get |
|-----------|-----------------|
| `/maps/dir/lat,lng/lat,lng/…` | Ordered stop coords in the path |
| `/maps/dir/Name+A/Name+B/…` + `data=` | Names in path; lat/lng often in `data` as `!1d{lng}!2d{lat}` pairs |
| `/maps/place/…/@lat,lng,…` | Single pin (POI path — no Routes call needed) |
| `@lat,lng` alone | Often **map center / viewport**, not a stop — do not treat as the route |

Practical approach used by existing converters:

1. Follow redirects to the expanded URL.
2. Prefer explicit `/dir/…/lat,lng/…` segments when present.
3. Otherwise parse the `data=` protocol-buffer-like string for ordered `!1d…!2d…` coordinate pairs (and travel-mode tokens such as `!3e0` drive / `!3e1` bike / `!3e2` walk — verify against real samples).
4. First point → `origin`, last → `destination`, middle → `intermediates` (cap at 25; Essentials prefer ≤10).

Community parsers exist (e.g. JS/PHP “google maps data parameter” parsers) but are **unofficial and can break** when Google changes URL encoding. We should own a small parser + a fixture set of real URLs.

### Fit with Wall Map

```
Paste URL
  → Nitro: resolve + parse waypoints (+ mode)
  → Nitro: computeRoutes (server key)
  → polyline → GeoJSON LineString (+ optional GPX for `gpx` bucket)
  → existing GPX/route create pipeline (geometry, distance_m, geocode start, etc.)
```

POI links skip Routes: parse one lat/lng (or resolve place) → pin-drop pipeline.

### Strengths

- Official API; returns a real road/path polyline, not a straight line between points.
- Programmatic end-to-end for “paste link”.
- `GEO_JSON_LINESTRING` / `distanceMeters` align with our storage model.
- Free tier is enough for early usage if we stay on Essentials.

### Risks / caveats

- **Recomputed ≠ original share**: Routes recalculates; path may differ from what the user saw (traffic, algorithm, via handling).
- **Off-road / trail fidelity**: `DRIVE` / `WALK` / `BICYCLE` follow Google’s network; rough tracks may not match a GPX from a device.
- **URL parsing is unofficial** and will need fixtures + graceful errors (“couldn’t read this link”).
- **Mode detection**: wrong mode → wrong geometry; may need a UI override (drive / walk / bike).
- **Billing + key**: Maps Platform project, billing enabled, restrict key by IP/referrer as much as Render allows; never ship key to the client.
- **Beta modes**: WALK/BICYCLE/TWO_WHEELER require Google’s user-facing warning.
- **Waypoint cap**: >25 intermediates not supported; 11–25 bumps SKU to Pro.

### Open questions

- [ ] Collect real example URLs (short link, 2-stop drive, multi-stop, walk, bike, place-only) and document extractable fields.
- [ ] Confirm travel-mode tokens in `data=` against those samples.
- [ ] Prefer `GEO_JSON_LINESTRING` + synthesize GPX for Storage, or encoded polyline → GPX writer?
- [ ] Default `travelMode` when URL has none; allow user override in UI?
- [ ] `HIGH_QUALITY` vs `OVERVIEW` for stored tracks (size vs fidelity).
- [ ] Enable only Routes API (+ billing) on a dedicated Maps project; estimate monthly cost at expected paste volume.
- [ ] ToS / attribution requirements for displaying or storing Routes geometry.

---

## Alternate — Google My Maps + KML

Earlier idea: create a My Map → add points from the URL → route → export KML → `@tmcw/togeojson`.

Useful as a **manual** fallback for users, but weak for Phase 7 paste-link: My Maps export is not a clean server automation path compared to Routes API. Keep as backup UX (“export KML from My Maps and upload”) if link parsing fails.

---

## Other angles

| Approach | Notes |
|----------|--------|
| Parse coordinates only (no Routes) | Fine for POIs; for routes yields endpoints/vias without road geometry |
| Legacy Directions API | Older sibling of Routes; prefer Routes API for new work |
| Third-party converters | Often wrap the same “parse URL + Directions/Routes” pattern; check license/ToS |
| User uploads GPX/KML | Already supported / lowest risk; weaker than paste-link |

---

## Place / POI links

Usually no Routes call:

- [ ] Patterns with `@lat,lng` or `/place/…/@lat,lng`
- [ ] Short links → resolve redirect, then parse
- [ ] Place id / name only (may need Places API — separate cost; defer if lat/lng is usually present)

---

## Next research steps

1. Build a small fixture table of real share URLs → expected waypoints + mode.
2. Spike Nitro: resolve short URL → parse coords → one `computeRoutes` call → GeoJSON LineString (no product UI yet).
3. Decide Essentials request shape (field mask, quality, mode defaults) and env var for the server key.
4. Revisit My Maps/KML only as manual fallback copy in error states.

---

## Related

- [Build Tasks — Phase 7](./tasks.md#phase-7--google-maps-links-v1-after-gpx--pin-drop-are-stable)
- [Tech Stack](./tech-stack.md) — `@tmcw/togeojson`, GPX pipeline
- [Project Goals](./project-goals.md) — route and POI creation from Google Maps links
