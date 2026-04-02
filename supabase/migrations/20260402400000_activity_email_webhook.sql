-- Trigger activity email Edge Function on activity_log INSERT.
-- Uses pg_net to call the function asynchronously.

create or replace function public.send_activity_email()
returns trigger as $$
begin
  perform net.http_post(
    url := 'https://dwtwmpcaylxgprdwaggl.supabase.co/functions/v1/send-activity-email',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3dHdtcGNheWx4Z3ByZHdhZ2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjUxODcsImV4cCI6MjA5MDI0MTE4N30.Xiub8hNgVQRreTCyrjVx4uT_z7BQl_Kz1usGkwDrrwo"}'::jsonb,
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'activity_log',
      'record', jsonb_build_object(
        'user_id', new.user_id,
        'piece_id', new.piece_id,
        'activity', new.activity
      )
    )
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_activity_log_send_email on public.activity_log;
create trigger on_activity_log_send_email
  after insert on public.activity_log
  for each row execute function public.send_activity_email();
