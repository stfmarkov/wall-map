<script setup lang="ts">
const route = useRoute()
const user = useSupabaseUser()
const mapWall = useMapWallStore()
const { pois, ownerId, isOwner } = storeToRefs(mapWall)

const poiId = computed(() => String(route.params.id ?? ''))

await mapWall.ensurePoiLoaded(poiId.value)

watch(poiId, (id) => {
  void mapWall.ensurePoiLoaded(id)
})

const mapPoi = computed(() =>
  pois.value.find((entry) => entry.id === poiId.value) ?? null,
)

const mapPois = computed(() => (mapPoi.value ? [mapPoi.value] : []))

const backPath = computed(() => {
  const owner = mapPoi.value?.owner_id || ownerId.value
  return owner ? `/users/${owner}` : '/'
})

const editPath = computed(() => `/pois/${poiId.value}/edit`)

const canEdit = computed(() => {
  if (!user.value || !mapPoi.value) return false
  if (mapPoi.value.owner_id) return user.value.sub === mapPoi.value.owner_id
  return isOwner.value
})
</script>

<template>
  <EntityDetailLayout
    :back-path="backPath"
    map-label="Point of interest map"
    details-label="Point of interest details"
  >
    <template #map>
      <ClientOnly>
        <MapView :pois="mapPois" :country="mapPoi?.country" :region="mapPoi?.region" />
        <template #fallback>
          <div class="map-fallback">Loading map…</div>
        </template>
      </ClientOnly>
    </template>

    <template #actions>
      <NuxtLink v-if="canEdit" :to="editPath" class="edit-btn">
        Edit
      </NuxtLink>
    </template>

    <template v-if="mapPoi">
      <h1 class="title">{{ mapPoi.name }}</h1>

      <dl class="fields">
        <div class="field">
          <dt>Country:</dt>
          <dd>{{ mapPoi.country || '—' }}</dd>
        </div>
        <div class="field">
          <dt>Region:</dt>
          <dd>{{ mapPoi.region || '—' }}</dd>
        </div>
      </dl>
      <p v-if="mapPoi.description" class="description">{{ mapPoi.description }}</p>
      <p v-else class="description muted">No description yet.</p>
      <EntityPhotosGallery parent="poi" :parent-id="poiId" />
    </template>

    <p v-else class="placeholder">
      Point of interest not found or not available.
    </p>
  </EntityDetailLayout>
</template>
