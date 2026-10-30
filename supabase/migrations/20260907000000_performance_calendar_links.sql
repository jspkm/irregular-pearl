-- Add public concert links to the existing user performance calendar.
alter table public.performances
  add column if not exists concert_url text;

alter table public.performances
  drop constraint if exists performances_concert_url_http;

alter table public.performances
  add constraint performances_concert_url_http
  check (concert_url is null or concert_url ~ '^https?://');

create index if not exists idx_performances_piece_date
  on public.performances(piece_id, date);
