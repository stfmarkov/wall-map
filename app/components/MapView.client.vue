<script setup lang="ts">
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { MapPoi } from '~/types/poi'
import type { MapRoute } from '~/types/route'
import { poisToGeoJson } from '~/utils/poisGeoJson'
import { routesToGeoJson } from '~/utils/routesGeoJson'

const ROUTES_SOURCE_ID = 'routes'
const ROUTES_LAYER_ID = 'routes-line'
const ROUTES_HIT_LAYER_ID = 'routes-hit'
const POIS_SOURCE_ID = 'pois'
const POIS_LAYER_ID = 'pois-circle'
const POIS_HIT_LAYER_ID = 'pois-hit'
const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

const props = withDefaults(
  defineProps<{
    routes?: MapRoute[]
    pois?: MapPoi[]
    country?: string | null
    region?: string | null
    pinDropActive?: boolean
  }>(),
  {
    routes: () => [],
    pois: () => [],
    country: null,
    region: null,
    pinDropActive: false,
  },
)

const emit = defineEmits<{
  select: [routeId: string]
  'select-poi': [poiId: string]
  place: [coords: { lng: number; lat: number }]
}>()

const container = ref<HTMLElement | null>(null)
let map: maplibregl.Map | null = null
let mapReady = false

const syncRoutes = () => {
  if (!map?.getSource(ROUTES_SOURCE_ID)) return

  const source = map.getSource(ROUTES_SOURCE_ID) as maplibregl.GeoJSONSource
  source.setData(routesToGeoJson(props.routes))
}

const syncPois = () => {
  if (!map?.getSource(POIS_SOURCE_ID)) return

  const source = map.getSource(POIS_SOURCE_ID) as maplibregl.GeoJSONSource
  source.setData(poisToGeoJson(props.pois))
}

const zoomToPlace = async () => {
  if (!map || !mapReady) return
  if (!props.country && !props.region) return

  try {
    const { bounds } = await $fetch<{
      bounds: [[number, number], [number, number]]
    }>('/api/geocode/place', {
      query: {
        country: props.country || undefined,
        region: props.region || undefined,
      },
    })

    map.fitBounds(bounds, {
      padding: 48,
      duration: 0,
      maxZoom: 12,
    })
  }
  catch {
    // Keep default camera if place lookup fails
  }
}

const onRouteClick = (event: maplibregl.MapLayerMouseEvent) => {
  if (props.pinDropActive) return
  const feature = event.features?.[0]
  const routeId = feature?.properties?.id
  if (typeof routeId === 'string' && routeId) {
    emit('select', routeId)
  }
}

const onPoiClick = (event: maplibregl.MapLayerMouseEvent) => {
  if (props.pinDropActive) return
  const feature = event.features?.[0]
  const poiId = feature?.properties?.id
  if (typeof poiId === 'string' && poiId) {
    emit('select-poi', poiId)
  }
}

const onFeatureEnter = () => {
  if (props.pinDropActive) return
  if (map) map.getCanvas().style.cursor = 'pointer'
}

const onFeatureLeave = () => {
  if (props.pinDropActive) {
    if (map) map.getCanvas().style.cursor = 'crosshair'
    return
  }
  if (map) map.getCanvas().style.cursor = ''
}

const onMapPlaceClick = (event: maplibregl.MapMouseEvent) => {
  if (!props.pinDropActive) return
  emit('place', { lng: event.lngLat.lng, lat: event.lngLat.lat })
}

const syncPinDropCursor = () => {
  if (!map) return
  map.getCanvas().style.cursor = props.pinDropActive ? 'crosshair' : ''
}

const bindRouteInteractions = () => {
  if (!map) return
  map.on('click', ROUTES_HIT_LAYER_ID, onRouteClick)
  map.on('mouseenter', ROUTES_HIT_LAYER_ID, onFeatureEnter)
  map.on('mouseleave', ROUTES_HIT_LAYER_ID, onFeatureLeave)
}

