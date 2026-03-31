-- Add role, notes, and notes_public to performances table
ALTER TABLE public.performances ADD COLUMN IF NOT EXISTS role text DEFAULT 'performed' CHECK (role IN ('performed', 'attended'));
ALTER TABLE public.performances ADD COLUMN IF NOT EXISTS notes text DEFAULT '';
ALTER TABLE public.performances ADD COLUMN IF NOT EXISTS notes_public boolean DEFAULT true;
