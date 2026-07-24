# Project Goals

This document defines what Wall Map is and what we are building toward. It is the source of truth for product scope and intent.

## Vision

Wall Map is a personal and social route atlas. Each user maintains a living map of the routes they have ridden, hiked, driven, or otherwise traveled, plus **points of interest** — memorable places pinned to the world. Routes and points of interest are first-class map objects: they have location, metadata, media, and a story. Users can explore their own collection, filter it, export tracks, and visit other users' maps to discover new places and paths.

The product should feel map-native — geography, trails, and exploration are central, not bolted on.

## Core concepts

### User profile

Every user has a **profile** that represents their identity on the platform. The profile's **main screen is a map** — not a feed or a list. The map is the user's personal wall of routes and points of interest: a visual record of where they have been and what they found there.

Maps are addressed by user id (`/users/[id]`); `/users/me` opens the signed-in user’s map. **Username** is an optional public handle, not required for routing. Users edit display name, username, bio, visibility, and avatar on `/profile`.

### Route

A **route** is a path-based map object. Creating a route always starts from track data:

| Input | Behavior |
|-------|----------|
| **GPX file upload** | Imported directly as the route geometry |
| **Google Maps route** | Converted to GPX, then stored and treated like any other route |

Every route has at minimum:

- **Name** — human-readable title
- **Track geometry** — the path drawn on the map (from GPX)
- **Owner** — the user who created it

Routes also have (planned; not required for early GPX work):

