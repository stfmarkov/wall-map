export type EntityPhotoParent = 'route' | 'poi'

export type EntityPhoto = {
  id: string
  display_path: string
  thumb_path: string
  sort_order: number
  thumbUrl: string | null
}
