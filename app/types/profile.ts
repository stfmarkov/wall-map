import type { Database } from '~/types/database.types'

/** Public fields shown on a traveler's map page. */
export type PublicProfile = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'id' | 'username' | 'display_name' | 'bio' | 'avatar_url'
>

/** Signed-in user's profile including edit fields. */
export type OwnProfile = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'id' | 'username' | 'display_name' | 'bio' | 'avatar_url' | 'is_public'
>
