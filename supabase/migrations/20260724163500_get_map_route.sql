-- Single route with GeoJSON geometry. RLS applies via security invoker.
create or replace function public.get_map_route(p_route_id uuid)
returns table (
  id uuid,
  owner_id uuid,
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
    r.owner_id,
    r.name,
    r.description,
    r.distance_m,
    r.country,
    r.region,
    r.created_at,
    ST_AsGeoJSON(r.geom)::json as geometry
  from public.routes r
  where r.id = p_route_id;
$$;

comment on function public.get_map_route(uuid) is
  'One route by id with GeoJSON geometry (detail / edit deep links).';

grant execute on function public.get_map_route(uuid) to anon, authenticated;
