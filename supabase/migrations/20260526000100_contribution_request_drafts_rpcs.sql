-- Contribution-request drafts — RPCs (PR 1 of contribution-request-drafts plan)
-- See PLAN-contribution-request-drafts.md §3 for full spec.
--
-- This migration:
--   1. _require_drafting_staff() — gate for sender mutations. Matches the
--      existing v0.4.0 convention (role IN admin/moderator), distinct from
--      is_staff() which includes is_maestro.
--   2. _check_sender_eligible(p_recipient_id) — refactor of the sender-gate
--      logic that lives inline in request_contribution today. Reused by
--      create_outbox_request.
--   3. create_outbox_request — staff opens a new outbox request.
--   4. propose_draft — sender attaches a draft to an outbox request.
--   5. update_outbox_draft — sender edits a draft on an outbox request.
--   6. delete_outbox_draft — sender removes a draft from an outbox request.
--   7. delete_outbox_request — sender deletes the outbox request entirely.
--   8. send_request — sender stamps sent_at, snapshots to archive, fires
--      recipient notification. Locks the request row to serialize against
--      concurrent draft mutations.
--   9. act_on_draft — recipient accepts (with or without edit) or declines
--      a single draft. Locks the draft row to serialize dual-tab races.
--      On accept, creates a published row in the matching content table.
--  10. dismiss_draft_inline — recipient hides a draft from inline render.
--  11. UPDATE existing request_contribution RPC: stamp sent_at = now() on
--      insert (otherwise plain v0.4.0 requests are invisible to recipients
--      under the new RLS), and call _check_sender_eligible.

-- ============================================
-- 1. _require_drafting_staff
-- ============================================

create or replace function public._require_drafting_staff()
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_role text;
begin
  if auth.uid() is null then
    raise exception 'unauthenticated' using errcode = 'P0001';
  end if;
  select role into v_role from public.users where id = auth.uid();
  if v_role is null or v_role not in ('admin', 'moderator') then
    raise exception 'admin or moderator role required for drafting'
      using errcode = 'P0010';
  end if;
end;
$$;

revoke all on function public._require_drafting_staff() from public;

-- ============================================
-- 2. _check_sender_eligible(p_recipient_id)
-- ============================================
-- Shared sender-gate logic. Refactored from the inline body of
-- request_contribution. Raises on rate-limit or min-contributions failure.
-- Returns void on success. Staff bypass both checks.

create or replace function public._check_sender_eligible(
  p_recipient_id uuid
)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_sender_id uuid := auth.uid();
  v_is_staff boolean;
  v_min_contrib int;
  v_per_recipient_limit int;
  v_per_sender_limit int;
  v_recent_to_recipient int;
  v_recent_from_sender int;
  v_published_contrib_count int;
