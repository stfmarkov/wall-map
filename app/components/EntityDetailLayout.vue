<script setup lang="ts">
defineProps<{
  backPath: string
  mapLabel: string
  detailsLabel: string
}>()
</script>

<template>
  <div class="detail">
    <section class="map-pane" :aria-label="mapLabel">
      <slot name="map" />
    </section>

    <section class="details-pane" :aria-label="detailsLabel">
      <div class="details-header">
        <NuxtLink :to="backPath" class="back-link">← Back</NuxtLink>
        <div class="header-actions">
          <slot name="actions" />
        </div>
      </div>
      <slot />
    </section>
  </div>
</template>

<style scoped>
.detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100dvh;
  color: #e8e4dc;
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: #12161c;
}

.map-pane {
  position: relative;
  min-height: 50dvh;
  border-right: 1px solid #2a322c;
}

.details-pane {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem 1.75rem;
  height: 100%;
  overflow-y: auto;
}

.details-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.back-link {
  font-size: 0.85rem;
  color: #9bb09a;
  text-decoration: none;
}

.back-link:hover {
  color: #c4d4a8;
}

:slotted(.edit-btn) {
  appearance: none;
  flex-shrink: 0;
  border: 1px solid rgb(155 176 154 / 45%);
  background: rgb(18 22 28 / 55%);
  color: #e8e4dc;
  border-radius: 8px;
  padding: 0.45rem 0.85rem;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: none;
}

:slotted(.edit-btn:hover:not(:disabled)) {
  border-color: #9bb09a;
  background: rgb(18 22 28 / 75%);
}

:slotted(.edit-btn:disabled) {
  opacity: 0.6;
  cursor: wait;
}

:slotted(.title) {
  margin: 0;
  font-size: clamp(1.4rem, 2.5vw, 1.85rem);
  font-weight: 650;
  line-height: 1.25;
}

:slotted(.fields) {
  margin: 0;
  display: flex;
  gap: 0.85rem;
}

:slotted(.fields) .field {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

:slotted(.fields) .field dt {
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #9bb09a;
}

:slotted(.fields) .field dd {
  margin: 0;
  font-size: 0.95rem;
  color: #d5d0c6;
}

:slotted(.description) {
  margin: 0.25rem 0 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #d5d0c6;
  white-space: pre-wrap;
}

:slotted(.description.muted) {
  color: #8a857c;
}

:slotted(.placeholder) {
  margin: 0;
  color: #8a857c;
  font-size: 0.95rem;
}

.map-pane :deep(.map-fallback) {
  display: grid;
  place-items: center;
  height: 100%;
  min-height: 50dvh;
  background: #12161c;
  color: #9aa39a;
}

:slotted(.download-error) {
  margin: 0.5rem 0 0;
  font-size: 0.85rem;
  color: #e8a090;
}

@media (max-width: 800px) {
  .detail {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(40dvh, 45dvh) 1fr;
  }

  .map-pane {
    border-right: none;
    border-bottom: 1px solid #2a322c;
  }
}
</style>
