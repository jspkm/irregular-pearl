-- Signed community additions to the two existing era knowledge sections.
create table public.glossary_era_entries (
  id uuid primary key default gen_random_uuid(),
  era_id text not null check (era_id in ('antiquity','6th-9th-century','10th-12th-century','13th-century','14th-century','15th-century','16th-century','17th-century','late-baroque','18th-century','19th-century','late-romanticism','20th-century','21st-century')),
  kind text not null check (kind in ('characteristic', 'theory')),
  name text not null check (char_length(trim(name)) between 1 and 600),
  description text not null default '' check (char_length(description) <= 1200),
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint era_theory_explanation check (kind <> 'theory' or (char_length(trim(description)) > 0 and char_length(trim(name)) <= 100))
);
create unique index glossary_era_entries_name on public.glossary_era_entries (era_id, kind, lower(trim(name)));
alter table public.glossary_era_entries enable row level security;
create policy "Era knowledge is public" on public.glossary_era_entries for select using (true);
create policy "Authors add era knowledge" on public.glossary_era_entries for insert to authenticated with check (auth.uid() = user_id);
create policy "Authors edit era knowledge" on public.glossary_era_entries for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Authors delete era knowledge" on public.glossary_era_entries for delete to authenticated using (auth.uid() = user_id);
