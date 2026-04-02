-- Rename vanity_slug to username
ALTER TABLE public.users RENAME COLUMN vanity_slug TO username;

-- Rename the unique index if it exists
ALTER INDEX IF EXISTS users_vanity_slug_key RENAME TO users_username_key;
