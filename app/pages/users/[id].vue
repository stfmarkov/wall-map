<script setup lang="ts">
const route = useRoute()
const mapWall = useMapWallStore()

const {
  profile,
  routes,
  status,
  error,
  isOwner,
  hasMapContent,
} = storeToRefs(mapWall)

const userId = computed(() => String(route.params.id ?? ''))

await mapWall.loadWall(userId.value)

watch(userId, (id) => {
  void mapWall.loadWall(id)
})

const emptyEyebrow = computed(() => (isOwner.value ? 'Your wall' : 'This wall'))
const emptyCopy = computed(() =>
  isOwner.value
    ? 'No routes or places yet. Upload a GPX track or pin a point of interest to start the map.'
    : 'No routes or places on this map yet.',
)

const onRouteUploaded = async () => {
  await mapWall.refreshRoutes()
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
      @uploaded="onRouteUploaded"
    />

    <div class="map-slot">
      <ClientOnly>
        <MapView :routes="routes" />
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
