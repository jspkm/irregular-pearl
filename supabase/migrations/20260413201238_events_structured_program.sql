-- Structured performer/program columns for scraped events. Previously both
-- were crammed into description as "Performers: x, y" and "Program: a; b".
-- Store as arrays so the detail page can render them as sections.
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS performers_raw text[];
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS program_raw text[];
