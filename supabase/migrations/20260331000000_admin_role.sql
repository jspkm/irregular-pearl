-- Admin Panel: roles, managed sections, banned, maestro playlist

-- Add role, maestro flag, managed sections, and banned columns
-- role: user/manager/admin (hierarchical)
-- is_maestro: additive flag, any role can also be maestro (only one at a time)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'manager', 'admin'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_maestro boolean NOT NULL DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS managed_sections jsonb NOT NULL DEFAULT '[]';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;

-- Helper functions (SECURITY DEFINER to avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND (role IN ('admin', 'manager') OR is_maestro = true));
$$;

-- Enforce singleton maestro: when is_maestro is set to true, remove it from previous holder
CREATE OR REPLACE FUNCTION public.enforce_singleton_maestro()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.is_maestro = true AND (OLD.is_maestro IS DISTINCT FROM true) THEN
    UPDATE public.users SET is_maestro = false WHERE is_maestro = true AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_single_maestro
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_singleton_maestro();

-- Maestro playlist table
CREATE TABLE IF NOT EXISTS public.maestro_playlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id text NOT NULL REFERENCES public.pieces(id) ON DELETE CASCADE,
  position integer NOT NULL,
  added_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(piece_id)
);

ALTER TABLE public.maestro_playlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Playlist viewable by everyone" ON public.maestro_playlist FOR SELECT USING (true);
CREATE POLICY "Maestro can manage playlist" ON public.maestro_playlist FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND (is_maestro = true OR role = 'admin'))
);

-- Admin/staff RLS policies
CREATE POLICY "Admins can update any user" ON public.users FOR UPDATE USING (public.is_admin());
CREATE POLICY "Staff can view deleted discussions" ON public.discussions FOR SELECT USING (public.is_staff());
CREATE POLICY "Staff can update any discussion" ON public.discussions FOR UPDATE USING (public.is_staff());
CREATE POLICY "Staff can view reports" ON public.reports FOR SELECT USING (public.is_staff());
CREATE POLICY "Staff can delete reports" ON public.reports FOR DELETE USING (public.is_staff());

-- To make yourself admin after first sign-in:
-- UPDATE public.users SET role = 'admin' WHERE id = '<your-auth-user-uuid>';
