import { randomUUID } from 'node:crypto'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { nameFromGpxFilename, parseGpxToTrack } from '../../utils/gpx'
import { reverseGeocode } from '../../utils/reverseGeocode'

const MAX_GPX_BYTES = 15 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.sub
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const form = await readMultipartFormData(event)
  if (!form?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Expected multipart form data' })
  }

  const filePart = form.find((part) => part.name === 'file' && part.data?.length)
  if (!filePart) {
    throw createError({ statusCode: 400, statusMessage: 'Missing GPX file field "file"' })
  }

  if (filePart.data.byteLength > MAX_GPX_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'GPX file must be 15 MB or smaller' })
  }

  const filename = filePart.filename || 'route.gpx'
  const lowerName = filename.toLowerCase()
  if (!lowerName.endsWith('.gpx') && !lowerName.endsWith('.xml')) {
    throw createError({ statusCode: 400, statusMessage: 'Upload a .gpx file' })
  }

  const namePart = form.find((part) => part.name === 'name')
  const requestedName = namePart?.data
    ? Buffer.from(namePart.data).toString('utf8').trim()
    : ''
  const name = (requestedName || nameFromGpxFilename(filename)).slice(0, 200)
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Route name is required' })
  }

  const xml = Buffer.from(filePart.data).toString('utf8')
  const track = parseGpxToTrack(xml)

  const routeId = randomUUID()
  const gpxPath = `${userId}/${routeId}.gpx`
  const supabase = await serverSupabaseClient<Database>(event)

  const { error: uploadError } = await supabase.storage
    .from('gpx')
    .upload(gpxPath, filePart.data, {
      contentType: 'application/gpx+xml',
      upsert: false,
    })

  if (uploadError) {
    throw createError({
      statusCode: 500,
      statusMessage: `GPX storage upload failed: ${uploadError.message}`,
    })
  }

  let country: string | null = null
  let region: string | null = null
  const startPosition = track.coordinates[0]

  if(startPosition) {
    const [startLon, startLat] = startPosition as [number, number]
    const place = await reverseGeocode(startLon, startLat)
    country = place.country
    region = place.region
  }

  const { data: route, error: insertError } = await supabase
    .from('routes')
    .insert({
      id: routeId,
      owner_id: userId,
      name,
      geom: track.ewkt,
      gpx_path: gpxPath,
      distance_m: track.distanceM,
      country,
      region,
    })
    .select('id, name, distance_m, gpx_path, country, region, created_at')
    .single()

  if (insertError) {
    await supabase.storage.from('gpx').remove([gpxPath])
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to save route: ${insertError.message}`,
    })
  }

  return { route }
})
