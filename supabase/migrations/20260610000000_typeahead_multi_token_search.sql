-- Multi-token typeahead search.
--
-- The previous version matched the whole query as a single phrase against
-- each column. Multi-word queries that combined composer + title (e.g.
-- "bach sonata", "cello bach", "bach s" while typing "bach sonatas")
-- returned zero rows because no single column contains both tokens —
-- composer is "Johann Sebastian Bach" and title is "Cello Suite No. 1
-- in G major". Trigram similarity also fails on short fragments that
-- straddle column boundaries.
--
-- New behavior: split the query on whitespace, build a per-row haystack
-- from composer_name + title + catalog_number + instruments (also
-- native_title for canonical entries), and require every token to
-- appear as an ILIKE substring of the haystack. Trigram similarity is
-- preserved for single-token typo tolerance and for ranking.

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
  v_tokens  text[];
begin
  if char_length(v_trimmed) < 2 then
    return;
  end if;

  v_tokens := array(
    select lower(t)
    from unnest(regexp_split_to_array(v_trimmed, '\s+')) as t
    where char_length(t) > 0
  );

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
      join public.v_pieces_with_content_state v on v.id = p.id,
      lateral (
        select lower(
          coalesce(p.composer_name, '') || ' ' ||
          coalesce(p.title, '') || ' ' ||
          coalesce(p.catalog_number, '') || ' ' ||
          coalesce(array_to_string(p.instruments, ' '), '')
        ) as h
      ) hay
      where v.has_signed_content = true
        and (
          (select bool_and(hay.h like '%' || t || '%') from unnest(v_tokens) t)
          or (cardinality(v_tokens) = 1 and (
                p.title % v_trimmed
                or p.composer_name % v_trimmed
                or (p.catalog_number is not null and p.catalog_number % v_trimmed)
              ))
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
      join public.v_pieces_with_content_state v on v.id = p.id,
      lateral (
        select lower(
          coalesce(p.composer_name, '') || ' ' ||
          coalesce(p.title, '') || ' ' ||
          coalesce(p.catalog_number, '') || ' ' ||
          coalesce(array_to_string(p.instruments, ' '), '')
        ) as h
      ) hay
      where v.has_signed_content = false
        and (
          (select bool_and(hay.h like '%' || t || '%') from unnest(v_tokens) t)
          or (cardinality(v_tokens) = 1 and (
                p.title % v_trimmed
                or p.composer_name % v_trimmed
                or (p.catalog_number is not null and p.catalog_number % v_trimmed)
              ))
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
      from public.canonical_piece_index c,
      lateral (
        select lower(
          coalesce(c.composer_name, '') || ' ' ||
          coalesce(c.canonical_title, '') || ' ' ||
          coalesce(c.native_title, '') || ' ' ||
          coalesce(c.catalog_number, '') || ' ' ||
          coalesce(array_to_string(c.instruments, ' '), '')
        ) as h
      ) hay
      where not exists (
              select 1 from public.pieces p where p.canonical_index_id = c.id)
        and (
          (select bool_and(hay.h like '%' || t || '%') from unnest(v_tokens) t)
          or (cardinality(v_tokens) = 1 and (
                c.canonical_title % v_trimmed
                or (c.native_title is not null and c.native_title % v_trimmed)
                or c.composer_name % v_trimmed
                or (c.catalog_number is not null and c.catalog_number % v_trimmed)
              ))
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
