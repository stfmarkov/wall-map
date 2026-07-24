export type ReverseGeocodeResult = {
  country: string | null
  region: string | null
}

type NominatimAddress = {
  country?: string
  state?: string
  region?: string
  county?: string
  state_district?: string
}

type NominatimReverseResponse = {
  address?: NominatimAddress
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse'
const TIMEOUT_MS = 5_000

/**
 * Reverse-geocode a WGS84 point via OpenStreetMap Nominatim.
 * Returns nulls on failure — callers should not block route create on geocode errors.
 */
export const reverseGeocode = async (
  lon: number,
  lat: number,
): Promise<ReverseGeocodeResult> => {
  try {
    const url = new URL(NOMINATIM_URL)
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lon', String(lon))
    url.searchParams.set('format', 'json')
    url.searchParams.set('zoom', '10')

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        // Nominatim requires a valid identifying User-Agent
        'User-Agent': 'WallMap/1.0 (personal route atlas; local-dev)',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!response.ok) {
      return { country: null, region: null }
    }

    const body = (await response.json()) as NominatimReverseResponse
    const address = body.address
    if (!address) {
      return { country: null, region: null }
    }

    const region
      = address.state
        || address.region
        || address.state_district
        || address.county
        || null

    return {
      country: address.country ?? null,
      region,
    }
  }
  catch {
    return { country: null, region: null }
  }
}
