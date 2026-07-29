import type { LineString } from 'geojson'
import type { Json } from '~/types/database.types'
import type { MapRoute } from '~/types/route'

export const isLineString = (value: Json): value is LineString => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const geom = value as { type?: unknown; coordinates?: unknown }
  return geom.type === 'LineString' && Array.isArray(geom.coordinates)
}

export const toMapRoute = (row: {
  id: string
  name: string
  description: string | null
  distance_m: number | null
  country: string | null
  region: string | null
  created_at: string
  geometry: Json
  gpx_path?: string | null
  thumb_path?: string | null
  owner_id?: string
}): MapRoute | null => {
  if (!isLineString(row.geometry)) return null
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    distance_m: row.distance_m,
    country: row.country,
    region: row.region,
    gpx_path: row.gpx_path ?? null,
    thumb_path: row.thumb_path ?? null,
    created_at: row.created_at,
    geometry: row.geometry,
    ...(row.owner_id ? { owner_id: row.owner_id } : {}),
  }
}

export const formatDistanceKm = (distanceM: number | null | undefined) => {
  if (distanceM == null || Number.isNaN(distanceM)) return null
  const km = distanceM / 1000
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`
}

export const gpxDownloadFilename = (routeName: string) => {
  const base = routeName
    .trim()
    .replace(/[^\w\s-]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
  return `${base || 'route'}.gpx`
}
