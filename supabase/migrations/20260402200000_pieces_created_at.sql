-- Add created_at to pieces for tracking when new pieces are added
ALTER TABLE public.pieces ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
