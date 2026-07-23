<script setup lang="ts">
defineProps<{
  variant: 'info' | 'error'
}>()
</script>

<template>
  <p class="message" :class="variant" :role="variant === 'error' ? 'alert' : undefined">
    <slot />
  </p>
</template>

<style scoped>
.message {
  margin: 0;
  font-size: 0.9rem;
}

.info {
  color: #9bb09a;
}

.error {
  color: #e8a090;
}
</style>
