-- Drop vestigial users.is_contributor + users.contributor_active columns.
--
-- The Slice C governance migration (20260513000000_open_self_authoring.sql)
-- rewrote _require_active_contributor() to require only auth.uid() is not
-- null, and the staff-draft-for-other RPCs check only that the target user
-- exists. Nothing reads these columns at runtime anymore.
--
-- The columns are kept by older migrations (20260420000000 creates them,
-- 20260420010000 + 20260422000000 reference them in earlier RPC bodies).
-- Those references run before this migration during a fresh `db reset`, so
-- the historical chain stays valid; this migration removes the columns at
-- the end of the chain after every consumer has been removed.

drop index if exists public.idx_users_is_contributor;

alter table public.users
  drop column if exists is_contributor,
  drop column if exists contributor_active;
