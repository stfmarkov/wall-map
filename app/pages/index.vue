<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()

const signingOut = ref(false)

async function signOut() {
  signingOut.value = true
  await supabase.auth.signOut()
  signingOut.value = false
  await navigateTo('/login')
}
</script>

<template>
  <div class="home">
    <header class="home-bar">
      <span class="brand">Wall Map</span>
      <div class="home-bar-actions">
        <template v-if="user">
          <span class="user-email">{{ user.email }}</span>
          <button type="button" class="btn" :disabled="signingOut" @click="signOut">
            {{ signingOut ? 'Signing out…' : 'Sign out' }}
          </button>
        </template>
        <NuxtLink v-else to="/login" class="btn btn-link">Sign in</NuxtLink>
      </div>
    </header>

    <ClientOnly>
      <MapView />
      <template #fallback>
        <div class="map-fallback">Loading map…</div>
      </template>
    </ClientOnly>
  </div>
</template>

<style scoped>
.home {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100dvh;
}

.home-bar {
  position: absolute;
  z-index: 2;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(to bottom, rgb(18 22 28 / 72%), transparent);
  color: #f4f1ea;
  font-family: 'Segoe UI', system-ui, sans-serif;
  pointer-events: none;
}

.home-bar > * {
  pointer-events: auto;
}

.brand {
  font-weight: 650;
  letter-spacing: 0.02em;
}

.home-bar-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-email {
  font-size: 0.85rem;
  opacity: 0.9;
  max-width: 40vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn {
  appearance: none;
  border: 1px solid rgb(244 241 234 / 35%);
  background: rgb(18 22 28 / 55%);
  color: inherit;
  border-radius: 6px;
  padding: 0.35rem 0.7rem;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn:hover:not(:disabled) {
  background: rgb(18 22 28 / 75%);
}

.btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.btn-link {
  text-decoration: none;
  display: inline-block;
}

.map-fallback {
  display: grid;
  place-items: center;
  min-height: 100dvh;
  font-family: system-ui, sans-serif;
  color: #555;
}
</style>
