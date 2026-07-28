import { randomUUID } from 'node:crypto'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import {
  buildPhotoVariants,
  isAllowedPhotoMime,
  MAX_PHOTO_BYTES,
} from '../../utils/photos'

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

  if (filePart.data.byteLength > MAX_PHOTO_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'Image must be 15 MB or smaller' })
  }

  const contentType = filePart.type?.toLowerCase()
  if (!isAllowedPhotoMime(contentType)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Upload a JPEG, PNG, WebP, GIF, or AVIF image',
    })
  }

  let variants
  try {
    variants = await buildPhotoVariants(Buffer.from(filePart.data))
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Could not process image' })
  }

  const photoId = randomUUID()
  const displayPath = `${userId}/${photoId}/display.avif`
  const thumbPath = `${userId}/${photoId}/thumb.avif`
  const supabase = await serverSupabaseClient<Database>(event)

  const { error: displayError } = await supabase.storage
    .from('photos')
    .upload(displayPath, variants.display, {
      contentType: 'image/avif',
      upsert: false,
    })

  if (displayError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Photo display upload failed: ${displayError.message}`,
    })
  }

  const { error: thumbError } = await supabase.storage
    .from('photos')
    .upload(thumbPath, variants.thumb, {
      contentType: 'image/avif',
      upsert: false,
    })

  if (thumbError) {
    await supabase.storage.from('photos').remove([displayPath])
    throw createError({
      statusCode: 500,
      statusMessage: `Photo thumbnail upload failed: ${thumbError.message}`,
    })
  }

  return {
    photo: {
      id: photoId,
      display_path: displayPath,
      thumb_path: thumbPath,
    },
  }
})
