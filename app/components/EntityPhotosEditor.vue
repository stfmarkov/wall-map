<script setup lang="ts">
import type { Database } from '~/types/database.types'
import type { EntityPhoto, EntityPhotoParent } from '~/types/entityPhoto'

const props = defineProps<{
  parent: EntityPhotoParent
  parentId: string
}>()

const supabase = useSupabaseClient<Database>()

const photos = ref<EntityPhoto[]>([])
const loading = ref(false)
const uploading = ref(false)
const removingId = ref<string | null>(null)
const errorMessage = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const MAX_PHOTO_BYTES = 15 * 1024 * 1024
const SIGNED_URL_SECONDS = 60 * 60

const errorText = (err: unknown, fallback: string) => {
  if (err instanceof Error && err.message) return err.message
  const shaped = err as {
    data?: { statusMessage?: string; message?: string }
    statusMessage?: string
    message?: string
  }
  return (
    shaped.data?.statusMessage
    || shaped.data?.message
    || shaped.statusMessage
    || shaped.message
    || fallback
  )
}

const signThumb = async (thumbPath: string) => {
  const { data, error } = await supabase.storage
    .from('photos')
    .createSignedUrl(thumbPath, SIGNED_URL_SECONDS)

  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

const toEntityPhoto = async (row: {
  id: string
  display_path: string
  thumb_path: string
  sort_order: number
}): Promise<EntityPhoto> => ({
  id: row.id,
  display_path: row.display_path,
  thumb_path: row.thumb_path,
  sort_order: row.sort_order,
  thumbUrl: await signThumb(row.thumb_path),
})

const loadPhotos = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const query =
      props.parent === 'route'
        ? supabase
            .from('route_images')
            .select('id, display_path, thumb_path, sort_order')
            .eq('route_id', props.parentId)
            .order('sort_order', { ascending: true })
        : supabase
            .from('poi_images')
            .select('id, display_path, thumb_path, sort_order')
            .eq('poi_id', props.parentId)
            .order('sort_order', { ascending: true })

    const { data, error } = await query
    if (error) throw error

    photos.value = await Promise.all((data ?? []).map((row) => toEntityPhoto(row)))
  }
  catch (err) {
    errorMessage.value = errorText(err, 'Failed to load photos')
    photos.value = []
  }
  finally {
    loading.value = false
  }
}

watch(
  () => [props.parent, props.parentId] as const,
  () => {
    void loadPhotos()
  },
  { immediate: true },
)

const nextSortOrder = () => {
  if (!photos.value.length) return 0
  return Math.max(...photos.value.map((photo) => photo.sort_order)) + 1
}

const attachPhoto = async (displayPath: string, thumbPath: string) => {
  const sortOrder = nextSortOrder()

  if (props.parent === 'route') {
    const { data, error } = await supabase
      .from('route_images')
      .insert({
        route_id: props.parentId,
        display_path: displayPath,
        thumb_path: thumbPath,
        sort_order: sortOrder,
      })
      .select('id, display_path, thumb_path, sort_order')
      .single()

    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('poi_images')
    .insert({
      poi_id: props.parentId,
      display_path: displayPath,
      thumb_path: thumbPath,
      sort_order: sortOrder,
    })
    .select('id, display_path, thumb_path, sort_order')
    .single()

  if (error) throw error
  return data
}

const deletePhotoRow = async (photoId: string) => {
  if (props.parent === 'route') {
    const { error } = await supabase.from('route_images').delete().eq('id', photoId)
    if (error) throw error
    return
  }

  const { error } = await supabase.from('poi_images').delete().eq('id', photoId)
  if (error) throw error
}

const onFileChange = async (event: Event) => {
  errorMessage.value = ''
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Choose an image file (JPEG, PNG, WebP, GIF, or AVIF).'
    input.value = ''
    return
  }

  if (file.size > MAX_PHOTO_BYTES) {
    errorMessage.value = 'Image must be 15 MB or smaller.'
    input.value = ''
    return
  }

  uploading.value = true
  let uploadedPaths: string[] | null = null

  try {
    const body = new FormData()
    body.append('file', file)

    const result = await $fetch<{
      photo: { id: string; display_path: string; thumb_path: string }
    }>('/api/photos', {
      method: 'POST',
      body,
    })

    uploadedPaths = [result.photo.display_path, result.photo.thumb_path]

    try {
      const row = await attachPhoto(result.photo.display_path, result.photo.thumb_path)
      photos.value = [...photos.value, await toEntityPhoto(row)]
      uploadedPaths = null
    }
    catch (attachErr) {
      await supabase.storage.from('photos').remove(uploadedPaths!)
      uploadedPaths = null
      throw attachErr
    }
  }
  catch (err) {
    if (uploadedPaths) {
      await supabase.storage.from('photos').remove(uploadedPaths)
    }
    errorMessage.value = errorText(err, 'Failed to add photo')
  }
  finally {
    uploading.value = false
    input.value = ''
  }
}

const removePhoto = async (photo: EntityPhoto) => {
  errorMessage.value = ''
  removingId.value = photo.id

  try {
    await deletePhotoRow(photo.id)
    await supabase.storage
      .from('photos')
      .remove([photo.display_path, photo.thumb_path])
    photos.value = photos.value.filter((entry) => entry.id !== photo.id)
  }
  catch (err) {
    errorMessage.value = errorText(err, 'Failed to remove photo')
  }
  finally {
    removingId.value = null
  }
}

const openPicker = () => {
  fileInput.value?.click()
}
</script>

<template>
  <section class="photos">
    <div class="photos-header">
      <h2 class="photos-title">Photos</h2>
    </div>

    <p v-if="loading" class="status">Loading photos…</p>
    <p v-else-if="!photos.length" class="status muted">No photos yet.</p>

    <ul v-if="photos.length" class="grid">
      <EntityPhotosEditorItem
        v-for="photo in photos"
        :key="photo.id"
        :photo="photo"
        :removing="removingId === photo.id"
        @remove="removePhoto(photo)"
      />
    </ul>

    <input
      ref="fileInput"
      type="file"
      class="file-input"
      accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
      :disabled="uploading || loading"
      @change="onFileChange"
    >

    <UiButton
      type="button"
      variant="ghost"
      :disabled="uploading || loading"
      @click="openPicker"
    >
      {{ uploading ? 'Uploading…' : 'Add photo' }}
    </UiButton>

    <UiMessage v-if="errorMessage" variant="error">{{ errorMessage }}</UiMessage>
  </section>
</template>

<style scoped>
.photos {
  max-width: 36rem;
  margin: 0 auto;
  display: grid;
  gap: 0.85rem;
}

.photos-header {
  display: grid;
  gap: 0.25rem;
}

.photos-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
}

.photos-hint {
  margin: 0;
  font-size: 0.85rem;
  color: #8a857c;
}

.status {
  margin: 0;
  font-size: 0.9rem;
  color: #d5d0c6;
}

.status.muted {
  color: #8a857c;
}

.grid {
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
  gap: 0.75rem;
}

.file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
