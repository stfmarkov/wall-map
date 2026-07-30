import type { RouteDifficulty, RouteSurface, RouteTransport } from '~/types/routeDetails'

export type ComboboxOption = {
  value: string
  label: string
}

export type MapContentTypeFilter = 'both' | 'route' | 'poi'

export type MapFiltersSelection = {
  country: string | null
  region: string | null
  contentType: MapContentTypeFilter
  transport: RouteTransport | null
  difficulty: RouteDifficulty | null
  surface: RouteSurface | null
}

export const emptyMapFilters = (): MapFiltersSelection => ({
  country: null,
  region: null,
  contentType: 'both',
  transport: null,
  difficulty: null,
  surface: null,
})
