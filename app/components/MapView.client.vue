<script setup lang="ts">
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { MapRoute } from '~/types/route'
import { routesToGeoJson } from '~/utils/routesGeoJson'

const ROUTES_SOURCE_ID = 'routes'
const ROUTES_LAYER_ID = 'routes-line'
const ROUTES_HIT_LAYER_ID = 'routes-hit'
const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

const props = withDefaults(
  defineProps<{
    routes?: MapRoute[]
    country?: string | null
    region?: string | null
  }>(),
  {
    routes: () => [],
    country: null,
    region: null,
  },
)

const emit = defineEmits<{
  select: [routeId: string]
}>()

const container = ref<HTMLElement | null>(null)
let map: maplibregl.Map | null = null
let mapReady = false

const syncRoutes = () => {
  if (!map?.getSource(ROUTES_SOURCE_ID)) return

  const source = map.getSource(ROUTES_SOURCE_ID) as maplibregl.GeoJSONSource
  source.setData(routesToGeoJson(props.routes))
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
  const feature = event.features?.[0]
  const routeId = feature?.properties?.id
  if (typeof routeId === 'string' && routeId) {
    emit('select', routeId)
  }
}

const onRouteEnter = () => {
  if (map) map.getCanvas().style.cursor = 'pointer'
}

const onRouteLeave = () => {
  if (map) map.getCanvas().style.cursor = ''
}

const bindRouteInteractions = () => {
  if (!map) return
  map.on('click', ROUTES_HIT_LAYER_ID, onRouteClick)
  map.on('mouseenter', ROUTES_HIT_LAYER_ID, onRouteEnter)
  map.on('mouseleave', ROUTES_HIT_LAYER_ID, onRouteLeave)
}

const unbindRouteInteractions = () => {
  if (!map) return
  map.off('click', ROUTES_HIT_LAYER_ID, onRouteClick)
  map.off('mouseenter', ROUTES_HIT_LAYER_ID, onRouteEnter)
  map.off('mouseleave', ROUTES_HIT_LAYER_ID, onRouteLeave)
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
  () => [props.country, props.region] as const,
  () => {
    void zoomToPlace()
  },
)

onBeforeUnmount(() => {
  unbindRouteInteractions()
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
