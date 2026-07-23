import type { Database } from '~/types/database.types'
import type { OwnProfile } from '~/types/profile'

export const useOwnProfileStore = defineStore('ownProfile', () => {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient<Database>()

  const profile = ref<OwnProfile | null>(null)
  const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
  const error = ref<Error | null>(null)

  let inflight: Promise<void> | null = null

  const profilePath = computed(() => (user.value ? '/users/me' : '/'))

  const fetchProfile = async () => {
    if (inflight) return inflight

    inflight = (async () => {
      if (!user.value) {
        profile.value = null
        status.value = 'idle'
        error.value = null
        return
      }

      status.value = 'pending'
      error.value = null

      try {
        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('id, username, display_name, bio, avatar_url, is_public')
          .eq('id', user.value.sub)
          .maybeSingle()

        if (queryError) throw queryError

        profile.value = data
        status.value = 'success'
      }
      catch (err) {
        profile.value = null
        error.value = err instanceof Error ? err : new Error('Failed to load profile')
        status.value = 'error'
        throw error.value
      }
    })().finally(() => {
      inflight = null
    })

    return inflight
  }

  const ensureLoaded = async () => {
    if (!user.value) {
      profile.value = null
      status.value = 'idle'
      return
    }

    if (status.value === 'success' && profile.value) return
    await fetchProfile()
  }

  watch(user, () => {
    void fetchProfile()
  }, { immediate: true })

  return {
    profile,
    status,
    error,
    profilePath,
    fetchProfile,
    refresh: fetchProfile,
    ensureLoaded,
  }
})
