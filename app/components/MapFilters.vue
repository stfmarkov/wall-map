<script setup lang="ts">
import type { Database } from '~/types/database.types'
import type { ComboboxOption, MapContentTypeFilter, MapFiltersSelection } from '~/types/mapFilters'
import { emptyMapFilters } from '~/types/mapFilters'
import {
  isRouteDifficulty,
  isRouteSurface,
  isRouteTransport,
  routeDifficultyOptions,
  routeSurfaceOptions,
  routeTransportOptions,
  withAllOption,
} from '~/types/routeDetails'

const props = defineProps<{
  ownerId: string
}>()

const filters = defineModel<MapFiltersSelection>('filters', { required: true })

const CONTENT_TYPE_OPTIONS: ComboboxOption[] = [
  { value: 'both', label: 'Both' },
  { value: 'route', label: 'Routes' },
  { value: 'poi', label: 'POIs' },
]

const transportFilterOptions = withAllOption(routeTransportOptions())
const difficultyFilterOptions = withAllOption(routeDifficultyOptions())
const surfaceFilterOptions = withAllOption(routeSurfaceOptions())

const supabase = useSupabaseClient<Database>()

const countryQuery = ref('')
const regionQuery = ref('')

const countryOptions = ref<ComboboxOption[]>([])
const regionOptions = ref<ComboboxOption[]>([])

const toOptions = (values: string[]): ComboboxOption[] =>
  values.map((value) => ({ value, label: value }))

const countryCache = useFilterOptionCache(async (query) => {
  const { data, error } = await supabase.rpc('search_map_countries', {
    p_owner_id: props.ownerId,
    p_query: query,
  })
  if (error) throw error
  return (data ?? []).map((row) => row.value).filter(Boolean)
})
const countryLoading = countryCache.loading

const regionCache = useFilterOptionCache(async (query) => {
  const { data, error } = await supabase.rpc('search_map_regions', {
    p_owner_id: props.ownerId,
    p_query: query,
  })
  if (error) throw error
  return (data ?? []).map((row) => row.value).filter(Boolean)
})
const regionLoading = regionCache.loading

const patchFilters = (patch: Partial<MapFiltersSelection>) => {
  filters.value = { ...filters.value, ...patch }
}

const onCountrySelected = (value: string | null) => {
  patchFilters({ country: value })
}

const onRegionSelected = (value: string | null) => {
  patchFilters({ region: value })
}

const onTypeSelected = (value: string) => {
  const contentType: MapContentTypeFilter =
    value === 'route' || value === 'poi' || value === 'both' ? value : 'both'
  patchFilters({ contentType })
}

const onTransportSelected = (value: string) => {
  patchFilters({
    transport: isRouteTransport(value) ? value : null,
  })
}

const onDifficultySelected = (value: string) => {
  patchFilters({
    difficulty: isRouteDifficulty(value) ? value : null,
  })
}

const onSurfaceSelected = (value: string) => {
  patchFilters({
    surface: isRouteSurface(value) ? value : null,
  })
}

watch(countryQuery, async (query) => {
  try {
    countryOptions.value = toOptions(await countryCache.sync(query))
  }
  catch {
    countryOptions.value = []
  }
})

watch(regionQuery, async (query) => {
  try {
    regionOptions.value = toOptions(await regionCache.sync(query))
  }
  catch {
    regionOptions.value = []
  }
})

watch(
  () => props.ownerId,
  () => {
    countryCache.clear()
    regionCache.clear()
    countryOptions.value = []
    regionOptions.value = []
    countryQuery.value = filters.value.country ?? ''
    regionQuery.value = filters.value.region ?? ''
  },
)

const clearAll = () => {
  filters.value = emptyMapFilters()
  countryQuery.value = ''
  regionQuery.value = ''
  countryOptions.value = []
  regionOptions.value = []
  countryCache.clear()
  regionCache.clear()
}

const hasActiveFilters = computed(() =>
  Boolean(
    filters.value.country
    || filters.value.region
    || filters.value.contentType !== 'both'
    || filters.value.transport
    || filters.value.difficulty
    || filters.value.surface,
  ),
)

const onCountryClear = () => {
  countryOptions.value = []
}

const onRegionClear = () => {
  regionOptions.value = []
}
</script>

<template>
  <div class="map-filters">
    <UiCombobox
      v-model:query="countryQuery"
      :selected="filters.country"
      label="Country"
      placeholder="Search country…"
      :options="countryOptions"
      :loading="countryLoading"
      @update:selected="onCountrySelected"
      @clear="onCountryClear"
    />
    <UiCombobox
      v-model:query="regionQuery"
      :selected="filters.region"
      label="Region"
      placeholder="Search region…"
      :options="regionOptions"
      :loading="regionLoading"
      @update:selected="onRegionSelected"
      @clear="onRegionClear"
    />
    <UiSelect
      :model-value="filters.contentType"
      label="Type"
      :options="CONTENT_TYPE_OPTIONS"
      @update:model-value="onTypeSelected"
    />
    <UiSelect
      :model-value="filters.transport ?? ''"
      label="Transport"
      :options="transportFilterOptions"
      @update:model-value="onTransportSelected"
    />
    <UiSelect
      :model-value="filters.difficulty ?? ''"
      label="Difficulty"
      :options="difficultyFilterOptions"
      @update:model-value="onDifficultySelected"
    />
    <UiSelect
      :model-value="filters.surface ?? ''"
      label="Surface"
      :options="surfaceFilterOptions"
      @update:model-value="onSurfaceSelected"
    />
    <button
      v-if="hasActiveFilters"
      type="button"
      class="clear-all"
      @click="clearAll"
    >
      Clear filters
    </button>
  </div>
</template>

<style scoped>
.map-filters {
  position: absolute;
  z-index: 3;
  top: 3.75rem;
  left: 1rem;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.65rem;
  max-width: min(100% - 2rem, 52rem);
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  border: 1px solid rgb(155 176 154 / 30%);
  background: rgb(18 22 28 / 82%);
  backdrop-filter: blur(8px);
  color: #e8e4dc;
  font-family: 'Segoe UI', system-ui, sans-serif;
  pointer-events: auto;
}

.clear-all {
  appearance: none;
  align-self: flex-end;
  border: 1px solid rgb(155 176 154 / 45%);
  background: rgb(18 22 28 / 55%);
  color: #e8e4dc;
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  margin-bottom: 0.05rem;
}

.clear-all:hover {
  border-color: #9bb09a;
  background: rgb(18 22 28 / 75%);
}
</style>
