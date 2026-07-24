import { searchPlaceBounds } from '../../utils/placeBounds'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const country = typeof query.country === 'string' ? query.country : null
  const region = typeof query.region === 'string' ? query.region : null

  if (!country && !region) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Provide country and/or region',
    })
  }

  const bounds = await searchPlaceBounds(country, region)
  if (!bounds) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Place not found',
    })
  }

  return { bounds }
})
