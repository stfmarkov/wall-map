export type ComboboxOption = {
  value: string
  label: string
}

export type MapContentTypeFilter = 'both' | 'route' | 'poi'

export type MapFiltersSelection = {
  country: string | null
  region: string | null
  contentType: MapContentTypeFilter
}
