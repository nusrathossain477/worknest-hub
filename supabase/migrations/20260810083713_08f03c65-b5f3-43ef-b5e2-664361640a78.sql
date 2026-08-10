
REVOKE ALL ON FUNCTION public.visible_members() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.visible_members() TO authenticated;
REVOKE ALL ON FUNCTION public.role_from_email(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.role_from_email(text) TO authenticated;
