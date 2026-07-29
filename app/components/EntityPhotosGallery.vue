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

const SIGNED_URL_SECONDS = 60 * 60

const signDisplay = async (displayPath: string) => {
  const { data, error } = await supabase.storage
    .from('photos')
    .createSignedUrl(displayPath, SIGNED_URL_SECONDS)

  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

const loadPhotos = async () => {
  loading.value = true

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

    photos.value = await Promise.all(
      (data ?? []).map(async (row) => ({
        id: row.id,
        display_path: row.display_path,
        thumb_path: row.thumb_path,
        sort_order: row.sort_order,
        displayUrl: await signDisplay(row.display_path),
      })),
    )
  }
  catch {
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

const hasPhotos = computed(() => photos.value.length > 0)
</script>

<template>
  <section
    v-if="loading || hasPhotos"
    class="gallery"
    aria-label="Photos"
  >
    <h2 class="title">Photos</h2>
    <p v-if="loading" class="status">Loading photos…</p>
    <ul v-else class="list">
      <EntityPhotosGalleryItem
        v-for="photo in photos"
        :key="photo.id"
        :photo="photo"
      />
    </ul>
  </section>
</template>

<style scoped>
.gallery {
  display: grid;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.title {
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #9bb09a;
  font-weight: 600;
}

.status {
  margin: 0;
  font-size: 0.9rem;
  color: #8a857c;
}

.list {
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.85rem;
}
</style>
