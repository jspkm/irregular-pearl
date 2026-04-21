-- Extended fetch_piece_changelog — UNIONs every versioned subject table
-- plus content_mutation_log for non-versioned content (editions, external
-- references, recordings). Pedagogical arc will join the union when its
-- schema lands.
--
-- Return shape change: subject_id is now text (not uuid). Uuids from the
-- versioned tables are cast to text at union time; editions.id and
-- external_links.id are text natively. The change log UI treats subject_id
-- as an opaque identifier — no existing caller computes on its type.
--
-- Edit-summary derivation:
--   * movements: uses movement_versions.edit_summary verbatim
--     (Step 3 RPCs populate 'created' / 'deleted' / 'reordered: N → M').
--   * performer's notes / interpretive schools / piece descriptions:
--     version_number = 1 → 'published', higher → 'edited', and soft-
--     removed parent rows emit a trailing 'removed' entry.
--   * editions / external references / recordings: content_mutation_log
--     stores 'added' / 'updated' / 'deleted' directly.

begin;

drop function if exists public.fetch_piece_changelog(text);

create or replace function public.fetch_piece_changelog(
  p_piece_id text
) returns table (
  id text,
  created_at timestamptz,
  authored_by uuid,
  authored_by_display_name text,
  subject_type text,
  subject_id text,
  subject_label text,
  edit_summary text,
  version_number integer
)
  language sql
  security definer
  set search_path = public
as $$
  -- Movements: version rows carry author, timestamp, and an explicit
  -- edit_summary string (added/edited/reordered/deleted).
  select
    mv.id::text as id,
    mv.created_at,
    mv.authored_by,
    coalesce(u.display_name, 'Seed data') as authored_by_display_name,
    'movement'::text as subject_type,
    mv.movement_id::text as subject_id,
    mv.name as subject_label,
    mv.edit_summary,
    mv.version_number
  from public.movement_versions mv
  left join public.users u on u.id = mv.authored_by
  where mv.piece_id = p_piece_id

  union all

  -- Performer's notes: each version row = publish or edit.
  select
    pnv.id::text,
    pnv.created_at,
    pnv.authored_by,
    coalesce(u.display_name, 'Seed data'),
    'performer''s note'::text,
    pnv.note_id::text,
    substring(pnv.body from 1 for 80) as subject_label,
    case when pnv.version_number = 1 then 'published' else 'edited' end,
    pnv.version_number
  from public.performers_note_versions pnv
  left join public.users u on u.id = pnv.authored_by
  where pnv.piece_id = p_piece_id
    and pnv.approved_at is not null

  union all

  -- Soft-removals of performer's notes.
  select
    ('pnrm-' || pn.id::text),
    pn.removed_at,
    pn.removed_by,
    coalesce(u.display_name, 'Seed data'),
    'performer''s note'::text,
    pn.id::text,
    substring(coalesce(pnv.body, '') from 1 for 80),
    'removed'::text,
    null::integer
  from public.performers_notes pn
  left join public.performers_note_versions pnv on pnv.id = pn.current_version_id
  left join public.users u on u.id = pn.removed_by
  where pn.piece_id = p_piece_id
    and pn.status = 'removed'
    and pn.removed_at is not null

  union all

  -- Interpretive schools: each version row = publish or edit. Name lives
  -- on the parent interpretive_schools table.
  select
    isv.id::text,
    isv.created_at,
    isv.authored_by,
    coalesce(u.display_name, 'Seed data'),
    'interpretive school'::text,
    isv.school_id::text,
    s.name,
    case when isv.version_number = 1 then 'published' else 'edited' end,
    isv.version_number
  from public.interpretive_school_versions isv
  join public.interpretive_schools s on s.id = isv.school_id
  left join public.users u on u.id = isv.authored_by
  where isv.piece_id = p_piece_id
    and isv.approved_at is not null

  union all

  -- Soft-removals of interpretive schools.
  select
    ('isrm-' || s.id::text),
    s.removed_at,
    s.removed_by,
    coalesce(u.display_name, 'Seed data'),
    'interpretive school'::text,
    s.id::text,
    s.name,
    'removed'::text,
    null::integer
  from public.interpretive_schools s
  left join public.users u on u.id = s.removed_by
  where s.piece_id = p_piece_id
    and s.status = 'removed'
    and s.removed_at is not null

  union all

  -- Piece descriptions: each version row = publish or edit.
  select
    pdv.id::text,
    pdv.created_at,
    pdv.authored_by,
    coalesce(u.display_name, 'Seed data'),
    'piece description'::text,
    pdv.description_id::text,
    substring(pdv.body from 1 for 80) as subject_label,
    case when pdv.version_number = 1 then 'published' else 'edited' end,
    pdv.version_number
  from public.piece_description_versions pdv
  left join public.users u on u.id = pdv.authored_by
  where pdv.piece_id = p_piece_id
    and pdv.approved_at is not null

  union all

  -- Soft-removals of piece descriptions.
  select
    ('pdrm-' || d.id::text),
    d.removed_at,
    d.removed_by,
    coalesce(u.display_name, 'Seed data'),
    'piece description'::text,
    d.id::text,
    substring(coalesce(pdv.body, '') from 1 for 80),
    'removed'::text,
    null::integer
  from public.piece_descriptions d
  left join public.piece_description_versions pdv on pdv.id = d.current_version_id
  left join public.users u on u.id = d.removed_by
  where d.piece_id = p_piece_id
    and d.status = 'removed'
    and d.removed_at is not null

  union all

  -- Editions / external references / recordings / (future) pedagogical
  -- arc — non-versioned, audited via content_mutation_log triggers.
  select
    ('cml-' || cml.id::text),
    cml.occurred_at,
    cml.actor_id,
    coalesce(u.display_name, 'Seed data'),
    cml.subject_type,
    cml.subject_id,
    cml.subject_label,
    cml.action,
    null::integer
  from public.content_mutation_log cml
  left join public.users u on u.id = cml.actor_id
  where cml.piece_id = p_piece_id

  order by created_at desc, version_number desc nulls last;
$$;

grant execute on function public.fetch_piece_changelog(text) to anon, authenticated;

commit;
