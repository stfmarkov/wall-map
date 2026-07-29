<script setup lang="ts">
import type { EntityPhoto } from '~/types/entityPhoto'

defineProps<{
  photo: EntityPhoto
}>()
</script>

<template>
  <li class="item">
    <img
      v-if="photo.displayUrl"
      :src="photo.displayUrl"
      alt=""
      class="image"
      loading="lazy"
    >
    <div v-else class="image image-fallback" aria-hidden="true" />
  </li>
</template>

<style scoped>
.item {
  list-style: none;
}

.image {
  display: block;
  width: 100%;
  max-height: 28rem;
  object-fit: contain;
  object-position: center;
  border-radius: 8px;
  border: 1px solid #3a433c;
  background: #1a201c;
}

.image-fallback {
  aspect-ratio: 4 / 3;
}
</style>
