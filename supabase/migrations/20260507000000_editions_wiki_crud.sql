-- Editions wiki-edit parity with movements: any authenticated user can
-- create / update / reorder / (soft-)delete. Shares the 'content_edit'
-- rate-limit bucket with external-link and pedagogical-arc CRUD.
--
-- Schema changes:
--   - url text (optional, used by the UI to link out to publisher pages)
--   - type text (optional: 'urtext' | 'scholarly' | 'performer' | 'facsimile' | 'critical' | 'practical')
--   - ordinal smallint: display order per piece; new editions append at max+1
--   - deleted_at timestamptz: soft-delete
--   - created_by uuid: who added this edition (null for seed data)
--   - Partial unique(piece_id, ordinal) WHERE deleted_at IS NULL so
--     tombstones don't reserve ordinals

begin;

alter table public.editions add column if not exists url text;
alter table public.editions add column if not exists type text;
alter table public.editions add column if not exists ordinal smallint;
alter table public.editions add column if not exists deleted_at timestamptz;
alter table public.editions add column if not exists created_by uuid references public.users(id);

-- Backfill ordinal for pre-existing rows based on insertion order.
update public.editions e
  set ordinal = sub.rn
  from (
    select id, row_number() over (partition by piece_id order by id) as rn
    from public.editions
    where ordinal is null
  ) sub
  where e.id = sub.id
    and e.ordinal is null;

alter table public.editions alter column ordinal set not null;
alter table public.editions alter column ordinal set default 1;

create unique index if not exists ux_editions_piece_ordinal_active
  on public.editions (piece_id, ordinal)
  where deleted_at is null;

-- ============================================================================
-- create_edition
-- ============================================================================

create or replace function public.create_edition(
  p_piece_id text,
  p_publisher text,
  p_editor text,
  p_year integer default null,
  p_description text default '',
  p_type text default null,
  p_url text default null
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
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  perform public._check_rate_limit('content_edit', 30, 3600);

  if not exists (select 1 from public.pieces where id = p_piece_id) then
    raise exception 'piece not found: %', p_piece_id;
  end if;
  if char_length(coalesce(p_publisher, '')) < 1 or char_length(p_publisher) > 200 then
    raise exception 'publisher must be 1-200 chars';
  end if;
  if char_length(coalesce(p_editor, '')) > 200 then
    raise exception 'editor must be <= 200 chars';
  end if;

  select coalesce(max(ordinal), 0) + 1 into v_next
    from public.editions
    where piece_id = p_piece_id
      and deleted_at is null;

  v_id := 'ed-' || gen_random_uuid()::text;

  insert into public.editions (
    id, piece_id, publisher, editor, year, description, type, url, ordinal, created_by
  ) values (
    v_id, p_piece_id, p_publisher, coalesce(p_editor, ''), p_year,
    coalesce(p_description, ''), p_type, p_url, v_next, v_uid
  );

  return v_id;
end;
$$;

revoke execute on function public.create_edition(text, text, text, integer, text, text, text) from public;
grant execute on function public.create_edition(text, text, text, integer, text, text, text) to authenticated;

-- ============================================================================
-- update_edition
-- ============================================================================

create or replace function public.update_edition(
  p_id text,
  p_publisher text,
  p_editor text,
  p_year integer default null,
  p_description text default '',
  p_type text default null,
  p_url text default null
) returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_deleted_at timestamptz;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  perform public._check_rate_limit('content_edit', 30, 3600);

  select deleted_at into v_deleted_at from public.editions where id = p_id;
  if not found then raise exception 'edition not found: %', p_id; end if;
  if v_deleted_at is not null then raise exception 'edition is deleted'; end if;

  if char_length(coalesce(p_publisher, '')) < 1 or char_length(p_publisher) > 200 then
    raise exception 'publisher must be 1-200 chars';
  end if;

  update public.editions
    set publisher = p_publisher,
        editor = coalesce(p_editor, ''),
        year = p_year,
        description = coalesce(p_description, ''),
        type = p_type,
        url = p_url
    where id = p_id;
end;
$$;

revoke execute on function public.update_edition(text, text, text, integer, text, text, text) from public;
grant execute on function public.update_edition(text, text, text, integer, text, text, text) to authenticated;

-- ============================================================================
-- delete_edition — soft-delete
-- ============================================================================

create or replace function public.delete_edition(p_id text) returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_deleted_at timestamptz;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;

  perform public._check_rate_limit('content_edit', 30, 3600);

  select deleted_at into v_deleted_at from public.editions where id = p_id;
  if not found then raise exception 'edition not found: %', p_id; end if;
  if v_deleted_at is not null then raise exception 'edition already deleted'; end if;

  update public.editions set deleted_at = now() where id = p_id;
end;
$$;

revoke execute on function public.delete_edition(text) from public;
grant execute on function public.delete_edition(text) to authenticated;

-- ============================================================================
-- swap_edition_ordinals
-- ============================================================================

create or replace function public.swap_edition_ordinals(
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

  select * into v_a from public.editions where id = p_id_a;
  if not found then raise exception 'edition A not found'; end if;
  if v_a.deleted_at is not null then raise exception 'edition A is deleted'; end if;

  select * into v_b from public.editions where id = p_id_b;
  if not found then raise exception 'edition B not found'; end if;
  if v_b.deleted_at is not null then raise exception 'edition B is deleted'; end if;

  if v_a.piece_id <> v_b.piece_id then
    raise exception 'editions belong to different pieces';
  end if;

  update public.editions set ordinal = -1 where id = p_id_a;
  update public.editions set ordinal = v_a.ordinal where id = p_id_b;
  update public.editions set ordinal = v_b.ordinal where id = p_id_a;
end;
$$;

revoke execute on function public.swap_edition_ordinals(text, text) from public;
grant execute on function public.swap_edition_ordinals(text, text) to authenticated;

commit;
