-- Public culture pages: reviews and curated lists authored from user profiles.

create table if not exists public.profile_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  review_type text not null check (review_type in ('concert', 'opera', 'recording', 'venue', 'other')),
  title text not null check (char_length(title) between 1 and 160),
  subject text not null check (char_length(subject) between 1 and 160),
  body text not null check (char_length(body) between 1 and 5000),
  rating smallint check (rating between 1 and 5),
  event_date date,
  external_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.curated_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '' check (char_length(description) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.curated_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.curated_lists(id) on delete cascade,
  position integer not null check (position > 0),
  title text not null check (char_length(title) between 1 and 240),
  note text not null default '' check (char_length(note) <= 1000),
  external_url text,
  created_at timestamptz not null default now(),
  unique (list_id, position)
);

create index if not exists idx_profile_reviews_user_created on public.profile_reviews(user_id, created_at desc);
create index if not exists idx_curated_lists_user_created on public.curated_lists(user_id, created_at desc);
create index if not exists idx_curated_list_items_list_position on public.curated_list_items(list_id, position);

alter table public.profile_reviews enable row level security;
alter table public.curated_lists enable row level security;
alter table public.curated_list_items enable row level security;

create policy "Profile reviews are public" on public.profile_reviews for select using (true);
create policy "Users create own profile reviews" on public.profile_reviews for insert with check (auth.uid() = user_id);
create policy "Users update own profile reviews" on public.profile_reviews for update using (auth.uid() = user_id);
create policy "Users delete own profile reviews" on public.profile_reviews for delete using (auth.uid() = user_id);

create policy "Curated lists are public" on public.curated_lists for select using (true);
create policy "Users create own curated lists" on public.curated_lists for insert with check (auth.uid() = user_id);
create policy "Users update own curated lists" on public.curated_lists for update using (auth.uid() = user_id);
create policy "Users delete own curated lists" on public.curated_lists for delete using (auth.uid() = user_id);

create policy "Curated list items are public" on public.curated_list_items for select using (true);
create policy "List owners create items" on public.curated_list_items for insert with check (
  exists (select 1 from public.curated_lists where id = list_id and user_id = auth.uid())
);
create policy "List owners update items" on public.curated_list_items for update using (
  exists (select 1 from public.curated_lists where id = list_id and user_id = auth.uid())
);
create policy "List owners delete items" on public.curated_list_items for delete using (
  exists (select 1 from public.curated_lists where id = list_id and user_id = auth.uid())
);