const unbindRouteInteractions = () => {
  if (!map) return
  map.off('click', ROUTES_HIT_LAYER_ID, onRouteClick)
  map.off('mouseenter', ROUTES_HIT_LAYER_ID, onFeatureEnter)
  map.off('mouseleave', ROUTES_HIT_LAYER_ID, onFeatureLeave)
}

const bindPoiInteractions = () => {
  if (!map) return
  map.on('click', POIS_HIT_LAYER_ID, onPoiClick)
  map.on('mouseenter', POIS_HIT_LAYER_ID, onFeatureEnter)
  map.on('mouseleave', POIS_HIT_LAYER_ID, onFeatureLeave)
}

const unbindPoiInteractions = () => {
  if (!map) return
  map.off('click', POIS_HIT_LAYER_ID, onPoiClick)
  map.off('mouseenter', POIS_HIT_LAYER_ID, onFeatureEnter)
  map.off('mouseleave', POIS_HIT_LAYER_ID, onFeatureLeave)
}

const ensureRoutesLayer = () => {
  if (!map) return

  if (map.getSource(ROUTES_SOURCE_ID)) {
    syncRoutes()
    return
  }

  map.addSource(ROUTES_SOURCE_ID, {
    type: 'geojson',
    data: routesToGeoJson(props.routes),
  })

  map.addLayer({
    id: ROUTES_LAYER_ID,
    type: 'line',
    source: ROUTES_SOURCE_ID,
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': '#1a2332',
      'line-width': 3,
      'line-opacity': 0.5,
    },
  })

  map.addLayer({
    id: ROUTES_HIT_LAYER_ID,
    type: 'line',
    source: ROUTES_SOURCE_ID,
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': '#000000',
      'line-width': 18,
      'line-opacity': 0,
    },
  })

  bindRouteInteractions()
}

const ensurePoisLayer = () => {
  if (!map) return

  if (map.getSource(POIS_SOURCE_ID)) {
    syncPois()
    return
  }

  map.addSource(POIS_SOURCE_ID, {
    type: 'geojson',
    data: poisToGeoJson(props.pois),
  })

  map.addLayer({
    id: POIS_LAYER_ID,
    type: 'circle',
    source: POIS_SOURCE_ID,
    paint: {
      'circle-radius': 7,
      'circle-color': '#c4d4a8',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#1a2332',
      'circle-opacity': 0.95,
    },
  })

  map.addLayer({
    id: POIS_HIT_LAYER_ID,
    type: 'circle',
    source: POIS_SOURCE_ID,
    paint: {
      'circle-radius': 16,
      'circle-color': '#000000',
      'circle-opacity': 0,
    },
  })

  bindPoiInteractions()
}

onMounted(async () => {
  await nextTick()
  if (!container.value) return

  map = new maplibregl.Map({
    container: container.value,
    style: OPENFREEMAP_STYLE,
    center: [25.4858, 42.7339],
    zoom: 7,
  })

  map.addControl(new maplibregl.NavigationControl(), 'top-right')

  map.once('load', () => {
    mapReady = true
    map?.resize()
    ensureRoutesLayer()
    ensurePoisLayer()
    map?.on('click', onMapPlaceClick)
    syncPinDropCursor()
    void zoomToPlace()
  })

  requestAnimationFrame(() => {
    map?.resize()
  })
})

watch(
  () => props.routes,
  () => {
    syncRoutes()
  },
  { deep: true },
)

watch(
  () => props.pois,
  () => {
    syncPois()
  },
  { deep: true },
)

watch(
  () => props.pinDropActive,
  () => {
    syncPinDropCursor()
  },
)

watch(
  () => [props.country, props.region] as const,
  () => {
    void zoomToPlace()
  },
)

onBeforeUnmount(() => {
  unbindRouteInteractions()
  unbindPoiInteractions()
  map?.off('click', onMapPlaceClick)
  map?.remove()
  map = null
  mapReady = false
})
</script>

<template>
  <div ref="container" class="map-view" />
</template>

<style scoped>
.map-view {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
