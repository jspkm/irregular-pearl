-- One 1–5 pearl rating per user on each summary comment.

create table if not exists public.piece_summary_comment_ratings (
  comment_id uuid not null references public.piece_summary_comments(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index if not exists ix_piece_summary_comment_ratings_comment
  on public.piece_summary_comment_ratings(comment_id);

alter table public.piece_summary_comment_ratings enable row level security;

create policy "Comment pearl ratings are public"
  on public.piece_summary_comment_ratings for select using (true);
create policy "Users create their own comment pearl ratings"
  on public.piece_summary_comment_ratings for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Users update their own comment pearl ratings"
  on public.piece_summary_comment_ratings for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users remove their own comment pearl ratings"
  on public.piece_summary_comment_ratings for delete to authenticated
  using (auth.uid() = user_id);
