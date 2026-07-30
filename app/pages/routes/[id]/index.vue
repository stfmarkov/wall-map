<script setup lang="ts">
import type { Database } from '~/types/database.types'
import { formatDistanceKm, gpxDownloadFilename } from '~/utils/mapRoute'

const route = useRoute()
const user = useSupabaseUser()
const supabase = useSupabaseClient<Database>()
const mapWall = useMapWallStore()
const { routes, ownerId, isOwner } = storeToRefs(mapWall)

const routeId = computed(() => String(route.params.id ?? ''))

await mapWall.ensureRouteLoaded(routeId.value)

watch(routeId, (id) => {
  void mapWall.ensureRouteLoaded(id)
})

const mapRoute = computed(() =>
  routes.value.find((entry) => entry.id === routeId.value) ?? null,
)

const mapRoutes = computed(() => (mapRoute.value ? [mapRoute.value] : []))

const distanceLabel = computed(() => formatDistanceKm(mapRoute.value?.distance_m))

const backPath = computed(() => {
  const owner = mapRoute.value?.owner_id || ownerId.value
  return owner ? `/users/${owner}` : '/'
})

const editPath = computed(() => `/routes/${routeId.value}/edit`)

const canEdit = computed(() => {
  if (!user.value || !mapRoute.value) return false
  if (mapRoute.value.owner_id) return user.value.sub === mapRoute.value.owner_id
  return isOwner.value
})

const canDownload = computed(() => Boolean(mapRoute.value?.gpx_path))
const downloading = ref(false)
const downloadError = ref('')

const downloadGpx = async () => {
  const current = mapRoute.value
  if (!current?.gpx_path) return

  downloading.value = true
  downloadError.value = ''

  try {
    const { data, error } = await supabase.storage
      .from('gpx')
      .download(current.gpx_path)

    if (error) throw error

    const url = URL.createObjectURL(data)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = gpxDownloadFilename(current.name)
    anchor.click()
    URL.revokeObjectURL(url)
  }
  catch (err) {
    downloadError.value = err instanceof Error ? err.message : 'Download failed'
  }
  finally {
    downloading.value = false
  }
}
</script>

<template>
  <EntityDetailLayout
    :back-path="backPath"
    map-label="Route map"
    details-label="Route details"
  >
    <template #map>
      <ClientOnly>
        <MapView :routes="mapRoutes" :country="mapRoute?.country" :region="mapRoute?.region" />
        <template #fallback>
          <div class="map-fallback">Loading map…</div>
        </template>
      </ClientOnly>
    </template>

    <template #actions>
      <button
        v-if="canDownload"
        type="button"
        class="edit-btn"
        :disabled="downloading"
        @click="downloadGpx"
      >
        {{ downloading ? 'Downloading…' : 'Download GPX' }}
      </button>
      <NuxtLink v-if="canEdit" :to="editPath" class="edit-btn">
        Edit
      </NuxtLink>
    </template>

    <template v-if="mapRoute">
      <h1 class="title">{{ mapRoute.name }}</h1>

      <RouteDetailTags
        class="detail-tags"
        :transport="mapRoute.transport"
        :difficulty="mapRoute.difficulty"
        :surface="mapRoute.surface"
      />

      <dl class="fields">
        <div class="field">
          <dt>Country:</dt>
          <dd>{{ mapRoute.country || '—' }}</dd>
        </div>
        <div class="field">
          <dt>Region:</dt>
          <dd>{{ mapRoute.region || '—' }}</dd>
        </div>
        <div class="field">
          <dt>Distance:</dt>
          <dd>{{ distanceLabel || '—' }}</dd>
        </div>
      </dl>
      <p v-if="mapRoute.description" class="description">{{ mapRoute.description }}</p>
      <p v-else class="description muted">No description yet.</p>
      <EntityPhotosGallery parent="route" :parent-id="routeId" />
      <p v-if="downloadError" class="download-error" role="alert">{{ downloadError }}</p>
    </template>

    <p v-else class="placeholder">
      Route not found or not available.
    </p>
  </EntityDetailLayout>
</template>
