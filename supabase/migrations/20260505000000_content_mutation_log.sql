-- Subject-agnostic audit log for piece-scoped content that doesn't have
-- its own *_versions table (editions, external_links, and eventually the
-- pedagogical arc when it lands).
--
-- Write path: AFTER INSERT / UPDATE / DELETE triggers on the covered
-- tables. Each trigger logs one row here capturing who did it (auth.uid()
-- captured at trigger fire time, or null for seed/admin-path writes),
-- what subject, what action, and a derived human-readable label for the
-- change log UI.
--
-- Read path: public.fetch_piece_changelog (amended in the next migration)
-- UNIONs this table with every existing *_versions table. The RPC is
-- SECURITY DEFINER; this table itself is REVOKE'd from clients so direct
-- reads that might leak actor timestamps or detail blobs can't happen.

begin;

create table public.content_mutation_log (
  id bigserial primary key,
  piece_id text not null references public.pieces(id) on delete cascade,
  subject_table text not null,
  -- text (not uuid): editions.id + external_links.id are both text today;
  -- versioned signed content uses uuid which we cast to text at union time.
  subject_id text,
  subject_label text,
  subject_type text not null,
  action text not null check (action in ('added', 'updated', 'deleted')),
  actor_id uuid references public.users(id),
  occurred_at timestamptz not null default now(),
  detail jsonb not null default '{}'::jsonb
);

create index ix_cml_piece_time on public.content_mutation_log (piece_id, occurred_at desc);

alter table public.content_mutation_log enable row level security;
revoke all on public.content_mutation_log from anon, authenticated;
-- Reads flow through fetch_piece_changelog (SECURITY DEFINER).

-- ============================================================================
-- _log_edition_mutation — trigger for public.editions INSERT/UPDATE/DELETE
-- ============================================================================

create or replace function public._log_edition_mutation() returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_action text;
  v_row record;
  v_label text;
begin
  if TG_OP = 'INSERT' then
    v_action := 'added';
    v_row := NEW;
  elsif TG_OP = 'UPDATE' then
    v_action := 'updated';
    v_row := NEW;
  else
    v_action := 'deleted';
    v_row := OLD;
  end if;

  v_label := coalesce(v_row.publisher, 'Edition')
           || case when v_row.year is not null then ' (' || v_row.year || ')' else '' end;

  insert into public.content_mutation_log
    (piece_id, subject_table, subject_id, subject_label, subject_type, action, actor_id, detail)
  values (
    v_row.piece_id,
    'editions',
    v_row.id,
    v_label,
    'edition',
    v_action,
    auth.uid(),
    jsonb_build_object(
      'publisher', v_row.publisher,
      'editor', v_row.editor,
      'year', v_row.year
    )
  );
  return null;
end;
$$;

create trigger trg_editions_log
  after insert or update or delete on public.editions
  for each row execute function public._log_edition_mutation();

-- ============================================================================
-- _log_external_link_mutation — trigger for public.external_links
-- ============================================================================
--
-- Differentiates recordings from references via link type:
--   youtube | vimeo | spotify | internet_archive | soundcloud | bandcamp → recording
--   imslp | wikipedia | <other> → external reference

create or replace function public._log_external_link_mutation() returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_action text;
  v_row record;
  v_subject_type text;
begin
  if TG_OP = 'INSERT' then
    v_action := 'added';
    v_row := NEW;
  elsif TG_OP = 'UPDATE' then
    v_action := 'updated';
    v_row := NEW;
  else
    v_action := 'deleted';
    v_row := OLD;
  end if;

  v_subject_type := case
    when v_row.type in ('youtube', 'vimeo', 'spotify', 'internet_archive', 'soundcloud', 'bandcamp')
      then 'recording'
    else 'external reference'
  end;

  insert into public.content_mutation_log
    (piece_id, subject_table, subject_id, subject_label, subject_type, action, actor_id, detail)
  values (
    v_row.piece_id,
    'external_links',
    v_row.id,
    coalesce(v_row.label, v_row.url),
    v_subject_type,
    v_action,
    auth.uid(),
    jsonb_build_object(
      'type', v_row.type,
      'url', v_row.url
    )
  );
  return null;
end;
$$;

create trigger trg_external_links_log
  after insert or update or delete on public.external_links
  for each row execute function public._log_external_link_mutation();

commit;
