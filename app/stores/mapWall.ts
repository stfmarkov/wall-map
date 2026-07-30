import type { Database } from '~/types/database.types'
import type { PublicProfile } from '~/types/profile'
import type { MapPoi } from '~/types/poi'
import type { MapRoute } from '~/types/route'
import type { RouteDifficulty, RouteSurface, RouteTransport } from '~/types/routeDetails'
import { toMapPoi } from '~/utils/mapPoi'
import { toMapRoute } from '~/utils/mapRoute'

export const useMapWallStore = defineStore('mapWall', () => {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient<Database>()

  const ownerId = ref<string | null>(null)
  const profile = ref<PublicProfile | null>(null)
  const routes = ref<MapRoute[]>([])
  const pois = ref<MapPoi[]>([])
  const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
  const error = ref<Error | null>(null)

  const isOwner = computed(() =>
    Boolean(user.value && profile.value && user.value.sub === profile.value.id),
  )
  const hasMapContent = computed(() => routes.value.length > 0 || pois.value.length > 0)

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

  const fetchPois = async (userId: string) => {
    const { data, error: queryError } = await supabase.rpc('list_map_pois', {
      p_owner_id: userId,
    })

    if (queryError) throw queryError

    pois.value = (data ?? [])
      .map(toMapPoi)
      .filter((poi): poi is MapPoi => poi !== null)
  }

  const loadWall = async (userId: string) => {
    if (!userId) {
      ownerId.value = null
      profile.value = null
      routes.value = []
      pois.value = []
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
        fetchPois(userId),
      ])
      status.value = 'success'
    }
    catch (err) {
      profile.value = null
      routes.value = []
      pois.value = []
      error.value = err instanceof Error ? err : new Error('Failed to load map wall')
      status.value = 'error'
    }
  }

  const refreshRoutes = async () => {
    if (!ownerId.value) return
    await fetchRoutes(ownerId.value)
  }

  const refreshPois = async () => {
    if (!ownerId.value) return
    await fetchPois(ownerId.value)
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
      transport: RouteTransport | null
      difficulty: RouteDifficulty | null
      surface: RouteSurface | null
    },
  ) => {
    const { error: updateError } = await supabase
      .from('routes')
      .update({
        name: patch.name,
        description: patch.description,
        transport: patch.transport,
        difficulty: patch.difficulty,
        surface: patch.surface,
      })
      .eq('id', routeId)

    if (updateError) throw updateError

    const index = routes.value.findIndex((entry) => entry.id === routeId)
    if (index === -1) return

    routes.value[index] = {
      ...routes.value[index],
      name: patch.name,
      description: patch.description,
      transport: patch.transport,
      difficulty: patch.difficulty,
      surface: patch.surface,
    } as MapRoute
  }

  /**
   * Load one POI by id into `pois` (for detail/edit deep links).
   * No-op if already present. Sets `ownerId` from the row when unset.
   */
  const fetchPoiById = async (poiId: string) => {
    if (!poiId) return null

    const existing = pois.value.find((entry) => entry.id === poiId)
    if (existing) return existing

    const { data, error: queryError } = await supabase.rpc('get_map_poi', {
      p_poi_id: poiId,
    })

    if (queryError) throw queryError

    const row = data?.[0]
    if (!row) return null

    const mapped = toMapPoi(row)
    if (!mapped) return null

    pois.value = [...pois.value, mapped]

    if (!ownerId.value && mapped.owner_id) {
      ownerId.value = mapped.owner_id
    }

    return mapped
  }

  const ensurePoiLoaded = async (poiId: string) => {
    if (pois.value.some((entry) => entry.id === poiId)) return
    await fetchPoiById(poiId)
  }

  const updatePoiMeta = async (
    poiId: string,
    patch: {
      name: string
      description: string | null
    },
  ) => {
    const { error: updateError } = await supabase
      .from('points_of_interest')
      .update({
        name: patch.name,
        description: patch.description,
      })
      .eq('id', poiId)

    if (updateError) throw updateError

    const index = pois.value.findIndex((entry) => entry.id === poiId)
    if (index === -1) return

    pois.value[index] = {
      ...pois.value[index],
      name: patch.name,
      description: patch.description,
    } as MapPoi
  }

  return {
    ownerId,
    profile,
    routes,
    pois,
    status,
    error,
    isOwner,
    hasMapContent,
    loadWall,
    fetchProfile,
    fetchRoutes,
    fetchPois,
    refreshRoutes,
    refreshPois,
    refresh,
    fetchRouteById,
    ensureRouteLoaded,
    updateRouteMeta,
    fetchPoiById,
    ensurePoiLoaded,
    updatePoiMeta,
  }
})
