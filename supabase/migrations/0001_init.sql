-- Traveler Map: initial schema
-- Run once in Supabase Dashboard -> SQL Editor.

-- ============================================================
-- Types
-- ============================================================
create type public.user_role as enum ('member', 'admin');
create type public.content_type as enum ('facebook', 'link');

-- ============================================================
-- Tables
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  facebook_profile_url text
    check (facebook_profile_url is null
           or facebook_profile_url ~* '^https://([a-z]+\.)?facebook\.com/'),
  role public.user_role not null default 'member',
  is_banned boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.spots (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  description text check (char_length(description) <= 1000),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  address text check (char_length(address) <= 300),
  google_place_id text unique,
  created_by uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index spots_created_by_idx on public.spots (created_by);

create table public.spot_contents (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots (id) on delete cascade,
  type public.content_type not null,
  url text not null check (url ~* '^https?://' and char_length(url) <= 2048),
  note text check (char_length(note) <= 500),
  preview_title text check (char_length(preview_title) <= 300),
  preview_description text check (char_length(preview_description) <= 1000),
  preview_image text check (preview_image is null or preview_image ~* '^https://'),
  preview_site_name text check (char_length(preview_site_name) <= 100),
  created_by uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index spot_contents_spot_id_idx on public.spot_contents (spot_id, created_at desc);
create index spot_contents_created_by_idx on public.spot_contents (created_by);

-- ============================================================
-- Helper functions (security definer so RLS policies can call them
-- without recursing into profiles' own RLS)
-- ============================================================
create function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and not is_banned
  );
$$;

create function public.is_active_member()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and not is_banned
  );
$$;

-- Create a profile automatically when someone signs in for the first time.
create function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name',
             new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Members may edit their own profile, but only admins may change
-- role / is_banned. Direct SQL (Dashboard, service role) is not restricted,
-- which is how the first admin gets assigned.
create function public.guard_profile_update()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated')
     and (new.role is distinct from old.role
          or new.is_banned is distinct from old.is_banned
          or new.id is distinct from old.id)
     and not public.is_admin() then
    raise exception 'Only admins can change role or ban status';
  end if;
  return new;
end;
$$;

create trigger guard_profile_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.guard_profile_update() from public, anon, authenticated;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.spots enable row level security;
alter table public.spot_contents enable row level security;

-- profiles
create policy "profiles are public"
  on public.profiles for select to anon, authenticated using (true);

create policy "users update own profile, admins update any"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

-- spots
create policy "spots are public"
  on public.spots for select to anon, authenticated using (true);

create policy "members create spots"
  on public.spots for insert to authenticated
  with check (created_by = (select auth.uid()) and (select public.is_active_member()));

create policy "owners or admins update spots"
  on public.spots for update to authenticated
  using ((created_by = (select auth.uid()) and (select public.is_active_member()))
         or (select public.is_admin()))
  with check ((created_by = (select auth.uid()) and (select public.is_active_member()))
              or (select public.is_admin()));

create policy "owners or admins delete spots"
  on public.spots for delete to authenticated
  using ((created_by = (select auth.uid()) and (select public.is_active_member()))
         or (select public.is_admin()));

-- spot_contents
create policy "contents are public"
  on public.spot_contents for select to anon, authenticated using (true);

create policy "members create contents"
  on public.spot_contents for insert to authenticated
  with check (created_by = (select auth.uid()) and (select public.is_active_member()));

create policy "owners or admins update contents"
  on public.spot_contents for update to authenticated
  using ((created_by = (select auth.uid()) and (select public.is_active_member()))
         or (select public.is_admin()))
  with check ((created_by = (select auth.uid()) and (select public.is_active_member()))
              or (select public.is_admin()));

create policy "owners or admins delete contents"
  on public.spot_contents for delete to authenticated
  using ((created_by = (select auth.uid()) and (select public.is_active_member()))
         or (select public.is_admin()));

-- ============================================================
-- Grants (explicit, so the Data API can reach the tables)
-- ============================================================
grant select on public.profiles, public.spots, public.spot_contents to anon, authenticated;
grant update on public.profiles to authenticated;
grant insert, update, delete on public.spots, public.spot_contents to authenticated;
