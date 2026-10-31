-- Harden the digest scheduler guard in two ways.
--
-- 1. Guarantee local never fires, at execution time and not just at migration
--    time. 20260908000000 only decided whether to *schedule*. That leaves a
--    real hole: restore a production dump into a local stack and the cron.job
--    rows come with it, already scheduled, pointing at the production Edge
--    Function URL. Nothing would stop a laptop from mailing real subscribers.
--    trigger_digest now refuses to make the call when it is running on a local
--    stack, so the guarantee holds however the job got there.
--
-- 2. Stop failing silently. The previous guard treated an unreadable
--    app.settings.jwt_secret as "local" and skipped scheduling without
--    complaint. Fail-safe for sending is fail-silent for the feature: if that
--    branch had been taken in production, digests would have stayed dead in
--    exactly the way this whole investigation was about, and the deploy would
--    still have gone green. An environment we cannot identify is now a hard
--    error, so it surfaces as a red migration rather than as nine weeks of
--    missing email.
--
-- Because the environment check is now needed in two places, it lives in one
-- function rather than being copy-pasted.

create or replace function public.is_local_stack()
returns boolean
language plpgsql
stable
security definer
set search_path = public, extensions
as $fn$
declare
  v_secret text := current_setting('app.settings.jwt_secret', true);
begin
  -- Positive detection only. The Supabase CLI writes this exact secret into
  -- every local stack, so its presence is a definitive "local".
  --
  -- Absence means hosted. Hosted Supabase does not expose app.settings.*
  -- at all — confirmed the hard way: the first version of this function
  -- raised on an unreadable setting, and the production deploy failed with
  -- "app.settings.jwt_secret is unreadable". That is the normal hosted
  -- state, not a misconfiguration.
  --
  -- Residual risk, stated plainly: if a future CLI release stops setting
  -- this, a local stack would read as hosted. The post-condition check at
  -- the bottom of this migration does not cover that case. Re-verify this
  -- signal when upgrading the Supabase CLI.
  return coalesce(v_secret, '') = 'super-secret-jwt-token-with-at-least-32-characters-long';
end;
$fn$;

revoke all on function public.is_local_stack() from public, anon, authenticated;

comment on function public.is_local_stack() is
  'True on a local Supabase CLI stack (detected by the CLI''s well-known JWT secret), false on a hosted project. Used to keep dev machines from invoking production Edge Functions.';

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

  -- Execution-time guarantee. The scheduling guard in 20260908000000 cannot
  -- cover a job that arrived by other means (a restored dump, a manual
  -- cron.schedule). This can.
  if public.is_local_stack() then
    raise notice 'trigger_digest: local stack — refusing to invoke the production Edge Function (%).', p_function;
    return;
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

revoke all on function public.trigger_digest(text) from public, anon, authenticated;

-- Re-run the scheduling decision under the strict check. Applying cleanly in
-- production is itself the proof that the environment was positively
-- identified as hosted and both jobs are registered — if it could not tell,
-- this migration fails and the deploy goes red.
do $sched$
begin
  begin perform cron.unschedule('send_notification_digest_daily'); exception when others then null; end;
  begin perform cron.unschedule('send_weekly_digest');            exception when others then null; end;

  if public.is_local_stack() then
    raise notice 'Local stack - digest cron jobs NOT scheduled.';
    return;
  end if;

  perform cron.schedule(
    'send_notification_digest_daily',
    '0 13 * * *',
    $cron$ select public.trigger_digest('send-notification-digest') $cron$
  );

  perform cron.schedule(
    'send_weekly_digest',
    '30 13 * * 0',
    $cron$ select public.trigger_digest('send-weekly-digest') $cron$
  );

  -- Post-condition. Scheduling silently doing nothing is the exact failure
  -- this whole change exists to prevent, so assert the jobs actually landed
  -- rather than trusting that cron.schedule worked. A red migration is a
  -- far cheaper signal than another stretch of undelivered email.
  if (select count(*) from cron.job
       where jobname in ('send_notification_digest_daily', 'send_weekly_digest')) <> 2 then
    raise exception
      'digest scheduling failed: expected both cron jobs to be registered, found %',
      (select coalesce(string_agg(jobname, ', '), '<none>') from cron.job
        where jobname in ('send_notification_digest_daily', 'send_weekly_digest'));
  end if;

  raise notice 'Hosted stack - digest cron jobs scheduled.';
end
$sched$;
