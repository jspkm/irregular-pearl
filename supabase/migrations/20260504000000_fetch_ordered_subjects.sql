-- Slice C Step 5 (early): fetch_ordered_subjects RPC.
--
-- Returns the input IDs ordered by vote_tallies.net_score DESC, with a
-- stable tie-break on id. Counts never leave the server — only the ordered
-- ID list. vote_tallies is REVOKE'd from anon + authenticated (per plan
-- §2.5), and this SECURITY DEFINER RPC is the public read surface.
--
-- Callers pass the IDs they already have permission to see (e.g. published
-- performer's-note IDs, published signed-description IDs). The RPC never
-- reveals existence of an ID the caller didn't already pass in.

begin;

create or replace function public.fetch_ordered_subjects(
  p_subject_table text,
  p_subject_ids uuid[]
) returns uuid[]
  language sql
  security definer
  set search_path = public
as $$
  select coalesce(
    array_agg(s.id order by coalesce(t.net_score, 0) desc, s.id::text asc),
    '{}'::uuid[]
  )
  from unnest(p_subject_ids) as s(id)
  left join public.vote_tallies t
    on t.subject_table = p_subject_table
   and t.subject_id = s.id;
$$;

grant execute on function public.fetch_ordered_subjects(text, uuid[]) to anon, authenticated;

commit;
