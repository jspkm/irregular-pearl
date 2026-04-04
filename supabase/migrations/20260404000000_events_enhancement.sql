-- Events Enhancement Migration
-- Adds: poster images, ticket info, moderation queue, scraping support
-- Part of: Events page feature (rich events + scraping + user submissions)

-- 1. Add new columns to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS poster_url text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS ticket_price text; -- text for "Free", "$25", "$15-45"
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS ticket_url text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'queued';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'user';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS start_time time; -- nullable, events may not have exact time
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS moderated_at timestamptz;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS moderation_note text;

-- 2. CHECK constraints for status and source enums
DO $$ BEGIN
  ALTER TABLE public.events ADD CONSTRAINT events_status_check
    CHECK (status IN ('queued', 'approved', 'rejected'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.events ADD CONSTRAINT events_source_check
    CHECK (source IN ('user', 'bachtrack'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Backfill existing events to 'approved' so they don't disappear
UPDATE public.events SET status = 'approved' WHERE status = 'queued';

-- 4. Make created_by nullable (scraped events have no user creator)
ALTER TABLE public.events ALTER COLUMN created_by DROP NOT NULL;

-- 5. Add 'festival' to event_type CHECK constraint
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_event_type_check;
ALTER TABLE public.events ADD CONSTRAINT events_event_type_check
  CHECK (event_type IN ('recital', 'concert', 'competition', 'masterclass', 'recording', 'festival'));

-- 6. Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_city ON public.events(city);

-- 7. Change ON DELETE CASCADE to SET NULL (don't delete approved events when user leaves)
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_created_by_fkey;
ALTER TABLE public.events ADD CONSTRAINT events_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- 8. Drop ALL existing event policies before creating new ones
DROP POLICY IF EXISTS "Events viewable by everyone" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;
DROP POLICY IF EXISTS "Creators can update own events" ON public.events;
DROP POLICY IF EXISTS "events_insert_policy" ON public.events;
DROP POLICY IF EXISTS "events_select_policy" ON public.events;

-- 9. RLS SELECT: public sees only approved; creators see their own; staff sees all
CREATE POLICY "events_select_policy" ON public.events FOR SELECT USING (
  status = 'approved'
  OR auth.uid() = created_by
  OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'firstchair'))
);

-- 10. RLS INSERT: authenticated users submit (enforced: queued, own user, 'user' source)
CREATE POLICY "events_insert_policy" ON public.events FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND status = 'queued'
  AND created_by = auth.uid()
  AND source = 'user'
);

-- 11. RLS UPDATE: staff can moderate; creators can edit own queued events
CREATE POLICY "events_update_policy" ON public.events FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'firstchair'))
  OR (auth.uid() = created_by AND status = 'queued')
);

-- 12. RLS DELETE: staff can delete spam; creators can withdraw queued submissions
CREATE POLICY "events_delete_policy" ON public.events FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'firstchair'))
  OR (auth.uid() = created_by AND status = 'queued')
);

-- 13. event_performances: staff + event creators can link performers
DROP POLICY IF EXISTS "Authenticated users can add performances" ON public.event_performances;
CREATE POLICY "event_performances_insert_policy"
  ON public.event_performances FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'firstchair'))
    OR auth.uid() IN (SELECT created_by FROM public.events WHERE id = event_id AND created_by IS NOT NULL)
  );

-- 14. Storage bucket for event posters
INSERT INTO storage.buckets (id, name, public) VALUES ('event-posters', 'event-posters', true)
  ON CONFLICT (id) DO NOTHING;

-- 15. Storage policies
CREATE POLICY "event_posters_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event-posters' AND auth.uid() IS NOT NULL);
CREATE POLICY "event_posters_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'event-posters');
CREATE POLICY "event_posters_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'event-posters' AND auth.uid() IS NOT NULL);
