-- 1. New signups never choose their own role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _role public.app_role;
  _admin_count int;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);

  SELECT count(*) INTO _admin_count FROM public.user_roles WHERE role = 'admin';
  -- bootstrap: first ever account becomes admin, everyone else is staff
  IF _admin_count = 0 THEN
    _role := 'admin';
  ELSE
    _role := 'staff';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$function$;

-- 2. Role changes: admins only, never on themselves, never remove the last admin
CREATE OR REPLACE FUNCTION public.guard_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _target uuid := COALESCE(NEW.user_id, OLD.user_id);
  _admins int;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() = _target THEN
    RAISE EXCEPTION 'You cannot change your own role';
  END IF;

  IF TG_OP IN ('UPDATE','DELETE') AND OLD.role = 'admin'
     AND (TG_OP = 'DELETE' OR NEW.role <> 'admin') THEN
    SELECT count(*) INTO _admins FROM public.user_roles WHERE role = 'admin';
    IF _admins <= 1 THEN
      RAISE EXCEPTION 'There must always be at least one admin';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

DROP TRIGGER IF EXISTS guard_user_roles_trg ON public.user_roles;
CREATE TRIGGER guard_user_roles_trg
BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.guard_user_roles();

-- 3. Personal data no longer readable by every authenticated user
DROP POLICY IF EXISTS "Authenticated view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated view profile skills" ON public.profile_skills;

CREATE POLICY "View own or admin profile skills"
ON public.profile_skills FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));