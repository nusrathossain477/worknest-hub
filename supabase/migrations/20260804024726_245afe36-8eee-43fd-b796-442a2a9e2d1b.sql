
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS designation text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS department text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Everyone signed in can see basic colleague profiles (needed for team directory / assignment)
DROP POLICY IF EXISTS "Authenticated view profiles" ON public.profiles;
CREATE POLICY "Authenticated view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS skills_name_lower_idx ON public.skills (lower(name));
GRANT SELECT, INSERT ON public.skills TO authenticated;
GRANT DELETE ON public.skills TO authenticated;
GRANT ALL ON public.skills TO service_role;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view skills" ON public.skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated add skills" ON public.skills FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins delete skills" ON public.skills FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.profile_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency smallint NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_skills TO authenticated;
GRANT ALL ON public.profile_skills TO service_role;
ALTER TABLE public.profile_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view profile skills" ON public.profile_skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage own profile skills" ON public.profile_skills FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Update own profile skills" ON public.profile_skills FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Delete own profile skills" ON public.profile_skills FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'WorkNest',
  address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  helpline text NOT NULL DEFAULT '',
  support_email text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.company_settings TO authenticated;
GRANT ALL ON public.company_settings TO service_role;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view company settings" ON public.company_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins update company settings" ON public.company_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER company_settings_updated_at BEFORE UPDATE ON public.company_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.company_settings (company_name, address, phone, helpline, support_email, website)
VALUES ('WorkNest', 'House 12, Road 5, Banani, Dhaka 1213, Bangladesh', '+880 1700-000000', '+880 9600-123456', 'support@worknest.app', 'https://worknest.app');

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS reminder_24h_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS overdue_notified boolean NOT NULL DEFAULT false;
