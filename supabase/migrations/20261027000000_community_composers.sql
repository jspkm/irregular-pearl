-- Factual, sourced additions to the living composer directory.
create table public.community_composers (
 id uuid primary key default gen_random_uuid(),
 name text not null check (char_length(trim(name)) between 1 and 150),
 stage text not null check (stage in ('established','recognized-emerging','early-career','student')),
 notable_work text not null default '' check (char_length(notable_work) <= 300),
 source_url text not null check (char_length(source_url) <= 2000 and source_url ~ '^https?://[^[:space:]]+$'),
 user_id uuid not null references public.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create unique index community_composer_name on public.community_composers(lower(trim(name)));
alter table public.community_composers enable row level security;
create policy "Composer directory is public" on public.community_composers for select using (true);
create policy "Members add composers" on public.community_composers for insert to authenticated with check (auth.uid() = user_id);
