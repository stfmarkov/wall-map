import sharp from 'sharp'

export const MAX_PHOTO_BYTES = 15 * 1024 * 1024
export const DISPLAY_MAX_EDGE = 1920
export const THUMB_MAX_EDGE = 400

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])

export const isAllowedPhotoMime = (mime: string | undefined) =>
  Boolean(mime && ALLOWED_MIME.has(mime.toLowerCase()))

export type PhotoVariants = {
  display: Buffer
  thumb: Buffer
}

export const buildPhotoVariants = async (input: Buffer): Promise<PhotoVariants> => {
  const base = sharp(input, { failOn: 'none' }).rotate()

  const [display, thumb] = await Promise.all([
    base
      .clone()
      .resize({
        width: DISPLAY_MAX_EDGE,
        height: DISPLAY_MAX_EDGE,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .avif({ quality: 60 })
      .toBuffer(),
    base
      .clone()
      .resize({
        width: THUMB_MAX_EDGE,
        height: THUMB_MAX_EDGE,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .avif({ quality: 50 })
      .toBuffer(),
  ])

  return { display, thumb }
}
