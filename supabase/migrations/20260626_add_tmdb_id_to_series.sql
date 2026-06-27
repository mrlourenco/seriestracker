alter table public.series
  add column if not exists tmdb_id integer;

create index if not exists idx_series_tmdb_id
  on public.series (tmdb_id);
