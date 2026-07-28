
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@pinia/nuxt', '@nuxtjs/supabase'],

  supabase: {
    // Pages: opt-in via app/middleware/auth.ts (and guest.ts on /login).
    // API writes: server/middleware/auth.ts on /api/gpx, /api/photos, /api/avatars, /api/maps.
    redirect: false,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
    },
  },
})
