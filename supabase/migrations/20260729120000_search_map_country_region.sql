-- Distinct country / region values for map filter comboboxes (owner-scoped).

create function public.search_map_countries(p_owner_id uuid, p_query text)
returns table (value text)
language sql
stable
security invoker
set search_path = public
as $$
  select distinct v.country as value
  from (
    select r.country
    from public.routes r
    where r.owner_id = p_owner_id
      and r.country is not null
      and char_length(trim(p_query)) >= 3
      and r.country ilike '%' || trim(p_query) || '%'
    union all
    select p.country
    from public.points_of_interest p
    where p.owner_id = p_owner_id
      and p.country is not null
      and char_length(trim(p_query)) >= 3
      and p.country ilike '%' || trim(p_query) || '%'
  ) v
  order by v.country;
$$;

create function public.search_map_regions(p_owner_id uuid, p_query text)
returns table (value text)
language sql
stable
security invoker
set search_path = public
as $$
  select distinct v.region as value
  from (
    select r.region
    from public.routes r
    where r.owner_id = p_owner_id
      and r.region is not null
      and char_length(trim(p_query)) >= 3
      and r.region ilike '%' || trim(p_query) || '%'
    union all
    select p.region
    from public.points_of_interest p
    where p.owner_id = p_owner_id
      and p.region is not null
      and char_length(trim(p_query)) >= 3
      and p.region ilike '%' || trim(p_query) || '%'
  ) v
  order by v.region;
$$;

comment on function public.search_map_countries(uuid, text) is
  'Distinct country strings for an owner matching p_query (min 3 chars); for map filter combobox.';

comment on function public.search_map_regions(uuid, text) is
  'Distinct region strings for an owner matching p_query (min 3 chars); for map filter combobox.';

grant execute on function public.search_map_countries(uuid, text) to anon, authenticated;
grant execute on function public.search_map_regions(uuid, text) to anon, authenticated;
