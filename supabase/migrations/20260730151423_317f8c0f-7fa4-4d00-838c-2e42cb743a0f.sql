CREATE TYPE public.attachment_kind AS ENUM ('file','link');

CREATE TABLE public.task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  kind public.attachment_kind NOT NULL DEFAULT 'file',
  file_name text NOT NULL DEFAULT '',
  file_path text,
  file_size bigint,
  mime_type text,
  link_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_attachments TO authenticated;
GRANT ALL ON public.task_attachments TO service_role;

ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all attachments" ON public.task_attachments
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Assignees view attachments on own tasks" ON public.task_attachments
FOR SELECT TO authenticated USING (EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.id = task_attachments.task_id AND t.assigned_to = auth.uid()
));

CREATE POLICY "Assignees insert attachments on own tasks" ON public.task_attachments
FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.tasks t WHERE t.id = task_attachments.task_id AND t.assigned_to = auth.uid()
  )
);

CREATE POLICY "Owners delete own attachments" ON public.task_attachments
FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins delete attachments" ON public.task_attachments
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_task_attachments_task ON public.task_attachments(task_id);

-- Storage policies: files stored at <task_id>/<user_id>/<filename>
CREATE POLICY "Task files upload by assignee" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'task-files' AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Task files read by owner" ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'task-files' AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Task files read by admin" ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'task-files' AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Task files delete by owner" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'task-files' AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Task files delete by admin" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'task-files' AND public.has_role(auth.uid(), 'admin')
);