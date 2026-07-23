<script setup lang="ts">
const model = defineModel<string>({ required: true })

withDefaults(
  defineProps<{
    label: string
    name?: string
    rows?: number
    maxlength?: number | string
    required?: boolean
    disabled?: boolean
    placeholder?: string
  }>(),
  {
    rows: 4,
    required: false,
    disabled: false,
  },
)
</script>

<template>
  <label class="field">
    <span>{{ label }}</span>
    <textarea
      v-model="model"
      :name="name"
      :rows="rows"
      :maxlength="maxlength"
      :required="required"
      :disabled="disabled"
      :placeholder="placeholder"
    />
  </label>
</template>

<style scoped>
.field {
  display: grid;
  gap: 0.4rem;
  font-size: 0.85rem;
}

.field textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #3a433c;
  border-radius: 8px;
  background: #1a201c;
  color: inherit;
  padding: 0.7rem 0.8rem;
  font: inherit;
  font-size: 1rem;
  line-height: 1.45;
  resize: vertical;
  min-height: 6rem;
}

.field textarea:focus {
  outline: 2px solid #6f8f72;
  outline-offset: 1px;
}
</style>
