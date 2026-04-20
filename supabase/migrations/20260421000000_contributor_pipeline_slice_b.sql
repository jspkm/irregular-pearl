-- Contributor approval pipeline — Slice B (InterpretiveSchool + signed PieceDescription)
-- See PLAN-contributor-pipeline-slice-b.md for the full design rationale.
--
-- Step 1 of the 6-step rollout. This migration is additive: no destructive
-- drops. A later cleanup migration (post-Slice-B) drops the vestigial
-- notifications.performers_note_id column and removes the dual-write.
--
-- This migration adds:
--   1. interpretive_schools + interpretive_school_versions (new subject type)
--      with metadata_updated_by / metadata_updated_at audit columns (4A)
--   2. piece_descriptions + piece_description_versions (new subject type;
--      distinct from the unsigned pieces.description column)
--   3. Polymorphic notifications pivot (additive): adds subject_table +
--      subject_id alongside performers_note_id; backfills; locks NOT NULL;
--      adds CHECK constraining subject_table to the allowed set
--   4. Partial unique index uq_notifications_live_per_subject (CM3:
--      idempotent notification inserts)
--   5. Parameterized trigger functions clear_notifications_on_subject_removal
--      and clear_notifications_on_subject_delete (2A + CM2). Replaces the
--      three-function-copy-paste pattern with TG_ARGV[0] for subject_table.
--   6. Triggers on all three subject tables (performers_notes is rewired to
--      the new parameterized function; interpretive_schools and
--      piece_descriptions get both soft-remove and hard-delete triggers)
--   7. Published-versions views for both new subject types
--   8. RLS policies on all new tables
--
-- Slice A dual-write (CM1) lands in the companion RPC migration
-- 20260421000001_contributor_pipeline_slice_b_rpcs.sql — submit_performers_note
-- is updated to populate BOTH performers_note_id AND (subject_table,
-- subject_id) so Slice A consumers keep working until Step 3 refactors them.

-- ============================================
-- interpretive_schools
-- ============================================

create table public.interpretive_schools (
  id uuid primary key default gen_random_uuid(),
  piece_id text not null references public.pieces(id) on delete cascade,
  contributor_id uuid not null references public.users(id) on delete restrict,
  name text not null,
  tempo_cues jsonb,
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
  metadata_updated_by uuid references public.users(id),
  metadata_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_school_has_version
    check ((status <> 'published') or (current_version_id is not null)),
  constraint school_name_nonempty check (length(trim(name)) > 0)
);

create table public.interpretive_school_versions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.interpretive_schools(id) on delete cascade,
  piece_id text not null references public.pieces(id) on delete cascade,
  contributor_id uuid not null references public.users(id) on delete restrict,
  body text not null,
  authored_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  version_number integer not null,
  rejection_note text,
  constraint uq_isv_school_version unique (school_id, version_number),
  constraint uq_isv_school_id unique (school_id, id)
);

alter table public.interpretive_schools
  add constraint fk_is_current_version_matches_school
  foreign key (id, current_version_id)
  references public.interpretive_school_versions(school_id, id)
  deferrable initially deferred;

create index idx_interpretive_schools_piece_published
  on public.interpretive_schools(piece_id) where status = 'published';
create index idx_interpretive_schools_contributor_queue
  on public.interpretive_schools(contributor_id)
  where status = 'awaiting_contributor_approval';
create index idx_isv_school on public.interpretive_school_versions(school_id, version_number desc);
create index idx_isv_contributor on public.interpretive_school_versions(contributor_id);

-- ============================================
-- piece_descriptions (signed long-form; sibling of unsigned pieces.description)
-- ============================================

create table public.piece_descriptions (
  id uuid primary key default gen_random_uuid(),
  piece_id text not null references public.pieces(id) on delete cascade,
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
  constraint published_description_has_version
    check ((status <> 'published') or (current_version_id is not null))
);

create table public.piece_description_versions (
  id uuid primary key default gen_random_uuid(),
  description_id uuid not null references public.piece_descriptions(id) on delete cascade,
  piece_id text not null references public.pieces(id) on delete cascade,
  contributor_id uuid not null references public.users(id) on delete restrict,
  body text not null,
  authored_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  version_number integer not null,
  rejection_note text,
  constraint uq_pdv_description_version unique (description_id, version_number),
  constraint uq_pdv_description_id unique (description_id, id)
);

