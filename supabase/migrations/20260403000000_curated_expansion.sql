-- Add source tracking to pieces for rollback and provenance
ALTER TABLE public.pieces ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'seed';

-- Add source tracking to external_links
ALTER TABLE public.external_links ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'user';

-- Make difficulty nullable for imported pieces (it's currently NOT NULL with enum type 'difficulty')
ALTER TABLE public.pieces ALTER COLUMN difficulty DROP NOT NULL;
ALTER TABLE public.pieces ALTER COLUMN difficulty SET DEFAULT NULL;

-- Search analytics table for "Most Wanted" feature
CREATE TABLE IF NOT EXISTS public.search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  result_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_search_queries_query ON public.search_queries(query);
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON public.search_queries(created_at);

-- RLS for search_queries (public insert, no auth needed for analytics)
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log searches" ON public.search_queries FOR INSERT WITH CHECK (true);
CREATE POLICY "Search queries readable by everyone" ON public.search_queries FOR SELECT USING (true);

-- RLS policy for user-submitted pieces
CREATE POLICY "Authenticated users can add pieces"
  ON public.pieces FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
