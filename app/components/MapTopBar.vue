<script setup lang="ts">
withDefaults(
  defineProps<{
    username?: string | null
    showEditProfile?: boolean
    showDropPin?: boolean
    pinDropActive?: boolean
  }>(),
  {
    showEditProfile: false,
    showDropPin: false,
    pinDropActive: false,
  },
)

const emit = defineEmits<{
  uploaded: [route: { id: string; name: string; distance_m: number | null }]
  'toggle-pin-drop': []
}>()

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const signingOut = ref(false)
const uploading = ref(false)
const uploadMessage = ref('')
const uploadError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const signOut = async () => {
  signingOut.value = true
  await supabase.auth.signOut()
  signingOut.value = false
  await navigateTo('/login')
}

const openGpxPicker = () => {
  uploadMessage.value = ''
  uploadError.value = ''
  fileInput.value?.click()
}

const onGpxSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  uploading.value = true
  uploadMessage.value = ''
  uploadError.value = ''

  try {
    const body = new FormData()
    body.append('file', file)

    const result = await $fetch<{
      route: { id: string; name: string; distance_m: number | null }
    }>('/api/gpx', {
      method: 'POST',
      body,
    })

    uploadMessage.value = `Saved “${result.route.name}”`
    emit('uploaded', result.route)
  }
  catch (error: unknown) {
    const err = error as {
      data?: { statusMessage?: string }
      statusMessage?: string
      message?: string
    }
    uploadError.value
      = err.data?.statusMessage
        || err.statusMessage
        || err.message
        || 'Upload failed'
  }
  finally {
    uploading.value = false
  }
}

const togglePinDrop = () => {
  uploadMessage.value = ''
  uploadError.value = ''
  emit('toggle-pin-drop')
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
        <input
          ref="fileInput"
          type="file"
          class="file-input"
          accept=".gpx,application/gpx+xml,application/xml,text/xml"
          @change="onGpxSelected"
        >
        <button
          type="button"
          class="bar-btn"
          :disabled="uploading"
          @click="openGpxPicker"
        >
          {{ uploading ? 'Uploading…' : 'Upload GPX' }}
        </button>
        <button
          v-if="showDropPin"
          type="button"
          class="bar-btn"
          :class="{ 'bar-btn-active': pinDropActive }"
          :aria-pressed="pinDropActive"
          @click="togglePinDrop"
        >
          {{ pinDropActive ? 'Cancel pin' : 'Drop pin' }}
        </button>
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

    <p v-if="uploadError" class="status status-error" role="status">{{ uploadError }}</p>
    <p v-else-if="uploadMessage" class="status status-ok" role="status">{{ uploadMessage }}</p>
    <p v-else-if="pinDropActive && showDropPin" class="status status-ok" role="status">
      Click the map to place a point of interest
    </p>
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

.file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
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

.bar-btn-active {
  border-color: #c4d4a8;
  background: rgb(40 52 42 / 85%);
  color: #c4d4a8;
}

.bar-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.status {
  position: absolute;
  top: calc(100% - 0.25rem);
  right: 50px;
  margin: 0;
  max-width: min(100% - 4rem, 24rem);
  padding: 0.4rem 0.65rem;
  border-radius: 8px;
  border: 1px solid rgb(155 176 154 / 35%);
  background: rgb(18 22 28 / 90%);
  font-size: 0.8rem;
  line-height: 1.35;
}

.status-ok {
  color: #c4d4a8;
}

.status-error {
  color: #e8b4b4;
  border-color: rgb(200 120 120 / 45%);
}
</style>
