-- RPC: does a piece have any un-cleared sent contribution_requests?
--
-- The piece-page SSR needs this to decide whether to render a stub piece in
-- pre-piece mode or in full mode. Full mode is required when the piece has
-- active editorial conversation (pending requests + drafts addressed to a
-- recipient), otherwise the section components don't render and the
-- recipient's inline PendingDraftCards have nowhere to mount.
--
-- Direct SELECT on contribution_requests from SSR's anon-session supabase
-- client returns zero rows because RLS scopes reads to sender/recipient/staff.
-- This RPC runs security-definer and exposes only a boolean — no leak of who
-- asked whom or what the note said. Callable by anon + authenticated so
-- SSR can call it without a session.

create or replace function public.piece_has_active_contribution_requests(
  p_piece_id text
) returns boolean
  language sql
  security definer
  set search_path = public
  stable
as $$
  select exists (
    select 1
    from public.contribution_requests
    where piece_id = p_piece_id
      and cleared_at is null
      and sent_at is not null
  );
$$;

revoke all on function public.piece_has_active_contribution_requests(text) from public;
grant execute on function public.piece_has_active_contribution_requests(text) to anon, authenticated;

comment on function public.piece_has_active_contribution_requests(text) is
  'Returns true if the given piece has any un-cleared, sent contribution_requests. '
  'Used by the piece-page SSR to promote stub pieces with editorial activity out '
  'of pre-piece mode. Exposes only a boolean; no request detail leaks.';
