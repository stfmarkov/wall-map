-- Points of interest: pin-based map objects owned by a profile
create table public.points_of_interest (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  geom geography(Point, 4326) not null,
  country text,
  region text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint points_of_interest_name_length check (
    char_length(trim(name)) >= 1
    and char_length(name) <= 200
  ),
  constraint points_of_interest_description_length check (
    description is null
    or char_length(description) <= 5000
  )
);

create index points_of_interest_geom_gix on public.points_of_interest using gist (geom);
create index points_of_interest_owner_id_idx on public.points_of_interest (owner_id);
create index points_of_interest_owner_country_idx on public.points_of_interest (owner_id, country);

comment on table public.points_of_interest is 'Pin on a user map; geometry is a single Point (WGS84).';
comment on column public.points_of_interest.geom is 'Place location as geography Point (WGS84).';
comment on column public.points_of_interest.country is 'Denormalized at create via reverse-geocode of the pin.';
comment on column public.points_of_interest.region is 'Denormalized at create via reverse-geocode of the pin.';

-- Keep updated_at current on row changes
create or replace function public.set_points_of_interest_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger points_of_interest_set_updated_at
  before update on public.points_of_interest
  for each row
  execute function public.set_points_of_interest_updated_at();

-- RLS
alter table public.points_of_interest enable row level security;

-- Owners always see their POIs; others only when the owner profile is public
create policy "POIs are viewable when owner profile is public or own"
  on public.points_of_interest
  for select
  to anon, authenticated
  using (
    auth.uid() = owner_id
    or exists (
      select 1
      from public.profiles p
      where p.id = owner_id
        and p.is_public = true
    )
  );

create policy "Users can insert own POIs"
  on public.points_of_interest
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "Users can update own POIs"
  on public.points_of_interest
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Users can delete own POIs"
  on public.points_of_interest
  for delete
  to authenticated
  using (auth.uid() = owner_id);

-- Profile map list + single-row fetch (GeoJSON for MapLibre)
create function public.list_map_pois(p_owner_id uuid)
returns table (
  id uuid,
  name text,
  description text,
  country text,
  region text,
  created_at timestamptz,
  geometry json
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.id,
    p.name,
    p.description,
    p.country,
    p.region,
    p.created_at,
    ST_AsGeoJSON(p.geom)::json as geometry
  from public.points_of_interest p
  where p.owner_id = p_owner_id
  order by p.created_at desc;
$$;

create function public.get_map_poi(p_poi_id uuid)
returns table (
  id uuid,
  owner_id uuid,
  name text,
  description text,
  country text,
  region text,
  created_at timestamptz,
  geometry json
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.id,
    p.owner_id,
    p.name,
    p.description,
    p.country,
    p.region,
    p.created_at,
    ST_AsGeoJSON(p.geom)::json as geometry
  from public.points_of_interest p
  where p.id = p_poi_id;
$$;

comment on function public.list_map_pois(uuid) is
  'Profile map POIs for an owner; geometry is GeoJSON for MapLibre.';

comment on function public.get_map_poi(uuid) is
  'One POI by id with GeoJSON geometry (detail / edit deep links).';

grant execute on function public.list_map_pois(uuid) to anon, authenticated;
grant execute on function public.get_map_poi(uuid) to anon, authenticated;
