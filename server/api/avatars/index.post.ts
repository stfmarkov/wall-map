import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import {
  buildAvatarAvif,
  isAllowedAvatarMime,
  MAX_AVATAR_BYTES,
} from '../../utils/avatars'

const LEGACY_AVATAR_NAMES = [
  'avatar.jpg',
  'avatar.jpeg',
  'avatar.png',
  'avatar.webp',
  'avatar.gif',
] as const

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
    throw createError({ statusCode: 400, statusMessage: 'Missing image file field "file"' })
  }

  if (filePart.data.byteLength > MAX_AVATAR_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'Avatar must be 2 MB or smaller' })
  }

  const contentType = filePart.type?.toLowerCase()
  if (!isAllowedAvatarMime(contentType)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Upload a JPEG, PNG, WebP, GIF, or AVIF image',
    })
  }

  let avif: Buffer
  try {
    avif = await buildAvatarAvif(Buffer.from(filePart.data))
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Could not process image' })
  }

  const path = `${userId}/avatar.avif`
  const supabase = await serverSupabaseClient<Database>(event)

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, avif, {
      contentType: 'image/avif',
      upsert: true,
    })

  if (uploadError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Avatar upload failed: ${uploadError.message}`,
    })
  }

  const legacyPaths = LEGACY_AVATAR_NAMES.map((name) => `${userId}/${name}`)
  await supabase.storage.from('avatars').remove(legacyPaths)

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)

  return {
    avatar_url: `${data.publicUrl}?v=${Date.now()}`,
  }
})
