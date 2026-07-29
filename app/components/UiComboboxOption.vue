<script setup lang="ts">
import type { ComboboxOption } from '~/types/mapFilters'

const props = defineProps<{
  option: ComboboxOption
  active: boolean
}>()

const emit = defineEmits<{
  select: [option: ComboboxOption]
}>()

const onMouseDown = (event: MouseEvent) => {
  event.preventDefault()
  emit('select', props.option)
}
</script>

<template>
  <li
    role="option"
    :aria-selected="active"
    class="option"
    :class="{ active }"
    @mousedown="onMouseDown"
  >
    {{ option.label }}
  </li>
</template>

<style scoped>
.option {
  padding: 0.4rem 0.55rem;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #e8e4dc;
  cursor: pointer;
}

.option.active,
.option:hover {
  background: rgb(40 52 42 / 85%);
  color: #c4d4a8;
}
</style>
