-- Applause: social connection feature for artist profiles
-- Users "applaud" artists they appreciate. One applause per user per artist.

CREATE TABLE IF NOT EXISTS public.applause (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT applause_unique UNIQUE (user_id, artist_id),
  CONSTRAINT applause_no_self CHECK (user_id != artist_id)
);

-- Index for fast count queries on artist profiles
CREATE INDEX IF NOT EXISTS idx_applause_artist_id ON public.applause(artist_id);
CREATE INDEX IF NOT EXISTS idx_applause_user_id ON public.applause(user_id);

-- Enable RLS
ALTER TABLE public.applause ENABLE ROW LEVEL SECURITY;

-- Anyone can read applause counts
CREATE POLICY "Applause is publicly readable"
  ON public.applause FOR SELECT
  USING (true);

-- Authenticated users can insert their own applause
CREATE POLICY "Users can applaud artists"
  ON public.applause FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own applause
CREATE POLICY "Users can remove their own applause"
  ON public.applause FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for applause count updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.applause;
