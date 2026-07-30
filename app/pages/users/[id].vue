<script setup lang="ts">
import type { MapFiltersSelection } from '~/types/mapFilters'
import { emptyMapFilters } from '~/types/mapFilters'

const route = useRoute()
const mapWall = useMapWallStore()

const {
  profile,
  routes,
  pois,
  status,
  error,
  isOwner,
  hasMapContent,
  ownerId,
} = storeToRefs(mapWall)

const userId = computed(() => String(route.params.id ?? ''))
const pinDropActive = ref(false)
const placing = ref(false)
const placeMessage = ref('')
const placeError = ref('')

const mapFilters = ref<MapFiltersSelection>(emptyMapFilters())

const filteredRoutes = computed(() => {
  if (mapFilters.value.contentType === 'poi') return []
  return routes.value.filter((entry) =>
    (!mapFilters.value.country || entry.country === mapFilters.value.country)
    && (!mapFilters.value.region || entry.region === mapFilters.value.region)
    && (!mapFilters.value.transport || entry.transport === mapFilters.value.transport)
    && (!mapFilters.value.difficulty || entry.difficulty === mapFilters.value.difficulty)
    && (!mapFilters.value.surface || entry.surface === mapFilters.value.surface),
  )
})

const filteredPois = computed(() => {
  if (mapFilters.value.contentType === 'route') return []
  return pois.value.filter((entry) =>
    (!mapFilters.value.country || entry.country === mapFilters.value.country)
    && (!mapFilters.value.region || entry.region === mapFilters.value.region),
  )
})

await mapWall.loadWall(userId.value)

watch(userId, (id) => {
  pinDropActive.value = false
  placeMessage.value = ''
  placeError.value = ''
  mapFilters.value = emptyMapFilters()
  void mapWall.loadWall(id)
})

const emptyEyebrow = computed(() => (isOwner.value ? 'Your wall' : 'This wall'))
const emptyCopy = computed(() =>
  isOwner.value
    ? 'No routes or places yet. Upload a GPX track or pin a point of interest to start the map.'
    : 'No routes or places on this map yet.',
)

const onRouteUploaded = async () => {
  pinDropActive.value = false
  await mapWall.refreshRoutes()
}

const onTogglePinDrop = () => {
  if (!isOwner.value) return
  placeMessage.value = ''
  placeError.value = ''
  pinDropActive.value = !pinDropActive.value
}

const onRouteSelect = (id: string) => {
  if (pinDropActive.value) return
  void navigateTo(`/routes/${id}`)
}

const onPoiSelect = (id: string) => {
  if (pinDropActive.value) return
  void navigateTo(`/pois/${id}`)
}

const onPlace = async (coords: { lng: number; lat: number }) => {
  if (!isOwner.value || !pinDropActive.value || placing.value) return

  placing.value = true
  placeMessage.value = ''
  placeError.value = ''

  try {
    const result = await $fetch<{
      poi: { id: string; name: string }
    }>('/api/poi', {
      method: 'POST',
      body: {
        lng: coords.lng,
        lat: coords.lat,
      },
    })

    placeMessage.value = `Saved “${result.poi.name}”`
    pinDropActive.value = false
    await mapWall.refreshPois()
  }
  catch (err: unknown) {
    const errorInfo = err as {
      data?: { statusMessage?: string }
      statusMessage?: string
      message?: string
    }
    placeError.value
      = errorInfo.data?.statusMessage
        || errorInfo.statusMessage
        || errorInfo.message
        || 'Failed to place pin'
  }
  finally {
    placing.value = false
  }
}
</script>

<template>
  <AuthShell
    v-if="status === 'pending' || status === 'idle'"
    eyebrow="Wall Map"
    title="Loading map…"
    lede="Fetching this traveler’s profile."
  />

  <AuthShell
    v-else-if="error"
    eyebrow="Wall Map"
    title="Something went wrong"
    lede="We couldn’t load this profile right now."
  >
    <UiMessage variant="error">{{ error.message }}</UiMessage>
    <div class="shell-actions">
      <UiButton variant="ghost" @click="mapWall.refresh()">
        Try again
      </UiButton>
    </div>
    <template #footer>
      <NuxtLink to="/">Back to map</NuxtLink>
    </template>
  </AuthShell>

  <AuthShell
    v-else-if="!profile"
    eyebrow="Wall Map"
    title="Profile not found"
    lede="This traveler doesn’t have a public map yet."
  >
    <template #footer>
      <NuxtLink to="/">Back to map</NuxtLink>
    </template>
  </AuthShell>

  <div v-else class="profile">
    <MapTopBar
      :username="profile.username"
      :show-edit-profile="isOwner"
      :show-drop-pin="isOwner"
      :pin-drop-active="pinDropActive"
      @uploaded="onRouteUploaded"
      @toggle-pin-drop="onTogglePinDrop"
    />

    <MapFilters
      v-if="ownerId"
      v-model:filters="mapFilters"
      :owner-id="ownerId"
    />

    <p v-if="placeError" class="place-status place-error" role="status">{{ placeError }}</p>
    <p v-else-if="placeMessage" class="place-status place-ok" role="status">{{ placeMessage }}</p>
    <p v-else-if="placing" class="place-status place-ok" role="status">Saving pin…</p>

    <div class="map-slot">
      <ClientOnly>
        <MapView
          :routes="filteredRoutes"
          :pois="filteredPois"
          :pin-drop-active="pinDropActive"
          @select="onRouteSelect"
          @select-poi="onPoiSelect"
          @place="onPlace"
        />
        <template #fallback>
          <div class="map-fallback">Loading map…</div>
        </template>
      </ClientOnly>
    </div>

    <aside v-if="!hasMapContent" class="empty-state">
      <p class="eyebrow">{{ emptyEyebrow }}</p>
      <p class="empty-copy">{{ emptyCopy }}</p>
    </aside>
  </div>
</template>

<style scoped>
.shell-actions {
  margin-top: 1rem;
}

.profile {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100dvh;
  overflow: hidden;
  color: #e8e4dc;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.map-slot {
  position: absolute;
  inset: 0;
}

.place-status {
  position: absolute;
  z-index: 3;
  top: 7.25rem;
  right: 50px;
  margin: 0;
  max-width: min(100% - 4rem, 24rem);
  padding: 0.4rem 0.65rem;
  border-radius: 8px;
  border: 1px solid rgb(155 176 154 / 35%);
  background: rgb(18 22 28 / 90%);
  font-size: 0.8rem;
  line-height: 1.35;
}

.place-ok {
  color: #c4d4a8;
}

.place-error {
  color: #e8b4b4;
  border-color: rgb(200 120 120 / 45%);
}

.empty-state {
  position: absolute;
  z-index: 2;
  left: 1rem;
  bottom: 1.25rem;
  width: min(100% - 2rem, 20rem);
  padding: 1rem 1.1rem;
  border: 1px solid #3a433c;
  border-radius: 10px;
  background: rgb(18 22 28 / 82%);
  backdrop-filter: blur(8px);
  pointer-events: none;
}

.eyebrow {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #9bb09a;
}

.empty-copy {
  margin: 0.35rem 0 0;
  line-height: 1.45;
  color: #b7b2a8;
  font-size: 0.9rem;
}

.map-fallback {
  display: grid;
  place-items: center;
  min-height: 100dvh;
  background: #12161c;
  color: #9aa39a;
  font-family: 'Segoe UI', system-ui, sans-serif;
}
</style>
