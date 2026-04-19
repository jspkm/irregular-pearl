-- Drop legacy community/events features.
-- Scope: events + event_performances, discussions + reports, activity_log,
-- applause. See PRD.md for the scoped-down product direction.

-- Realtime publication removals (safe if already removed)
alter publication supabase_realtime drop table if exists public.discussions;
alter publication supabase_realtime drop table if exists public.activity_log;
alter publication supabase_realtime drop table if exists public.applause;
alter publication supabase_realtime drop table if exists public.events;
alter publication supabase_realtime drop table if exists public.event_performances;

-- Triggers and functions tied to activity emails
drop trigger if exists on_activity_log_send_email on public.activity_log;
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
