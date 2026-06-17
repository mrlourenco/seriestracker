-- ============================================================
-- Migration v2: Profiles, Dashboard Sharing, Next Episode
-- ============================================================

-- 1. Profiles table (public mirror of auth.users)
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text unique,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create/update profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email        = excluded.email,
    display_name = excluded.display_name,
    avatar_url   = excluded.avatar_url;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Profile shares table
create table if not exists public.profile_shares (
  id         uuid primary key default uuid_generate_v4(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  viewer_id  uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(owner_id, viewer_id),
  check (owner_id <> viewer_id)
);

alter table public.profile_shares enable row level security;

create policy "Owners can manage their shares"
  on public.profile_shares for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Viewers can see shares directed at them"
  on public.profile_shares for select
  using (auth.uid() = viewer_id);

-- 3. Expand series SELECT policy to allow shared access
drop policy if exists "Users can view own series" on public.series;

create policy "Users can view own or shared series"
  on public.series for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profile_shares
      where owner_id = series.user_id
        and viewer_id = auth.uid()
    )
  );

-- 4. Add next episode columns to series
alter table public.series
  add column if not exists next_episode_date    date,
  add column if not exists next_episode_season  integer check (next_episode_season >= 1),
  add column if not exists next_episode_number  integer check (next_episode_number >= 1),
  add column if not exists next_episode_title   text;
