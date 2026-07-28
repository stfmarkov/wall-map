import sharp from 'sharp'
import { isAllowedPhotoMime } from './photos'

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024
export const AVATAR_EDGE = 512

export { isAllowedPhotoMime as isAllowedAvatarMime }

/** Square crop for circular profile display; AVIF for storage savings. */
export const buildAvatarAvif = async (input: Buffer): Promise<Buffer> =>
  sharp(input, { failOn: 'none' })
    .rotate()
    .resize({
      width: AVATAR_EDGE,
      height: AVATAR_EDGE,
      fit: 'cover',
      position: 'centre',
    })
    .avif({ quality: 55 })
    .toBuffer()
