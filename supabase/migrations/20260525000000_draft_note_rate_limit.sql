-- Staff gate + rate limit for /api/draft-contribution-note.
--
-- The endpoint calls Anthropic per request. Staff-only (role IN
-- moderator/admin; is_maestro excluded to match the request_contribution
-- gate). Cap at 20 drafts per staff user per 24h by default, tunable via
-- app_config. Rationale: this is a cost center, not a user-facing feature;
-- limiting to staff keeps the bill bounded to people we trust.

create table public.draft_note_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index idx_draft_note_requests_user_created
  on public.draft_note_requests(user_id, created_at desc);

alter table public.draft_note_requests enable row level security;
-- No policies. Only the security-definer RPC below may touch this table.

insert into public.app_config (key, value) values
  ('draft_note.per_user_per_24h', '20'::jsonb)
  on conflict (key) do nothing;

create or replace function public.log_draft_note_request()
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_staff boolean;
  v_limit int;
  v_recent int;
begin
  if v_user_id is null then
    raise exception 'unauthenticated' using errcode = 'P0001';
  end if;

  select (role in ('moderator','admin')) into v_is_staff
    from public.users where id = v_user_id;
  if not coalesce(v_is_staff, false) then
    raise exception 'staff only' using errcode = 'P0003';
  end if;

  select coalesce((value #>> '{}')::int, 20) into v_limit
    from public.app_config
    where key = 'draft_note.per_user_per_24h';
  v_limit := coalesce(v_limit, 20);

  select count(*)::int into v_recent
    from public.draft_note_requests
    where user_id = v_user_id
      and created_at >= now() - interval '24 hours';

  if v_recent >= v_limit then
    raise exception 'rate_limit' using errcode = 'P0002';
  end if;

  insert into public.draft_note_requests (user_id) values (v_user_id);
end;
$$;

grant execute on function public.log_draft_note_request() to authenticated;
