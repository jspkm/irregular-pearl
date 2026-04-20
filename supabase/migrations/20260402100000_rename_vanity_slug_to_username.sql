-- Rename vanity_slug to username (idempotent against fresh-apply).
-- On linked prod the `vanity_slug` column exists and gets renamed. On fresh
-- local Postgres (post-#17 cleanup) neither column exists yet, so we add
-- `username` directly. Downstream migrations reference `username` either way.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'vanity_slug'
  ) then
    alter table public.users rename column vanity_slug to username;
  elsif not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'username'
  ) then
    alter table public.users add column username text unique;
  end if;
end;
$$;

-- Rename the unique index if it exists.
alter index if exists users_vanity_slug_key rename to users_username_key;
