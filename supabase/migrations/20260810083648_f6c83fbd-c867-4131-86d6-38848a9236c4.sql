
-- 1. Email domain -> role
CREATE OR REPLACE FUNCTION public.role_from_email(_email text)
RETURNS app_role
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE lower(split_part(_email, '@', 2))
    WHEN 'hr.worknest.bd' THEN 'hr'::app_role
    WHEN 'admin.worknest.bd' THEN 'admin'::app_role
    WHEN 'employee.worknest.bd' THEN 'employee'::app_role
    WHEN 'staff.worknest.bd' THEN 'staff'::app_role
    ELSE NULL
  END
$$;

-- 2. Signup: role always derived from the email domain
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
  _existing int;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);

  _role := public.role_from_email(NEW.email);

  IF _role IS NULL THEN
    SELECT count(*) INTO _existing FROM public.user_roles;
    IF _existing = 0 THEN
      _role := 'hr';
    ELSE
      RAISE EXCEPTION 'Accounts must use a WorkNest work email issued by HR (name@admin.worknest.bd, name@employee.worknest.bd, name@staff.worknest.bd)';
    END IF;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$$;

-- 3. Role guard: role must match the work email domain, nobody edits own role
CREATE OR REPLACE FUNCTION public.guard_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _target uuid := COALESCE(NEW.user_id, OLD.user_id);
  _email text;
  _expected public.app_role;
  _rows int;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() = _target THEN
    RAISE EXCEPTION 'You cannot change your own role';
  END IF;

  IF TG_OP IN ('INSERT','UPDATE') THEN
    SELECT email INTO _email FROM auth.users WHERE id = NEW.user_id;
    _expected := public.role_from_email(_email);
    IF _expected IS NULL THEN
      SELECT count(*) INTO _rows FROM public.user_roles;
      IF NOT (_rows = 0 AND NEW.role = 'hr') THEN
        RAISE EXCEPTION 'This account has no WorkNest work email, so no role can be granted';
      END IF;
    ELSIF NEW.role <> _expected THEN
      RAISE EXCEPTION 'Role must match the work email domain (expected %)', _expected;
    END IF;
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
$$;

-- 4. user_roles: only HR manages roles (admin may bootstrap the first HR)
DROP POLICY IF EXISTS "Admins insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins view all roles" ON public.user_roles;

CREATE POLICY "HR manages roles insert" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'hr')
    OR (public.has_role(auth.uid(), 'admin') AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.role = 'hr'))
  );
CREATE POLICY "HR manages roles update" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'hr'));
CREATE POLICY "HR manages roles delete" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'hr'));
CREATE POLICY "Admins and HR view roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

-- 5. Profile visibility rules
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
CREATE POLICY "Role scoped profile visibility" ON public.profiles FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR public.has_role(id, 'hr')
    OR public.has_role(auth.uid(), 'hr')
    OR public.has_role(auth.uid(), 'admin')
    OR (public.has_role(auth.uid(), 'employee') AND public.has_role(id, 'staff'))
  );

DROP POLICY IF EXISTS "View own or admin profile skills" ON public.profile_skills;
CREATE POLICY "Role scoped skill visibility" ON public.profile_skills FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(user_id, 'hr')
    OR public.has_role(auth.uid(), 'hr')
    OR public.has_role(auth.uid(), 'admin')
    OR (public.has_role(auth.uid(), 'employee') AND public.has_role(user_id, 'staff'))
  );

DROP POLICY IF EXISTS "Manage own profile skills" ON public.profile_skills;
DROP POLICY IF EXISTS "Update own profile skills" ON public.profile_skills;
DROP POLICY IF EXISTS "Delete own profile skills" ON public.profile_skills;
CREATE POLICY "Manage own profile skills" ON public.profile_skills FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));
CREATE POLICY "Update own profile skills" ON public.profile_skills FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));
CREATE POLICY "Delete own profile skills" ON public.profile_skills FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

-- 6. Directory function honouring the same rules
DROP FUNCTION IF EXISTS public.directory_profiles();
CREATE OR REPLACE FUNCTION public.visible_members()
RETURNS TABLE(
  id uuid, full_name text, email text, designation text, department text,
  phone text, bio text, avatar_url text, created_at timestamptz, role app_role
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name,
    CASE WHEN p.id = auth.uid() OR public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'admin')
         THEN p.email ELSE '' END,
    p.designation, p.department,
    CASE WHEN p.id = auth.uid() OR public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'admin')
         THEN p.phone ELSE '' END,
    p.bio, p.avatar_url, p.created_at, ur.role
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE auth.uid() IS NOT NULL AND (
    p.id = auth.uid()
    OR ur.role = 'hr'
    OR public.has_role(auth.uid(), 'hr')
    OR public.has_role(auth.uid(), 'admin')
    OR (public.has_role(auth.uid(), 'employee') AND ur.role = 'staff')
  )
$$;

-- 7. Tasks: required skill + employee -> staff delegation
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS required_skill_id uuid REFERENCES public.skills(id) ON DELETE SET NULL;

CREATE POLICY "Assigners view their tasks" ON public.tasks FOR SELECT TO authenticated
  USING (auth.uid() = assigned_by);

CREATE POLICY "Employees assign non-tech tasks to staff" ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'employee')
    AND auth.uid() = assigned_by
    AND target_role = 'staff'
    AND public.has_role(assigned_to, 'staff')
    AND required_skill_id IS NULL
  );

CREATE POLICY "Employees update tasks they assigned" ON public.tasks FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'employee') AND auth.uid() = assigned_by);

CREATE POLICY "Employees delete tasks they assigned" ON public.tasks FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'employee') AND auth.uid() = assigned_by);

-- task_updates / attachments / feedback visible to the assigner too
CREATE POLICY "Assigners view updates" ON public.task_updates FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_updates.task_id AND t.assigned_by = auth.uid()));
CREATE POLICY "Assigners view attachments" ON public.task_attachments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_attachments.task_id AND t.assigned_by = auth.uid()));

-- 8. Notifications: an assigner may notify the assignee about that task
CREATE POLICY "Assigners notify assignee" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = notifications.related_task_id
        AND t.assigned_by = auth.uid()
        AND t.assigned_to = notifications.user_id
    )
  );