alter table public.piece_descriptions
  add constraint fk_pd_current_version_matches_description
  foreign key (id, current_version_id)
  references public.piece_description_versions(description_id, id)
  deferrable initially deferred;

create index idx_piece_descriptions_piece_published
  on public.piece_descriptions(piece_id) where status = 'published';
create index idx_piece_descriptions_contributor_queue
  on public.piece_descriptions(contributor_id)
  where status = 'awaiting_contributor_approval';
create index idx_pdv_description on public.piece_description_versions(description_id, version_number desc);
create index idx_pdv_contributor on public.piece_description_versions(contributor_id);

-- ============================================
-- Published-version views
-- ============================================

create view public.v_interpretive_school_versions_published as
  select v.* from public.interpretive_school_versions v
  join public.interpretive_schools s on s.id = v.school_id
  where s.status = 'published';

comment on view public.v_interpretive_school_versions_published is
  'Version rows for interpretive_schools that are currently published. For audit/historical reads.';

create view public.v_piece_description_versions_published as
  select v.* from public.piece_description_versions v
  join public.piece_descriptions d on d.id = v.description_id
  where d.status = 'published';

comment on view public.v_piece_description_versions_published is
  'Version rows for piece_descriptions that are currently published. For audit/historical reads.';

-- ============================================
-- updated_at touch triggers (parity with performers_notes)
-- ============================================

create function public.touch_interpretive_schools_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_touch_interpretive_schools_updated_at
  before update on public.interpretive_schools
  for each row
  execute function public.touch_interpretive_schools_updated_at();

create function public.touch_piece_descriptions_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_touch_piece_descriptions_updated_at
  before update on public.piece_descriptions
  for each row
  execute function public.touch_piece_descriptions_updated_at();

-- ============================================
-- Notifications polymorphic pivot (additive)
-- ============================================

-- Add polymorphic columns alongside the existing narrow FK.
alter table public.notifications add column subject_table text;
alter table public.notifications add column subject_id uuid;

-- Relax performers_note_id to nullable so new subject-type inserts (schools,
-- descriptions) can leave it NULL while populating (subject_table, subject_id).
-- Existing performers-notes rows keep their value; Slice A dual-writes keep
-- populating it via submit_performers_note for the vestigial window.
alter table public.notifications alter column performers_note_id drop not null;

-- Backfill existing performers-notes notifications.
update public.notifications
  set subject_table = 'performers_notes',
      subject_id = performers_note_id
  where performers_note_id is not null;

-- All existing rows must now be populated; lock NOT NULL.
alter table public.notifications alter column subject_table set not null;
alter table public.notifications alter column subject_id set not null;

-- Constrain subject_table to the known set. Extending to a new subject type
-- is a migration (drop + add CHECK with the new value included).
alter table public.notifications
  add constraint subject_table_allowed
  check (subject_table in ('performers_notes', 'interpretive_schools', 'piece_descriptions'));

-- CM3: partial unique index makes notification inserts idempotent.
-- One un-cleared notification per (subject, type) at a time. ON CONFLICT
-- DO NOTHING in _insert_notification turns retries and double-clicks into
-- no-ops. Re-firing is possible after the prior notification is cleared.
create unique index uq_notifications_live_per_subject
  on public.notifications(subject_table, subject_id, type)
  where cleared_at is null;

-- ============================================
-- Parameterized trigger functions (2A + CM2)
-- ============================================

-- 2A: one function, three triggers. Each trigger passes its subject_table
-- name via TG_ARGV[0]. Adding a fourth subject type in Slice C is a new
-- trigger on that table, not another function copy.
create or replace function public.clear_notifications_on_subject_removal() returns trigger
  language plpgsql security definer set search_path = public as $$
declare
  v_subject_table text := TG_ARGV[0];
begin
  if new.status = 'removed' and (old.status is distinct from new.status) then
    update public.notifications
      set cleared_at = now()
      where subject_table = v_subject_table
        and subject_id = new.id
        and cleared_at is null;
  end if;
  return new;
end;
$$;

comment on function public.clear_notifications_on_subject_removal() is
  'AFTER UPDATE OF status trigger. Clears un-cleared notifications when the subject transitions to status=removed. TG_ARGV[0] carries the subject_table name.';

