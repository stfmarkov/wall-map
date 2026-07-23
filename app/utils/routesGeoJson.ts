import type { FeatureCollection, LineString } from 'geojson'
import type { MapRoute } from '~/types/route'

export const emptyRoutesGeoJson = (): FeatureCollection<LineString> => ({
  type: 'FeatureCollection',
  features: [],
})

export const routesToGeoJson = (routes: MapRoute[]): FeatureCollection<LineString> => ({
  type: 'FeatureCollection',
  features: routes.map((route) => ({
    type: 'Feature',
    id: route.id,
    properties: {
      id: route.id,
      name: route.name,
      distance_m: route.distance_m,
    },
    geometry: route.geometry,
  })),
})
