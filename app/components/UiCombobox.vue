<script setup lang="ts">
import type { ComboboxOption } from '~/types/mapFilters'

const query = defineModel<string>('query', { required: true })
const selected = defineModel<string | null>('selected', { default: null })

const props = withDefaults(
  defineProps<{
    label: string
    options: ComboboxOption[]
    placeholder?: string
    disabled?: boolean
    loading?: boolean
  }>(),
  {
    placeholder: '',
    disabled: false,
    loading: false,
  },
)

const emit = defineEmits<{
  clear: []
}>()

const open = ref(false)
const highlightIndex = ref(-1)
const root = ref<HTMLElement | null>(null)

const visibleOptions = computed(() => props.options.slice(0, 5))
const showList = computed(() => open.value && visibleOptions.value.length > 0)

const selectOption = (option: ComboboxOption) => {
  selected.value = option.value
  query.value = option.label
  open.value = false
  highlightIndex.value = -1
}

const clearSelection = () => {
  selected.value = null
  query.value = ''
  open.value = false
  highlightIndex.value = -1
  emit('clear')
}

const onInput = () => {
  if (selected.value !== null) {
    selected.value = null
  }
  open.value = true
  highlightIndex.value = visibleOptions.value.length > 0 ? 0 : -1
}

const onFocus = () => {
  open.value = true
}

const onBlur = (event: FocusEvent) => {
  const next = event.relatedTarget as Node | null
  if (root.value?.contains(next)) return
  open.value = false
  highlightIndex.value = -1
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    open.value = false
    highlightIndex.value = -1
    return
  }

  if (!showList.value) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    highlightIndex.value = Math.min(
      highlightIndex.value + 1,
      visibleOptions.value.length - 1,
    )
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    highlightIndex.value = Math.max(highlightIndex.value - 1, 0)
    return
  }

  if (event.key === 'Enter' && highlightIndex.value >= 0) {
    event.preventDefault()
    const option = visibleOptions.value[highlightIndex.value]
    if (option) selectOption(option)
  }
}

watch(visibleOptions, (opts) => {
  if (opts.length === 0) {
    highlightIndex.value = -1
    return
  }
  if (highlightIndex.value >= opts.length) {
    highlightIndex.value = opts.length - 1
  }
  if (open.value && highlightIndex.value < 0) {
    highlightIndex.value = 0
  }
})
</script>

<template>
  <div
    ref="root"
    class="combobox"
    @keydown="onKeydown"
  >
    <label class="field">
      <span class="label-row">
        <span>{{ label }}</span>
        <button
          v-if="selected || query"
          type="button"
          class="clear"
          :disabled="disabled"
          @click="clearSelection"
        >
          Clear
        </button>
      </span>
      <input
        v-model="query"
        type="search"
        autocomplete="off"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-expanded="showList"
        aria-autocomplete="list"
        role="combobox"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
      >
    </label>

    <ul
      v-if="showList"
      class="list"
      role="listbox"
    >
      <UiComboboxOption
        v-for="(option, index) in visibleOptions"
        :key="option.value"
        :option="option"
        :active="index === highlightIndex"
        @select="selectOption"
      />
    </ul>

    <p v-if="loading" class="status">Searching…</p>
  </div>
</template>

<style scoped>
.combobox {
  position: relative;
  min-width: 9.5rem;
}

.field {
  display: grid;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: #b7b2a8;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.clear {
  appearance: none;
  border: 0;
  background: transparent;
  color: #9bb09a;
  font: inherit;
  font-size: 0.7rem;
  padding: 0;
  cursor: pointer;
}

.clear:hover:not(:disabled) {
  color: #c4d4a8;
}

.clear:disabled {
  opacity: 0.5;
  cursor: wait;
}

.field input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid rgb(155 176 154 / 45%);
  border-radius: 8px;
  background: rgb(18 22 28 / 82%);
  color: #e8e4dc;
  padding: 0.45rem 0.65rem;
  font: inherit;
  font-size: 0.85rem;
}

.field input:focus {
  outline: 2px solid #6f8f72;
  outline-offset: 1px;
}

.list {
  position: absolute;
  z-index: 5;
  top: calc(100% + 0.25rem);
  left: 0;
  right: 0;
  margin: 0;
  padding: 0.25rem;
  list-style: none;
  border-radius: 8px;
  border: 1px solid rgb(155 176 154 / 35%);
  background: rgb(18 22 28 / 96%);
  backdrop-filter: blur(8px);
  max-height: 12rem;
  overflow: auto;
}

.status {
  margin: 0.25rem 0 0;
  font-size: 0.7rem;
  color: #9bb09a;
}
</style>
