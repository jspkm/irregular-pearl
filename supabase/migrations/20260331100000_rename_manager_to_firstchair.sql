-- Rename 'manager' role to 'firstchair'
-- Drop and recreate the check constraint with the new value
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
UPDATE public.users SET role = 'firstchair' WHERE role = 'manager';
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'firstchair', 'admin'));

-- Update is_staff function
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND (role IN ('admin', 'firstchair') OR is_maestro = true));
$$;
