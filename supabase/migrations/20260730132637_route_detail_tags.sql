-- Structured route detail tags: transport, difficulty, surface (nullable / unset).

create type public.route_transport as enum (
  'car',
  'motorcycle',
  'on_foot',
  'bicycle',
  'atv_utv',
  'road_vehicle',
  'offroad_vehicle'
);

create type public.route_difficulty as enum (
  'easy',
  'medium',
  'hard'
);

create type public.route_surface as enum (
  'fully_offroad',
  'pavement',
  'includes_offroad'
);

alter table public.routes
  add column transport public.route_transport,
  add column difficulty public.route_difficulty,
  add column surface public.route_surface;

create index routes_owner_surface_idx on public.routes (owner_id, surface);
create index routes_owner_transport_idx on public.routes (owner_id, transport);
create index routes_owner_difficulty_idx on public.routes (owner_id, difficulty);

comment on column public.routes.transport is 'How the route was traveled; null = unset.';
comment on column public.routes.difficulty is 'Perceived difficulty; null = unset.';
comment on column public.routes.surface is 'Pavement / off-road mix; null = unset.';

-- list_map_routes / get_map_route: include detail tags (DROP required to change RETURNS TABLE).
drop function if exists public.list_map_routes(uuid);
drop function if exists public.get_map_route(uuid);

create function public.list_map_routes(p_owner_id uuid)
returns table (
  id uuid,
  name text,
  description text,
  distance_m double precision,
  country text,
  region text,
  gpx_path text,
  thumb_path text,
  transport public.route_transport,
  difficulty public.route_difficulty,
  surface public.route_surface,
  created_at timestamptz,
  geometry json
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    r.id,
    r.name,
    r.description,
    r.distance_m,
    r.country,
    r.region,
    r.gpx_path,
    (
      select ri.thumb_path
      from public.route_images ri
      where ri.route_id = r.id
      order by ri.sort_order asc, ri.created_at asc
      limit 1
    ) as thumb_path,
    r.transport,
    r.difficulty,
    r.surface,
    r.created_at,
    ST_AsGeoJSON(r.geom)::json as geometry
  from public.routes r
  where r.owner_id = p_owner_id
  order by r.created_at desc;
$$;

create function public.get_map_route(p_route_id uuid)
returns table (
  id uuid,
  owner_id uuid,
  name text,
  description text,
  distance_m double precision,
  country text,
  region text,
  gpx_path text,
  transport public.route_transport,
  difficulty public.route_difficulty,
  surface public.route_surface,
  created_at timestamptz,
  geometry json
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    r.id,
    r.owner_id,
    r.name,
    r.description,
    r.distance_m,
    r.country,
    r.region,
    r.gpx_path,
    r.transport,
    r.difficulty,
    r.surface,
    r.created_at,
    ST_AsGeoJSON(r.geom)::json as geometry
  from public.routes r
  where r.id = p_route_id;
$$;

comment on function public.list_map_routes(uuid) is
  'Profile map routes for an owner; geometry is GeoJSON for MapLibre; thumb_path is first route image thumb when present.';

comment on function public.get_map_route(uuid) is
  'One route by id with GeoJSON geometry and detail tags (detail / edit deep links).';

grant execute on function public.list_map_routes(uuid) to anon, authenticated;
grant execute on function public.get_map_route(uuid) to anon, authenticated;
