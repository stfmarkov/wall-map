import type { LineString } from 'geojson'
import type { Json } from '~/types/database.types'
import type { MapRoute } from '~/types/route'
import type { RouteDifficulty, RouteSurface, RouteTransport } from '~/types/routeDetails'
import {
  isRouteDifficulty,
  isRouteSurface,
  isRouteTransport,
} from '~/types/routeDetails'

export const isLineString = (value: Json): value is LineString => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const geom = value as { type?: unknown; coordinates?: unknown }
  return geom.type === 'LineString' && Array.isArray(geom.coordinates)
}

const parseTransport = (value: string | null | undefined): RouteTransport | null =>
  value && isRouteTransport(value) ? value : null

const parseDifficulty = (value: string | null | undefined): RouteDifficulty | null =>
  value && isRouteDifficulty(value) ? value : null

const parseSurface = (value: string | null | undefined): RouteSurface | null =>
  value && isRouteSurface(value) ? value : null

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
  transport?: string | null
  difficulty?: string | null
  surface?: string | null
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
    transport: parseTransport(row.transport),
    difficulty: parseDifficulty(row.difficulty),
    surface: parseSurface(row.surface),
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
