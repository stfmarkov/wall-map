<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'ghost'
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
  }>(),
  {
    variant: 'primary',
    type: 'button',
    disabled: false,
  },
)
</script>

<template>
  <button
    :type="type"
    class="ui-button"
    :class="variant"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
.ui-button {
  appearance: none;
  border-radius: 8px;
  padding: 0.7rem 0.9rem;
  font: inherit;
  font-size: 0.95rem;
  cursor: pointer;
  width: 100%;
}

.primary {
  border: none;
  background: #c4d4a8;
  color: #12161c;
  font-weight: 600;
}

.primary:hover:not(:disabled) {
  background: #d2e0b8;
}

.ghost {
  border: 1px solid #3a433c;
  background: transparent;
  color: inherit;
}

.ghost:hover:not(:disabled) {
  border-color: #5a655c;
}

.ui-button:disabled {
  opacity: 0.6;
  cursor: wait;
}
</style>
