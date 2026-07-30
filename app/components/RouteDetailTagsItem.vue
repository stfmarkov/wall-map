<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    compact?: boolean
  }>(),
  {
    compact: false,
  },
)
</script>

<template>
  <li
    class="tag"
    :class="{ compact }"
  >
    {{ label }}
  </li>
</template>

<style scoped>
.tag {
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  border: 1px solid rgb(155 176 154 / 40%);
  background: rgb(40 52 42 / 55%);
  color: #c4d4a8;
  font-size: 0.8rem;
  line-height: 1.3;
}

.tag.compact {
  padding: 0.1rem 0.35rem;
  font-size: 0.65rem;
  border-radius: 4px;
}
</style>
