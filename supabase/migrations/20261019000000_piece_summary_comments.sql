-- Short, signed community comments attached to a piece summary.

begin;

create table if not exists public.piece_summary_comments (
  id uuid primary key default gen_random_uuid(),
  piece_id text not null references public.pieces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ix_piece_summary_comments_piece_created
  on public.piece_summary_comments(piece_id, created_at desc);

alter table public.piece_summary_comments enable row level security;

create policy "Summary comments are public"
  on public.piece_summary_comments for select using (true);
create policy "Users create their own summary comments"
  on public.piece_summary_comments for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Users update their own summary comments"
  on public.piece_summary_comments for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete their own summary comments"
  on public.piece_summary_comments for delete to authenticated
  using (auth.uid() = user_id);

alter table public.votes drop constraint if exists votes_subject_table_check;
alter table public.votes add constraint votes_subject_table_check check (subject_table in (
  'performers_notes', 'interpretive_schools', 'piece_descriptions', 'landmarks',
  'pieces_seed_description', 'piece_difficulty_ratings', 'pieces_seed_difficulty',
  'piece_summary_comments'
));

create trigger trg_clear_votes_piece_summary_comments
  after delete on public.piece_summary_comments
  for each row execute function public._clear_votes_on_subject_delete('piece_summary_comments');

create or replace function public.cast_vote(
  p_subject_table text,
  p_subject_id uuid,
  p_vote_value smallint
) returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'unauthenticated'; end if;
  if p_vote_value not in (-1, 1) then raise exception 'vote_value must be -1 or 1'; end if;
  if p_subject_table not in (
    'performers_notes', 'interpretive_schools', 'piece_descriptions', 'landmarks',
    'pieces_seed_description', 'piece_difficulty_ratings', 'pieces_seed_difficulty',
    'piece_summary_comments'
  ) then raise exception 'invalid subject_table: %', p_subject_table; end if;

  perform public._check_rate_limit('cast_vote', 30, 60);
  insert into public.votes (user_id, subject_table, subject_id, vote_value)
  values (v_uid, p_subject_table, p_subject_id, p_vote_value)
  on conflict (user_id, subject_table, subject_id) do update
    set vote_value = excluded.vote_value, updated_at = now();
end;
$$;

commit;
