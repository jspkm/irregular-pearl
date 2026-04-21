-- Slice C governance relaxation: any registered user can self-author
-- signed content (performer's notes, interpretive schools, signed piece
-- descriptions).
--
-- Per PLAN-contributor-pipeline-slice-c.md §1.0 rev 2: the original Slice A
-- "flagged contributor" gate (users.is_contributor + contributor_active,
-- granted out-of-band via scripts/seed-contributor.ts) was CEO/eng-review
-- reframed to "any registered user === contributor". Step 1 (#48) dropped
-- the vestigial notifications.performers_note_id but never shipped the
-- governance half. This migration does.
--
-- Two surgical moves, both inside SECURITY DEFINER RPCs — RLS policies
-- never referenced is_contributor (they check contributor_id = auth.uid()
-- and is_staff() only), and all mutations go through RPCs anyway.
--
-- 1. Rewrite _require_active_contributor() to require only authentication.
--    19 self-publish / approve-queue RPCs inherit the relaxation with zero
--    further changes: publish_contributor_note / _edit / remove +
--    approve_performers_note / approve_and_edit / reject + the matching
--    interpretive_schools and piece_descriptions families + the
--    update_interpretive_school_metadata one-off. Ownership is still
--    guaranteed inside each RPC by `where contributor_id = auth.uid()`
--    clauses — relaxing the helper does not let user A edit user B's row.
--
-- 2. Rewrite the 3 create-*-draft RPCs (staff drafts content on behalf of
--    a target user) to require the target user exist, not be flagged.
--    The caller gate stays _require_staff() — only admin/firstchair can
--    draft for others; the draftee can be any registered user.
--
-- `is_contributor` / `contributor_active` columns on public.users remain
-- in the schema as an unused editorial flag. Dropping them is follow-up
-- cleanup once we confirm no scripts, seeds, or scheduled tasks still
-- depend on them.

begin;

-- ============================================
-- 1. Relax the caller gate across all self-publish + approval RPCs.
-- ============================================

create or replace function public._require_active_contributor()
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  -- Governance: any registered user is a first-class author. The helper
  -- name is kept for caller compatibility (19 RPCs call it); rename is
  -- deferred to a later refactor pass.
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;
end;
$$;

-- ============================================
-- 2. Relax the target-user gate on the 3 create-draft RPCs.
--     The caller is still _require_staff(); only the target check shifts
--     from "is an active contributor" to "exists in public.users".
-- ============================================

create or replace function public.create_performers_note_draft(
  p_piece_id text,
  p_contributor_id uuid,
  p_body text
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_note_id uuid;
  v_staff_id uuid := auth.uid();
begin
  perform public._require_staff();

  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'body required';
  end if;
  if not exists (select 1 from public.pieces where id = p_piece_id) then
    raise exception 'piece not found';
  end if;
  if not exists (select 1 from public.users where id = p_contributor_id) then
    raise exception 'target user not found';
  end if;

  v_note_id := gen_random_uuid();
  insert into public.performers_notes (
    id, piece_id, contributor_id, status, drafted_by
  )
  values (v_note_id, p_piece_id, p_contributor_id, 'draft', v_staff_id);

  perform public._insert_performers_note_version(
    v_note_id, p_piece_id, p_contributor_id,
    p_body, v_staff_id, false
  );

  return v_note_id;
end;
$$;

create or replace function public.create_interpretive_school_draft(
  p_piece_id text,
  p_contributor_id uuid,
  p_name text,
  p_body text,
  p_tempo_cues jsonb default null
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_school_id uuid;
  v_staff_id uuid := auth.uid();
begin
  perform public._require_staff();

  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'body required';
  end if;
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'name required';
  end if;
  if not exists (select 1 from public.pieces where id = p_piece_id) then
    raise exception 'piece not found';
  end if;
  if not exists (select 1 from public.users where id = p_contributor_id) then
    raise exception 'target user not found';
  end if;

  v_school_id := gen_random_uuid();
  insert into public.interpretive_schools (
    id, piece_id, contributor_id, name, tempo_cues, status, drafted_by
  )
  values (v_school_id, p_piece_id, p_contributor_id, trim(p_name), p_tempo_cues, 'draft', v_staff_id);

  perform public._insert_interpretive_school_version(
    v_school_id, p_piece_id, p_contributor_id,
    p_body, v_staff_id, false
  );

  return v_school_id;
end;
$$;

create or replace function public.create_piece_description_draft(
  p_piece_id text,
  p_contributor_id uuid,
  p_body text
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_description_id uuid;
  v_staff_id uuid := auth.uid();
begin
  perform public._require_staff();

  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'body required';
  end if;
  if not exists (select 1 from public.pieces where id = p_piece_id) then
    raise exception 'piece not found';
  end if;
  if not exists (select 1 from public.users where id = p_contributor_id) then
    raise exception 'target user not found';
  end if;

  v_description_id := gen_random_uuid();
  insert into public.piece_descriptions (
    id, piece_id, contributor_id, status, drafted_by
  )
  values (v_description_id, p_piece_id, p_contributor_id, 'draft', v_staff_id);

  perform public._insert_piece_description_version(
    v_description_id, p_piece_id, p_contributor_id,
    p_body, v_staff_id, false
  );

  return v_description_id;
end;
$$;

commit;
