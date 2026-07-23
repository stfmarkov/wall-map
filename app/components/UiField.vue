<script setup lang="ts">
const model = defineModel<string>({ required: true })

withDefaults(
  defineProps<{
    label: string
    type?: string
    name?: string
    autocomplete?: string
    inputmode?: 'text' | 'email' | 'numeric' | 'tel' | 'url' | 'search' | 'none' | 'decimal'
    pattern?: string
    maxlength?: number | string
    required?: boolean
    disabled?: boolean
    placeholder?: string
  }>(),
  {
    type: 'text',
    required: false,
    disabled: false,
  },
)
</script>

<template>
  <label class="field">
    <span>{{ label }}</span>
    <input
      v-model="model"
      :type="type"
      :name="name"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :pattern="pattern"
      :maxlength="maxlength"
      :required="required"
      :disabled="disabled"
      :placeholder="placeholder"
    >
  </label>
</template>

<style scoped>
.field {
  display: grid;
  gap: 0.4rem;
  font-size: 0.85rem;
}

.field input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #3a433c;
  border-radius: 8px;
  background: #1a201c;
  color: inherit;
  padding: 0.7rem 0.8rem;
  font: inherit;
  font-size: 1rem;
}

.field input:focus {
  outline: 2px solid #6f8f72;
  outline-offset: 1px;
}
</style>
