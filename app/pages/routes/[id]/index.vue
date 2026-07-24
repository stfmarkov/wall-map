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
  <div class="detail">
    <section class="map-pane" aria-label="Route map">
      <ClientOnly>
        <MapView :routes="mapRoutes" :country="mapRoute?.country" :region="mapRoute?.region" />
        <template #fallback>
          <div class="map-fallback">Loading map…</div>
        </template>
      </ClientOnly>
    </section>

    <section class="details-pane" aria-label="Route details">
      <div class="details-header">
        <NuxtLink :to="backPath" class="back-link">← Back</NuxtLink>
        <div class="header-actions">
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
        </div>
      </div>

      <template v-if="mapRoute">
        <h1 class="title">{{ mapRoute.name }}</h1>

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
        <p v-if="downloadError" class="download-error" role="alert">{{ downloadError }}</p>
      </template>

      <p v-else class="placeholder">
        Route not found or not available.
      </p>
    </section>
  </div>
</template>

<style scoped>
.detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100dvh;
  color: #e8e4dc;
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: #12161c;
}

.map-pane {
  position: relative;
  min-height: 50dvh;
  border-right: 1px solid #2a322c;
}

.details-pane {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem 1.75rem;
  overflow: auto;
}

.details-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.back-link {
  font-size: 0.85rem;
  color: #9bb09a;
  text-decoration: none;
}

.back-link:hover {
  color: #c4d4a8;
}

.edit-btn {
  appearance: none;
  flex-shrink: 0;
  border: 1px solid rgb(155 176 154 / 45%);
  background: rgb(18 22 28 / 55%);
  color: #e8e4dc;
  border-radius: 8px;
  padding: 0.45rem 0.85rem;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: none;
}

.edit-btn:hover:not(:disabled) {
  border-color: #9bb09a;
  background: rgb(18 22 28 / 75%);
}

.edit-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.download-error {
  margin: 0.5rem 0 0;
  font-size: 0.85rem;
  color: #e8a090;
}

.title {
  margin: 0;
  font-size: clamp(1.4rem, 2.5vw, 1.85rem);
  font-weight: 650;
  line-height: 1.25;
}

.fields {
  margin: 0;
  display: flex;
  gap: 0.85rem;
}

.field {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.description {
  margin: 0.25rem 0 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #d5d0c6;
  white-space: pre-wrap;
}

.description.muted {
  color: #8a857c;
}

.field dt {
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #9bb09a;
}

.field dd {
  margin: 0;
  font-size: 0.95rem;
  color: #d5d0c6;
}

.placeholder {
  margin: 0;
  color: #8a857c;
  font-size: 0.95rem;
}

.map-fallback {
  display: grid;
  place-items: center;
  height: 100%;
  min-height: 50dvh;
  background: #12161c;
  color: #9aa39a;
}

@media (max-width: 800px) {
  .detail {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(40dvh, 45dvh) 1fr;
  }

  .map-pane {
    border-right: none;
    border-bottom: 1px solid #2a322c;
  }
}
</style>
