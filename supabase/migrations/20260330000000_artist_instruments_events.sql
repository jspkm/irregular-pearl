-- Migration: Artist Profiles, Instrument Registry & Events
-- Extends users table, creates instruments, events, and join tables

-- ── Extend users table ──
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS vanity_slug text UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS training_history jsonb NOT NULL DEFAULT '[]';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS career_highlights jsonb NOT NULL DEFAULT '[]';

-- FTS on users (display_name + instrument + bio)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(display_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(instrument, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(bio, '')), 'B')
  ) STORED;
CREATE INDEX IF NOT EXISTS idx_users_fts ON public.users USING gin(fts);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_vanity_slug ON public.users(vanity_slug) WHERE vanity_slug IS NOT NULL;

-- ── Instruments ──
CREATE TABLE IF NOT EXISTS public.instruments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  maker text,
  maker_year integer,
  country_of_origin text,
  provenance_story text NOT NULL DEFAULT '',
  current_owner_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  privacy_level text NOT NULL DEFAULT 'public' CHECK (privacy_level IN ('public', 'unlisted')),
  created_at timestamptz DEFAULT now() NOT NULL,
  fts tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(maker, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(type, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(provenance_story, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(country_of_origin, '')), 'B')
  ) STORED
);

CREATE INDEX IF NOT EXISTS idx_instruments_fts ON public.instruments USING gin(fts);
CREATE INDEX IF NOT EXISTS idx_instruments_owner ON public.instruments(current_owner_id);
CREATE INDEX IF NOT EXISTS idx_instruments_type ON public.instruments(type);

-- ── Instrument ownership history ──
CREATE TABLE IF NOT EXISTS public.instrument_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id uuid NOT NULL REFERENCES public.instruments(id) ON DELETE CASCADE,
  artist_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date_from date,
  date_to date,
  relationship text NOT NULL DEFAULT 'owned' CHECK (relationship IN ('owned', 'borrowed', 'loaned')),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(instrument_id, artist_id, date_from)
);

CREATE INDEX IF NOT EXISTS idx_instrument_history_instrument ON public.instrument_history(instrument_id);
CREATE INDEX IF NOT EXISTS idx_instrument_history_artist ON public.instrument_history(artist_id);

-- ── Events ──
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  venue text,
  city text,
  country text,
  event_date date NOT NULL,
  event_type text NOT NULL DEFAULT 'concert' CHECK (event_type IN ('recital', 'concert', 'competition', 'masterclass', 'recording')),
  description text NOT NULL DEFAULT '',
  url text,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);

-- ── Event performances (join table) ──
CREATE TABLE IF NOT EXISTS public.event_performances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  artist_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  piece_id text REFERENCES public.pieces(id) ON DELETE SET NULL,
  instrument_id uuid REFERENCES public.instruments(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_event_performances_event ON public.event_performances(event_id);
CREATE INDEX IF NOT EXISTS idx_event_performances_artist ON public.event_performances(artist_id);
CREATE INDEX IF NOT EXISTS idx_event_performances_piece ON public.event_performances(piece_id);

-- ── RLS ──
ALTER TABLE public.instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instrument_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_performances ENABLE ROW LEVEL SECURITY;

-- Instruments: public read for public, owner for unlisted
CREATE POLICY "Public instruments viewable by everyone"
  ON public.instruments FOR SELECT USING (privacy_level = 'public');
CREATE POLICY "Owners can view own unlisted instruments"
  ON public.instruments FOR SELECT USING (auth.uid() = current_owner_id);
CREATE POLICY "Owners can insert instruments"
  ON public.instruments FOR INSERT WITH CHECK (auth.uid() = current_owner_id);
CREATE POLICY "Owners can update own instruments"
  ON public.instruments FOR UPDATE USING (auth.uid() = current_owner_id);

-- Instrument history: public read, owner write
CREATE POLICY "Instrument history viewable by everyone"
  ON public.instrument_history FOR SELECT USING (true);
CREATE POLICY "Users can add own history entries"
  ON public.instrument_history FOR INSERT WITH CHECK (auth.uid() = artist_id);

-- Events: public read, authenticated write
CREATE POLICY "Events viewable by everyone"
  ON public.events FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create events"
  ON public.events FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update own events"
  ON public.events FOR UPDATE USING (auth.uid() = created_by);

-- Event performances: public read, event creator write
CREATE POLICY "Event performances viewable by everyone"
  ON public.event_performances FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add performances"
  ON public.event_performances FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT created_by FROM public.events WHERE id = event_id)
  );

-- Realtime for instruments and events
ALTER PUBLICATION supabase_realtime ADD TABLE public.instruments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
