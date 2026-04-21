-- Contributor approval pipeline — Slice C Step 4: Landmarks schema.
--
-- Adds the LandmarkPacket aggregate — a single signed subject whose nested
-- flags and practice notes ride inside the versioned payload as JSONB, so
-- approve/reject/retract/remove transitions act atomically on the whole
-- landmark. Mirrors Slice A + B shape: one aggregate table, one append-only
-- versions table, state machine via draft_status, state transitions land
-- through security-definer RPCs (shipped in the companion RPC migration).
--
-- Structure:
--   1. flag_type + flag_severity enums (code-defined vocabulary per PRD §7.3).
--   2. landmarks + landmark_versions — aggregate + append-only history.
--      - flags and practice_notes are JSONB arrays on landmark_versions.
--        DB-level CHECK constrains array type + max length; per-element enum
--        and body-length validation happens in _validate_landmark_payload
--        (RPC migration), because CHECK can't enumerate JSONB values.
--   3. Notifications subject_table CHECK widened to include 'landmarks'.
--   4. Notifications parameterized triggers attached to landmarks
--      (removal + hard-delete cleanup).
--   5. Votes orphan-cleanup trigger attached to landmarks. The
--      subject_table CHECK on public.votes already includes 'landmarks'
--      (landed with 20260502000000_votes_schema.sql).
--   6. RLS policies — public reads published, contributor owns drafts,
--      staff sees everything. Mutations exclusively via RPC.
--   7. touch_landmarks_updated_at trigger.
--   8. v_landmark_versions_published view.
--
-- See PLAN-contributor-pipeline-slice-c.md §2.2, §2.4, §2.6, §2.7 for the
-- design rationale.

-- ============================================
-- 1. Flag vocabulary (code-defined enums)
-- ============================================

create type public.flag_type as enum (
  'stamina',
  'bow_control',
  'stretch',
  'voicing',
  'double_stops',
  'sustained_bowing',
  'articulation',
  'rhythmic_lift',
  'intonation',
  'ensemble_coordination'
);

create type public.flag_severity as enum (
  'informational',
  'notable',
  'significant'
);

-- ============================================
-- 2. landmarks (aggregate) + landmark_versions (append-only)
-- ============================================

create table public.landmarks (
  id uuid primary key default gen_random_uuid(),
  piece_id text not null references public.pieces(id) on delete cascade,
  movement_id uuid not null references public.movements(id) on delete cascade,
  contributor_id uuid not null references public.users(id) on delete restrict,
  status draft_status not null default 'draft',
  current_version_id uuid,
  drafted_by uuid references public.users(id),
  submitted_by uuid references public.users(id),
  approved_by uuid references public.users(id),
  rejected_by uuid references public.users(id),
  retracted_by uuid references public.users(id),
  retracted_at timestamptz,
  removed_by uuid references public.users(id),
  removed_at timestamptz,
  approved_by_contributor_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint landmarks_published_has_version
    check ((status <> 'published') or (current_version_id is not null))
);

create index idx_landmarks_piece_published
  on public.landmarks(piece_id)
  where status = 'published';

create index idx_landmarks_movement_published
  on public.landmarks(movement_id)
  where status = 'published';

create index idx_landmarks_contributor_queue
  on public.landmarks(contributor_id)
  where status = 'awaiting_contributor_approval';

