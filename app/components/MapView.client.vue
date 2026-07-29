<script setup lang="ts">
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Database } from '~/types/database.types'
import type { MapPoi } from '~/types/poi'
import type { MapRoute } from '~/types/route'
import { boundsFromMapFeatures } from '~/utils/mapFeatureBounds'
import { poisToGeoJson } from '~/utils/poisGeoJson'
import { routesToGeoJson } from '~/utils/routesGeoJson'

const ROUTES_SOURCE_ID = 'routes'
const ROUTES_LAYER_ID = 'routes-line'
const ROUTES_HIT_LAYER_ID = 'routes-hit'
const POIS_SOURCE_ID = 'pois'
const POIS_LAYER_ID = 'pois-circle'
const POIS_HIT_LAYER_ID = 'pois-hit'
const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'
const SIGNED_URL_SECONDS = 60 * 60

type HoverPreview = {
  name: string
  description: string | null
  thumbPath: string | null
  x: number
  y: number
}

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

const supabase = useSupabaseClient<Database>()
const container = ref<HTMLElement | null>(null)
let map: maplibregl.Map | null = null
let mapReady = false

const hover = ref<HoverPreview | null>(null)
const hoverThumbUrl = ref<string | null>(null)
const signedThumbCache = new Map<string, string>()

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

const fitToFeatures = () => {
  if (!map || !mapReady) return

  const bounds = boundsFromMapFeatures(props.routes, props.pois)
  if (!bounds) return

  map.fitBounds(bounds, {
    padding: 64,
    duration: 450,
    maxZoom: 14,
  })
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

const resolveThumbUrl = async (thumbPath: string | null) => {
  if (!thumbPath) {
    hoverThumbUrl.value = null
    return
  }

  const cached = signedThumbCache.get(thumbPath)
  if (cached) {
    hoverThumbUrl.value = cached
    return
  }

  const { data, error } = await supabase.storage
    .from('photos')
    .createSignedUrl(thumbPath, SIGNED_URL_SECONDS)

  if (error || !data?.signedUrl) {
    hoverThumbUrl.value = null
    return
  }

  signedThumbCache.set(thumbPath, data.signedUrl)
  if (hover.value?.thumbPath === thumbPath) {
    hoverThumbUrl.value = data.signedUrl
  }
}

const clearHover = () => {
  hover.value = null
  hoverThumbUrl.value = null
}

const setHoverFromFeature = (
  kind: 'route' | 'poi',
  featureId: string,
  point: { x: number; y: number },
) => {
  if (props.pinDropActive) {
    clearHover()
    return
  }

  const entity =
    kind === 'route'
      ? props.routes.find((route) => route.id === featureId)
      : props.pois.find((poi) => poi.id === featureId)

  if (!entity) {
    clearHover()
    return
  }

  const next: HoverPreview = {
    name: entity.name,
    description: entity.description,
    thumbPath: entity.thumb_path,
    x: point.x,
    y: point.y,
  }

  const pathChanged = hover.value?.thumbPath !== next.thumbPath
  hover.value = next

  if (pathChanged) {
    void resolveThumbUrl(next.thumbPath)
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

const onRouteMove = (event: maplibregl.MapLayerMouseEvent) => {
  if (props.pinDropActive) return
  if (map) map.getCanvas().style.cursor = 'pointer'
  const feature = event.features?.[0]
  const routeId = feature?.properties?.id
  if (typeof routeId === 'string' && routeId) {
    setHoverFromFeature('route', routeId, event.point)
  }
}

const onPoiMove = (event: maplibregl.MapLayerMouseEvent) => {
  if (props.pinDropActive) return
  if (map) map.getCanvas().style.cursor = 'pointer'
  const feature = event.features?.[0]
  const poiId = feature?.properties?.id
  if (typeof poiId === 'string' && poiId) {
    setHoverFromFeature('poi', poiId, event.point)
  }
}

const onFeatureLeave = () => {
  clearHover()
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
  if (props.pinDropActive) clearHover()
}

const bindRouteInteractions = () => {
  if (!map) return
  map.on('click', ROUTES_HIT_LAYER_ID, onRouteClick)
  map.on('mousemove', ROUTES_HIT_LAYER_ID, onRouteMove)
  map.on('mouseleave', ROUTES_HIT_LAYER_ID, onFeatureLeave)
}

const unbindRouteInteractions = () => {
  if (!map) return
  map.off('click', ROUTES_HIT_LAYER_ID, onRouteClick)
  map.off('mousemove', ROUTES_HIT_LAYER_ID, onRouteMove)
  map.off('mouseleave', ROUTES_HIT_LAYER_ID, onFeatureLeave)
}

const bindPoiInteractions = () => {
  if (!map) return
  map.on('click', POIS_HIT_LAYER_ID, onPoiClick)
  map.on('mousemove', POIS_HIT_LAYER_ID, onPoiMove)
  map.on('mouseleave', POIS_HIT_LAYER_ID, onFeatureLeave)
}

const unbindPoiInteractions = () => {
  if (!map) return
  map.off('click', POIS_HIT_LAYER_ID, onPoiClick)
  map.off('mousemove', POIS_HIT_LAYER_ID, onPoiMove)
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

const hoverStyle = computed(() => {
  if (!hover.value) return undefined
  return {
    left: `${hover.value.x + 14}px`,
    top: `${hover.value.y + 14}px`,
  }
})

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
  [() => props.routes, () => props.pois],
  () => {
    syncRoutes()
    syncPois()
    if (!props.country && !props.region) {
      fitToFeatures()
    }
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
  clearHover()
})
</script>

<template>
  <div class="map-shell">
    <div ref="container" class="map-view" />
    <MapHoverCard
      v-if="hover"
      class="hover-anchor"
      :style="hoverStyle"
      :name="hover.name"
      :description="hover.description"
      :thumb-url="hoverThumbUrl"
    />
  </div>
</template>

<style scoped>
.map-shell {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.map-view {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hover-anchor {
  position: absolute;
  z-index: 2;
}
</style>
