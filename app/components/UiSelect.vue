<script setup lang="ts">
import type { ComboboxOption } from '~/types/mapFilters'

const model = defineModel<string>({ required: true })

withDefaults(
  defineProps<{
    label: string
    options: ComboboxOption[]
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)
</script>

<template>
  <label class="field">
    <span>{{ label }}</span>
    <select
      v-model="model"
      :disabled="disabled"
    >
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
  </label>
</template>

<style scoped>
.field {
  display: grid;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: #b7b2a8;
  min-width: 9.5rem;
}

.field select {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid rgb(155 176 154 / 45%);
  border-radius: 8px;
  background: rgb(18 22 28 / 82%);
  color: #e8e4dc;
  padding: 0.45rem 0.65rem;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}

.field select:focus {
  outline: 2px solid #6f8f72;
  outline-offset: 1px;
}

.field select:disabled {
  opacity: 0.6;
  cursor: wait;
}
</style>
