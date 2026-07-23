/**
 * Require a signed-out user. Use on /login (and similar):
 * definePageMeta({ middleware: 'guest' })
 */
export default defineNuxtRouteMiddleware(() => {
  const user = useSupabaseUser()

  if (user.value) {
    return navigateTo('/')
  }
})
