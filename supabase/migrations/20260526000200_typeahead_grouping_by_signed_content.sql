-- Realign the typeahead grouping with the product rule that "in catalog"
-- means at least one signed contribution exists, not merely "a pieces row
-- exists." Stubs (pieces row, has_signed_content=false) now group under
-- "Not yet curated" alongside canonical-index entries that have never been
-- materialized. The UI distinguishes the two via a new is_materialized
-- column so the click action can branch (navigate vs. materialize).
--
-- Status of result_type values:
--   'in_catalog'      — piece exists in pieces table AND has_signed_content
--   'not_yet_curated' — everything else (stubs OR canonical-only entries)
--
-- is_materialized:
--   true  — pieces row exists. Click navigates to /piece/<id>.
--   false — canonical_piece_index only. Click triggers materialize.

drop function if exists public.search_pieces_typeahead(text);

create or replace function public.search_pieces_typeahead(p_query text)
  returns table(
    result_type text,
    is_materialized boolean,
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
      -- Materialized pieces with signed content → in_catalog
      select
        'in_catalog'::text,
        true,
        p.id,
        p.title,
        p.composer_name,
        p.catalog_number,
        p.instruments
      from public.pieces p
      join public.v_pieces_with_content_state v on v.id = p.id
      where v.has_signed_content = true
        and (
          p.title % v_trimmed
          or p.composer_name % v_trimmed
          or (p.catalog_number is not null and p.catalog_number % v_trimmed)
          or lower(p.title) like '%' || lower(v_trimmed) || '%'
          or lower(p.composer_name) like '%' || lower(v_trimmed) || '%'
        )
      order by greatest(
        similarity(p.title, v_trimmed),
        similarity(p.composer_name, v_trimmed),
        similarity(coalesce(p.catalog_number, ''), v_trimmed)
      ) desc
      limit 8
    )
    union all
    (
      -- Materialized but unsigned (stubs) → not_yet_curated, is_materialized=true
      select
        'not_yet_curated'::text,
        true,
        p.id,
        p.title,
        p.composer_name,
        p.catalog_number,
        p.instruments
      from public.pieces p
      join public.v_pieces_with_content_state v on v.id = p.id
      where v.has_signed_content = false
        and (
          p.title % v_trimmed
          or p.composer_name % v_trimmed
          or (p.catalog_number is not null and p.catalog_number % v_trimmed)
          or lower(p.title) like '%' || lower(v_trimmed) || '%'
          or lower(p.composer_name) like '%' || lower(v_trimmed) || '%'
        )
      order by greatest(
        similarity(p.title, v_trimmed),
        similarity(p.composer_name, v_trimmed),
        similarity(coalesce(p.catalog_number, ''), v_trimmed)
      ) desc
      limit 8
    )
    union all
    (
      -- Canonical entries with no pieces row → not_yet_curated, is_materialized=false
      select
        'not_yet_curated'::text,
        false,
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

grant execute on function public.search_pieces_typeahead(text) to anon, authenticated;
