import type { Database } from '~/types/database.types'
import type { PublicProfile } from '~/types/profile'
import type { MapRoute } from '~/types/route'
import { toMapRoute } from '~/utils/mapRoute'

export const useMapWallStore = defineStore('mapWall', () => {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient<Database>()

  const ownerId = ref<string | null>(null)
  const profile = ref<PublicProfile | null>(null)
  const routes = ref<MapRoute[]>([])
  const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
  const error = ref<Error | null>(null)

  const isOwner = computed(() =>
    Boolean(user.value && profile.value && user.value.sub === profile.value.id),
  )
  const hasMapContent = computed(() => routes.value.length > 0)

  const fetchProfile = async (userId: string) => {
    const { data, error: queryError } = await supabase
      .from('profiles')
      .select('id, username, display_name, bio, avatar_url')
      .eq('id', userId)
      .maybeSingle()

    if (queryError) throw queryError
    profile.value = data
  }

  const fetchRoutes = async (userId: string) => {
    const { data, error: queryError } = await supabase.rpc('list_map_routes', {
      p_owner_id: userId,
    })

    if (queryError) throw queryError

    routes.value = (data ?? [])
      .map(toMapRoute)
      .filter((route): route is MapRoute => route !== null)
  }

  const loadWall = async (userId: string) => {
    if (!userId) {
      ownerId.value = null
      profile.value = null
      routes.value = []
      status.value = 'idle'
      error.value = null
      return
    }

    ownerId.value = userId
    status.value = 'pending'
    error.value = null

    try {
      await Promise.all([
        fetchProfile(userId),
        fetchRoutes(userId),
      ])
      status.value = 'success'
    }
    catch (err) {
      profile.value = null
      routes.value = []
      error.value = err instanceof Error ? err : new Error('Failed to load map wall')
      status.value = 'error'
    }
  }

  const refreshRoutes = async () => {
    if (!ownerId.value) return
    await fetchRoutes(ownerId.value)
  }

  const refresh = async () => {
    if (!ownerId.value) return
    await loadWall(ownerId.value)
  }

  /**
   * Load one route by id into `routes` (for detail/edit deep links).
   * No-op if already present. Sets `ownerId` from the row when unset.
   */
  const fetchRouteById = async (routeId: string) => {
    if (!routeId) return null

    const existing = routes.value.find((entry) => entry.id === routeId)
    if (existing) return existing

    const { data, error: queryError } = await supabase.rpc('get_map_route', {
      p_route_id: routeId,
    })

    if (queryError) throw queryError

    const row = data?.[0]
    if (!row) return null

    const mapped = toMapRoute(row)
    if (!mapped) return null

    routes.value = [...routes.value, mapped]

    if (!ownerId.value && mapped.owner_id) {
      ownerId.value = mapped.owner_id
    }

    return mapped
  }

  const ensureRouteLoaded = async (routeId: string) => {
    if (routes.value.some((entry) => entry.id === routeId)) return
    await fetchRouteById(routeId)
  }

  const updateRouteMeta = async (
    routeId: string,
    patch: {
      name: string
      description: string | null
    },
  ) => {
    const { error: updateError } = await supabase
      .from('routes')
      .update({
        name: patch.name,
        description: patch.description,
      })
      .eq('id', routeId)

    if (updateError) throw updateError

    const index = routes.value.findIndex((entry) => entry.id === routeId)
    if (index === -1) return

    routes.value[index] = {
      ...routes.value[index],
      name: patch.name,
      description: patch.description,
    } as MapRoute
  }

  return {
    ownerId,
    profile,
    routes,
    status,
    error,
    isOwner,
    hasMapContent,
    loadWall,
    fetchProfile,
    fetchRoutes,
    refreshRoutes,
    refresh,
    fetchRouteById,
    ensureRouteLoaded,
    updateRouteMeta,
  }
})