begin
  if v_sender_id is null then
    raise exception 'unauthenticated' using errcode = 'P0001';
  end if;

  select (role in ('moderator', 'admin')) into v_is_staff
    from public.users where id = v_sender_id;
  v_is_staff := coalesce(v_is_staff, false);

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

    select coalesce((value #>> '{}')::int, 10) into v_per_recipient_limit
      from public.app_config
      where key = 'request.rate_limit.per_recipient_per_30d';
    v_per_recipient_limit := coalesce(v_per_recipient_limit, 10);

    select coalesce((value #>> '{}')::int, 10) into v_per_sender_limit
      from public.app_config
      where key = 'request.rate_limit.per_sender_per_24h';
    v_per_sender_limit := coalesce(v_per_sender_limit, 10);

    if p_recipient_id is not null then
      select count(*)::int into v_recent_to_recipient
        from public.contribution_requests
        where sender_id = v_sender_id
          and recipient_id = p_recipient_id
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
end;
$$;

revoke all on function public._check_sender_eligible(uuid) from public;

-- ============================================
-- 3. create_outbox_request
-- ============================================

create or replace function public.create_outbox_request(
  p_piece_id text,
  p_recipient_id uuid,
  p_note text default null
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_sender_id uuid := auth.uid();
  v_request_id uuid;
begin
  perform public._require_drafting_staff();

  if p_recipient_id is null then
    raise exception 'recipient_id required' using errcode = 'P0011';
  end if;
  if p_recipient_id = v_sender_id then
    raise exception 'cannot send a request to yourself' using errcode = 'P0006';
  end if;
  if not exists (select 1 from public.users where id = p_recipient_id) then
    raise exception 'no musician found with that id' using errcode = 'P0005';
  end if;
  if not exists (select 1 from public.pieces where id = p_piece_id) then
    raise exception 'piece not found' using errcode = 'P0003';
  end if;
  if p_note is not null and char_length(p_note) > 280 then
    raise exception 'note exceeds 280 chars' using errcode = 'P0012';
  end if;

  perform public._check_sender_eligible(p_recipient_id);

  insert into public.contribution_requests
    (piece_id, sender_id, recipient_id, note, sent_at)
  values
    (p_piece_id, v_sender_id, p_recipient_id, p_note, null)
  returning id into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function public.create_outbox_request(text, uuid, text) from public;
grant execute on function public.create_outbox_request(text, uuid, text) to authenticated;

-- ============================================
-- 4. propose_draft
-- ============================================

create or replace function public.propose_draft(
  p_request_id uuid,
  p_kind public.draft_kind,
  p_payload jsonb
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_sender_id uuid := auth.uid();
  v_owner uuid;
  v_sent_at timestamptz;
  v_next_ordinal int;
  v_draft_id uuid;
begin
  perform public._require_drafting_staff();

  select sender_id, sent_at into v_owner, v_sent_at
    from public.contribution_requests
    where id = p_request_id
    for update;

  if v_owner is null then
    raise exception 'request not found' using errcode = 'P0013';
  end if;
  if v_owner <> v_sender_id then
    raise exception 'not the sender of this request' using errcode = 'P0014';
  end if;
  if v_sent_at is not null then
    raise exception 'request already sent' using errcode = 'P0015';
  end if;

  perform public._validate_draft_payload(p_kind, p_payload);

  select coalesce(max(ordinal) + 1, 0) into v_next_ordinal
    from public.contribution_request_drafts
    where request_id = p_request_id;

  insert into public.contribution_request_drafts
    (request_id, kind, payload, ordinal)
  values
    (p_request_id, p_kind, p_payload, v_next_ordinal)
  returning id into v_draft_id;

  return v_draft_id;
exception
  when unique_violation then
    raise exception 'a draft of this kind already exists on this request'
      using errcode = 'P0016';
end;
$$;

revoke all on function public.propose_draft(uuid, public.draft_kind, jsonb) from public;
grant execute on function public.propose_draft(uuid, public.draft_kind, jsonb) to authenticated;

-- ============================================
-- 5. update_outbox_draft
-- ============================================

create or replace function public.update_outbox_draft(
  p_draft_id uuid,
  p_payload jsonb
)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_sender_id uuid := auth.uid();
  v_owner uuid;
  v_sent_at timestamptz;
  v_kind public.draft_kind;
begin
  perform public._require_drafting_staff();

  select r.sender_id, r.sent_at, d.kind
    into v_owner, v_sent_at, v_kind
    from public.contribution_request_drafts d
    join public.contribution_requests r on r.id = d.request_id
    where d.id = p_draft_id
    for update of r;

  if v_owner is null then
    raise exception 'draft not found' using errcode = 'P0017';
  end if;
  if v_owner <> v_sender_id then
    raise exception 'not the sender of this draft' using errcode = 'P0014';
  end if;
  if v_sent_at is not null then
    raise exception 'request already sent' using errcode = 'P0015';
  end if;

  perform public._validate_draft_payload(v_kind, p_payload);

  update public.contribution_request_drafts
    set payload = p_payload
    where id = p_draft_id;
end;
$$;

revoke all on function public.update_outbox_draft(uuid, jsonb) from public;
grant execute on function public.update_outbox_draft(uuid, jsonb) to authenticated;

-- ============================================
-- 6. delete_outbox_draft
-- ============================================

create or replace function public.delete_outbox_draft(
  p_draft_id uuid
)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_sender_id uuid := auth.uid();
  v_owner uuid;
  v_sent_at timestamptz;
begin
  perform public._require_drafting_staff();

  select r.sender_id, r.sent_at
    into v_owner, v_sent_at
    from public.contribution_request_drafts d
    join public.contribution_requests r on r.id = d.request_id
    where d.id = p_draft_id
    for update of r;

  if v_owner is null then
    -- Idempotent — already deleted or never existed.
    return;
  end if;
  if v_owner <> v_sender_id then
    raise exception 'not the sender of this draft' using errcode = 'P0014';
  end if;
  if v_sent_at is not null then
    raise exception 'request already sent' using errcode = 'P0015';
  end if;

  delete from public.contribution_request_drafts where id = p_draft_id;
end;
$$;

revoke all on function public.delete_outbox_draft(uuid) from public;
grant execute on function public.delete_outbox_draft(uuid) to authenticated;

-- ============================================
-- 7. delete_outbox_request
-- ============================================

create or replace function public.delete_outbox_request(
  p_request_id uuid
)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_sender_id uuid := auth.uid();
  v_owner uuid;
  v_sent_at timestamptz;
begin
  perform public._require_drafting_staff();

  select sender_id, sent_at into v_owner, v_sent_at
    from public.contribution_requests
    where id = p_request_id
    for update;

  if v_owner is null then
    -- Idempotent.
    return;
  end if;
  if v_owner <> v_sender_id then
    raise exception 'not the sender of this request' using errcode = 'P0014';
  end if;
  if v_sent_at is not null then
    raise exception 'request already sent' using errcode = 'P0015';
  end if;

  delete from public.contribution_requests where id = p_request_id;
  -- Drafts cascade.
end;
$$;

revoke all on function public.delete_outbox_request(uuid) from public;
grant execute on function public.delete_outbox_request(uuid) to authenticated;

-- ============================================
-- 8. send_request
-- ============================================

create or replace function public.send_request(
  p_request_id uuid
)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_sender_id uuid := auth.uid();
  v_owner uuid;
  v_sent_at timestamptz;
  v_recipient_id uuid;
  v_piece_id text;
  v_piece_title text;
  v_note text;
  v_sender_display_name text;
  v_recipient_display_name text;
  v_draft_count int;
  v_only_kind public.draft_kind;
  v_metadata jsonb;
  v_body text;
  v_request_id_out uuid;
begin
  perform public._require_drafting_staff();

  select sender_id, sent_at, recipient_id, piece_id, note
    into v_owner, v_sent_at, v_recipient_id, v_piece_id, v_note
    from public.contribution_requests
    where id = p_request_id
    for update;

  if v_owner is null then
    raise exception 'request not found' using errcode = 'P0013';
  end if;
  if v_owner <> v_sender_id then
    raise exception 'not the sender of this request' using errcode = 'P0014';
  end if;
  if v_sent_at is not null then
    -- Idempotent on already-sent; just no-op.
    return;
  end if;
  if v_recipient_id is null then
    raise exception 'recipient no longer exists' using errcode = 'P0018';
  end if;

  select count(*)::int into v_draft_count
    from public.contribution_request_drafts
    where request_id = p_request_id;

  if v_draft_count = 1 then
    select kind into v_only_kind
      from public.contribution_request_drafts
      where request_id = p_request_id;
  end if;

  -- Snapshot to archive BEFORE stamping sent_at (so even if the auto-close
  -- trigger fires immediately on first disposition, the archive is intact).
  insert into public.sent_request_archive (
    original_request_id, piece_id, sender_id, recipient_id,
    recipient_display_name, sent_at, note, drafts
  )
  select
    p_request_id, v_piece_id, v_sender_id, v_recipient_id,
    (select display_name from public.users where id = v_recipient_id),
    now(),
    v_note,
    coalesce((
      select jsonb_agg(jsonb_build_object('kind', d.kind, 'payload', d.payload) order by d.ordinal)
      from public.contribution_request_drafts d
      where d.request_id = p_request_id
    ), '[]'::jsonb);

  -- Stamp sent_at on the live request.
  update public.contribution_requests
    set sent_at = now()
    where id = p_request_id;

  -- Build notification body + metadata.
  select title into v_piece_title from public.pieces where id = v_piece_id;
  select display_name into v_sender_display_name
    from public.users where id = v_sender_id;

  if v_draft_count = 0 then
    v_body := format('%s asked you to contribute to %s.',
      coalesce(v_sender_display_name, 'Someone'),
      v_piece_title);
    v_metadata := jsonb_build_object('draft_count', 0);
  elsif v_draft_count = 1 then
    v_body := format('%s asked you to contribute to %s, with a draft %s to start from.',
      coalesce(v_sender_display_name, 'Someone'),
      v_piece_title,
      case v_only_kind
        when 'performers_note' then 'performer''s note'
        when 'interpretive_school' then 'interpretive school'
        when 'piece_description' then 'piece description'
        when 'landmark' then 'landmark'
      end);
    v_metadata := jsonb_build_object(
      'draft_count', 1,
      'kind', v_only_kind::text
    );
  else
    v_body := format('%s asked you to contribute to %s, with %s drafts to start from.',
      coalesce(v_sender_display_name, 'Someone'),
      v_piece_title,
      v_draft_count);
    v_metadata := jsonb_build_object('draft_count', v_draft_count);
  end if;

  insert into public.notifications (
    recipient_id, type, subject_table, subject_id, body, link_path, metadata
  ) values (
    v_recipient_id,
    'contribution_requested',
    'contribution_requests',
    p_request_id,
    v_body,
    '/notifications',
    v_metadata
  )
  on conflict (subject_table, subject_id, type) where cleared_at is null
  do nothing;
end;
$$;

revoke all on function public.send_request(uuid) from public;
grant execute on function public.send_request(uuid) to authenticated;

-- ============================================
-- 9. act_on_draft
-- ============================================

create or replace function public.act_on_draft(
  p_draft_id uuid,
  p_action text,
  p_payload_override jsonb default null
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_request_id uuid;
  v_request_recipient uuid;
  v_request_sender uuid;
  v_request_piece text;
  v_request_sent_at timestamptz;
  v_kind public.draft_kind;
  v_payload jsonb;
  v_dispositioned timestamptz;
  v_effective_payload jsonb;
  v_new_content_id uuid;
  v_disposition text;
  v_version_id uuid;
  v_movement_id uuid;
  v_measure_start int;
  v_measure_end int;
  v_landmark_ordinal int;
begin
  if v_caller is null then
    raise exception 'unauthenticated' using errcode = 'P0001';
  end if;

  if p_action not in ('accept_as_is', 'edit_and_accept', 'decline') then
    raise exception 'invalid action: %', p_action using errcode = 'P0019';
  end if;

  -- Lock the draft row to serialize against concurrent acts in another tab.
  select d.request_id, d.kind, d.payload, d.dispositioned_at,
         r.recipient_id, r.sender_id, r.piece_id, r.sent_at
    into v_request_id, v_kind, v_payload, v_dispositioned,
         v_request_recipient, v_request_sender, v_request_piece, v_request_sent_at
    from public.contribution_request_drafts d
    join public.contribution_requests r on r.id = d.request_id
    where d.id = p_draft_id
    for update of d;

  if v_request_id is null then
    raise exception 'draft no longer available' using errcode = 'P0020';
  end if;
  if v_request_sent_at is null then
    -- Recipient cannot act on outbox (unsent) drafts.
    raise exception 'request not sent' using errcode = 'P0021';
  end if;
  if v_request_recipient is null or v_request_recipient <> v_caller then
    raise exception 'not the recipient of this draft' using errcode = 'P0022';
  end if;
  if v_dispositioned is not null then
    raise exception 'draft already dispositioned' using errcode = 'P0023';
  end if;

  if p_action = 'decline' then
    update public.contribution_request_drafts
      set dispositioned_at = now(),
          disposition = 'declined'
      where id = p_draft_id;
    return null;
  end if;

  -- Accept paths: validate effective payload, then create published content row.
  v_effective_payload := case
    when p_action = 'edit_and_accept' then p_payload_override
    else v_payload
  end;
  if v_effective_payload is null then
    raise exception 'edit_and_accept requires p_payload_override' using errcode = 'P0024';
  end if;
  perform public._validate_draft_payload(v_kind, v_effective_payload);

  -- Create the published content row under the recipient's byline.
  -- contributor_id = v_caller (the recipient acting), drafted_by = v_request_sender.

  if v_kind = 'performers_note' then
    v_new_content_id := gen_random_uuid();
    insert into public.performers_notes
      (id, piece_id, contributor_id, drafted_by, status,
       approved_by, approved_by_contributor_at)
    values
      (v_new_content_id, v_request_piece, v_caller, v_request_sender, 'draft',
       v_caller, now());

    v_version_id := public._insert_performers_note_version(
      v_new_content_id, v_request_piece, v_caller,
      v_effective_payload->>'body', v_caller, true
    );

    update public.performers_notes
      set status = 'published', current_version_id = v_version_id
      where id = v_new_content_id;

  elsif v_kind = 'interpretive_school' then
    v_new_content_id := gen_random_uuid();
    insert into public.interpretive_schools
      (id, piece_id, contributor_id, name, tempo_cues, drafted_by, status,
       approved_by, approved_by_contributor_at)
    values
      (v_new_content_id, v_request_piece, v_caller,
       trim(v_effective_payload->>'name'),
       v_effective_payload->'tempo_cues',
       v_request_sender, 'draft',
       v_caller, now());

    v_version_id := public._insert_interpretive_school_version(
      v_new_content_id, v_request_piece, v_caller,
      v_effective_payload->>'body', v_caller, true
    );

    update public.interpretive_schools
      set status = 'published', current_version_id = v_version_id
      where id = v_new_content_id;

  elsif v_kind = 'piece_description' then
    v_new_content_id := gen_random_uuid();
    insert into public.piece_descriptions
      (id, piece_id, contributor_id, drafted_by, status,
       approved_by, approved_by_contributor_at)
    values
      (v_new_content_id, v_request_piece, v_caller, v_request_sender, 'draft',
       v_caller, now());

    v_version_id := public._insert_piece_description_version(
      v_new_content_id, v_request_piece, v_caller,
      v_effective_payload->>'body', v_caller, true
    );

    update public.piece_descriptions
      set status = 'published', current_version_id = v_version_id
      where id = v_new_content_id;

  elsif v_kind = 'landmark' then
    -- Landmark head row is just the audit shell; label, measure range,
    -- ordinal, flags, and practice notes all live on landmark_versions.
    v_movement_id := (v_effective_payload->>'movement_id')::uuid;
    v_measure_start := (v_effective_payload->>'measure_start')::int;
    v_measure_end := nullif(v_effective_payload->>'measure_end', '')::int;

    -- Compute version-level ordinal scoped to (piece, movement).
    select coalesce(max(lv.ordinal) + 1, 0) into v_landmark_ordinal
      from public.landmarks l
      join public.landmark_versions lv on lv.id = l.current_version_id
      where l.piece_id = v_request_piece
        and l.movement_id = v_movement_id
        and l.status = 'published';

    v_new_content_id := gen_random_uuid();
    insert into public.landmarks
      (id, piece_id, movement_id, contributor_id, status, drafted_by,
       approved_by, approved_by_contributor_at)
    values
      (v_new_content_id, v_request_piece, v_movement_id, v_caller, 'draft',
       v_request_sender, v_caller, now());

    v_version_id := public._insert_landmark_version(
      v_new_content_id, v_request_piece, v_movement_id, v_caller,
      v_measure_start, v_measure_end,
      trim(v_effective_payload->>'label'),
      v_effective_payload->>'description',
      v_landmark_ordinal,
      coalesce(v_effective_payload->'flags', '[]'::jsonb),
      coalesce(v_effective_payload->'practice_notes', '[]'::jsonb),
      v_caller, true, null
    );

    update public.landmarks
      set status = 'published', current_version_id = v_version_id
      where id = v_new_content_id;

  else
    raise exception 'unknown kind: %', v_kind using errcode = 'P0025';
  end if;

  -- Stamp disposition. The auto-close trigger fires after this update;
  -- if all drafts on the request are now dispositioned, the request is
  -- hard-deleted (cascading remaining drafts) and the recipient's
  -- notification clears.
  update public.contribution_request_drafts
    set dispositioned_at = now(),
        disposition = 'accepted',
        accepted_as_id = v_new_content_id
    where id = p_draft_id;

  return v_new_content_id;
end;
$$;

revoke all on function public.act_on_draft(uuid, text, jsonb) from public;
grant execute on function public.act_on_draft(uuid, text, jsonb) to authenticated;

-- ============================================
-- 10. dismiss_draft_inline
-- ============================================

create or replace function public.dismiss_draft_inline(
  p_draft_id uuid
)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_request_recipient uuid;
  v_sent_at timestamptz;
  v_dispositioned timestamptz;
  v_already_dismissed timestamptz;
begin
  if v_caller is null then
    raise exception 'unauthenticated' using errcode = 'P0001';
  end if;

  select r.recipient_id, r.sent_at, d.dispositioned_at, d.inline_dismissed_at
    into v_request_recipient, v_sent_at, v_dispositioned, v_already_dismissed
    from public.contribution_request_drafts d
    join public.contribution_requests r on r.id = d.request_id
    where d.id = p_draft_id;

  if v_request_recipient is null then
    -- Idempotent: row gone.
    return;
  end if;
  if v_request_recipient <> v_caller then
    raise exception 'not the recipient of this draft' using errcode = 'P0022';
  end if;
  if v_sent_at is null then
    raise exception 'request not sent' using errcode = 'P0021';
  end if;
  if v_dispositioned is not null then
    raise exception 'draft already dispositioned' using errcode = 'P0023';
  end if;
  if v_already_dismissed is not null then
    -- Idempotent: already dismissed.
    return;
  end if;

  update public.contribution_request_drafts
    set inline_dismissed_at = now()
    where id = p_draft_id;
end;
$$;

revoke all on function public.dismiss_draft_inline(uuid) from public;
grant execute on function public.dismiss_draft_inline(uuid) to authenticated;

-- ============================================
-- 11. UPDATE existing request_contribution to stamp sent_at + use shared gate
-- ============================================
-- Without this update, plain v0.4.0 requests (which don't go through the new
-- create_outbox_request path) would be inserted with sent_at = NULL and become
-- invisible to recipients under the new RLS. This is the codex-flagged
-- ship-blocker (#1 in Draft 2 review).

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
  v_piece_title text;
  v_sender_display_name text;
  v_request_id uuid;
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

  -- Sender gate + rate limits via shared helper.
  perform public._check_sender_eligible(v_recipient_id);

  -- Plain requests are sent immediately (no outbox state).
  insert into public.contribution_requests
    (piece_id, sender_id, recipient_id, recipient_email, note, sent_at)
  values
    (p_piece_id, v_sender_id, v_recipient_id, p_recipient_email, p_note, now())
  returning id into v_request_id;

  if v_recipient_id is not null then
    select display_name into v_sender_display_name
      from public.users where id = v_sender_id;

    insert into public.notifications (
      recipient_id, type, subject_table, subject_id, body, link_path, metadata
    ) values (
      v_recipient_id,
      'contribution_requested',
      'contribution_requests',
      v_request_id,
      format('%s asked you to contribute to %s.',
             coalesce(v_sender_display_name, 'Someone'),
             v_piece_title),
      '/notifications',
      jsonb_build_object('draft_count', 0)
    )
    on conflict (subject_table, subject_id, type) where cleared_at is null
    do nothing;
  end if;

  return v_request_id;
end;
$$;
