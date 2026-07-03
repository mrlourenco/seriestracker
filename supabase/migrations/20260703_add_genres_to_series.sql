-- The app reads and backfills series.genres (see Top page) but the column
-- was never captured in a migration. Adds it for anyone recreating the DB.
alter table public.series
  add column if not exists genres text[];
