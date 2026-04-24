-- Add a per-user pref for the notification digest email (drafts awaiting review).
-- Defaults true — opted in. Surfaced in Settings → Email Preferences alongside
-- the weekly digest toggle, and read by send-notification-digest edge function
-- to gate outbound mail. When false, notifications still appear in the bell +
-- /notifications queue; only the email is suppressed.
--
-- Naming: parallels email_weekly_digest. An older email_activity column was
-- dropped in 20260419000000_drop_legacy_features.sql along with the activity-
-- feed concept; this is a new pref tied specifically to the contribution-
-- draft notification digest, not that legacy surface.

alter table public.users
  add column if not exists email_notification_digest boolean not null default true;
