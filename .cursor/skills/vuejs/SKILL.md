---
name: vuejs
description: >-
  Vue 3 and TypeScript conventions for the wall-map Nuxt frontend
  (Composition API, script setup). Use when creating or editing .vue files,
  components, composables, pages under app/, or when the user mentions Vue,
  v-for, computed props, or component naming in this project.
---

# Vue.js (wall-map)

Apply these rules when writing or reviewing Vue code in `app/`. More rules may be added later; treat this file as the source of truth for project Vue style.

## Rules

1. **No set and get for computed props** — Use read-only `computed()` values. Do not use getter/setter computed unless you truly need writable computed (e.g. `v-model` bridge); prefer explicit refs and methods instead.

2. **All functions are arrow functions** — In `<script setup>`, composables, and component logic, declare handlers and helpers as `const fn = () => { ... }` or `const fn = async () => { ... }`. Avoid `function fn() { ... }`.

3. **`v-for` on separate components** — Extract list items into their own component and put `v-for` on that component. Inline `v-for` in the parent template is allowed only when the loop body is very trivial (e.g. a single tag with minimal markup).

4. **No `v-if` in `v-for`** — Never combine `v-if` and `v-for` on the same element (or nest them in a way that filters inside the loop). Build a **computed** that applies the filter/sort logic, then `v-for` over that computed list.

5. **Tightly coupled child naming** — Child components that exist only for a specific parent should be prefixed with the parent name (PascalCase file and component name). Example: parent `PlatformLogin.vue` → child `PlatformLoginItem.vue`, not a generic `ListItem.vue` used only there.

## Examples

### Computed (read-only)

```ts
// Good
const visiblePlatforms = computed(() =>
  state.platforms.filter((p) => p.enabled),
)

// Avoid unless writable computed is required
const selected = computed({
  get: () => model.value,
  set: (v) => { model.value = v },
})
```

### Arrow functions

```ts
// Good
const sessionLabel = (status: string | undefined) => { ... }
const openLogin = async (platform: main.Platform) => { ... }

// Avoid
async function openLogin(platform: main.Platform) { ... }
```

### `v-for` → component

```vue
<!-- Good: non-trivial row -->
<PlatformLoginItem
  v-for="platform in state.platforms"
  :key="platform.id"
  :platform="platform"
/>

<!-- OK: very trivial -->
<span v-for="n in 3" :key="n">{{ n }}</span>

<!-- Avoid: rich markup inside parent v-for -->
<li v-for="platform in state.platforms" :key="platform.id">
  <div>...</div>
  <button>...</button>
</li>
```

### Filter in computed, not `v-if` in `v-for`

```ts
const activePlatforms = computed(() =>
  state.platforms.filter((p) => !p.hidden),
)
```

```vue
<!-- Good -->
<PlatformLoginItem
  v-for="platform in activePlatforms"
  :key="platform.id"
  :platform="platform"
/>

<!-- Avoid -->
<PlatformLoginItem
  v-for="platform in state.platforms"
  v-if="!platform.hidden"
  :key="platform.id"
/>
```

### Child component prefix

| Parent | Child (tightly coupled) |
|--------|-------------------------|
| `PlatformLogin.vue` | `PlatformLoginItem.vue` |
| `VehicleForm.vue` | `VehicleFormSection.vue` |

Reusable, generic components (used by multiple parents) keep neutral names (`BaseButton.vue`, `AppModal.vue`).

## Checklist (before finishing Vue changes)

- [ ] Computed props are read-only unless writable computed is justified
- [ ] New/changed functions use arrow syntax
- [ ] Non-trivial lists use a dedicated item component
- [ ] No `v-if` inside or on the same node as `v-for`; filtering lives in computed
- [ ] Parent-specific children use the parent name prefix
