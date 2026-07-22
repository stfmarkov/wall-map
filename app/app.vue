<template>
  <div class="app-shell">
    <NuxtRouteAnnouncer />
    <ClientOnly>
      <MapView />
      <template #fallback>
        <div class="map-fallback">Loading map…</div>
      </template>
    </ClientOnly>
  </div>
</template>

<style>
html,
body,
#__nuxt {
  margin: 0;
  height: 100%;
}

.app-shell {
  width: 100%;
  height: 100%;
  min-height: 100dvh;
}

.map-fallback {
  display: grid;
  place-items: center;
  min-height: 100dvh;
  font-family: system-ui, sans-serif;
  color: #555;
}
</style>
