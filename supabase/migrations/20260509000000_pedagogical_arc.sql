-- Pedagogical arc: directed piece-to-piece connections (prepare-with and
-- natural-next). Per PRD: "prepare-with and natural-next connections" are
-- the pedagogical arc — what to play before this piece to build the skills
-- it demands, and what to study after it to extend that arc.
--
-- Schema:
--   - piece_id: the subject of the arc
--   - related_piece_id: the other piece (FK to pieces, cascade on delete)
--   - kind: 'prepare_with' (before) | 'natural_next' (after)
--   - note: optional short editorial line explaining the relationship
--   - ordinal: display order within (piece_id, kind)
--   - created_by: who added this connection
--   - deleted_at: soft-delete
--   - CHECK piece_id <> related_piece_id
--
-- Wiki-editable: any authenticated user can add/update/reorder/delete.
-- Shares the 'content_edit' rate-limit bucket with editions + external
-- links. Changes tracked through content_mutation_log (next migration).

begin;

create table public.pedagogical_connections (
  id uuid primary key default gen_random_uuid(),
  piece_id text not null references public.pieces(id) on delete cascade,
  related_piece_id text not null references public.pieces(id) on delete cascade,
  kind text not null check (kind in ('prepare_with', 'natural_next')),
  note text,
  ordinal smallint not null default 1,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (piece_id <> related_piece_id)
);

create index ix_pedagogical_piece_kind_ordinal
  on public.pedagogical_connections (piece_id, kind, ordinal)
  where deleted_at is null;

-- Partial unique per (piece_id, kind, ordinal) — ordinals scoped per section.
create unique index ux_pedagogical_piece_kind_ordinal_active
  on public.pedagogical_connections (piece_id, kind, ordinal)
  where deleted_at is null;

alter table public.pedagogical_connections enable row level security;

create policy pedagogical_select_public
  on public.pedagogical_connections
  for select
  to anon, authenticated
  using (true);

-- Mutations go through RPCs (SECURITY DEFINER). No direct write policies.

-- ============================================================================
-- create_pedagogical_connection
-- ============================================================================

create or replace function public.create_pedagogical_connection(
  p_piece_id text,
  p_related_piece_id text,
  p_kind text,
  p_note text default null
) returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_next smallint;
begin
  if v_uid is null then raise exception 'unauthenticated'; end if;

  perform public._check_rate_limit('content_edit', 30, 3600);

  if p_kind not in ('prepare_with', 'natural_next') then
    raise exception 'kind must be prepare_with or natural_next';
  end if;
  if p_piece_id = p_related_piece_id then
    raise exception 'cannot connect a piece to itself';
  end if;
  if not exists (select 1 from public.pieces where id = p_piece_id) then
    raise exception 'piece not found: %', p_piece_id;
  end if;
  if not exists (select 1 from public.pieces where id = p_related_piece_id) then
    raise exception 'related piece not found: %', p_related_piece_id;
  end if;

  select coalesce(max(ordinal), 0) + 1 into v_next
    from public.pedagogical_connections
    where piece_id = p_piece_id
      and kind = p_kind
      and deleted_at is null;

  insert into public.pedagogical_connections
    (piece_id, related_piece_id, kind, note, ordinal, created_by)
  values
    (p_piece_id, p_related_piece_id, p_kind, p_note, v_next, v_uid)
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.create_pedagogical_connection(text, text, text, text) from public;
grant execute on function public.create_pedagogical_connection(text, text, text, text) to authenticated;

-- ============================================================================
-- update_pedagogical_connection
-- ============================================================================

create or replace function public.update_pedagogical_connection(
  p_id uuid,
  p_related_piece_id text,
  p_kind text,
  p_note text default null
) returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row record;
begin
  if v_uid is null then raise exception 'unauthenticated'; end if;

  perform public._check_rate_limit('content_edit', 30, 3600);

  select * into v_row from public.pedagogical_connections where id = p_id;
  if not found then raise exception 'connection not found'; end if;
  if v_row.deleted_at is not null then raise exception 'connection is deleted'; end if;

  if p_kind not in ('prepare_with', 'natural_next') then
    raise exception 'kind must be prepare_with or natural_next';
  end if;
  if v_row.piece_id = p_related_piece_id then
    raise exception 'cannot connect a piece to itself';
  end if;
  if not exists (select 1 from public.pieces where id = p_related_piece_id) then
    raise exception 'related piece not found: %', p_related_piece_id;
  end if;

  update public.pedagogical_connections
    set related_piece_id = p_related_piece_id,
        kind = p_kind,
        note = p_note,
        updated_at = now()
    where id = p_id;
