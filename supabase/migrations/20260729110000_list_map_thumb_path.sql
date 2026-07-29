-- First-image thumb path for map listings (hover preview later).
-- Must DROP first: Postgres cannot change RETURNS TABLE via CREATE OR REPLACE.
drop function if exists public.list_map_routes(uuid);
drop function if exists public.list_map_pois(uuid);

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
    r.created_at,
    ST_AsGeoJSON(r.geom)::json as geometry
  from public.routes r
  where r.owner_id = p_owner_id
  order by r.created_at desc;
$$;

create function public.list_map_pois(p_owner_id uuid)
returns table (
  id uuid,
  name text,
  description text,
  country text,
  region text,
  thumb_path text,
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
    (
      select pi.thumb_path
      from public.poi_images pi
      where pi.poi_id = p.id
      order by pi.sort_order asc, pi.created_at asc
      limit 1
    ) as thumb_path,
    p.created_at,
    ST_AsGeoJSON(p.geom)::json as geometry
  from public.points_of_interest p
  where p.owner_id = p_owner_id
  order by p.created_at desc;
$$;

comment on function public.list_map_routes(uuid) is
  'Profile map routes for an owner; geometry is GeoJSON for MapLibre; thumb_path is first route image thumb when present.';

comment on function public.list_map_pois(uuid) is
  'Profile map POIs for an owner; geometry is GeoJSON for MapLibre; thumb_path is first POI image thumb when present.';

grant execute on function public.list_map_routes(uuid) to anon, authenticated;
grant execute on function public.list_map_pois(uuid) to anon, authenticated;
