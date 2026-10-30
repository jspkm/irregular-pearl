-- Community-authored factual term definitions, shared within a historical era.
create table public.glossary_era_terms (
  id uuid primary key default gen_random_uuid(),
  era_id text not null check (era_id in ('antiquity','6th-9th-century','10th-12th-century','13th-century','14th-century','15th-century','16th-century','17th-century','late-baroque','18th-century','19th-century','20th-century','21st-century')),
  term text not null check (char_length(trim(term)) between 1 and 100),
  definition text not null check (char_length(trim(definition)) between 1 and 1200),
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create unique index glossary_era_terms_name on public.glossary_era_terms (era_id, lower(trim(term)));
alter table public.glossary_era_terms enable row level security;
create policy "Era terms are public" on public.glossary_era_terms for select using (true);
create policy "Users add their own era terms" on public.glossary_era_terms for insert to authenticated with check (auth.uid() = user_id);
create policy "Users edit their own era terms" on public.glossary_era_terms for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete their own era terms" on public.glossary_era_terms for delete to authenticated using (auth.uid() = user_id);
