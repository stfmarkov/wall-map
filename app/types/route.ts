import type { LineString } from 'geojson'

/** Route metadata + GeoJSON LineString for a profile map. */
export type MapRoute = {
  id: string
  name: string
  description: string | null
  distance_m: number | null
  country: string | null
  region: string | null
  gpx_path: string | null
  /** Storage path of the first image thumb (photos bucket); null if none. */
  thumb_path: string | null
  created_at: string
  geometry: LineString
  /** Present when loaded via get_map_route (deep link). */
  owner_id?: string
}
