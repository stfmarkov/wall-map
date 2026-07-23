<script setup lang="ts">
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { MapRoute } from '~/types/route'
import { routesToGeoJson } from '~/utils/routesGeoJson'

const ROUTES_SOURCE_ID = 'routes'
const ROUTES_LAYER_ID = 'routes-line'
const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

const props = withDefaults(
  defineProps<{
    routes?: MapRoute[]
  }>(),
  {
    routes: () => [],
  },
)

const container = ref<HTMLElement | null>(null)
let map: maplibregl.Map | null = null

const syncRoutes = () => {
  if (!map?.getSource(ROUTES_SOURCE_ID)) return

  const source = map.getSource(ROUTES_SOURCE_ID) as maplibregl.GeoJSONSource
  source.setData(routesToGeoJson(props.routes))
}

const ensureRoutesLayer = () => {
  if (!map || map.getSource(ROUTES_SOURCE_ID)) {
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
    map?.resize()
    ensureRoutesLayer()
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

onBeforeUnmount(() => {
  map?.remove()
  map = null
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
