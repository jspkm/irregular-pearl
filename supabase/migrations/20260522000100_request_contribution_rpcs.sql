-- Request-a-contribution — RPCs
--
-- Adds:
--   1. Unique constraint on pieces.canonical_index_id (1-to-1 with index)
--   2. Slugify helper _slugify()
--   3. materialize_piece_from_index(p_index_id)
--      Signed-in only. Race-safe via canonical_index_id / musicbrainz_work_id
--      / slug unique violations. Idempotent: returns existing piece_id on
--      any collision path.
--   4. request_contribution(p_piece_id, p_recipient_username, p_recipient_email, p_note)
--      Enforces sender gate, rate limits, recipient != sender. Email
--      invites staff-only. Staff (role IN moderator/admin; NOT is_maestro
--      for this feature's gate) bypass sender gate and rate limits.
--      Inserts contribution_request + notification (polymorphic pair
--      subject_table='contribution_requests', subject_id=<request_id>).
--   5. search_pieces_typeahead(p_query)
--      Returns grouped results (materialized + seed), fuzzy-matched via
--      pg_trgm. Logs queries >= 6 chars with zero matches to search_misses.
--
-- All RPCs are SECURITY DEFINER and set search_path = public.

-- ============================================
-- 1. pieces.canonical_index_id UNIQUE
-- ============================================

create unique index idx_pieces_canonical_index_id
  on public.pieces(canonical_index_id);

-- ============================================
-- 2. _slugify helper
-- ============================================

create or replace function public._slugify(p_input text)
  returns text
  language sql
  immutable
as $$
  select trim(
    both '-' from
    regexp_replace(
      regexp_replace(
        lower(coalesce(p_input, '')),
        '[^a-z0-9]+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
$$;

-- ============================================
-- 3. materialize_piece_from_index
-- ============================================

create or replace function public.materialize_piece_from_index(p_index_id uuid)
  returns text
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_cpi public.canonical_piece_index%rowtype;
  v_composer_last text;
  v_base_slug text;
  v_slug text;
  v_attempt int := 1;
  v_existing_piece_id text;
begin
  if auth.uid() is null then
    raise exception 'unauthenticated' using errcode = 'P0001';
  end if;

  select * into v_cpi from public.canonical_piece_index where id = p_index_id;
  if not found then
    raise exception 'canonical index entry not found' using errcode = 'P0002';
  end if;

  -- Idempotent: if this index row is already materialized, return that piece.
  select id into v_existing_piece_id
    from public.pieces
    where canonical_index_id = p_index_id
    limit 1;
  if v_existing_piece_id is not null then
    return v_existing_piece_id;
  end if;

  -- Also idempotent on MB work_id: if the MB work is already materialized
  -- via a different index row (shouldn't happen but defensive), return it.
  if v_cpi.musicbrainz_work_id is not null then
    select id into v_existing_piece_id
      from public.pieces
      where musicbrainz_work_id = v_cpi.musicbrainz_work_id
      limit 1;
    if v_existing_piece_id is not null then
      return v_existing_piece_id;
    end if;
  end if;

  -- Slug: composer_last - form - catalog_number, all slugified and joined.
  v_composer_last := split_part(trim(v_cpi.composer_name), ' ', -1);
  if coalesce(v_composer_last, '') = '' then
    v_composer_last := 'unknown';
  end if;

  v_base_slug := public._slugify(v_composer_last);
  if coalesce(v_cpi.form, '') <> '' then
    v_base_slug := v_base_slug || '-' || public._slugify(v_cpi.form);
  end if;
  if coalesce(v_cpi.catalog_number, '') <> '' then
    v_base_slug := v_base_slug || '-' || public._slugify(v_cpi.catalog_number);
  end if;

  if coalesce(v_base_slug, '') = '' then
    raise exception 'cannot generate slug from empty metadata' using errcode = 'P0003';
  end if;

  v_slug := v_base_slug;

  -- Attempt insert; on unique violation, disambiguate.
  loop
    begin
      insert into public.pieces (
        id, title, composer_name, catalog_number, instruments, era, form,
        difficulty, description, canonical_index_id, musicbrainz_work_id
      ) values (
        v_slug,
        v_cpi.canonical_title,
        v_cpi.composer_name,
        v_cpi.catalog_number,
        coalesce(v_cpi.instruments, '{}'),
        coalesce(nullif(v_cpi.era, ''), 'Contemporary'),
        coalesce(nullif(v_cpi.form, ''), 'unknown'),
        'intermediate',
        '',
        p_index_id,
        v_cpi.musicbrainz_work_id
      );
      return v_slug;
    exception
      when unique_violation then
        -- Race: another txn may have materialized this index row or MB id.
        select id into v_existing_piece_id
          from public.pieces
          where canonical_index_id = p_index_id
          limit 1;
        if v_existing_piece_id is not null then
          return v_existing_piece_id;
        end if;

        if v_cpi.musicbrainz_work_id is not null then
          select id into v_existing_piece_id
            from public.pieces
            where musicbrainz_work_id = v_cpi.musicbrainz_work_id
            limit 1;
          if v_existing_piece_id is not null then
            return v_existing_piece_id;
          end if;
        end if;

        -- Slug collision (two different index rows map to the same base slug).
        -- Disambiguate with -2, -3, ...
        v_attempt := v_attempt + 1;
        if v_attempt > 20 then
          raise exception 'slug collision: too many attempts' using errcode = 'P0004';
        end if;
        v_slug := v_base_slug || '-' || v_attempt;
    end;
  end loop;
end;
$$;

-- ============================================
-- 4. request_contribution
-- ============================================

create or replace function public.request_contribution(
  p_piece_id text,
  p_recipient_username text default null,
  p_recipient_email text default null,
  p_note text default null
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_sender_id uuid := auth.uid();
  v_recipient_id uuid;
  v_is_staff boolean;
  v_min_contrib int;
  v_per_recipient_limit int;
  v_per_sender_limit int;
  v_recent_to_recipient int;
  v_recent_from_sender int;
  v_piece_title text;
  v_sender_display_name text;
  v_request_id uuid;
  v_published_contrib_count int;
begin
  -- Auth
  if v_sender_id is null then
    raise exception 'unauthenticated' using errcode = 'P0001';
  end if;

  -- Exactly one recipient identifier
  if (p_recipient_username is null) = (p_recipient_email is null) then
    raise exception 'must provide exactly one of recipient username or email'
      using errcode = 'P0002';
  end if;

  -- Piece must exist
  select title into v_piece_title from public.pieces where id = p_piece_id;
  if v_piece_title is null then
    raise exception 'piece not found' using errcode = 'P0003';
  end if;

  -- Staff check (role-only; is_maestro excluded for this feature's gate)
  select (role in ('moderator', 'admin')) into v_is_staff
    from public.users where id = v_sender_id;
  v_is_staff := coalesce(v_is_staff, false);

  -- Email invites staff-only
  if p_recipient_email is not null and not v_is_staff then
    raise exception 'email invites are staff-only' using errcode = 'P0004';
  end if;

  -- Resolve username
  if p_recipient_username is not null then
    select id into v_recipient_id
      from public.users
      where username = p_recipient_username;
    if v_recipient_id is null then
      raise exception 'no musician found with that username'
        using errcode = 'P0005';
    end if;

    if v_recipient_id = v_sender_id then
      raise exception 'cannot send a request to yourself'
        using errcode = 'P0006';
    end if;
  end if;

  -- Sender gate: >=1 published signed contribution (staff bypass)
  if not v_is_staff then
    select coalesce((value #>> '{}')::int, 1) into v_min_contrib
      from public.app_config
      where key = 'request.sender_gate.min_published_contributions';
    v_min_contrib := coalesce(v_min_contrib, 1);

    select (
      (select count(*) from public.performers_notes
         where contributor_id = v_sender_id and status = 'published')
      + (select count(*) from public.interpretive_schools
           where contributor_id = v_sender_id and status = 'published')
      + (select count(*) from public.landmarks
           where contributor_id = v_sender_id and status = 'published')
      + (select count(*) from public.piece_descriptions
           where contributor_id = v_sender_id and status = 'published')
    ) into v_published_contrib_count;

    if v_published_contrib_count < v_min_contrib then
      raise exception
        'sender gate: need at least % published signed contribution(s) before sending requests',
        v_min_contrib
        using errcode = 'P0007';
    end if;
  end if;

  -- Rate limits (staff bypass)
  if not v_is_staff then
    select coalesce((value #>> '{}')::int, 10) into v_per_recipient_limit
      from public.app_config
      where key = 'request.rate_limit.per_recipient_per_30d';
    v_per_recipient_limit := coalesce(v_per_recipient_limit, 10);

    select coalesce((value #>> '{}')::int, 10) into v_per_sender_limit
      from public.app_config
      where key = 'request.rate_limit.per_sender_per_24h';
    v_per_sender_limit := coalesce(v_per_sender_limit, 10);

    if v_recipient_id is not null then
      select count(*)::int into v_recent_to_recipient
        from public.contribution_requests
        where sender_id = v_sender_id
          and recipient_id = v_recipient_id
          and created_at >= now() - interval '30 days';
      if v_recent_to_recipient >= v_per_recipient_limit then
        raise exception
          'rate limit: too many recent requests to this recipient'
          using errcode = 'P0008';
      end if;
    end if;

    select count(*)::int into v_recent_from_sender
      from public.contribution_requests
      where sender_id = v_sender_id
        and created_at >= now() - interval '24 hours';
    if v_recent_from_sender >= v_per_sender_limit then
      raise exception
        'rate limit: too many requests in the last 24 hours'
        using errcode = 'P0009';
    end if;
  end if;

  -- Insert the request
  insert into public.contribution_requests (
    piece_id, sender_id, recipient_id, recipient_email, note
  ) values (
    p_piece_id, v_sender_id, v_recipient_id, p_recipient_email, p_note
  ) returning id into v_request_id;

  -- Notify recipient (only user-ID invites; email invites are delivered via
  -- the ESP pipeline when it lands).
  if v_recipient_id is not null then
    select display_name into v_sender_display_name
      from public.users where id = v_sender_id;

    insert into public.notifications (
      recipient_id, type, subject_table, subject_id, body, link_path
    ) values (
      v_recipient_id,
      'contribution_requested',
      'contribution_requests',
      v_request_id,
      format('%s asked you to contribute to %s.',
             coalesce(v_sender_display_name, 'Someone'),
             v_piece_title),
      format('/p/%s', p_piece_id)
    )
    on conflict (subject_table, subject_id, type) where cleared_at is null
    do nothing;
  end if;

  return v_request_id;
end;
$$;

-- ============================================
-- 5. search_pieces_typeahead
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
  v_user_id uuid := auth.uid();
  v_trimmed text := trim(coalesce(p_query, ''));
  v_total_rows int;
begin
  if char_length(v_trimmed) < 2 then
    return;  -- minimum 2 chars before searching
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

  -- Log unmatched queries (>=6 chars, zero results combined).
  if char_length(v_trimmed) >= 6 then
    select
      ( (select count(*) from public.pieces p
           where p.title % v_trimmed
              or p.composer_name % v_trimmed
              or (p.catalog_number is not null and p.catalog_number % v_trimmed))
      + (select count(*) from public.canonical_piece_index c
           where not exists (select 1 from public.pieces p where p.canonical_index_id = c.id)
             and (c.canonical_title % v_trimmed
                  or c.composer_name % v_trimmed
                  or (c.catalog_number is not null and c.catalog_number % v_trimmed)))
      ) into v_total_rows;

    if coalesce(v_total_rows, 0) = 0 then
      insert into public.search_misses (query, result_count, user_id)
        values (v_trimmed, 0, v_user_id);
    end if;
  end if;
end;
$$;

-- ============================================
-- Grants so authenticated + anon roles can call these via PostgREST.
-- ============================================

grant execute on function public.materialize_piece_from_index(uuid) to authenticated;
grant execute on function public.request_contribution(text, text, text, text) to authenticated;
grant execute on function public.search_pieces_typeahead(text) to anon, authenticated;
