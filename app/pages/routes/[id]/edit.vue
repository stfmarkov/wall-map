<script setup lang="ts">
import {
  isRouteDifficulty,
  isRouteSurface,
  isRouteTransport,
  routeDifficultyOptions,
  routeSurfaceOptions,
  routeTransportOptions,
  withUnsetOption,
} from '~/types/routeDetails'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const user = useSupabaseUser()
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

const name = ref('')
const description = ref('')
const transport = ref('')
const difficulty = ref('')
const surface = ref('')
const pending = ref(false)
const errorMessage = ref('')

const transportSelectOptions = withUnsetOption(routeTransportOptions())
const difficultySelectOptions = withUnsetOption(routeDifficultyOptions())
const surfaceSelectOptions = withUnsetOption(routeSurfaceOptions())

const detailPath = computed(() => `/routes/${routeId.value}`)
const backPath = computed(() => {
  const owner = mapRoute.value?.owner_id || ownerId.value
  return owner ? `/users/${owner}` : '/'
})

const canEdit = computed(() => {
  if (!user.value || !mapRoute.value) return false
  if (mapRoute.value.owner_id) return user.value.sub === mapRoute.value.owner_id
  return isOwner.value
})

const placeLabel = computed(() => {
  const parts = [mapRoute.value?.region, mapRoute.value?.country].filter(Boolean)
  return parts.length ? parts.join(', ') : null
})

const hydrateForm = () => {
  name.value = mapRoute.value?.name ?? ''
  description.value = mapRoute.value?.description ?? ''
  transport.value = mapRoute.value?.transport ?? ''
  difficulty.value = mapRoute.value?.difficulty ?? ''
  surface.value = mapRoute.value?.surface ?? ''
  errorMessage.value = ''
}

watch(mapRoute, () => {
  hydrateForm()
}, { immediate: true })

const save = async () => {
  errorMessage.value = ''

  if (!canEdit.value) {
    errorMessage.value = 'You can only edit your own routes.'
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
    await mapWall.updateRouteMeta(routeId.value, {
      name: trimmedName,
      description: description.value.trim() || null,
      transport: isRouteTransport(transport.value) ? transport.value : null,
      difficulty: isRouteDifficulty(difficulty.value) ? difficulty.value : null,
      surface: isRouteSurface(surface.value) ? surface.value : null,
    })
    await navigateTo(detailPath.value)
  }
  catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to save route'
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
      <h1 class="title">Edit route</h1>
    </header>

    <AuthShell
      v-if="!mapRoute"
      eyebrow="Wall Map"
      title="Route not found"
      lede="This route isn’t available — it may be private or removed."
    >
      <template #footer>
        <NuxtLink :to="backPath">Back to map</NuxtLink>
      </template>
    </AuthShell>

    <AuthShell
      v-else-if="!canEdit"
      eyebrow="Wall Map"
      title="Can’t edit this route"
      lede="Only the owner can change route details."
    >
      <template #footer>
        <NuxtLink :to="detailPath">Back to route</NuxtLink>
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
          placeholder="Route name"
        />

        <UiTextarea
          v-model="description"
          label="Description"
          name="description"
          maxlength="5000"
          :rows="6"
          placeholder="Notes about this trip…"
        />

        <div class="detail-selects">
          <UiSelect
            v-model="transport"
            label="Transport"
            :options="transportSelectOptions"
          />
          <UiSelect
            v-model="difficulty"
            label="Difficulty"
            :options="difficultySelectOptions"
          />
          <UiSelect
            v-model="surface"
            label="Surface"
            :options="surfaceSelectOptions"
          />
        </div>

        <p class="place-readonly">
          <span class="place-label">Location</span>
          <span>{{ placeLabel || '—' }}</span>
        </p>

        <p class="hint">
          Country and region come from the GPX start point (used for map zoom). Geometry and distance stay tied to the file.
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
        parent="route"
        :parent-id="routeId"
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

.detail-selects {
  display: grid;
  gap: 0.75rem;
}

@media (min-width: 40rem) {
  .detail-selects {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
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
