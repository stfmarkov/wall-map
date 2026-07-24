import type { FeatureCollection, Point } from 'geojson'
import type { MapPoi } from '~/types/poi'

export const emptyPoisGeoJson = (): FeatureCollection<Point> => ({
  type: 'FeatureCollection',
  features: [],
})

export const poisToGeoJson = (pois: MapPoi[]): FeatureCollection<Point> => ({
  type: 'FeatureCollection',
  features: pois.map((poi) => ({
    type: 'Feature',
    id: poi.id,
    properties: {
      id: poi.id,
      name: poi.name,
    },
    geometry: poi.geometry,
  })),
})
