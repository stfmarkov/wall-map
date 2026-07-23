import type { LineString } from 'geojson'
import type { Database, Json } from '~/types/database.types'
import type { PublicProfile } from '~/types/profile'
import type { MapRoute } from '~/types/route'

const isLineString = (value: Json): value is LineString => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const geom = value as { type?: unknown; coordinates?: unknown }
  return geom.type === 'LineString' && Array.isArray(geom.coordinates)
}

const toMapRoute = (row: {
  id: string
  name: string
  description: string | null
  distance_m: number | null
  country: string | null
  region: string | null
  created_at: string
  geometry: Json
}): MapRoute | null => {
  if (!isLineString(row.geometry)) return null
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    distance_m: row.distance_m,
    country: row.country,
    region: row.region,
    created_at: row.created_at,
    geometry: row.geometry,
  }
}

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
  }
})
