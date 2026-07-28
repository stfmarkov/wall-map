import type { JwtPayload } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'

/**
 * API path prefixes that require a signed-in user.
 * Add entries as Nitro upload / conversion routes appear.
 */
const AUTH_REQUIRED_PREFIXES = [
  '/api/gpx',
  '/api/poi',
  '/api/photos',
  '/api/avatars',
  '/api/maps',
] as const

/**
 * Server auth for privileged actions (GPX upload, photo upload, Maps→GPX, etc.).
 * Skips all other paths so public reads and page SSR stay open.
 *
 * `serverSupabaseUser` returns JWT claims (`JwtPayload`), not a full `User`.
 * Use `event.context.user.sub` as the auth user id.
 */
export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  const needsAuth = AUTH_REQUIRED_PREFIXES.some((prefix) => path.startsWith(prefix))

  if (!needsAuth) {
    return
  }

  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  event.context.user = user
})
