-- Rename 'firstchair' role to 'moderator'
-- Mirror of 20260331100000 which renamed 'manager' to 'firstchair'.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
UPDATE public.users SET role = 'moderator' WHERE role = 'firstchair';
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'moderator', 'admin'));

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND (role IN ('admin', 'moderator') OR is_maestro = true));
$$;
