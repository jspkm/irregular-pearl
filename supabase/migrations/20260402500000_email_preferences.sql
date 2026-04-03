-- Email preferences per user
-- Each preference defaults to true (opted in). Users can toggle off.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_weekly_digest boolean NOT NULL DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_activity boolean NOT NULL DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_welcome boolean NOT NULL DEFAULT true;
