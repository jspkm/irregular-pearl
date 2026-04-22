-- Admin RPCs for the editorial signals dashboard.
-- Both are staff-gated (role IN moderator/admin) and return the aggregated
-- shapes the /admin/unmatched-queries page renders. RPCs rather than direct
-- client queries because the aggregations (GROUP BY, COUNT DISTINCT with
-- COALESCE) are awkward via PostgREST.

-- ============================================
-- admin_top_unmatched_queries
-- ============================================
-- Groups search_misses by lowercased query so "Bach Cello Suite" and
-- "bach cello suite" roll up as the same query. Returns count, distinct
-- users, first/last seen.

create or replace function public.admin_top_unmatched_queries(p_limit int default 50)
  returns table(
    query text,
    count bigint,
    distinct_users bigint,
    first_seen timestamptz,
    last_seen timestamptz
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

  v_limit := greatest(1, least(p_limit, 500));

  return query
    select
      lower(sm.query) as query,
      count(*)::bigint as count,
      count(distinct sm.user_id)::bigint as distinct_users,
      min(sm.created_at) as first_seen,
      max(sm.created_at) as last_seen
    from public.search_misses sm
    where char_length(trim(sm.query)) >= 6
    group by lower(sm.query)
    order by count desc, last_seen desc
    limit v_limit;
end;
$$;

grant execute on function public.admin_top_unmatched_queries(int) to authenticated;

-- ============================================
-- admin_top_viewed_no_content_pieces
-- ============================================
-- Pieces that have zero published signed content but accumulated views.
-- Unique viewer count uses the
--   COALESCE(user_id::text, visitor_token, 'orphan-'||id::text)
-- pattern so revisits collapse for the same person (signed-in or anon-
-- with-token). 'orphan-*' rows count individually (each is a distinct
-- id), which matches the user's intent.

create or replace function public.admin_top_viewed_no_content_pieces(p_limit int default 50)
  returns table(
    piece_id text,
    title text,
    composer_name text,
    catalog_number text,
    unique_viewers bigint,
    total_views bigint,
    last_viewed timestamptz
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

  v_limit := greatest(30, least(p_limit, 200));

  return query
    select
      p.id as piece_id,
      p.title,
      p.composer_name,
      p.catalog_number,
      count(distinct coalesce(pv.user_id::text, pv.visitor_token, 'orphan-' || pv.id::text))::bigint as unique_viewers,
      count(pv.id)::bigint as total_views,
      max(pv.created_at) as last_viewed
    from public.pieces p
    join public.piece_views pv on pv.piece_id = p.id
    join public.v_pieces_with_content_state vs on vs.id = p.id
    where vs.has_signed_content = false
    group by p.id, p.title, p.composer_name, p.catalog_number
    order by unique_viewers desc, total_views desc, last_viewed desc
    limit v_limit;
end;
$$;

grant execute on function public.admin_top_viewed_no_content_pieces(int) to authenticated;
