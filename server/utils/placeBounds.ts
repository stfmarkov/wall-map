export type PlaceBounds = [[number, number], [number, number]]

type NominatimSearchHit = {
  boundingbox?: [string, string, string, string]
}

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search'
const TIMEOUT_MS = 5_000

/**
 * Forward-geocode a place name to a MapLibre-compatible bounds pair (SW, NE).
 */
export const searchPlaceBounds = async (
  country: string | null | undefined,
  region: string | null | undefined,
): Promise<PlaceBounds | null> => {
  const parts = [region, country]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))

  if (!parts.length) return null

  try {
    const url = new URL(NOMINATIM_SEARCH_URL)
    url.searchParams.set('q', parts.join(', '))
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '1')

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'WallMap/1.0 (personal route atlas; local-dev)',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!response.ok) return null

    const results = (await response.json()) as NominatimSearchHit[]
    const box = results[0]?.boundingbox
    if (!box || box.length !== 4) return null

    const south = Number(box[0])
    const north = Number(box[1])
    const west = Number(box[2])
    const east = Number(box[3])

    if ([south, north, west, east].some((value) => Number.isNaN(value))) {
      return null
    }

    return [
      [west, south],
      [east, north],
    ]
  }
  catch {
    return null
  }
}
