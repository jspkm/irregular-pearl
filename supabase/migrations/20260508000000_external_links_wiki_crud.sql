-- External-link wiki-edit parity (recordings + external references).
-- `external_links` is the shared table; UI splits by type: recordings
-- (youtube / vimeo / spotify / internet_archive / soundcloud / bandcamp)
-- vs external references (imslp / wikipedia / anything else).
--
-- Schema changes:
--   - ordinal smallint: display order per (piece, kind)  — UI orders each
--     kind independently, but one shared numeric column is enough as long
--     as the UI filters its own subset.
--   - deleted_at timestamptz: soft-delete
--   - created_by uuid: who added this link
--   - Partial unique(piece_id, ordinal) WHERE deleted_at IS NULL — not
--     per-kind since ordinal is only a sort key per-section in the UI;
--     making the uniqueness span the whole piece keeps the swap RPC simple.
--     Downside: a reorder in recordings can shift an external reference's
--     absolute ordinal. UI handles this by swapping only within-kind IDs.

begin;

alter table public.external_links add column if not exists ordinal smallint;
alter table public.external_links add column if not exists deleted_at timestamptz;
alter table public.external_links add column if not exists created_by uuid references public.users(id);

update public.external_links e
  set ordinal = sub.rn
  from (
    select id, row_number() over (partition by piece_id order by id) as rn
    from public.external_links
    where ordinal is null
  ) sub
  where e.id = sub.id
    and e.ordinal is null;

alter table public.external_links alter column ordinal set not null;
alter table public.external_links alter column ordinal set default 1;

create unique index if not exists ux_external_links_piece_ordinal_active
  on public.external_links (piece_id, ordinal)
  where deleted_at is null;

-- ============================================================================
-- create_external_link
-- ============================================================================

create or replace function public.create_external_link(
  p_piece_id text,
  p_type text,
  p_url text,
  p_label text
) returns text
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id text;
  v_next smallint;
begin
  if v_uid is null then raise exception 'unauthenticated'; end if;

  perform public._check_rate_limit('content_edit', 30, 3600);

  if not exists (select 1 from public.pieces where id = p_piece_id) then
    raise exception 'piece not found: %', p_piece_id;
  end if;
  if char_length(coalesce(p_url, '')) < 1 then
    raise exception 'url required';
  end if;
  if char_length(coalesce(p_label, '')) < 1 or char_length(p_label) > 200 then
    raise exception 'label must be 1-200 chars';
  end if;

  -- p_type must be a valid link_type enum value; cast raises on bad input.
  perform p_type::public.link_type;

  select coalesce(max(ordinal), 0) + 1 into v_next
    from public.external_links
    where piece_id = p_piece_id
      and deleted_at is null;

  v_id := 'xl-' || gen_random_uuid()::text;

  insert into public.external_links (id, piece_id, type, url, label, source, ordinal, created_by)
  values (v_id, p_piece_id, p_type::public.link_type, p_url, p_label, 'user', v_next, v_uid);

  return v_id;
end;
$$;

revoke execute on function public.create_external_link(text, text, text, text) from public;
grant execute on function public.create_external_link(text, text, text, text) to authenticated;

-- ============================================================================
-- update_external_link
-- ============================================================================

create or replace function public.update_external_link(
  p_id text,
  p_type text,
  p_url text,
  p_label text
) returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_deleted_at timestamptz;
begin
  if v_uid is null then raise exception 'unauthenticated'; end if;

  perform public._check_rate_limit('content_edit', 30, 3600);

  select deleted_at into v_deleted_at from public.external_links where id = p_id;
  if not found then raise exception 'external link not found'; end if;
  if v_deleted_at is not null then raise exception 'external link is deleted'; end if;

  if char_length(coalesce(p_url, '')) < 1 then raise exception 'url required'; end if;
  if char_length(coalesce(p_label, '')) < 1 or char_length(p_label) > 200 then
    raise exception 'label must be 1-200 chars';
  end if;
  perform p_type::public.link_type;

  update public.external_links
    set type = p_type::public.link_type,
        url = p_url,
        label = p_label
    where id = p_id;
end;
$$;

revoke execute on function public.update_external_link(text, text, text, text) from public;
grant execute on function public.update_external_link(text, text, text, text) to authenticated;

-- ============================================================================
-- delete_external_link — soft-delete
-- ============================================================================

create or replace function public.delete_external_link(p_id text) returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_deleted_at timestamptz;
begin
  if v_uid is null then raise exception 'unauthenticated'; end if;

  perform public._check_rate_limit('content_edit', 30, 3600);

  select deleted_at into v_deleted_at from public.external_links where id = p_id;
  if not found then raise exception 'external link not found'; end if;
  if v_deleted_at is not null then raise exception 'external link already deleted'; end if;

  update public.external_links set deleted_at = now() where id = p_id;
end;
$$;

revoke execute on function public.delete_external_link(text) from public;
grant execute on function public.delete_external_link(text) to authenticated;

-- ============================================================================
-- swap_external_link_ordinals
-- ============================================================================

create or replace function public.swap_external_link_ordinals(
  p_id_a text,
  p_id_b text
) returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_a record;
  v_b record;
begin
  if v_uid is null then raise exception 'unauthenticated'; end if;
  if p_id_a = p_id_b then raise exception 'cannot swap with itself'; end if;

  perform public._check_rate_limit('content_edit', 30, 3600);

  select * into v_a from public.external_links where id = p_id_a;
  if not found then raise exception 'link A not found'; end if;
  if v_a.deleted_at is not null then raise exception 'link A is deleted'; end if;

  select * into v_b from public.external_links where id = p_id_b;
  if not found then raise exception 'link B not found'; end if;
  if v_b.deleted_at is not null then raise exception 'link B is deleted'; end if;

  if v_a.piece_id <> v_b.piece_id then
    raise exception 'links belong to different pieces';
  end if;

  update public.external_links set ordinal = -1 where id = p_id_a;
  update public.external_links set ordinal = v_a.ordinal where id = p_id_b;
  update public.external_links set ordinal = v_b.ordinal where id = p_id_a;
end;
$$;

revoke execute on function public.swap_external_link_ordinals(text, text) from public;
grant execute on function public.swap_external_link_ordinals(text, text) to authenticated;

commit;
