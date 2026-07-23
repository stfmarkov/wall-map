<template>
  <div class="app-shell">
    <NuxtRouteAnnouncer />
    <NuxtPage />
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
</style>
