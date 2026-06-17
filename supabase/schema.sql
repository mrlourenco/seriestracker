-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Series table
create table if not exists public.series (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  poster_url    text,
  status        text not null check (status in ('watching','completed','want_to_watch','dropped','archived')),
  platform      text check (platform in ('Netflix','Max','Disney+','Prime','Apple TV','Outra')),
  current_season  integer check (current_season >= 1),
  current_episode integer check (current_episode >= 1),
  rating        integer check (rating >= 1 and rating <= 10),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger series_updated_at
  before update on public.series
  for each row execute procedure public.handle_updated_at();

-- Row Level Security
alter table public.series enable row level security;

create policy "Users can view own series"
  on public.series for select
  using (auth.uid() = user_id);

create policy "Users can insert own series"
  on public.series for insert
  with check (auth.uid() = user_id);

create policy "Users can update own series"
  on public.series for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own series"
  on public.series for delete
  using (auth.uid() = user_id);
