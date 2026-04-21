-- cast_vote whitelists subject_table explicitly; widen it to accept the
-- new 'pieces_seed_description' subject introduced in migration 20260516.
-- clear_vote has no whitelist (trust-by-ownership via user_id match), so
-- only cast_vote needs to change.

begin;

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
    'performers_notes',
    'interpretive_schools',
    'piece_descriptions',
    'landmarks',
    'pieces_seed_description'
  ) then
    raise exception 'invalid subject_table: %', p_subject_table;
  end if;

  perform public._check_rate_limit('cast_vote', 30, 60);

  insert into public.votes (user_id, subject_table, subject_id, vote_value)
  values (v_uid, p_subject_table, p_subject_id, p_vote_value)
  on conflict (user_id, subject_table, subject_id) do update
    set vote_value = excluded.vote_value,
        updated_at = now();
end;
$$;

commit;
