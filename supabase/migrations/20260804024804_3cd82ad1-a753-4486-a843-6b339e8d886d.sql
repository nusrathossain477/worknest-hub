
DROP POLICY IF EXISTS "Authenticated add skills" ON public.skills;
CREATE POLICY "Authenticated add valid skills" ON public.skills
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND length(btrim(name)) BETWEEN 1 AND 40);
