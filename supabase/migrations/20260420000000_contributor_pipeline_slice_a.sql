-- Contributor approval pipeline — Slice A (PerformersNote only)
-- See PLAN-contributor-pipeline-slice-a.md for the full design rationale.
--
-- This migration adds:
--   1. Contributor columns on users (is_contributor, contributor_bio_short,
--      contributor_agreement_signed_at, contributor_active)
--   2. draft_status enum + performers_notes table (full audit trail:
--      drafted_by, submitted_by, approved_by, rejected_by, retracted_by,
--      removed_by + timestamps)
--   3. performers_note_versions table (append-only, denorm immutable fields
--      only: piece_id, contributor_id; NO parent_status denorm)
--   4. Composite FK pinning current_version_id to same note
--   5. notification_type enum + notifications table (narrow FK to
--      performers_notes, not polymorphic)
--   6. Defensive trigger clearing notifications when note hits `removed`
--      (primary clearing lives inside RPCs, this is a safety net)
--   7. Public view exposing published version bodies for audit reads
--   8. RLS policies on all new tables
--
-- Uses display_name from the existing users table as the byline source.
-- Uses bio from artist_profiles migration as the long bio. Slice A only
-- introduces contributor_bio_short for the one-liner shown under bylines.

-- ============================================
-- Contributor fields on users
-- ============================================

alter table public.users
  add column is_contributor boolean not null default false,
  add column contributor_bio_short text,
  add column contributor_agreement_signed_at timestamptz,
  add column contributor_active boolean not null default false;

create index idx_users_is_contributor on public.users(id) where is_contributor;

-- ============================================
-- Enums
-- ============================================

create type draft_status as enum (
  'draft',
  'awaiting_contributor_approval',
  'published',
  'removed'
);

create type notification_type as enum ('draft_awaiting_approval');

-- ============================================
-- performers_notes
-- ============================================

create table public.performers_notes (
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
  constraint published_has_version
    check ((status <> 'published') or (current_version_id is not null))
);

create index idx_performers_notes_piece_published
  on public.performers_notes(piece_id) where status = 'published';
create index idx_performers_notes_contributor_queue
  on public.performers_notes(contributor_id)
  where status = 'awaiting_contributor_approval';

-- ============================================
-- performers_note_versions (append-only)
-- ============================================

create table public.performers_note_versions (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.performers_notes(id) on delete cascade,
  piece_id text not null references public.pieces(id) on delete cascade,
  contributor_id uuid not null references public.users(id) on delete restrict,
  body text not null,
  authored_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  version_number integer not null,
  rejection_note text,
  constraint uq_pnv_note_version unique (note_id, version_number),
  constraint uq_pnv_note_id unique (note_id, id)
);

create index idx_pnv_note on public.performers_note_versions(note_id, version_number desc);
create index idx_pnv_contributor on public.performers_note_versions(contributor_id);

-- Composite FK: a note's current_version_id must belong to the same note.
-- Requires uq_pnv_note_id (unique over note_id + id) on the versions table.
alter table public.performers_notes
  add constraint fk_current_version_matches_note
  foreign key (id, current_version_id)
  references public.performers_note_versions(note_id, id)
  deferrable initially deferred;

-- ============================================
-- notifications (narrow FK, not polymorphic)
-- ============================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.users(id) on delete cascade,
  type notification_type not null,
  performers_note_id uuid not null references public.performers_notes(id) on delete cascade,
  body text not null,
  link_path text not null,
  created_at timestamptz not null default now(),
  cleared_at timestamptz,
  last_digest_sent_at timestamptz
);

create index idx_notifications_recipient_active
  on public.notifications(recipient_id, created_at desc)
  where cleared_at is null;

-- ============================================
-- Triggers
-- ============================================

-- Defensive safety net: when a note is soft-removed, auto-clear any
-- un-cleared notifications for it. Primary notification clearing for
-- approve/reject/retract happens inside the RPCs.
create function public.clear_notifications_on_pn_removal() returns trigger
  language plpgsql security definer
  set search_path = public
  as $$
begin
  if new.status = 'removed' and (old.status is distinct from new.status) then
    update public.notifications
      set cleared_at = now()
      where performers_note_id = new.id
        and cleared_at is null;
  end if;
  return new;
end;
$$;

create trigger trg_clear_notifications_on_pn_removal
  after update of status on public.performers_notes
  for each row
  execute function public.clear_notifications_on_pn_removal();

-- Touch updated_at on row change.
create function public.touch_performers_notes_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_touch_performers_notes_updated_at
  before update on public.performers_notes
  for each row
  execute function public.touch_performers_notes_updated_at();

-- ============================================
-- View: published version bodies for audit reads
-- ============================================

create view public.v_performers_note_versions_published as
  select v.*
  from public.performers_note_versions v
  join public.performers_notes n on n.id = v.note_id
  where n.status = 'published';

comment on view public.v_performers_note_versions_published is
  'Version rows for performers_notes that are currently published. For audit/historical reads.';

-- ============================================
-- RLS
-- ============================================

alter table public.performers_notes enable row level security;
alter table public.performers_note_versions enable row level security;
alter table public.notifications enable row level security;

-- performers_notes: public reads limited to status=published.
-- Owner contributor and staff see everything.
-- No direct insert/update from clients; all mutations go through
-- security-definer RPCs landed in a follow-up migration.
create policy "Published performer's notes are viewable by everyone"
  on public.performers_notes for select
  using (status = 'published');

create policy "Contributor can view own performer's notes"
  on public.performers_notes for select
  using (contributor_id = auth.uid());

create policy "Staff can view all performer's notes"
  on public.performers_notes for select
  using (public.is_staff());

-- performers_note_versions: public cannot read rows directly.
-- Piece-page rendering fetches published bodies via a joined query on
-- performers_notes. Direct version reads are for audit/history only.
create policy "Contributor can view versions of own notes"
  on public.performers_note_versions for select
  using (contributor_id = auth.uid());

create policy "Staff can view all versions"
  on public.performers_note_versions for select
  using (public.is_staff());

-- notifications: only the recipient sees and updates their own.
create policy "Recipient can view own notifications"
  on public.notifications for select
  using (recipient_id = auth.uid());

create policy "Recipient can update own notifications"
  on public.notifications for update
  using (recipient_id = auth.uid());

-- ============================================
-- Grant view visibility
-- ============================================

grant select on public.v_performers_note_versions_published to authenticated, anon;
