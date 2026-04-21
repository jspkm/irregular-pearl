-- Garbage-collect stale unconfirmed auth.users rows.
--
-- An email/password signup that never clicks the confirmation link leaves a
-- row in auth.users with email_confirmed_at = null. It also creates a row in
-- public.users via the handle_new_user trigger (display_name = email). These
-- rows are unreachable — the user can't sign in — but they squat on the
-- email and (more importantly) leak the email address through any public
-- view that exposes display_name.
--
-- Mitigation: run daily at 03:00 UTC, delete every auth.users row with
-- email_confirmed_at IS NULL older than 7 days. public.users cascades via FK
-- (public.users.id references auth.users(id) on delete cascade, see initial
-- schema migration). Cron job uses pg_cron which Supabase ships enabled on
-- the postgres role.

create extension if not exists pg_cron with schema extensions;

create or replace function public.gc_unconfirmed_auth_users()
returns integer
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  deleted_count integer;
begin
  with victims as (
    delete from auth.users
    where email_confirmed_at is null
      and created_at < now() - interval '7 days'
    returning id
  )
  select count(*) into deleted_count from victims;
  return deleted_count;
end;
$$;

revoke all on function public.gc_unconfirmed_auth_users() from public, anon, authenticated;

-- Schedule daily at 03:00 UTC. Unschedule first so re-running the migration
-- is idempotent. cron.unschedule throws if the job doesn't exist, so wrap it.
do $$
begin
  perform cron.unschedule('gc_unconfirmed_auth_users');
exception when others then
  null;
end $$;

select cron.schedule(
  'gc_unconfirmed_auth_users',
  '0 3 * * *',
  $cron$ select public.gc_unconfirmed_auth_users() $cron$
);
