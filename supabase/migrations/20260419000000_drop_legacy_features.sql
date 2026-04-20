-- Drop legacy community/events features.
-- Scope: events + event_performances, discussions + reports, activity_log,
-- applause. See PRD.md for the scoped-down product direction.

-- Realtime publication removals (guarded because ALTER PUBLICATION ... DROP
-- TABLE does not accept IF EXISTS)
do $$
declare
  t text;
begin
  for t in select unnest(array['discussions', 'activity_log', 'applause', 'events', 'event_performances'])
  loop
    if exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime drop table public.%I', t);
    end if;
  end loop;
end $$;

-- Triggers and functions tied to activity emails. The trigger drop is wrapped
-- so a fresh replay (where activity_log was never created by any surviving
-- migration) doesn't choke on the missing table.
do $$
begin
  if to_regclass('public.activity_log') is not null then
    drop trigger if exists on_activity_log_send_email on public.activity_log;
  end if;
end;
$$;
drop function if exists public.send_activity_email();

-- Tables (CASCADE removes dependent FKs, indexes, policies)
drop table if exists public.reports cascade;
drop table if exists public.discussions cascade;
drop table if exists public.activity_log cascade;
drop table if exists public.applause cascade;
drop table if exists public.event_performances cascade;
drop table if exists public.events cascade;
drop table if exists public.performances cascade;
drop table if exists public.instrument_history cascade;
drop table if exists public.instruments cascade;

-- Enums
drop type if exists public.activity_type;
drop type if exists public.event_status;
drop type if exists public.event_source;
drop type if exists public.event_type;

-- Email preference columns for deleted features
alter table public.users drop column if exists email_activity;
