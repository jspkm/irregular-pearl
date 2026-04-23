-- Request-a-contribution — schema scaffolding
-- See ~/.gstack/projects/jspkm-irregular-pearl/jspkm-main-design-request-contribution-20260421-183606.md
-- for the full design rationale.
--
-- This migration adds:
--   1. pg_trgm extension (if not already enabled) for fuzzy typeahead
--   2. canonical_piece_index — read-only source of piece identity, populated
--      exclusively by the automated worker (multi-source: MB, Wikidata, IMSLP)
--   3. app_config — tunable thresholds (rate limits, sender gate)
--   4. pieces.canonical_index_id + pieces.musicbrainz_work_id columns
--   5. Backfill: existing pieces get canonical_piece_index rows (1-to-1)
--   6. contribution_requests — the request ledger
--   7. piece_redirects — slug-rename redirect table (identity immutability
--      via redirect, not UPDATE)
--   8. search_misses — unmatched-query log, curation signal for the worker
--   9. Extend notifications.subject_table_allowed CHECK to include
--      'contribution_requests' (the existing polymorphic pair is reused;
--      no new narrow FK column).
--  10. notification_type enum extensions (contribution_requested,
--      contribution_fulfilled)
--  11. Auto-clear triggers on the four signed-content tables: when a
--      contributor transitions signed content to 'published' on a piece,
--      un-cleared contribution_requested notifications for that contributor
--      on that piece clear, and the underlying contribution_requests are
--      marked fulfilled.
--  12. v_pieces_with_content_state — derived has_signed_content property
--      across the four signed-content tables. No denormalized count.
--  13. RLS on all new tables. Writes gated by RPC (security definer).

-- ============================================
-- 1. Extensions
-- ============================================

create extension if not exists pg_trgm;

-- ============================================
-- 2. canonical_piece_index
-- ============================================

create table public.canonical_piece_index (
  id uuid primary key default gen_random_uuid(),
  canonical_title text not null,
  native_title text,
  composer_name text not null,
  catalog_number text,
  era text,
  form text,
  instruments text[] not null default '{}',
  movements jsonb,
  musicbrainz_work_id text unique,
  wikidata_qid text unique,
  viaf_composer_id text,
  imslp_work_id text unique,
  source_agreement_count int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_cpi_search_trgm
  on public.canonical_piece_index
  using gin (
    (canonical_title || ' ' || coalesce(native_title, '') || ' ' ||
     composer_name || ' ' || coalesce(catalog_number, '')) gin_trgm_ops
  );

create index idx_cpi_composer_title
  on public.canonical_piece_index(composer_name, canonical_title);

-- ============================================
-- 3. app_config
-- ============================================

create table public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id)
);

insert into public.app_config (key, value) values
  ('request.rate_limit.per_recipient_per_30d', '10'::jsonb),
  ('request.rate_limit.per_sender_per_24h', '10'::jsonb),
  ('request.sender_gate.min_published_contributions', '1'::jsonb);

-- ============================================
-- 4. pieces columns + backfill
-- ============================================

alter table public.pieces
  add column canonical_index_id uuid references public.canonical_piece_index(id) on delete restrict,
  add column musicbrainz_work_id text;

create unique index idx_pieces_mb_work_id
  on public.pieces(musicbrainz_work_id)
  where musicbrainz_work_id is not null;

-- Backfill: one canonical_piece_index row per existing piece, 1-to-1.
do $$
declare
  p record;
  new_idx_id uuid;
begin
  for p in select * from public.pieces order by id loop
    insert into public.canonical_piece_index
      (canonical_title, composer_name, catalog_number, era, form, instruments)
    values (p.title, p.composer_name, p.catalog_number, p.era, p.form, p.instruments)
    returning id into new_idx_id;

    update public.pieces set canonical_index_id = new_idx_id where id = p.id;
  end loop;
end $$;

-- Now enforce NOT NULL: every piece traces back to an index row.
alter table public.pieces
  alter column canonical_index_id set not null;

-- ============================================
-- 5. contribution_requests
-- ============================================

