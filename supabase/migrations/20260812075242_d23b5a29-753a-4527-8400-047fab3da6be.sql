CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _existing int;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);

  SELECT count(*) INTO _existing FROM public.user_roles;
  IF _existing = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'hr');
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.guard_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _target uuid := COALESCE(NEW.user_id, OLD.user_id);
  _rows int;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() = _target THEN
    RAISE EXCEPTION 'You cannot change your own role';
  END IF;

  IF TG_OP IN ('UPDATE','DELETE') AND OLD.role = 'hr'
     AND (TG_OP = 'DELETE' OR NEW.role <> 'hr') THEN
    SELECT count(*) INTO _rows FROM public.user_roles WHERE role = 'hr';
    IF _rows <= 1 THEN
      RAISE EXCEPTION 'There must always be at least one HR account';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

DROP FUNCTION IF EXISTS public.role_from_email(text);