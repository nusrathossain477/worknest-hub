CREATE POLICY "Members notify admins"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(user_id, 'admin'));