import type { JwtPayload } from '@supabase/supabase-js'

declare module 'h3' {
  interface H3EventContext {
    /**
     * JWT claims from server/middleware/auth.ts on protected API prefixes.
     * User id is `user.sub` (not `user.id`).
     */
    user?: JwtPayload
  }
}
