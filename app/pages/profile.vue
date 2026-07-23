<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({
  middleware: 'auth',
})

const user = useSupabaseUser()
const supabase = useSupabaseClient<Database>()
const { profile, status, refresh } = useOwnProfile()

const displayName = ref('')
const username = ref('')
const bio = ref('')
const isPublic = ref(true)
const avatarUrl = ref<string | null>(null)
const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string | null>(null)

const pending = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')

const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/
const MAX_AVATAR_BYTES = 2 * 1024 * 1024

const hydrateForm = () => {
  displayName.value = profile.value?.display_name ?? ''
  username.value = profile.value?.username ?? ''
  bio.value = profile.value?.bio ?? ''
  isPublic.value = profile.value?.is_public ?? true
  avatarUrl.value = profile.value?.avatar_url ?? null
  avatarFile.value = null
  avatarPreview.value = null
}

watch(profile, () => {
  hydrateForm()
}, { immediate: true })

watch(avatarPreview, (_next, prev) => {
  if (prev) URL.revokeObjectURL(prev)
})

onBeforeUnmount(() => {
  if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value)
})

const previewSrc = computed(() => avatarPreview.value || avatarUrl.value)

const onAvatarChange = (event: Event) => {
  errorMessage.value = ''
  infoMessage.value = ''

  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Choose an image file (JPEG, PNG, WebP, or GIF).'
    input.value = ''
    return
  }

  if (file.size > MAX_AVATAR_BYTES) {
    errorMessage.value = 'Avatar must be 2 MB or smaller.'
    input.value = ''
    return
  }

  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

const extensionFor = (file: File) => {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName
  }

  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  }
  return map[file.type] ?? 'jpg'
}

const uploadAvatar = async (userId: string) => {
  const file = avatarFile.value
  if (!file) return avatarUrl.value

  const path = `${userId}/avatar.${extensionFor(file)}`
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}

const saveProfile = async () => {
  errorMessage.value = ''
  infoMessage.value = ''

  if (!user.value) {
    await navigateTo('/login')
    return
  }

  const normalizedUsername = username.value.trim().toLowerCase()
  if (normalizedUsername && !USERNAME_PATTERN.test(normalizedUsername)) {
    errorMessage.value = 'Username needs 3–30 characters: lowercase letters, numbers, or underscores.'
    return
  }

  if (bio.value.length > 500) {
    errorMessage.value = 'Bio must be 500 characters or fewer.'
    return
  }

  pending.value = true

  try {
    const nextAvatarUrl = await uploadAvatar(user.value.sub)

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.value.trim() || null,
        username: normalizedUsername || null,
        bio: bio.value.trim() || null,
        avatar_url: nextAvatarUrl,
        is_public: isPublic.value,
      })
      .eq('id', user.value.sub)

    if (error) {
      if (error.code === '23505') {
        errorMessage.value = 'That username is taken. Try another.'
        return
      }
      errorMessage.value = error.message
      return
    }

    await refresh()
    hydrateForm()
    infoMessage.value = 'Profile saved.'
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Could not save profile.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <AuthShell
    v-if="status === 'pending'"
    eyebrow="Wall Map"
    title="Loading…"
    lede="Fetching your profile."
  />

  <AuthShell
    v-else-if="!profile"
    eyebrow="Wall Map"
    title="Profile missing"
    lede="We couldn’t find a profile for this account."
  >
    <template #footer>
      <NuxtLink to="/users/me">Back to your map</NuxtLink>
    </template>
  </AuthShell>

  <AuthShell
    v-else
    wide
    eyebrow="Wall Map"
    title="Edit profile"
    lede="Update how you appear on your map and when others visit."
  >
    <form class="form" @submit.prevent="saveProfile">
      <div class="avatar-row">
        <div class="avatar-preview" aria-hidden="true">
          <img v-if="previewSrc" :src="previewSrc" alt="" class="avatar-img">
          <svg
            v-else
            class="avatar-fallback"
            viewBox="0 0 40 40"
          >
            <circle cx="20" cy="20" r="20" fill="#1a201c" />
            <circle cx="20" cy="15" r="7" fill="#6f8f72" />
            <path
              d="M6 34.5c2.8-7.2 8.2-10.5 14-10.5s11.2 3.3 14 10.5"
              fill="#6f8f72"
            />
          </svg>
        </div>

        <label class="avatar-pick">
          <span>Avatar</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            :disabled="pending"
            @change="onAvatarChange"
          >
        </label>
      </div>

      <UiField
        v-model="displayName"
        label="Display name"
        name="display_name"
        autocomplete="nickname"
        maxlength="80"
        placeholder="Trail name"
        :disabled="pending"
      />

      <UiField
        v-model="username"
        label="Username"
        name="username"
        autocomplete="username"
        maxlength="30"
        placeholder="trail_rider"
        :disabled="pending"
      />

      <UiTextarea
        v-model="bio"
        label="Bio"
        name="bio"
        maxlength="500"
        placeholder="Where you ride, hike, or explore…"
        :disabled="pending"
      />

      <label class="toggle">
        <input v-model="isPublic" type="checkbox" :disabled="pending">
        <span>Public profile — others can visit your map</span>
      </label>

      <UiMessage v-if="infoMessage" variant="info">{{ infoMessage }}</UiMessage>
      <UiMessage v-if="errorMessage" variant="error">{{ errorMessage }}</UiMessage>

      <div class="actions">
        <UiButton type="submit" :disabled="pending">
          {{ pending ? 'Saving…' : 'Save profile' }}
        </UiButton>
        <NuxtLink to="/users/me" class="ghost-link">Back to your map</NuxtLink>
      </div>
    </form>
  </AuthShell>
</template>

<style scoped>
.form {
  display: grid;
  gap: 1rem;
}

.avatar-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar-preview {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid #3a433c;
  background: #1a201c;
  flex-shrink: 0;
}

.avatar-img,
.avatar-fallback {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-pick {
  display: grid;
  gap: 0.4rem;
  font-size: 0.85rem;
  min-width: 0;
}

.avatar-pick input {
  width: 100%;
  font: inherit;
  font-size: 0.85rem;
  color: #b7b2a8;
}

.toggle {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  font-size: 0.9rem;
  line-height: 1.4;
  color: #b7b2a8;
  cursor: pointer;
}

.toggle input {
  margin-top: 0.2rem;
  accent-color: #c4d4a8;
}

.actions {
  display: grid;
  gap: 0.75rem;
}

.ghost-link {
  text-align: center;
  color: #9aa39a;
  font-size: 0.9rem;
  text-decoration: none;
}

.ghost-link:hover {
  color: #e8e4dc;
}
</style>
