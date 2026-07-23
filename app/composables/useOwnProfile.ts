import type { Database } from '~/types/database.types'

export type OwnProfile = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'id' | 'username' | 'display_name' | 'bio' | 'avatar_url' | 'is_public'
>

export const useOwnProfile = () => {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient<Database>()

  const {
    data: profile,
    status,
    error,
    refresh,
  } = useAsyncData(
    'own-profile',
    async (): Promise<OwnProfile | null> => {
      if (!user.value) return null

      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url, is_public')
        .eq('id', user.value.sub)
        .maybeSingle()

      if (queryError) throw queryError
      return data
    },
    { watch: [user] },
  )

  const profilePath = computed(() => (user.value ? '/users/me' : '/'))

  return {
    profile,
    status,
    error,
    refresh,
    profilePath,
  }
}