end;
$$;

revoke execute on function public.update_pedagogical_connection(uuid, text, text, text) from public;
grant execute on function public.update_pedagogical_connection(uuid, text, text, text) to authenticated;

-- ============================================================================
-- delete_pedagogical_connection — soft-delete
-- ============================================================================

create or replace function public.delete_pedagogical_connection(p_id uuid) returns void
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

  select deleted_at into v_deleted_at from public.pedagogical_connections where id = p_id;
  if not found then raise exception 'connection not found'; end if;
  if v_deleted_at is not null then raise exception 'connection already deleted'; end if;

  update public.pedagogical_connections set deleted_at = now(), updated_at = now() where id = p_id;
end;
$$;

revoke execute on function public.delete_pedagogical_connection(uuid) from public;
grant execute on function public.delete_pedagogical_connection(uuid) to authenticated;

-- ============================================================================
-- swap_pedagogical_ordinals — swap within the same (piece, kind)
-- ============================================================================

create or replace function public.swap_pedagogical_ordinals(
  p_id_a uuid,
  p_id_b uuid
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

  select * into v_a from public.pedagogical_connections where id = p_id_a;
  if not found then raise exception 'connection A not found'; end if;
  if v_a.deleted_at is not null then raise exception 'connection A is deleted'; end if;

  select * into v_b from public.pedagogical_connections where id = p_id_b;
  if not found then raise exception 'connection B not found'; end if;
  if v_b.deleted_at is not null then raise exception 'connection B is deleted'; end if;

  if v_a.piece_id <> v_b.piece_id or v_a.kind <> v_b.kind then
    raise exception 'connections belong to different sections';
  end if;

  update public.pedagogical_connections set ordinal = -1 where id = p_id_a;
  update public.pedagogical_connections set ordinal = v_a.ordinal where id = p_id_b;
  update public.pedagogical_connections set ordinal = v_b.ordinal where id = p_id_a;

  update public.pedagogical_connections
    set updated_at = now()
    where id in (p_id_a, p_id_b);
end;
$$;

revoke execute on function public.swap_pedagogical_ordinals(uuid, uuid) from public;
grant execute on function public.swap_pedagogical_ordinals(uuid, uuid) to authenticated;

-- ============================================================================
-- Trigger: log mutations to content_mutation_log
-- ============================================================================

create or replace function public._log_pedagogical_mutation() returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_action text;
  v_row record;
  v_related_title text;
begin
  if TG_OP = 'INSERT' then v_action := 'added'; v_row := NEW;
  elsif TG_OP = 'UPDATE' then
    -- Soft-delete: set deleted_at — treat as delete action in the log.
    if OLD.deleted_at is null and NEW.deleted_at is not null then
      v_action := 'deleted';
      v_row := OLD;
    else
      v_action := 'updated';
      v_row := NEW;
    end if;
  else v_action := 'deleted'; v_row := OLD;
  end if;

  select title into v_related_title from public.pieces where id = v_row.related_piece_id;

  insert into public.content_mutation_log
    (piece_id, subject_table, subject_id, subject_label, subject_type, action, actor_id, detail)
  values (
    v_row.piece_id,
    'pedagogical_connections',
    v_row.id::text,
    case v_row.kind
      when 'prepare_with' then 'prepare with ' || coalesce(v_related_title, v_row.related_piece_id)
      when 'natural_next' then 'natural next → ' || coalesce(v_related_title, v_row.related_piece_id)
      else coalesce(v_related_title, v_row.related_piece_id)
    end,
    'pedagogical arc',
    v_action,
    auth.uid(),
    jsonb_build_object('kind', v_row.kind, 'related_piece_id', v_row.related_piece_id, 'note', v_row.note)
  );
  return null;
end;
$$;

create trigger trg_pedagogical_log
  after insert or update or delete on public.pedagogical_connections
  for each row execute function public._log_pedagogical_mutation();

commit;
