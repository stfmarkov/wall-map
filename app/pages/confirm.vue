<script setup lang="ts">
/**
 * PKCE / magic-link callback route expected by @nuxtjs/supabase.
 * Email OTP completes on /login via verifyOtp; this page just lands signed-in users home.
 */
const user = useSupabaseUser()

watch(
  user,
  (current) => {
    if (current) navigateTo('/')
  },
  { immediate: true },
)
</script>

<template>
  <main class="confirm">
    <p>Confirming sign-in…</p>
  </main>
</template>

<style scoped>
.confirm {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  background: #12161c;
  color: #b7b2a8;
  font-family: 'Segoe UI', system-ui, sans-serif;
}
</style>
