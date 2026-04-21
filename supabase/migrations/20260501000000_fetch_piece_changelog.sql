-- Slice C Step 3 follow-up: page-level change log RPC.
--
-- Returns a unified feed of versioned changes for a piece, most recent
-- first. Today the only source is movement_versions; as new versioned
-- subject types land (landmark_versions, signed-content versions), they
-- get UNION'd into this RPC and callers keep working unchanged.
--
-- Row shape is subject-agnostic so the React ChangeLog component renders
-- a uniform feed:
--   subject_type — 'movement' | (future) 'landmark' | 'performers_note' | ...
--   subject_id   — uuid of the subject (points to the live row, or to the
--                  soft-deleted tombstone row if applicable)
--   subject_label — user-readable label for the subject at time of change
--                   (e.g. the movement name in that version row)
--
-- Security: security-definer, granted to anon + authenticated. Public piece
-- pages read this surface; no auth needed to view history.

begin;

create or replace function public.fetch_piece_changelog(
  p_piece_id text
) returns table (
  id uuid,
  created_at timestamptz,
  authored_by uuid,
  authored_by_display_name text,
  subject_type text,
  subject_id uuid,
  subject_label text,
  edit_summary text,
  version_number integer
)
  language sql
  security definer
  set search_path = public
as $$
  select
    mv.id,
    mv.created_at,
    mv.authored_by,
    coalesce(u.display_name, 'Seed data') as authored_by_display_name,
    'movement'::text as subject_type,
    mv.movement_id as subject_id,
    mv.name as subject_label,
    mv.edit_summary,
    mv.version_number
  from public.movement_versions mv
  left join public.users u on u.id = mv.authored_by
  where mv.piece_id = p_piece_id
  -- (future) union all select ... from landmark_versions lv where lv.piece_id = p_piece_id
  -- (future) union all select ... from piece_description_versions ...
  order by created_at desc, version_number desc;
$$;

grant execute on function public.fetch_piece_changelog(text) to anon, authenticated;

commit;
