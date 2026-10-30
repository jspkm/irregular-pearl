-- Signed comments and 1–5 pearl ratings for glossary content sections.

create table if not exists public.section_comments (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in (
    'glossary_era_summary', 'glossary_era_characteristics', 'glossary_term_definition'
  )),
  subject_key text not null,
  user_id uuid not null references public.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ix_section_comments_subject
  on public.section_comments(subject_type, subject_key, created_at desc);

create table if not exists public.section_comment_ratings (
  comment_id uuid not null references public.section_comments(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

alter table public.section_comments enable row level security;
alter table public.section_comment_ratings enable row level security;

create policy "Section comments are public" on public.section_comments for select using (true);
create policy "Users create own section comments" on public.section_comments for insert to authenticated with check (auth.uid() = user_id);
create policy "Users delete own section comments" on public.section_comments for delete to authenticated using (auth.uid() = user_id);
create policy "Section comment ratings are public" on public.section_comment_ratings for select using (true);
create policy "Users create own section ratings" on public.section_comment_ratings for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own section ratings" on public.section_comment_ratings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

