<script setup lang="ts">
import type { EntityPhoto } from '~/types/entityPhoto'

defineProps<{
  photo: EntityPhoto
  removing: boolean
}>()

const emit = defineEmits<{
  remove: []
}>()
</script>

<template>
  <li class="item">
    <img
      v-if="photo.thumbUrl"
      :src="photo.thumbUrl"
      alt=""
      class="thumb"
    >
    <div v-else class="thumb thumb-fallback" aria-hidden="true" />
    <button
      type="button"
      class="remove"
      :class="{ removing }"
      :disabled="removing"
      :aria-label="removing ? 'Removing photo' : 'Remove photo'"
      @click="emit('remove')"
    >
      <IconsClose
        v-if="!removing"
        class="icon"
      />
      <IconsRefresh
        v-else
        class="icon spin"
      />
    </button>
  </li>
</template>

<style scoped>
.item {
  position: relative;
  list-style: none;
}

.thumb {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #3a433c;
  background: #1a201c;
}

.thumb-fallback {
  min-height: 0;
}

.remove {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: #b33a3a;
  color: #f5f0e8;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.item:hover .remove,
.remove.removing {
  opacity: 1;
}

.remove.removing {
  cursor: wait;
}

.icon {
  display: block;
  width: 0.9rem;
  height: 0.9rem;
}

.icon.spin {
  animation: rotate 0.7s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.remove:disabled {
  cursor: wait;
}
</style>
