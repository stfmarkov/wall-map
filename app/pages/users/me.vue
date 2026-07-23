<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const user = useSupabaseUser()

await navigateTo(`/users/${user.value!.sub}`, { replace: true })
</script>

<template>
  <AuthShell
    eyebrow="Wall Map"
    title="Opening your map…"
    lede="Taking you to your map."
  />
</template>
