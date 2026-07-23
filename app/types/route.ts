import type { LineString } from 'geojson'

/** Route metadata + GeoJSON LineString for a profile map. */
export type MapRoute = {
  id: string
  name: string
  description: string | null
  distance_m: number | null
  country: string | null
  region: string | null
  created_at: string
  geometry: LineString
}
