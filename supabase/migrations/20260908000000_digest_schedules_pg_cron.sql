-- Move the digest schedules off GitHub Actions cron and into pg_cron.
--
-- Why: GitHub disables `schedule:` workflow triggers after ~60 days of
-- repository inactivity. This repo went quiet between 2026-05-02 and
-- 2026-09-07, so both digest workflows flipped to `disabled_inactivity` and
-- stopped firing after 2026-07-12 — nine weekly digests and roughly 57 daily
-- digests were never sent, with no error raised anywhere. Whether a subscriber
-- gets their Sunday email should not depend on how recently anyone pushed
-- code. pg_cron runs inside Postgres and has no repo-activity concept, which
-- is why the gc_unconfirmed_auth_users job (20260511000000) ran straight
-- through the same window.
--
-- Auth: uses the project's anon key, exactly as the welcome-email webhook
-- (20260402300000) already does. The digest functions do not inspect the
-- caller's Authorization header — they read SUPABASE_SERVICE_ROLE_KEY from
-- their own environment — so the anon key is sufficient to clear the edge
-- gateway. Verified against production before writing this migration. No
-- service-role secret is committed.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

create or replace function public.trigger_digest(p_function text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $fn$
begin
  if p_function not in ('send-weekly-digest', 'send-notification-digest') then
    raise exception 'trigger_digest: unsupported function %', p_function;
  end if;

  perform net.http_post(
    url := 'https://dwtwmpcaylxgprdwaggl.supabase.co/functions/v1/' || p_function,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3dHdtcGNheWx4Z3ByZHdhZ2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjUxODcsImV4cCI6MjA5MDI0MTE4N30.Xiub8hNgVQRreTCyrjVx4uT_z7BQl_Kz1usGkwDrrwo'
    ),
    body := '{}'::jsonb
  );
end;
$fn$;

-- Every function in `public` is exposed as an RPC by PostgREST, so without
-- this an anonymous caller could POST /rest/v1/rpc/trigger_digest and fire a
-- mail-out to the whole subscriber list. Only the cron job (running as the
-- table owner) needs it.
revoke all on function public.trigger_digest(text) from public, anon, authenticated;

comment on function public.trigger_digest(text) is
  'Invokes a digest Edge Function via pg_net. Called only by pg_cron; not exposed to PostgREST callers.';

do $sched$
declare
  v_is_local boolean;
begin
  -- The local Supabase CLI stack ships a well-known JWT secret shared by every
  -- install; a hosted project has a unique one. Gating on it means a developer
  -- machine never schedules these jobs. Without the guard, a local stack left
  -- running would POST to the production Edge Function at 13:00 UTC and email
  -- real subscribers from a laptop. Fails safe: an unreadable setting is
  -- treated as local.
  v_is_local := coalesce(current_setting('app.settings.jwt_secret', true), '')
                is distinct from ''
                and current_setting('app.settings.jwt_secret', true)
                    = 'super-secret-jwt-token-with-at-least-32-characters-long';

  if coalesce(current_setting('app.settings.jwt_secret', true), '') = '' then
    v_is_local := true;
  end if;

  -- Unschedule first so re-running the migration is idempotent.
  -- cron.unschedule throws when the job is absent, so each is wrapped.
  begin perform cron.unschedule('send_notification_digest_daily'); exception when others then null; end;
  begin perform cron.unschedule('send_weekly_digest');            exception when others then null; end;

  if v_is_local then
    raise notice 'Local stack detected - digest cron jobs NOT scheduled (they would email production subscribers).';
    return;
  end if;

  -- 13:00 UTC = 06:00 Pacific / 09:00 Eastern. Matches the previous GitHub cron.
  perform cron.schedule(
    'send_notification_digest_daily',
    '0 13 * * *',
    $cron$ select public.trigger_digest('send-notification-digest') $cron$
  );

  -- Sunday 13:30 UTC, offset 30 min from the daily so a user opted into both
  -- does not receive two emails at once.
  perform cron.schedule(
    'send_weekly_digest',
    '30 13 * * 0',
    $cron$ select public.trigger_digest('send-weekly-digest') $cron$
  );

  raise notice 'Digest cron jobs scheduled.';
end
$sched$;
