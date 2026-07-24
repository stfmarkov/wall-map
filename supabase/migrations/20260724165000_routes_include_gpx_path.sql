-- Include storage path so clients can download the original GPX.
-- Must DROP first: Postgres cannot change RETURNS TABLE via CREATE OR REPLACE.
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
    r.created_at,
    ST_AsGeoJSON(r.geom)::json as geometry
  from public.routes r
  where r.id = p_route_id;
$$;

comment on function public.list_map_routes(uuid) is
  'Profile map routes for an owner; geometry is GeoJSON for MapLibre.';

comment on function public.get_map_route(uuid) is
  'One route by id with GeoJSON geometry (detail / edit deep links).';

grant execute on function public.list_map_routes(uuid) to anon, authenticated;
grant execute on function public.get_map_route(uuid) to anon, authenticated;
