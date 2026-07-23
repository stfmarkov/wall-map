/**
 * Require a signed-in user on protected pages (profile edit, add/edit route or POI, etc.):
 * definePageMeta({ middleware: 'auth' })
 *
 * UX only — always enforce the same check in Nitro for writes/uploads.
 */
export default defineNuxtRouteMiddleware(() => {
  const user = useSupabaseUser()

  if (!user.value) {
    return navigateTo('/login')
  }
})
