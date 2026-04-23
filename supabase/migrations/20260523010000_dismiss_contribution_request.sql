-- Dismiss action for contribution-request messages.
--
-- "Dismiss" is the non-staff recipient's opt-out: the request is neither
-- fulfilled nor formally declined — it's set aside. Stamps both
-- contribution_requests.cleared_at and the associated notification's
-- cleared_at so the message stops appearing in the Messages page and
-- the bell. Does NOT set fulfilled_at (dismiss ≠ fulfilled).
--
-- Only the recipient can dismiss their own request, and only if they are
-- NOT staff. Staff recipients are held to the request — they can fulfill
-- it by publishing signed content (which triggers auto-clear) or leave
-- it pending, but they cannot soft-clear it. This matches the design
-- decision: staff-to-staff applies only the publish-auto-clear path;
-- *-to-user gets the dismiss option.

create or replace function public.dismiss_contribution_request(
  p_request_id uuid
) returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_recipient_id uuid;
  v_already_cleared timestamptz;
  v_recipient_is_staff boolean;
begin
  if v_user_id is null then
    raise exception 'unauthenticated' using errcode = 'P0001';
  end if;

  select recipient_id, cleared_at
    into v_recipient_id, v_already_cleared
    from public.contribution_requests
    where id = p_request_id;

  if v_recipient_id is null then
    -- Either the request doesn't exist or it's an email-only invite with
    -- no registered recipient. Either way, not dismissible via this path.
    raise exception 'request not found' using errcode = 'P0002';
  end if;

  if v_recipient_id <> v_user_id then
    raise exception 'only the recipient can dismiss this request'
      using errcode = 'P0003';
  end if;

  -- Staff (moderator/admin) cannot dismiss: they act via publish or
  -- leave the request pending. is_maestro is intentionally excluded from
  -- the staff check for this feature (matches request_contribution).
  select (role in ('moderator', 'admin')) into v_recipient_is_staff
    from public.users where id = v_user_id;
  if coalesce(v_recipient_is_staff, false) then
    raise exception 'staff cannot dismiss; publish to clear or leave pending'
      using errcode = 'P0004';
  end if;

  if v_already_cleared is not null then
    -- Idempotent: already dismissed or fulfilled, nothing to do.
    return;
  end if;

  update public.contribution_requests
    set cleared_at = now()
    where id = p_request_id;

  update public.notifications
    set cleared_at = now()
    where subject_table = 'contribution_requests'
      and subject_id = p_request_id
      and cleared_at is null;
end;
$$;

grant execute on function public.dismiss_contribution_request(uuid) to authenticated;