create table public.contribution_requests (
  id uuid primary key default gen_random_uuid(),
  piece_id text not null references public.pieces(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid references public.users(id) on delete set null,
  recipient_email text,
  note text,
  created_at timestamptz not null default now(),
  cleared_at timestamptz,
  fulfilled_at timestamptz,
  constraint cr_recipient_exactly_one check (
    (recipient_id is not null and recipient_email is null) or
    (recipient_id is null and recipient_email is not null)
  ),
  constraint cr_recipient_not_sender check (
    recipient_id is null or recipient_id <> sender_id
  ),
  constraint cr_note_length check (
    note is null or char_length(note) <= 280
  )
);

create index idx_cr_recipient_active
  on public.contribution_requests(recipient_id, piece_id, created_at desc)
  where cleared_at is null and recipient_id is not null;

create index idx_cr_sender_24h
  on public.contribution_requests(sender_id, created_at desc);

create index idx_cr_sender_recipient_30d
  on public.contribution_requests(sender_id, recipient_id, created_at desc)
  where recipient_id is not null;

create index idx_cr_piece_active
  on public.contribution_requests(piece_id, created_at desc)
  where cleared_at is null;

-- ============================================
-- 6. piece_redirects
-- ============================================

create table public.piece_redirects (
  from_slug text primary key,
  to_piece_id text not null references public.pieces(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references public.users(id)
);

create index idx_piece_redirects_to on public.piece_redirects(to_piece_id);

-- ============================================
-- 7. search_misses
-- ============================================

create table public.search_misses (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  query_length int not null generated always as (char_length(query)) stored,
  result_count int not null default 0,
  user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_sm_recent on public.search_misses(created_at desc);
create index idx_sm_query_trgm on public.search_misses using gin (lower(query) gin_trgm_ops);

-- ============================================
-- 8. Extend notifications polymorphic CHECK
-- ============================================
-- The existing subject_table_allowed CHECK restricts subject_table to
-- performers_notes / interpretive_schools / piece_descriptions. We
-- broaden it to also admit contribution_requests. Landmarks is added
-- at the same time so that Slice C landmark notifications (if any)
-- don't violate the invariant; if landmarks never emit notifications
-- this is harmless.

alter table public.notifications
  drop constraint if exists subject_table_allowed;

alter table public.notifications
  add constraint subject_table_allowed
  check (subject_table in (
    'performers_notes',
    'interpretive_schools',
    'piece_descriptions',
    'landmarks',
    'contribution_requests'
  ));

-- ============================================
-- 9. notification_type enum extensions
-- ============================================
-- Postgres 12+ allows ALTER TYPE ... ADD VALUE in a transaction, but the
-- new value cannot be used as an enum literal in the same transaction.
-- We only use type::text comparisons elsewhere, so this is safe.

alter type notification_type add value if not exists 'contribution_requested';
alter type notification_type add value if not exists 'contribution_fulfilled';

-- ============================================
-- 10. Auto-clear triggers on contribution fulfilment
-- ============================================
-- When a contributor transitions a signed-content row to 'published' on a
-- piece, un-cleared contribution_requests and their associated notifications
-- (subject_table='contribution_requests') for that contributor on that piece
-- auto-clear. Mirrors the existing clear-on-removal trigger pattern but
-- keyed on publish-by-recipient instead of remove-by-anyone.

create function public.clear_contrib_requests_on_publish(
  p_piece_id text,
  p_contributor_id uuid
) returns void
  language plpgsql security definer
  set search_path = public
as $$
declare
  v_request_ids uuid[];
begin
  select coalesce(array_agg(id), array[]::uuid[])
    into v_request_ids
    from public.contribution_requests
    where piece_id = p_piece_id
      and recipient_id = p_contributor_id
      and cleared_at is null;

  if array_length(v_request_ids, 1) is null then
    return;
  end if;

  update public.contribution_requests
    set fulfilled_at = now(), cleared_at = now()
    where id = any(v_request_ids);

  update public.notifications
    set cleared_at = now()
    where cleared_at is null
      and subject_table = 'contribution_requests'
      and subject_id = any(v_request_ids);
end;
$$;

create function public.trg_clear_contrib_on_signed_publish() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'published' and (old.status is distinct from 'published') then
    perform public.clear_contrib_requests_on_publish(
      new.piece_id, new.contributor_id
    );
  end if;
  return new;
end;
$$;

create trigger trg_clear_contrib_on_pn_publish
  after update of status on public.performers_notes
  for each row execute function public.trg_clear_contrib_on_signed_publish();

create trigger trg_clear_contrib_on_is_publish
  after update of status on public.interpretive_schools
  for each row execute function public.trg_clear_contrib_on_signed_publish();

create trigger trg_clear_contrib_on_lm_publish
  after update of status on public.landmarks
  for each row execute function public.trg_clear_contrib_on_signed_publish();

create trigger trg_clear_contrib_on_pd_publish
  after update of status on public.piece_descriptions
  for each row execute function public.trg_clear_contrib_on_signed_publish();

-- ============================================
-- 11. v_pieces_with_content_state
-- ============================================
-- Pre-piece vs active is computed, not a column. The view joins across the
-- four signed-content tables and exposes has_signed_content as boolean.

create view public.v_pieces_with_content_state as
  select
    p.id,
    p.title,
    p.composer_name,
    p.catalog_number,
    p.canonical_index_id,
    (
      exists (select 1 from public.performers_notes pn
                where pn.piece_id = p.id and pn.status = 'published')
      or exists (select 1 from public.interpretive_schools s
                   where s.piece_id = p.id and s.status = 'published')
      or exists (select 1 from public.landmarks lm
                   where lm.piece_id = p.id and lm.status = 'published')
      or exists (select 1 from public.piece_descriptions pd
                   where pd.piece_id = p.id and pd.status = 'published')
    ) as has_signed_content
  from public.pieces p;

-- ============================================
-- 12. RLS
-- ============================================

alter table public.canonical_piece_index enable row level security;

create policy canonical_piece_index_read on public.canonical_piece_index
  for select using (true);

alter table public.contribution_requests enable row level security;

create policy cr_sender_read on public.contribution_requests
  for select using (sender_id = auth.uid());

create policy cr_recipient_read on public.contribution_requests
  for select using (recipient_id = auth.uid() and cleared_at is null);

create policy cr_staff_read on public.contribution_requests
  for select using (
    exists (select 1 from public.users
              where id = auth.uid() and role in ('moderator', 'admin'))
  );

alter table public.piece_redirects enable row level security;

create policy piece_redirects_read on public.piece_redirects
  for select using (true);

alter table public.search_misses enable row level security;

create policy search_misses_staff_read on public.search_misses
  for select using (
    exists (select 1 from public.users
              where id = auth.uid() and role in ('moderator', 'admin'))
  );

alter table public.app_config enable row level security;

create policy app_config_read on public.app_config
  for select using (true);
