-- Profiles: public app identity (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_username_format check (
    username is null
    or username ~ '^[a-z0-9_]{3,30}$'
  ),
  constraint profiles_bio_length check (
    bio is null
    or char_length(bio) <= 500
  )
);

create index profiles_username_idx on public.profiles (username)
  where username is not null;

comment on table public.profiles is 'Public profile for each auth user; slug + display fields for map pages.';
comment on column public.profiles.username is 'URL slug for /u/[username]; lowercase letters, digits, underscore.';
comment on column public.profiles.is_public is 'When true, others may read basic profile fields and visit the map.';

-- Keep updated_at current on row changes
create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_profiles_updated_at();

-- Create a profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;

-- Public (and authenticated) can read public profiles; owners can always read their own
create policy "Profiles are viewable when public or own"
  on public.profiles
  for select
  to anon, authenticated
  using (is_public = true or auth.uid() = id);

-- Owners can update their own profile
create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Inserts come from the signup trigger (security definer); no direct client insert
