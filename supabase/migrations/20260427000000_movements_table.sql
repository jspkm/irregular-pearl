-- Slice C Step 2: materialize movements as first-class Postgres entity.
--
-- Until now, each piece carried its movements as an inline array in
-- src/data/seed.ts — never persisted to the DB. Slice C introduces
-- landmarks, which need a stable movement_id FK; that forces movements
-- to exist as rows.
--
-- Governance model (per PLAN-contributor-pipeline-slice-c.md §1.4):
--   Movements are wiki-edit content. Any authenticated user can update a
--   movement via the update_movement RPC (landing in Step 3). Every edit
--   writes a new movement_versions row; revert creates another version
--   pointing back. No approval queue, no byline enforcement. Initial seed
--   versions have authored_by = NULL (rendered as "Seed data" in the UI).
--
-- This migration creates the SCHEMA ONLY. Population happens via
-- supabase/seed.ts, consistent with how pieces / editions / external_links
-- already work — seed.ts is the authoritative source for curated catalog
-- data. Running `bun run supabase/seed.ts` after `supabase db reset` seeds
-- pieces THEN movements THEN versions in the correct order.
--
-- Eng-review open question on "seed from seed.ts vs pieces.movements jsonb":
-- resolved toward seed.ts as source of truth. Drift detection for any
-- piece lacking a movement row is an integration test (seed-time check),
-- not a migration-time check.

begin;

-- ============================================
-- movements — the editable entity.
-- ============================================
--
-- `meter` extends plan §2.3 (name, tempo_indication, key_signature) because
-- src/data/seed.ts already carries a meter per movement. Persisting it keeps
-- editorial data.

create table public.movements (
  id uuid primary key default gen_random_uuid(),
  piece_id text not null references public.pieces(id) on delete cascade,
  ordinal smallint not null,
  name text not null,
  tempo_indication text,
  key_signature text,
  meter text,
  current_version_id uuid,  -- composite FK wired after movement_versions exists
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (piece_id, ordinal),
  check (char_length(name) between 1 and 200)
);

create index ix_movements_piece_ordinal on public.movements (piece_id, ordinal);

-- ============================================
-- movement_versions — append-only history.
-- ============================================

create table public.movement_versions (
  id uuid primary key default gen_random_uuid(),
  movement_id uuid not null references public.movements(id) on delete cascade,
  piece_id text not null,
  ordinal smallint not null,
  name text not null,
  tempo_indication text,
  key_signature text,
  meter text,
  version_number integer not null,
  authored_by uuid references public.users(id), -- null = initial seed; non-null for user wiki edits
  created_at timestamptz not null default now(),
  edit_summary text,
  reverted_from_version_id uuid references public.movement_versions(id),
  unique (movement_id, version_number),
  unique (movement_id, id)  -- composite FK target
);

create index ix_movement_versions_movement_version
  on public.movement_versions (movement_id, version_number desc);

-- Composite FK: current_version_id must belong to the same movement.
alter table public.movements
  add constraint fk_movements_current_version_matches
  foreign key (id, current_version_id)
  references public.movement_versions (movement_id, id)
  deferrable initially deferred;

-- ============================================
-- RLS — both tables publicly readable.
-- ============================================

alter table public.movements enable row level security;
alter table public.movement_versions enable row level security;

create policy movements_select_public
  on public.movements
  for select
  to anon, authenticated
  using (true);

create policy movement_versions_select_public
  on public.movement_versions
  for select
  to anon, authenticated
  using (true);

-- Mutations go through Step 3 RPCs (update_movement, revert_movement),
-- which use security-definer. No direct client insert/update/delete policies.

commit;
