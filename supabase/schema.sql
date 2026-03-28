-- Irregular Pearl — Phase 1 Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enums
create type difficulty as enum ('beginner', 'intermediate', 'advanced', 'professional');
create type user_level as enum ('student', 'amateur', 'professional', 'teacher');
create type link_type as enum ('imslp', 'youtube', 'wikipedia');

-- Users (extends Supabase auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  instrument text,
  level user_level,
  created_at timestamptz default now() not null
);

-- Pieces (the atomic unit — text slug IDs for readable URLs)
create table public.pieces (
  id text primary key,
  title text not null,
  composer_name text not null,
  catalog_number text,
  instruments text[] not null default '{}',
  era text not null,
  form text not null,
  duration_minutes integer,
  difficulty difficulty not null default 'intermediate',
  description text not null default ''
);

-- Editions
create table public.editions (
  id text primary key,
  piece_id text not null references public.pieces(id) on delete cascade,
  publisher text not null,
  editor text not null,
  year integer,
  description text not null default ''
);

-- Edition reviews (1-5 stars, optional text)
create table public.edition_reviews (
  id uuid primary key default gen_random_uuid(),
  edition_id text not null references public.editions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  text text,
  created_at timestamptz default now() not null,
  unique(edition_id, user_id) -- one review per user per edition
);

-- Discussions (single-level threading)
create table public.discussions (
  id uuid primary key default gen_random_uuid(),
  piece_id text not null references public.pieces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  text text not null,
  created_at timestamptz default now() not null,
  parent_id uuid references public.discussions(id) on delete cascade,
  is_deleted boolean default false not null
);

-- Working on (many-to-many)
create table public.working_on (
  piece_id text not null references public.pieces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz default now() not null,
  primary key (piece_id, user_id)
);

-- External links
create table public.external_links (
  id text primary key,
  piece_id text not null references public.pieces(id) on delete cascade,
  type link_type not null,
  url text not null,
  label text not null
);

-- Reports (moderation)
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.discussions(id) on delete cascade,
  reporter_user_id uuid not null references public.users(id) on delete cascade,
  reason text not null,
  created_at timestamptz default now() not null
);

-- Indexes
create index idx_editions_piece on public.editions(piece_id);
create index idx_edition_reviews_edition on public.edition_reviews(edition_id);
create index idx_discussions_piece on public.discussions(piece_id);
create index idx_discussions_parent on public.discussions(parent_id);
create index idx_working_on_piece on public.working_on(piece_id);
create index idx_external_links_piece on public.external_links(piece_id);
create index idx_pieces_composer on public.pieces(composer_name);
create index idx_pieces_instruments on public.pieces using gin(instruments);

-- Full text search on pieces
alter table public.pieces add column if not exists fts tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(composer_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored;
create index idx_pieces_fts on public.pieces using gin(fts);

-- ============================================
-- Row Level Security
-- ============================================

alter table public.users enable row level security;
alter table public.pieces enable row level security;
alter table public.editions enable row level security;
alter table public.edition_reviews enable row level security;
alter table public.discussions enable row level security;
alter table public.working_on enable row level security;
alter table public.external_links enable row level security;
alter table public.reports enable row level security;

-- Users: anyone can read, users can update their own profile
create policy "Users are viewable by everyone" on public.users for select using (true);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

-- Pieces: anyone can read
create policy "Pieces are viewable by everyone" on public.pieces for select using (true);

-- Editions: anyone can read
create policy "Editions are viewable by everyone" on public.editions for select using (true);

-- Edition reviews: anyone can read, authenticated users can write their own
create policy "Reviews are viewable by everyone" on public.edition_reviews for select using (true);
create policy "Authenticated users can create reviews" on public.edition_reviews for insert with check (auth.uid() = user_id);
create policy "Users can update own reviews" on public.edition_reviews for update using (auth.uid() = user_id);
create policy "Users can delete own reviews" on public.edition_reviews for delete using (auth.uid() = user_id);

-- Discussions: anyone can read (non-deleted), authenticated users can write
create policy "Discussions are viewable by everyone" on public.discussions for select using (is_deleted = false);
create policy "Authenticated users can post" on public.discussions for insert with check (auth.uid() = user_id);
create policy "Users can update own posts" on public.discussions for update using (auth.uid() = user_id);

-- Working on: anyone can read, authenticated users can toggle
create policy "Working on is viewable by everyone" on public.working_on for select using (true);
create policy "Authenticated users can mark working on" on public.working_on for insert with check (auth.uid() = user_id);
create policy "Users can remove own working on" on public.working_on for delete using (auth.uid() = user_id);

-- External links: anyone can read
create policy "External links are viewable by everyone" on public.external_links for select using (true);

-- Reports: authenticated users can create
create policy "Authenticated users can report" on public.reports for insert with check (auth.uid() = reporter_user_id);

-- ============================================
-- Realtime
-- ============================================

-- Enable realtime for discussions (the live feed)
alter publication supabase_realtime add table public.discussions;
alter publication supabase_realtime add table public.working_on;
