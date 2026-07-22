<script setup lang="ts">
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

const container = ref<HTMLElement | null>(null)
let map: maplibregl.Map | null = null

onMounted(() => {
  if (!container.value) return

  map = new maplibregl.Map({
    container: container.value,
    style: OPENFREEMAP_STYLE,
    center: [25.4858, 42.7339],
    zoom: 7,
  })

  map.addControl(new maplibregl.NavigationControl(), 'top-right')
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
  width: 100%;
  height: 100%;
  min-height: 100dvh;
}
</style>
