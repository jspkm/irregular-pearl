-- Admin RPC: recent published signed content across all four subject
-- types. Powers the "Recent curation" section on the admin dashboard.
--
-- Returns one row per published performers_note / interpretive_school /
-- landmark / piece_description row, with piece title + contributor
-- identity (display name, username, email). Ordered by updated_at
-- descending so freshly edited content floats to the top.
--
-- Staff-gated. Reads auth.users for the contributor's email, which is
-- safe inside a security-definer function.

create or replace function public.admin_recent_curation(
  p_limit int default 20
) returns table(
  subject_type text,
  subject_id uuid,
  piece_id text,
  piece_title text,
  contributor_id uuid,
  contributor_display_name text,
  contributor_username text,
  contributor_email text,
  published_at timestamptz
)
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_limit int;
begin
  if not exists (select 1 from public.users
                 where id = auth.uid() and role in ('moderator','admin')) then
    raise exception 'staff only' using errcode = 'P0001';
  end if;

  v_limit := greatest(1, least(p_limit, 200));

  return query
    select * from (
      select
        'performers_note'::text as subject_type,
        pn.id as subject_id,
        pn.piece_id,
        p.title as piece_title,
        pn.contributor_id,
        u.display_name as contributor_display_name,
        u.username as contributor_username,
        au.email as contributor_email,
        pn.updated_at as published_at
      from public.performers_notes pn
      join public.pieces p on p.id = pn.piece_id
      left join public.users u on u.id = pn.contributor_id
      left join auth.users au on au.id = pn.contributor_id
      where pn.status = 'published'

      union all

      select
        'interpretive_school'::text,
        s.id,
        s.piece_id,
        p.title,
        s.contributor_id,
        u.display_name,
        u.username,
        au.email,
        s.updated_at
      from public.interpretive_schools s
      join public.pieces p on p.id = s.piece_id
      left join public.users u on u.id = s.contributor_id
      left join auth.users au on au.id = s.contributor_id
      where s.status = 'published'

      union all

      select
        'landmark'::text,
        lm.id,
        lm.piece_id,
        p.title,
        lm.contributor_id,
        u.display_name,
        u.username,
        au.email,
        lm.updated_at
      from public.landmarks lm
      join public.pieces p on p.id = lm.piece_id
      left join public.users u on u.id = lm.contributor_id
      left join auth.users au on au.id = lm.contributor_id
      where lm.status = 'published'

      union all

      select
        'piece_description'::text,
        pd.id,
        pd.piece_id,
        p.title,
        pd.contributor_id,
        u.display_name,
        u.username,
        au.email,
        pd.updated_at
      from public.piece_descriptions pd
      join public.pieces p on p.id = pd.piece_id
      left join public.users u on u.id = pd.contributor_id
      left join auth.users au on au.id = pd.contributor_id
      where pd.status = 'published'
    ) all_curation
    order by published_at desc nulls last
    limit v_limit;
end;
$$;

grant execute on function public.admin_recent_curation(int) to authenticated;
