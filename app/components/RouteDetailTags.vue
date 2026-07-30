<script setup lang="ts">
import type { RouteDifficulty, RouteSurface, RouteTransport } from '~/types/routeDetails'
import { routeDetailTagLabels } from '~/types/routeDetails'

const props = withDefaults(
  defineProps<{
    transport?: RouteTransport | null
    difficulty?: RouteDifficulty | null
    surface?: RouteSurface | null
    compact?: boolean
  }>(),
  {
    transport: null,
    difficulty: null,
    surface: null,
    compact: false,
  },
)

const labels = computed(() =>
  routeDetailTagLabels({
    transport: props.transport,
    difficulty: props.difficulty,
    surface: props.surface,
  }),
)
</script>

<template>
  <ul
    v-if="labels.length"
    class="tags"
    :class="{ compact }"
  >
    <RouteDetailTagsItem
      v-for="label in labels"
      :key="label"
      :label="label"
      :compact="compact"
    />
  </ul>
</template>

<style scoped>
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tags.compact {
  gap: 0.25rem;
}
</style>
