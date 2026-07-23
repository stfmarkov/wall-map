<script setup lang="ts">
withDefaults(
  defineProps<{
    username?: string | null
    showEditProfile?: boolean
  }>(),
  {
    showEditProfile: false,
  },
)

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const signingOut = ref(false)

const signOut = async () => {
  signingOut.value = true
  await supabase.auth.signOut()
  signingOut.value = false
  await navigateTo('/login')
}
</script>

<template>
  <header class="map-top-bar">
    <div class="leading">
      <NuxtLink to="/" class="brand">Wall Map</NuxtLink>
      <span v-if="username" class="handle">@{{ username }}</span>
    </div>

    <div class="actions">
      <template v-if="user">
        <NuxtLink v-if="showEditProfile" to="/profile" class="bar-link">Edit profile</NuxtLink>
        <UserAvatarLink />
        <button
          type="button"
          class="bar-btn"
          :disabled="signingOut"
          @click="signOut"
        >
          {{ signingOut ? 'Signing out…' : 'Sign out' }}
        </button>
      </template>
      <NuxtLink v-else to="/login" class="bar-link">Sign in</NuxtLink>
    </div>
  </header>
</template>

<style scoped>
.map-top-bar {
  position: absolute;
  z-index: 2;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 50px 0.75rem 1rem;
  background: linear-gradient(to bottom, rgb(18 22 28 / 78%), transparent);
  color: #e8e4dc;
  font-family: 'Segoe UI', system-ui, sans-serif;
  pointer-events: none;
}

.map-top-bar > * {
  pointer-events: auto;
}

.leading {
  display: flex;
  align-items: baseline;
  gap: 0.65rem;
  min-width: 0;
  max-width: min(100%, 22rem);
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  border: 1px solid rgb(155 176 154 / 30%);
  background: rgb(18 22 28 / 82%);
  backdrop-filter: blur(8px);
}

.brand {
  font-weight: 650;
  letter-spacing: 0.02em;
  color: inherit;
  text-decoration: none;
  flex-shrink: 0;
}

.brand:hover {
  color: #c4d4a8;
}

.handle {
  font-size: 0.9rem;
  color: #b7b2a8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.bar-btn,
.bar-link {
  appearance: none;
  border: 1px solid rgb(155 176 154 / 45%);
  background: rgb(18 22 28 / 55%);
  color: #e8e4dc;
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
}

.bar-btn:hover:not(:disabled),
.bar-link:hover {
  border-color: #9bb09a;
  background: rgb(18 22 28 / 75%);
}

.bar-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}
</style>
