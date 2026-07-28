-- Route and POI images (private bucket; path prefix = owner user id)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos',
  'photos',
  false,
  15728640, -- 15 MiB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Owner always; anyone (incl. anon) when the path owner's profile is public.
-- Trailmate read can be added when the trailmates table exists.
create policy "Photos readable by owner or when profile is public"
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id = 'photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1
        from public.profiles p
        where p.id::text = (storage.foldername(name))[1]
          and p.is_public = true
      )
    )
  );

create policy "Users can upload own photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own photos"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own photos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
