-- Return owner routes with geometry as GeoJSON (for MapLibre). RLS applies via security invoker.
create or replace function public.list_map_routes(p_owner_id uuid)
returns table (
  id uuid,
  name text,
  description text,
  distance_m double precision,
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
    r.id,
    r.name,
    r.description,
    r.distance_m,
    r.country,
    r.region,
    r.created_at,
    ST_AsGeoJSON(r.geom)::json as geometry
  from public.routes r
  where r.owner_id = p_owner_id
  order by r.created_at desc;
$$;

comment on function public.list_map_routes(uuid) is
  'Profile map routes for an owner; geometry is GeoJSON for MapLibre.';

grant execute on function public.list_map_routes(uuid) to anon, authenticated;
