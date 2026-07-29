import type { LineString, Point, Position } from 'geojson'
import type { MapPoi } from '~/types/poi'
import type { MapRoute } from '~/types/route'

export type LngLatBoundsTuple = [[number, number], [number, number]]

const extend = (
  bounds: { minLng: number; minLat: number; maxLng: number; maxLat: number } | null,
  position: Position,
) => {
  const lng = position[0]
  const lat = position[1]
  if (typeof lng !== 'number' || typeof lat !== 'number') return bounds

  if (!bounds) {
    return { minLng: lng, minLat: lat, maxLng: lng, maxLat: lat }
  }

  return {
    minLng: Math.min(bounds.minLng, lng),
    minLat: Math.min(bounds.minLat, lat),
    maxLng: Math.max(bounds.maxLng, lng),
    maxLat: Math.max(bounds.maxLat, lat),
  }
}

const extendLine = (
  bounds: ReturnType<typeof extend>,
  geometry: LineString,
) => {
  let next = bounds
  for (const position of geometry.coordinates) {
    next = extend(next, position)
  }
  return next
}

const extendPoint = (
  bounds: ReturnType<typeof extend>,
  geometry: Point,
) => extend(bounds, geometry.coordinates)

/** Bounding box for filtered map features, or null when empty / invalid. */
export const boundsFromMapFeatures = (
  routes: MapRoute[],
  pois: MapPoi[],
): LngLatBoundsTuple | null => {
  let bounds: ReturnType<typeof extend> = null

  for (const route of routes) {
    bounds = extendLine(bounds, route.geometry)
  }
  for (const poi of pois) {
    bounds = extendPoint(bounds, poi.geometry)
  }

  if (!bounds) return null

  return [
    [bounds.minLng, bounds.minLat],
    [bounds.maxLng, bounds.maxLat],
  ]
}