- **Status** — **done** (completed / already traveled) or **plan** (future intention). Plans let users sketch upcoming trips on the map without mixing them with finished rides.
- **Visibility** — **public** or **personal**. A **personal** route is visible only to its owner, even when the owner's profile is public. A **public** route is visible to visitors only when the owner's profile is public (same gate as today's profile-level visibility).

Routes can be **edited** after creation:

- Replace or extend track data by uploading a new GPX file
- Add or update a **note / description**
- Attach **images** (photos from the trip, scenery, etc.)
- Set **status** (plan vs done) and **visibility** (personal vs public)

### Point of interest

A **point of interest** (POI) is a place-based map object. It works much like a route — same metadata, editing, map interactions, filters, and social browsing — but its geometry is a **single point** on the map, not a path.

Creating a point of interest starts from a location:

| Input | Behavior |
|-------|----------|
| **Drop a pin** | Click the map (or enter coordinates) to place the point |
| **Google Maps place / share link** | Converted to a coordinate, then stored and treated like any other POI |

Every point of interest has at minimum:

- **Name** — human-readable title
- **Location** — a single coordinate (latitude / longitude) in the world
- **Owner** — the user who created it

Points of interest can be **edited** after creation:

- Update **location** (move the pin on the map)
- Add or update a **note / description**
- Attach **images**

### Map (profile main screen)

On a user's profile, the map displays **all routes and points of interest they have created**. Interaction model:

| Action | Result |
|--------|--------|
| **View** | Routes as paths/lines; points of interest as pins/markers |
| **Hover** | Quick preview — name, summary info, thumbnail if available |
| **Click** | Open the **route detail screen** or **point of interest detail screen** |

The map is both a portfolio and a navigation hub.

### Route detail screen

Clicking a route opens a dedicated view with full information:

- Complete **description / notes**
- **Image gallery**
- Full route on the map
- **GPX export** (download the track)
- Other metadata (distance, region, tags — as we define them)

### Point of interest detail screen

Clicking a point of interest opens a dedicated view with full information:

- Complete **description / notes**
- **Image gallery**
- Location shown on the map
- Other metadata (region, tags — as we define them)

Export format for a single point TBD (e.g. GPX waypoint); not required for the core experience.

### Filters

Users need to slice large route collections. Planned filter dimensions include:

- **Country**
- **Region** (state, province, area, etc.)
- **Off-road inclusion** (e.g. show only off-road routes, or include/exclude paved segments)
- **Content type** — routes only, points of interest only, or both
- **Route status** — plan only, done only, or both (makes it easy to organize future trips vs completed routes)
- Additional filters TBD (activity type, date, distance, tags)

Filters apply on the profile map and when browsing another user's map. Visitors only ever see routes that are **public** (and whose owner profile is public); personal routes stay on the owner's map alone.

### Social: visiting other maps

Users can **visit other users' profiles** and browse their maps the same way they browse their own — routes and points of interest, hover for preview, click for detail, apply filters.

This turns individual map walls into a discoverable network of real-world paths and places.

### Connections: fellow explorers

Users can maintain a list of people they follow or care about — not generic "friends," but something that fits the map/exploration theme.

Working name: **Trailmates** (alternatives: Waypoint Circle, Fellow Explorers, Cartographers).

Capabilities (high level):

- Add / remove trailmates
- See trailmates' maps
- Optionally surface new routes and points of interest from trailmates (future)

Exact naming and mechanics (follow vs mutual, requests, privacy) are TBD.

## User flows

### Create a route

1. User opens their profile map
2. User chooses to add a route (GPX upload or Google Maps link)
3. System creates the route from track data
4. User names the route and optionally adds description and images
5. Route appears on the profile map

### Edit a route

1. User opens route detail (from map click or list)
2. User updates name, description, images, or uploads new GPX
3. Map and detail view reflect changes

### Create a point of interest

1. User opens their profile map
2. User chooses to add a point of interest (drop a pin on the map, or paste a Google Maps place / share link)
3. System creates the POI at that location
4. User names it and optionally adds description and images
5. Point of interest appears on the profile map

### Edit a point of interest

1. User opens POI detail (from map click or list)
2. User updates name, description, images, or moves the pin
3. Map and detail view reflect changes

### Browse own map

1. User lands on profile → map shows all routes and points of interest
2. User applies filters (country, region, off-road, content type, etc.)
3. User hovers items for quick info
4. User clicks a route for full detail and GPX export, or a POI for place detail

### Discover on another user's map

1. User navigates to another profile (via trailmate list, search, or `/users/[id]` link)
2. User sees that user's map — routes and points of interest
3. Same hover / click / filter behavior as on own profile
4. User can view item details; export/sharing rules TBD

## Scope boundaries (initial)

These are goals, not commitments for v1. They help keep early builds focused:

**In scope for the product vision**

- User profiles with map as home
- GPX import and Google Maps → GPX conversion
- Google Maps place / share link → point of interest conversion
- Route CRUD (create, read, update; delete TBD)
- Point of interest CRUD (create, read, update; delete TBD)
- Route metadata: name, description, images
- Point of interest metadata: name, description, images, location
- Interactive map with hover and click (routes as lines, POIs as pins)
- Route detail page with GPX export
- Point of interest detail page
- Map filters (country, region, off-road, etc.)
- Viewing other users' maps
- Trailmate-style user connections

**Out of scope / later**

- Real-time GPS recording in the app
- Turn-by-turn navigation
- Commercial route marketplace
- Detailed permissions model beyond profile public/private and per-route personal/public (unless needed for MVP)
- **Route status & per-route visibility** — plan vs done; personal vs public routes; filter by status (see Route and Filters above)
- **Travelogues** — rich trip narratives as a separate collection linked to routes by id (not stored on the route row; route photos stay on `route_images`)

## Success criteria

We will know the project is on track when:

1. A user can upload GPX or paste a Google Maps route and see it on their map within minutes
2. A user can drop a point of interest on the map and enrich it with name, story, and photos
3. Routes and points of interest feel rich — not anonymous geometry on a map
4. Filtering makes large collections usable
5. Visiting another user's map feels as natural as browsing your own
6. The social layer (trailmates) connects people through shared geography, not generic social noise

## Tech context

Wall Map is built as a **Nuxt** web application (`wall-map` in the repo root). Implementation details, architecture, and API design will be documented separately as the codebase grows.
