-- Fix: clear_contrib_requests_on_publish must not sweep bundled-draft requests.
--
-- The publish-triggered helper introduced in v0.4.0 clears every un-cleared
-- contribution_request at (piece_id, recipient_id) when the recipient
-- publishes a signed content row on that piece. That works for plain asks
-- (the request says "please contribute"; publishing fulfils it).
--
-- With v0.5.0 bundled-draft requests, multiple senders can have separate
-- requests addressed to the same recipient on the same piece. When the
-- recipient accepts one draft from sender A, act_on_draft creates a
-- published content row under the recipient's byline, which fires the
-- publish trigger, which would also clear sender B's unrelated request +
-- cascade its pending drafts.
--
-- The per-request _auto_close_request_on_full_disposition trigger already
-- handles lifecycle for bundled requests correctly (delete only when every
-- draft on that specific request is dispositioned). So clear-on-publish
-- should skip any request that has drafts attached — it owns only the
-- plain-ask path.

create or replace function public.clear_contrib_requests_on_publish(
  p_piece_id text,
  p_contributor_id uuid
) returns void
  language plpgsql security definer
  set search_path = public
as $$
declare
  v_request_ids uuid[];
begin
  -- Plain requests only: no rows in contribution_request_drafts. Bundled
  -- requests (any draft attached, regardless of disposition state) ride the
  -- auto-close-on-full-disposition trigger instead.
  select coalesce(array_agg(cr.id), array[]::uuid[])
    into v_request_ids
    from public.contribution_requests cr
    where cr.piece_id = p_piece_id
      and cr.recipient_id = p_contributor_id
      and cr.cleared_at is null
      and not exists (
        select 1 from public.contribution_request_drafts d
        where d.request_id = cr.id
      );

  if array_length(v_request_ids, 1) is null then
    return;
  end if;

  update public.contribution_requests
    set cleared_at = now()
    where id = any(v_request_ids);

  update public.notifications
    set cleared_at = now()
    where cleared_at is null
      and subject_table = 'contribution_requests'
      and subject_id = any(v_request_ids);
end;
$$;
