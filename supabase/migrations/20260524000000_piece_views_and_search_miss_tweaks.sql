-- Editorial signals: piece_views + dismiss-only search_misses logging
--
-- 1. piece_views — every visit to /piece/[id] fires log_piece_view with
--    the current auth.uid() (null for anon) and a client-local visitor
--    token (uuid stored in localStorage; null if cookies/storage blocked).
--    The admin view counts unique viewers using
--    COALESCE(user_id::text, visitor_token, 'orphan-' || id::text),
--    so revisits don't inflate the count for the same person whether
--    signed-in or anon-with-storage.
--
-- 2. search_pieces_typeahead no longer auto-logs misses on every
--    keystroke. Per-keystroke logging produced 10+ rows for a single
--    typing session. The client now calls log_search_miss only when
--    the user dismisses the dropdown with zero matches on a query
--    >= 6 chars (Escape, outside click, nav away, blur). Dedup is
--    client-side via sessionStorage.

-- ============================================
-- 1. piece_views table + RLS
-- ============================================

create table public.piece_views (
  id uuid primary key default gen_random_uuid(),
  piece_id text not null references public.pieces(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  visitor_token text,
  created_at timestamptz not null default now()
);

create index idx_piece_views_piece
  on public.piece_views(piece_id, created_at desc);

create index idx_piece_views_piece_dedup
  on public.piece_views(piece_id, user_id, visitor_token);

alter table public.piece_views enable row level security;

-- Staff-only read. Writes happen via the log_piece_view RPC below
-- (security definer) so anon can log without a broad INSERT policy.
create policy piece_views_staff_read on public.piece_views
  for select using (
    exists (select 1 from public.users
              where id = auth.uid() and role in ('moderator', 'admin'))
  );

-- ============================================
-- 2. log_piece_view RPC
-- ============================================

create or replace function public.log_piece_view(
  p_piece_id text,
  p_visitor_token text default null
) returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_token text;
begin
  if p_piece_id is null or p_piece_id = '' then
    return;
  end if;

  -- visitor_token is only retained for anon calls. For signed-in users
  -- the user_id is the dedup key, so we don't need the token.
  if v_user_id is null then
    v_token := nullif(trim(coalesce(p_visitor_token, '')), '');
  else
    v_token := null;
  end if;

  begin
    insert into public.piece_views (piece_id, user_id, visitor_token)
      values (p_piece_id, v_user_id, v_token);
  exception
    when foreign_key_violation then
      -- Piece was deleted or never existed; drop the log silently.
      return;
  end;
end;
$$;

grant execute on function public.log_piece_view(text, text) to anon, authenticated;

-- ============================================
-- 3. log_search_miss RPC (client-called on dismiss)
-- ============================================

create or replace function public.log_search_miss(p_query text)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_trimmed text := trim(coalesce(p_query, ''));
  v_user_id uuid := auth.uid();
begin
  -- Match the original threshold: below 6 chars, queries are too noisy
  -- to be useful signal even if zero results.
  if char_length(v_trimmed) < 6 then
    return;
  end if;

  insert into public.search_misses (query, result_count, user_id)
    values (v_trimmed, 0, v_user_id);
end;
$$;

grant execute on function public.log_search_miss(text) to anon, authenticated;

-- ============================================
-- 4. Drop per-keystroke logging from search_pieces_typeahead
-- ============================================

create or replace function public.search_pieces_typeahead(p_query text)
  returns table(
    result_type text,
    id text,
    title text,
    composer_name text,
    catalog_number text,
    instruments text[]
  )
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_trimmed text := trim(coalesce(p_query, ''));
begin
  if char_length(v_trimmed) < 2 then
    return;
  end if;

  return query
    (
      select
        'materialized'::text,
        p.id,
        p.title,
        p.composer_name,
        p.catalog_number,
        p.instruments
      from public.pieces p
      where p.title % v_trimmed
         or p.composer_name % v_trimmed
         or (p.catalog_number is not null and p.catalog_number % v_trimmed)
         or lower(p.title) like '%' || lower(v_trimmed) || '%'
         or lower(p.composer_name) like '%' || lower(v_trimmed) || '%'
      order by greatest(
        similarity(p.title, v_trimmed),
        similarity(p.composer_name, v_trimmed),
        similarity(coalesce(p.catalog_number, ''), v_trimmed)
      ) desc
      limit 8
    )
    union all
    (
      select
        'seed'::text,
        c.id::text,
        c.canonical_title,
        c.composer_name,
        c.catalog_number,
        c.instruments
      from public.canonical_piece_index c
      where not exists (
              select 1 from public.pieces p where p.canonical_index_id = c.id)
        and (
          c.canonical_title % v_trimmed
          or (c.native_title is not null and c.native_title % v_trimmed)
          or c.composer_name % v_trimmed
          or (c.catalog_number is not null and c.catalog_number % v_trimmed)
          or lower(c.canonical_title) like '%' || lower(v_trimmed) || '%'
          or lower(c.composer_name) like '%' || lower(v_trimmed) || '%'
        )
      order by greatest(
        similarity(c.canonical_title, v_trimmed),
        similarity(coalesce(c.native_title, ''), v_trimmed),
        similarity(c.composer_name, v_trimmed),
        similarity(coalesce(c.catalog_number, ''), v_trimmed)
      ) desc
      limit 8
    );
end;
$$;
