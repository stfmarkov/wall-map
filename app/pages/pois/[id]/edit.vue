<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

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

const name = ref('')
const description = ref('')
const pending = ref(false)
const errorMessage = ref('')

const detailPath = computed(() => `/pois/${poiId.value}`)
const backPath = computed(() => {
  const owner = mapPoi.value?.owner_id || ownerId.value
  return owner ? `/users/${owner}` : '/'
})

const canEdit = computed(() => {
  if (!user.value || !mapPoi.value) return false
  if (mapPoi.value.owner_id) return user.value.sub === mapPoi.value.owner_id
  return isOwner.value
})

const placeLabel = computed(() => {
  const parts = [mapPoi.value?.region, mapPoi.value?.country].filter(Boolean)
  return parts.length ? parts.join(', ') : null
})

const hydrateForm = () => {
  name.value = mapPoi.value?.name ?? ''
  description.value = mapPoi.value?.description ?? ''
  errorMessage.value = ''
}

watch(mapPoi, () => {
  hydrateForm()
}, { immediate: true })

const save = async () => {
  errorMessage.value = ''

  if (!canEdit.value) {
    errorMessage.value = 'You can only edit your own points of interest.'
    return
  }

  const trimmedName = name.value.trim()
  if (!trimmedName) {
    errorMessage.value = 'Name is required.'
    return
  }

  if (trimmedName.length > 200) {
    errorMessage.value = 'Name must be 200 characters or fewer.'
    return
  }

  if (description.value.length > 5000) {
    errorMessage.value = 'Description must be 5000 characters or fewer.'
    return
  }

  pending.value = true
  try {
    await mapWall.updatePoiMeta(poiId.value, {
      name: trimmedName,
      description: description.value.trim() || null,
    })
    await navigateTo(detailPath.value)
  }
  catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to save point of interest'
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="edit">
    <header class="edit-header">
      <NuxtLink :to="detailPath" class="back-link">← Cancel</NuxtLink>
      <h1 class="title">Edit point of interest</h1>
    </header>

    <AuthShell
      v-if="!mapPoi"
      eyebrow="Wall Map"
      title="Point of interest not found"
      lede="This place isn’t available — it may be private or removed."
    >
      <template #footer>
        <NuxtLink :to="backPath">Back to map</NuxtLink>
      </template>
    </AuthShell>

    <AuthShell
      v-else-if="!canEdit"
      eyebrow="Wall Map"
      title="Can’t edit this place"
      lede="Only the owner can change point of interest details."
    >
      <template #footer>
        <NuxtLink :to="detailPath">Back to place</NuxtLink>
      </template>
    </AuthShell>

    <template v-else>
      <form class="form" @submit.prevent="save">
        <UiField
          v-model="name"
          label="Name"
          name="name"
          required
          maxlength="200"
          placeholder="Place name"
        />

        <UiTextarea
          v-model="description"
          label="Description"
          name="description"
          maxlength="5000"
          :rows="6"
          placeholder="Notes about this place…"
        />

        <p class="place-readonly">
          <span class="place-label">Location</span>
          <span>{{ placeLabel || '—' }}</span>
        </p>

        <p class="hint">
          Country and region come from the pin location (used for map zoom). The pin stays fixed for now.
        </p>

        <UiMessage v-if="errorMessage" variant="error">{{ errorMessage }}</UiMessage>

        <div class="actions">
          <UiButton type="submit" :disabled="pending">
            {{ pending ? 'Saving…' : 'Save' }}
          </UiButton>
          <UiButton type="button" variant="ghost" :disabled="pending" @click="navigateTo(detailPath)">
            Cancel
          </UiButton>
        </div>
      </form>

      <EntityPhotosEditor
        class="photos-block"
        parent="poi"
        :parent-id="poiId"
      />
    </template>
  </div>
</template>

<style scoped>
.edit {
  min-height: 100dvh;
  padding: 1.5rem 1.75rem 2.5rem;
  color: #e8e4dc;
  font-family: 'Segoe UI', system-ui, sans-serif;
  background:
    radial-gradient(ellipse 70% 40% at 100% 0%, #1a2a22 0%, transparent 55%),
    #12161c;
}

.edit-header {
  max-width: 36rem;
  margin: 0 auto 1.5rem;
}

.back-link {
  display: inline-block;
  margin-bottom: 0.75rem;
  font-size: 0.85rem;
  color: #9bb09a;
  text-decoration: none;
}

.back-link:hover {
  color: #c4d4a8;
}

.title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 650;
}

.form {
  max-width: 36rem;
  margin: 0 auto;
  display: grid;
  gap: 1rem;
}

.place-readonly {
  margin: 0;
  display: grid;
  gap: 0.35rem;
  font-size: 0.95rem;
  color: #d5d0c6;
}

.place-label {
  font-size: 0.85rem;
  color: #9bb09a;
}

.hint {
  margin: 0;
  font-size: 0.85rem;
  color: #8a857c;
}

.actions {
  display: grid;
  gap: 0.65rem;
  margin-top: 0.35rem;
}

.photos-block {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #2a322c;
}
</style>
