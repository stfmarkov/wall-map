<script setup lang="ts">
import type { RouteDifficulty, RouteSurface, RouteTransport } from '~/types/routeDetails'

const props = defineProps<{
  name: string
  description?: string | null
  thumbUrl?: string | null
  transport?: RouteTransport | null
  difficulty?: RouteDifficulty | null
  surface?: RouteSurface | null
}>()

const DESCRIPTION_PREVIEW_LENGTH = 15

const descriptionPreview = computed(() => {
  const text = props.description?.trim()
  if (!text) return null
  if (text.length <= DESCRIPTION_PREVIEW_LENGTH) return text
  return `${text.slice(0, DESCRIPTION_PREVIEW_LENGTH)}…`
})
</script>

<template>
  <div class="hover-card" role="tooltip">
    <img
      v-if="thumbUrl"
      :src="thumbUrl"
      alt=""
      class="thumb"
    >
    <div class="copy">
      <p class="name">{{ name }}</p>
      <RouteDetailTags
        :transport="transport"
        :difficulty="difficulty"
        :surface="surface"
        compact
      />
      <p v-if="descriptionPreview" class="description">{{ descriptionPreview }}</p>
    </div>
  </div>
</template>

<style scoped>
.hover-card {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  max-width: 16rem;
  padding: 0.4rem 0.55rem;
  border: 1px solid #3a433c;
  border-radius: 8px;
  background: rgb(18 22 28 / 92%);
  color: #e8e4dc;
  box-shadow: 0 8px 24px rgb(0 0 0 / 35%);
  pointer-events: none;
}

.thumb {
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #2a322c;
  background: #1a201c;
}

.copy {
  min-width: 0;
  display: grid;
  gap: 0.15rem;
}

.name {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 650;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.description {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.3;
  color: #b7b2a8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
