import type { Point } from 'geojson'
import type { Json } from '~/types/database.types'
import type { MapPoi } from '~/types/poi'

export const isPoint = (value: Json): value is Point => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const geom = value as { type?: unknown; coordinates?: unknown }
  return geom.type === 'Point' && Array.isArray(geom.coordinates)
}

export const toMapPoi = (row: {
  id: string
  name: string
  description: string | null
  country: string | null
  region: string | null
  created_at: string
  geometry: Json
  owner_id?: string
}): MapPoi | null => {
  if (!isPoint(row.geometry)) return null
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    country: row.country,
    region: row.region,
    created_at: row.created_at,
    geometry: row.geometry,
    ...(row.owner_id ? { owner_id: row.owner_id } : {}),
  }
}
