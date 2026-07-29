-- Image metadata for routes and POIs (Storage paths live in the photos bucket)
-- Child tables keep gallery order editable without rewriting a JSON blob on the parent.

create table public.route_images (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes (id) on delete cascade,
  display_path text not null,
  thumb_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),

  constraint route_images_display_path_length check (
    char_length(trim(display_path)) >= 1
    and char_length(display_path) <= 1000
  ),
  constraint route_images_thumb_path_length check (
    char_length(trim(thumb_path)) >= 1
    and char_length(thumb_path) <= 1000
  )
);

create index route_images_route_id_sort_idx
  on public.route_images (route_id, sort_order);

comment on table public.route_images is
  'Gallery images for a route; paths are objects in the photos Storage bucket.';
comment on column public.route_images.display_path is
  'Storage path to the display-sized AVIF (max edge 1920).';
comment on column public.route_images.thumb_path is
  'Storage path to the thumbnail AVIF (max edge 400).';
comment on column public.route_images.sort_order is
  'Gallery order within the route (lower first).';

create table public.poi_images (
  id uuid primary key default gen_random_uuid(),
  poi_id uuid not null references public.points_of_interest (id) on delete cascade,
  display_path text not null,
  thumb_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),

  constraint poi_images_display_path_length check (
    char_length(trim(display_path)) >= 1
    and char_length(display_path) <= 1000
  ),
  constraint poi_images_thumb_path_length check (
    char_length(trim(thumb_path)) >= 1
    and char_length(thumb_path) <= 1000
  )
);

create index poi_images_poi_id_sort_idx
  on public.poi_images (poi_id, sort_order);

comment on table public.poi_images is
  'Gallery images for a POI; paths are objects in the photos Storage bucket.';
comment on column public.poi_images.display_path is
  'Storage path to the display-sized AVIF (max edge 1920).';
comment on column public.poi_images.thumb_path is
  'Storage path to the thumbnail AVIF (max edge 400).';
comment on column public.poi_images.sort_order is
  'Gallery order within the POI (lower first).';

-- RLS: same visibility as parent (owner, or owner profile is public)
alter table public.route_images enable row level security;
alter table public.poi_images enable row level security;

create policy "Route images are viewable when parent route is"
  on public.route_images
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.routes r
      where r.id = route_id
        and (
          auth.uid() = r.owner_id
          or exists (
            select 1
            from public.profiles p
            where p.id = r.owner_id
              and p.is_public = true
          )
        )
    )
  );

create policy "Users can insert images on own routes"
  on public.route_images
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.routes r
      where r.id = route_id
        and auth.uid() = r.owner_id
    )
  );

create policy "Users can update images on own routes"
  on public.route_images
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.routes r
      where r.id = route_id
        and auth.uid() = r.owner_id
    )
  )
  with check (
    exists (
      select 1
      from public.routes r
      where r.id = route_id
        and auth.uid() = r.owner_id
    )
  );

create policy "Users can delete images on own routes"
  on public.route_images
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.routes r
      where r.id = route_id
        and auth.uid() = r.owner_id
    )
  );

create policy "POI images are viewable when parent POI is"
  on public.poi_images
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.points_of_interest poi
      where poi.id = poi_id
        and (
          auth.uid() = poi.owner_id
          or exists (
            select 1
            from public.profiles p
            where p.id = poi.owner_id
              and p.is_public = true
          )
        )
    )
  );

create policy "Users can insert images on own POIs"
  on public.poi_images
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.points_of_interest poi
      where poi.id = poi_id
        and auth.uid() = poi.owner_id
    )
  );

create policy "Users can update images on own POIs"
  on public.poi_images
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.points_of_interest poi
      where poi.id = poi_id
        and auth.uid() = poi.owner_id
    )
  )
  with check (
    exists (
      select 1
      from public.points_of_interest poi
      where poi.id = poi_id
        and auth.uid() = poi.owner_id
    )
  );

create policy "Users can delete images on own POIs"
  on public.poi_images
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.points_of_interest poi
      where poi.id = poi_id
        and auth.uid() = poi.owner_id
    )
  );
