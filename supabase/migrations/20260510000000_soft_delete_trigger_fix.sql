-- Fix: edition + external_link triggers logged soft-deletes as 'updated'.
-- The pedagogical_connections trigger already handles the transition
-- OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL → 'deleted'.
-- Replicate that branch in the other two so the change log shows the
-- correct action when delete_edition / delete_external_link fire.

begin;

create or replace function public._log_edition_mutation() returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_action text;
  v_row record;
  v_label text;
begin
  if TG_OP = 'INSERT' then
    v_action := 'added';
    v_row := NEW;
  elsif TG_OP = 'UPDATE' then
    if OLD.deleted_at is null and NEW.deleted_at is not null then
      v_action := 'deleted';
      v_row := OLD;
    else
      v_action := 'updated';
      v_row := NEW;
    end if;
  else
    v_action := 'deleted';
    v_row := OLD;
  end if;

  v_label := coalesce(v_row.publisher, 'Edition')
           || case when v_row.year is not null then ' (' || v_row.year || ')' else '' end;

  insert into public.content_mutation_log
    (piece_id, subject_table, subject_id, subject_label, subject_type, action, actor_id, detail)
  values (
    v_row.piece_id,
    'editions',
    v_row.id,
    v_label,
    'edition',
    v_action,
    auth.uid(),
    jsonb_build_object('publisher', v_row.publisher, 'editor', v_row.editor, 'year', v_row.year)
  );
  return null;
end;
$$;

create or replace function public._log_external_link_mutation() returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_action text;
  v_row record;
  v_subject_type text;
begin
  if TG_OP = 'INSERT' then
    v_action := 'added';
    v_row := NEW;
  elsif TG_OP = 'UPDATE' then
    if OLD.deleted_at is null and NEW.deleted_at is not null then
      v_action := 'deleted';
      v_row := OLD;
    else
      v_action := 'updated';
      v_row := NEW;
    end if;
  else
    v_action := 'deleted';
    v_row := OLD;
  end if;

  v_subject_type := case
    when v_row.type in ('youtube', 'vimeo', 'spotify', 'internet_archive', 'soundcloud', 'bandcamp')
      then 'recording'
    else 'external reference'
  end;

  insert into public.content_mutation_log
    (piece_id, subject_table, subject_id, subject_label, subject_type, action, actor_id, detail)
  values (
    v_row.piece_id,
    'external_links',
    v_row.id,
    coalesce(v_row.label, v_row.url),
    v_subject_type,
    v_action,
    auth.uid(),
    jsonb_build_object('type', v_row.type, 'url', v_row.url)
  );
  return null;
end;
$$;

commit;
