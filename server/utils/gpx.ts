import { DOMParser } from '@xmldom/xmldom'
import { gpx } from '@tmcw/togeojson'
import { length, lineString } from '@turf/turf'
import type { Feature, FeatureCollection, Position } from 'geojson'

export type ParsedGpxTrack = {
  coordinates: Position[]
  distanceM: number
  ewkt: string
}

const collectLineCoords = (geometry: Feature['geometry'], into: Position[]) => {
  if (!geometry) return

  if (geometry.type === 'LineString') {
    for (const position of geometry.coordinates) {
      if (!position[0] || !position[1]) continue
      into.push([position[0], position[1]])
    }
    return
  }

  if (geometry.type === 'MultiLineString') {
    for (const segment of geometry.coordinates) {
      for (const position of segment) {
        if (!position[0] || !position[1]) continue
        into.push([position[0], position[1]])
      }
    }
  }
}

const toEwktLineString = (coordinates: Position[]) => {
  const body = coordinates
    .map(([lon, lat]) => `${lon} ${lat}`)
    .join(', ')
  return `SRID=4326;LINESTRING(${body})`
}

/**
 * Parse GPX XML into a single LineString (multi-track / multi-segment coords merged).
 */
export const parseGpxToTrack = (xml: string): ParsedGpxTrack => {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const parseError = doc.getElementsByTagName('parsererror')[0]
  if (parseError) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid GPX XML',
    })
  }

  let collection: FeatureCollection
  try {
    collection = gpx(doc)
  }
  catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Could not parse GPX file',
    })
  }

  const coordinates: Position[] = []
  for (const feature of collection.features) {
    collectLineCoords(feature.geometry, coordinates)
  }

  if (coordinates.length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'GPX must contain a track or route with at least two points',
    })
  }

  const line = lineString(coordinates)
  const distanceM = length(line, { units: 'meters' })

  return {
    coordinates,
    distanceM,
    ewkt: toEwktLineString(coordinates),
  }
}

export const nameFromGpxFilename = (filename: string) => {
  const base = filename.replace(/\.[^.]+$/, '').trim()
  const name = base || 'Untitled route'
  return name.slice(0, 200)
}