create table public.landmark_versions (
  id uuid primary key default gen_random_uuid(),
  landmark_id uuid not null references public.landmarks(id) on delete cascade,
  piece_id text not null references public.pieces(id) on delete cascade,
  movement_id uuid not null references public.movements(id) on delete cascade,
  contributor_id uuid not null references public.users(id) on delete restrict,
  measure_start integer not null,
  measure_end integer,
  label text not null,
  description text,
  ordinal smallint not null default 0,
  flags jsonb not null default '[]'::jsonb,
  practice_notes jsonb not null default '[]'::jsonb,
  version_number integer not null,
  authored_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  rejection_note text,
  constraint uq_lv_landmark_version unique (landmark_id, version_number),
  constraint uq_lv_landmark_id unique (landmark_id, id),
  constraint lv_measure_end_after_start
    check (measure_end is null or measure_end >= measure_start),
  constraint lv_measure_start_positive
    check (measure_start >= 1),
  constraint lv_label_length
    check (char_length(label) between 1 and 60),
  constraint lv_description_length
    check (description is null or char_length(description) <= 4000),
  constraint lv_flags_array_bounded
    check (jsonb_typeof(flags) = 'array' and jsonb_array_length(flags) <= 20),
  constraint lv_practice_notes_array_bounded
    check (jsonb_typeof(practice_notes) = 'array' and jsonb_array_length(practice_notes) <= 10)
);

create index idx_lv_landmark on public.landmark_versions(landmark_id, version_number desc);
create index idx_lv_contributor on public.landmark_versions(contributor_id);

-- Composite FK: a landmark's current_version_id must belong to the same
-- landmark. Requires uq_lv_landmark_id (unique over landmark_id + id).
-- Deferred so the RPC can insert the version row and update the pointer in
-- a single transaction.
alter table public.landmarks
  add constraint fk_landmarks_current_version_matches
  foreign key (id, current_version_id)
  references public.landmark_versions(landmark_id, id)
  deferrable initially deferred;

-- ============================================
-- 3. Notifications: widen subject_table CHECK to include 'landmarks'
-- ============================================

alter table public.notifications
  drop constraint if exists subject_table_allowed;

alter table public.notifications
  add constraint subject_table_allowed
  check (subject_table in (
    'performers_notes',
    'interpretive_schools',
    'piece_descriptions',
    'landmarks'
  ));

-- ============================================
-- 4. Notifications triggers on landmarks
--    Reuse the parameterized helpers from Slice B.
-- ============================================

create trigger trg_clear_notifications_on_landmark_removal
  after update of status on public.landmarks
  for each row
  execute function public.clear_notifications_on_subject_removal('landmarks');

create trigger trg_clear_notifications_on_landmark_delete
  before delete on public.landmarks
  for each row
  execute function public.clear_notifications_on_subject_delete('landmarks');

-- ============================================
-- 5. Votes orphan-cleanup trigger on landmarks
--    Reuses _clear_votes_on_subject_delete (20260502000000_votes_schema.sql).
--    The votes.subject_table CHECK already permits 'landmarks'.
-- ============================================

create trigger trg_clear_votes_landmarks
  after delete on public.landmarks
  for each row
  execute function public._clear_votes_on_subject_delete('landmarks');

-- ============================================
-- 6. RLS — matches Slice A/B shape exactly
-- ============================================

alter table public.landmarks enable row level security;
alter table public.landmark_versions enable row level security;

create policy "Published landmarks are viewable by everyone"
  on public.landmarks for select
  using (status = 'published');

create policy "Contributor can view own landmarks"
  on public.landmarks for select
  using (contributor_id = auth.uid());

create policy "Staff can view all landmarks"
  on public.landmarks for select
  using (public.is_staff());

create policy "Contributor can view versions of own landmarks"
  on public.landmark_versions for select
  using (contributor_id = auth.uid());

create policy "Staff can view all landmark versions"
  on public.landmark_versions for select
  using (public.is_staff());

-- ============================================
-- 7. touch_updated_at
-- ============================================

create function public.touch_landmarks_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_touch_landmarks_updated_at
  before update on public.landmarks
  for each row
  execute function public.touch_landmarks_updated_at();

-- ============================================
-- 8. Published-version view (audit reads + public join path)
-- ============================================

create view public.v_landmark_versions_published as
  select lv.*
  from public.landmarks l
  join public.landmark_versions lv
    on lv.landmark_id = l.id
   and lv.id = l.current_version_id
  where l.status = 'published';

grant select on public.v_landmark_versions_published to authenticated, anon;
