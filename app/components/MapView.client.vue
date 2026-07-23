<script setup lang="ts">
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

const container = ref<HTMLElement | null>(null)
let map: maplibregl.Map | null = null

onMounted(async () => {
  await nextTick()
  if (!container.value) return

  // Style/center/zoom can later come from user location or settings
  map = new maplibregl.Map({
    container: container.value,
    style: OPENFREEMAP_STYLE,
    center: [25.4858, 42.7339],
    zoom: 7,
  })

  map.addControl(new maplibregl.NavigationControl(), 'top-right')

  // ClientOnly / route layout can leave the canvas at 0×0 until measured again
  map.once('load', () => {
    map?.resize()
  })
  requestAnimationFrame(() => {
    map?.resize()
  })
})

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
