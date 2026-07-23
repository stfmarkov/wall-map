
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/supabase'],

  supabase: {
    // Pages: opt-in via app/middleware/auth.ts (and guest.ts on /login).
    // API writes: server/middleware/auth.ts on /api/gpx, /api/images, /api/maps.
    redirect: false,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
    },
  },
})
