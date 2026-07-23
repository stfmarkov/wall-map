-- Routes: path-based map objects owned by a profile
create table public.routes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  geom geography(LineString, 4326) not null,
  country text,
  region text,
  gpx_path text,
  distance_m double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint routes_name_length check (
    char_length(trim(name)) >= 1
    and char_length(name) <= 200
  ),
  constraint routes_description_length check (
    description is null
    or char_length(description) <= 5000
  )
);

create index routes_geom_gix on public.routes using gist (geom);
create index routes_owner_id_idx on public.routes (owner_id);
create index routes_owner_country_idx on public.routes (owner_id, country);

comment on table public.routes is 'GPX-backed path on a user map; geometry is a single LineString (segments merged on import).';
comment on column public.routes.geom is 'Track path as geography LineString (WGS84).';
comment on column public.routes.gpx_path is 'Storage path in the gpx bucket for the original file (export).';
comment on column public.routes.country is 'Denormalized at import via reverse-geocode of start point.';
comment on column public.routes.region is 'Denormalized at import via reverse-geocode of start point.';
comment on column public.routes.distance_m is 'Path length in meters; computed on import/update.';

-- Keep updated_at current on row changes
create or replace function public.set_routes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger routes_set_updated_at
  before update on public.routes
  for each row
  execute function public.set_routes_updated_at();

-- RLS
alter table public.routes enable row level security;

-- Owners always see their routes; others only when the owner profile is public
create policy "Routes are viewable when owner profile is public or own"
  on public.routes
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

create policy "Users can insert own routes"
  on public.routes
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "Users can update own routes"
  on public.routes
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Users can delete own routes"
  on public.routes
  for delete
  to authenticated
  using (auth.uid() = owner_id);
