-- Slice C Step 4: cast_vote + clear_vote RPCs.
--
-- Both are SECURITY DEFINER and share a single 30/min rate-limit bucket
-- (action key 'cast_vote') so rapid toggling between up/down counts against
-- the same cap. Reuses the rate_limit_log + _check_rate_limit helper
-- shipped in Step 3 (20260428000000).
--
-- cast_vote uses upsert semantics. Calling it with the same vote_value as
-- an existing vote is a no-op (idempotent); calling it with a different
-- value flips the vote (UPDATE path in trg_votes_delta reconciles tally).
--
-- clear_vote deletes the vote row. No error if the vote didn't exist —
-- lets the client call it unconditionally when the user un-selects.

begin;

-- ============================================================================
-- cast_vote
-- ============================================================================

create or replace function public.cast_vote(
  p_subject_table text,
  p_subject_id uuid,
  p_vote_value smallint
) returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  if p_vote_value not in (-1, 1) then
    raise exception 'vote_value must be -1 or 1';
  end if;

  if p_subject_table not in (
    'performers_notes', 'interpretive_schools', 'piece_descriptions', 'landmarks'
  ) then
    raise exception 'invalid subject_table: %', p_subject_table;
  end if;

  perform public._check_rate_limit('cast_vote', 30, 60);

  -- Upsert. ON CONFLICT fires when the user already voted on this subject;
  -- updating vote_value triggers trg_votes_delta's UPDATE branch which
  -- reconciles the tally.
  insert into public.votes (user_id, subject_table, subject_id, vote_value)
  values (v_uid, p_subject_table, p_subject_id, p_vote_value)
  on conflict (user_id, subject_table, subject_id) do update
    set vote_value = excluded.vote_value,
        updated_at = now();
end;
$$;

revoke execute on function public.cast_vote(text, uuid, smallint) from public;
grant execute on function public.cast_vote(text, uuid, smallint) to authenticated;

-- ============================================================================
-- clear_vote
-- ============================================================================

create or replace function public.clear_vote(
  p_subject_table text,
  p_subject_id uuid
) returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  perform public._check_rate_limit('cast_vote', 30, 60);

  delete from public.votes
    where user_id = v_uid
      and subject_table = p_subject_table
      and subject_id = p_subject_id;
end;
$$;

revoke execute on function public.clear_vote(text, uuid) from public;
grant execute on function public.clear_vote(text, uuid) to authenticated;

commit;
