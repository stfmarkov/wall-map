-- Allow AVIF for avatar storage (uploads go through Nitro → sharp → AVIF)
update storage.buckets
set allowed_mime_types = array[
  'image/avif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]
where id = 'avatars';
