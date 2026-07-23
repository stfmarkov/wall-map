<script setup lang="ts">
const user = useSupabaseUser()
const ownProfile = useOwnProfileStore()
const { profile, profilePath } = storeToRefs(ownProfile)

const label = computed(
  () => profile.value?.display_name || profile.value?.username || user.value?.email || 'Your profile',
)
</script>

<template>
  <NuxtLink
    v-if="user"
    :to="profilePath"
    class="avatar-link"
    :title="label"
    :aria-label="`Open profile: ${label}`"
  >
    <img
      v-if="profile?.avatar_url"
      :src="profile.avatar_url"
      alt=""
      class="avatar-img"
    >
    <svg
      v-else
      class="avatar-fallback"
      viewBox="0 0 40 40"
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="20" fill="#1a201c" />
      <circle cx="20" cy="15" r="7" fill="#6f8f72" />
      <path
        d="M6 34.5c2.8-7.2 8.2-10.5 14-10.5s11.2 3.3 14 10.5"
        fill="#6f8f72"
      />
    </svg>
  </NuxtLink>
</template>

<style scoped>
.avatar-link {
  display: block;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid rgb(155 176 154 / 50%);
  background: #1a201c;
  flex-shrink: 0;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.avatar-link:hover {
  border-color: #c4d4a8;
  transform: scale(1.04);
}

.avatar-img,
.avatar-fallback {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
