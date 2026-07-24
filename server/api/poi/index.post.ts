import { randomUUID } from 'node:crypto'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { reverseGeocode } from '../../utils/reverseGeocode'

const DEFAULT_NAME = 'Point of interest'

type PoiCreateBody = {
  lng?: unknown
  lat?: unknown
  name?: unknown
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.sub
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody<PoiCreateBody>(event)
  const lng = body?.lng
  const lat = body?.lat

  if (!isFiniteNumber(lng) || !isFiniteNumber(lat)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'lng and lat must be finite numbers',
    })
  }

  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Coordinates out of range',
    })
  }

  const requestedName = typeof body?.name === 'string' ? body.name.trim() : ''
  const name = (requestedName || DEFAULT_NAME).slice(0, 200)
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required' })
  }

  const place = await reverseGeocode(lng, lat)
  const poiId = randomUUID()
  const ewkt = `SRID=4326;POINT(${lng} ${lat})`
  const supabase = await serverSupabaseClient<Database>(event)

  const { data: poi, error: insertError } = await supabase
    .from('points_of_interest')
    .insert({
      id: poiId,
      owner_id: userId,
      name,
      geom: ewkt,
      country: place.country,
      region: place.region,
    })
    .select('id, name, country, region, created_at')
    .single()

  if (insertError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to save point of interest: ${insertError.message}`,
    })
  }

  return { poi }
})
