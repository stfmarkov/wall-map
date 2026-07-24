import type { Point } from 'geojson'

/** Point of interest metadata + GeoJSON Point for a profile map. */
export type MapPoi = {
  id: string
  name: string
  description: string | null
  country: string | null
  region: string | null
  created_at: string
  geometry: Point
  /** Present when loaded via get_map_poi (deep link). */
  owner_id?: string
}
