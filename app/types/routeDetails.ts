import type { ComboboxOption } from '~/types/mapFilters'

export const ROUTE_TRANSPORT_VALUES = [
  'car',
  'motorcycle',
  'on_foot',
  'bicycle',
  'atv_utv',
  'road_vehicle',
  'offroad_vehicle',
] as const

export type RouteTransport = (typeof ROUTE_TRANSPORT_VALUES)[number]

export const ROUTE_DIFFICULTY_VALUES = [
  'easy',
  'medium',
  'hard',
] as const

export type RouteDifficulty = (typeof ROUTE_DIFFICULTY_VALUES)[number]

export const ROUTE_SURFACE_VALUES = [
  'fully_offroad',
  'pavement',
  'includes_offroad',
] as const

export type RouteSurface = (typeof ROUTE_SURFACE_VALUES)[number]

export const ROUTE_TRANSPORT_LABELS: Record<RouteTransport, string> = {
  car: 'Car',
  motorcycle: 'Motorcycle',
  on_foot: 'On foot',
  bicycle: 'Bicycle',
  atv_utv: 'ATV / UTV',
  road_vehicle: 'Road vehicle',
  offroad_vehicle: 'Off-road vehicle',
}

export const ROUTE_DIFFICULTY_LABELS: Record<RouteDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export const ROUTE_SURFACE_LABELS: Record<RouteSurface, string> = {
  fully_offroad: 'Fully off-road',
  pavement: 'Pavement',
  includes_offroad: 'Includes off-road',
}

export const routeTransportOptions = (): ComboboxOption[] =>
  ROUTE_TRANSPORT_VALUES.map((value) => ({
    value,
    label: ROUTE_TRANSPORT_LABELS[value],
  }))

export const routeDifficultyOptions = (): ComboboxOption[] =>
  ROUTE_DIFFICULTY_VALUES.map((value) => ({
    value,
    label: ROUTE_DIFFICULTY_LABELS[value],
  }))

export const routeSurfaceOptions = (): ComboboxOption[] =>
  ROUTE_SURFACE_VALUES.map((value) => ({
    value,
    label: ROUTE_SURFACE_LABELS[value],
  }))

/** Select options including an unset (“—”) entry with empty string value. */
export const withUnsetOption = (options: ComboboxOption[]): ComboboxOption[] => [
  { value: '', label: '—' },
  ...options,
]

/** Filter select options including an “All” entry with empty string value. */
export const withAllOption = (options: ComboboxOption[]): ComboboxOption[] => [
  { value: '', label: 'All' },
  ...options,
]

export const isRouteTransport = (value: string): value is RouteTransport =>
  (ROUTE_TRANSPORT_VALUES as readonly string[]).includes(value)

export const isRouteDifficulty = (value: string): value is RouteDifficulty =>
  (ROUTE_DIFFICULTY_VALUES as readonly string[]).includes(value)

export const isRouteSurface = (value: string): value is RouteSurface =>
  (ROUTE_SURFACE_VALUES as readonly string[]).includes(value)

export const routeDetailTagLabels = (details: {
  transport: RouteTransport | null
  difficulty: RouteDifficulty | null
  surface: RouteSurface | null
}): string[] => {
  const labels: string[] = []
  if (details.transport) labels.push(ROUTE_TRANSPORT_LABELS[details.transport])
  if (details.difficulty) labels.push(ROUTE_DIFFICULTY_LABELS[details.difficulty])
  if (details.surface) labels.push(ROUTE_SURFACE_LABELS[details.surface])
  return labels
}
