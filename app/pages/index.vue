<template>
  <div class="home">
    <MapTopBar />

    <div class="map-slot">
      <ClientOnly>
        <MapView />
        <template #fallback>
          <div class="map-fallback">Loading map…</div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<style scoped>
.home {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100dvh;
  overflow: hidden;
}

.map-slot {
  position: absolute;
  inset: 0;
}

.map-fallback {
  display: grid;
  place-items: center;
  min-height: 100dvh;
  font-family: 'Segoe UI', system-ui, sans-serif;
  color: #9aa39a;
  background: #12161c;
}
</style>
