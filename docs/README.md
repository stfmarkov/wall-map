# Wall Map — Documentation

Wall Map is a web app for collecting, sharing, and exploring personal route maps and points of interest. Users build a map of their adventures by importing GPX tracks and Google Maps routes, pinning memorable places, enriching each item with notes and photos, and browsing their own collection or discovering paths and places on other users' maps.

## Documents

| Document | Description |
|----------|-------------|
| [Project Goals](./project-goals.md) | Vision, core concepts, user flows, and feature scope |
| [Tech Stack](./tech-stack.md) | Technology choices, architecture, and hosting |
| [Build Tasks](./tasks.md) | Phased implementation checklist |
| [Dev Flows](./dev-flows.md) | Repeatable CLI workflows (migrations, types, env, Resend/OTP email setup) |

## Quick summary

- **Users** have a profile whose main screen is an interactive map of their routes and points of interest.
- **Routes** are created from GPX files or Google Maps route links (converted to GPX).
- **Points of interest** are single locations on the map — drop a pin or paste a Google Maps place link; same metadata and UX as routes, but a pin instead of a path.
- **Routes and POIs** can be edited with a name, description, images; routes also accept updated track data, POIs can be moved.
- **Maps** show routes and POIs with hover previews and a detail view on click.
- **Filters** help narrow by country, region, off-road, content type, and more.
- **Social** features let users visit each other's maps and follow fellow explorers.

Start with [Project Goals](./project-goals.md) for the full definition of what we are building.
