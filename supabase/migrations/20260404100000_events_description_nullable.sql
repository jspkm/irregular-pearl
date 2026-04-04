-- Make events.description nullable for scraped events (they often lack descriptions)
ALTER TABLE public.events ALTER COLUMN description DROP NOT NULL;
