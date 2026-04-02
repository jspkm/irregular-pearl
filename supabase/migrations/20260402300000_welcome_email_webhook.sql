-- Database webhook: trigger welcome email Edge Function on new user registration.
-- Uses pg_net extension to call the Edge Function asynchronously.

create extension if not exists pg_net with schema extensions;

create or replace function public.send_welcome_email()
returns trigger as $$
begin
  perform net.http_post(
    url := 'https://dwtwmpcaylxgprdwaggl.supabase.co/functions/v1/send-welcome-email',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3dHdtcGNheWx4Z3ByZHdhZ2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjUxODcsImV4cCI6MjA5MDI0MTE4N30.Xiub8hNgVQRreTCyrjVx4uT_z7BQl_Kz1usGkwDrrwo"}'::jsonb,
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'users',
      'record', jsonb_build_object(
        'id', new.id,
        'display_name', new.display_name
      )
    )
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_user_created_send_welcome on public.users;
create trigger on_user_created_send_welcome
  after insert on public.users
  for each row execute function public.send_welcome_email();