-- CM2: hard-delete cleanup. Polymorphic notifications don't have ON DELETE
-- CASCADE (no FK). BEFORE DELETE trigger on each subject table removes
-- orphans when the subject row is hard-deleted (e.g. via a piece cascade).
create or replace function public.clear_notifications_on_subject_delete() returns trigger
  language plpgsql security definer set search_path = public as $$
declare
  v_subject_table text := TG_ARGV[0];
begin
  delete from public.notifications
    where subject_table = v_subject_table
      and subject_id = old.id;
  return old;
end;
$$;

comment on function public.clear_notifications_on_subject_delete() is
  'BEFORE DELETE trigger. Deletes notifications referencing the subject row about to be hard-deleted. TG_ARGV[0] carries the subject_table name. Replaces the ON DELETE CASCADE guarantee lost in the narrow-FK-to-polymorphic pivot.';

-- ============================================
-- Rewire performers_notes triggers to the parameterized functions
-- ============================================

-- Drop the Slice A per-subject trigger and its function; rewire to the new
-- parameterized function with 'performers_notes' argument.
drop trigger if exists trg_clear_notifications_on_pn_removal on public.performers_notes;
drop function if exists public.clear_notifications_on_pn_removal();

create trigger trg_clear_notifications_on_pn_removal
  after update of status on public.performers_notes
  for each row execute function public.clear_notifications_on_subject_removal('performers_notes');

-- CM2: new BEFORE DELETE trigger on performers_notes. Pre-Slice-B, the
-- narrow FK's ON DELETE CASCADE handled this; post-pivot, the BEFORE DELETE
-- trigger ensures polymorphic notifications are cleared on hard delete.
create trigger trg_clear_notifications_on_pn_delete
  before delete on public.performers_notes
  for each row execute function public.clear_notifications_on_subject_delete('performers_notes');

-- ============================================
-- Triggers for the new subject tables
-- ============================================

create trigger trg_clear_notifications_on_is_removal
  after update of status on public.interpretive_schools
  for each row execute function public.clear_notifications_on_subject_removal('interpretive_schools');

create trigger trg_clear_notifications_on_is_delete
  before delete on public.interpretive_schools
  for each row execute function public.clear_notifications_on_subject_delete('interpretive_schools');

create trigger trg_clear_notifications_on_pd_removal
  after update of status on public.piece_descriptions
  for each row execute function public.clear_notifications_on_subject_removal('piece_descriptions');

create trigger trg_clear_notifications_on_pd_delete
  before delete on public.piece_descriptions
  for each row execute function public.clear_notifications_on_subject_delete('piece_descriptions');

-- ============================================
-- RLS
-- ============================================

alter table public.interpretive_schools enable row level security;
alter table public.interpretive_school_versions enable row level security;
alter table public.piece_descriptions enable row level security;
alter table public.piece_description_versions enable row level security;

-- interpretive_schools: public reads limited to published. Owner contributor
-- and staff see everything. Mutations go through security-definer RPCs only.
create policy "Published interpretive schools are viewable by everyone"
  on public.interpretive_schools for select
  using (status = 'published');

create policy "Contributor can view own interpretive schools"
  on public.interpretive_schools for select
  using (contributor_id = auth.uid());

create policy "Staff can view all interpretive schools"
  on public.interpretive_schools for select
  using (public.is_staff());

-- interpretive_school_versions: owner contributor + staff only (public reads
-- published bodies via the joined piece-page query on interpretive_schools).
create policy "Contributor can view versions of own schools"
  on public.interpretive_school_versions for select
  using (contributor_id = auth.uid());

create policy "Staff can view all school versions"
  on public.interpretive_school_versions for select
  using (public.is_staff());

-- piece_descriptions: same shape as interpretive_schools.
create policy "Published piece descriptions are viewable by everyone"
  on public.piece_descriptions for select
  using (status = 'published');

create policy "Contributor can view own piece descriptions"
  on public.piece_descriptions for select
  using (contributor_id = auth.uid());

create policy "Staff can view all piece descriptions"
  on public.piece_descriptions for select
  using (public.is_staff());

create policy "Contributor can view versions of own descriptions"
  on public.piece_description_versions for select
  using (contributor_id = auth.uid());

create policy "Staff can view all description versions"
  on public.piece_description_versions for select
  using (public.is_staff());

-- ============================================
-- Grant view visibility
-- ============================================

grant select on public.v_interpretive_school_versions_published to authenticated, anon;
grant select on public.v_piece_description_versions_published   to authenticated, anon;
