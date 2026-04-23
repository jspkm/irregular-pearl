-- Re-point contribution_requested notifications at /notifications
-- instead of /piece/<slug>.
--
-- Rationale: contribution requests are messages. The recipient reads them
-- on the Messages page, where sender, timestamp, and personal note are
-- surfaced clearly. The piece link lives inside the message card, not on
-- the bell row. Mirrors how draft_awaiting_approval already routes.
--
-- Non-destructive: CREATE OR REPLACE on an existing function, no data
-- touched. Applied via `supabase migration up`.

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
  if v_sender_id is null then
    raise exception 'unauthenticated' using errcode = 'P0001';
  end if;

  if (p_recipient_username is null) = (p_recipient_email is null) then
    raise exception 'must provide exactly one of recipient username or email'
      using errcode = 'P0002';
  end if;

  select title into v_piece_title from public.pieces where id = p_piece_id;
  if v_piece_title is null then
    raise exception 'piece not found' using errcode = 'P0003';
  end if;

  select (role in ('moderator', 'admin')) into v_is_staff
    from public.users where id = v_sender_id;
  v_is_staff := coalesce(v_is_staff, false);

  if p_recipient_email is not null and not v_is_staff then
    raise exception 'email invites are staff-only' using errcode = 'P0004';
  end if;

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

  insert into public.contribution_requests (
    piece_id, sender_id, recipient_id, recipient_email, note
  ) values (
    p_piece_id, v_sender_id, v_recipient_id, p_recipient_email, p_note
  ) returning id into v_request_id;

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
      '/notifications'
    )
    on conflict (subject_table, subject_id, type) where cleared_at is null
    do nothing;
  end if;

  return v_request_id;
end;
$$;
