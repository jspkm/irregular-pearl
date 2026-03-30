-- Migration: Replace working_on with activity_log
-- Run this in Supabase SQL Editor

-- Activity type enum
create type activity_type as enum (
  'working_on',
  'listened',
  'practiced',
  'sight_read',
  'took_lesson',
  'performed'
);

-- Activity log table
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  piece_id text not null references public.pieces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  activity activity_type not null,
  created_at timestamptz default now() not null
);

-- Indexes
create index idx_activity_log_piece on public.activity_log(piece_id);
create index idx_activity_log_user on public.activity_log(user_id);
create index idx_activity_log_piece_user on public.activity_log(piece_id, user_id);

-- RLS
alter table public.activity_log enable row level security;

create policy "Activity log is viewable by everyone"
  on public.activity_log for select using (true);

create policy "Authenticated users can log activity"
  on public.activity_log for insert with check (auth.uid() = user_id);

create policy "Users can delete own activity"
  on public.activity_log for delete using (auth.uid() = user_id);

-- Realtime
alter publication supabase_realtime add table public.activity_log;

-- Migrate existing working_on data
insert into public.activity_log (piece_id, user_id, activity, created_at)
select piece_id, user_id, 'working_on', created_at
from public.working_on;
