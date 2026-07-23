<script setup lang="ts">
withDefaults(
  defineProps<{
    eyebrow?: string
    title: string
    lede?: string
    wide?: boolean
  }>(),
  {
    wide: false,
  },
)
</script>

<template>
  <main class="auth-shell">
    <div class="auth-panel" :class="{ wide }">
      <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
      <h1>{{ title }}</h1>
      <p v-if="lede" class="lede">{{ lede }}</p>
      <slot />
      <div v-if="$slots.footer" class="footer">
        <slot name="footer" />
      </div>
    </div>
  </main>
</template>

<style scoped>
.auth-shell {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background:
    radial-gradient(ellipse 80% 60% at 20% 10%, #2a3a2e 0%, transparent 55%),
    radial-gradient(ellipse 70% 50% at 90% 80%, #1a2a38 0%, transparent 50%),
    #12161c;
  color: #e8e4dc;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.auth-panel {
  width: min(100%, 22rem);
}

.auth-panel.wide {
  width: min(100%, 28rem);
}

.eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #9bb09a;
}

h1 {
  margin: 0;
  font-size: 1.85rem;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.lede {
  margin: 0.6rem 0 1.5rem;
  line-height: 1.45;
  color: #b7b2a8;
  font-size: 0.95rem;
}

.footer {
  margin-top: 1.5rem;
}

.footer :deep(a) {
  color: #9aa39a;
  font-size: 0.9rem;
  text-decoration: none;
}

.footer :deep(a:hover) {
  color: #e8e4dc;
}
</style>
