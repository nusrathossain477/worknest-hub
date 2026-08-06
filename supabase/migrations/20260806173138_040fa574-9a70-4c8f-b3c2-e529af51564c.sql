DROP VIEW IF EXISTS public.directory_profiles;

CREATE OR REPLACE FUNCTION public.directory_profiles()
RETURNS TABLE (id uuid, full_name text, designation text, department text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.id, p.full_name, p.designation, p.department, p.avatar_url
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
$$;

REVOKE EXECUTE ON FUNCTION public.directory_profiles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.directory_profiles() TO authenticated;