-- Municipal building file (תיק בניין) integration
CREATE TABLE public.tik_binyan (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  municipality     text        NOT NULL,
  municipality_url text,
  search_type      text        NOT NULL DEFAULT 'file_number',
  file_number      text,
  request_number   text,
  address          text,
  gush             text,
  helka            text,
  parsed_data      jsonb       DEFAULT '{}',
  sync_status      text        NOT NULL DEFAULT 'pending',
  sync_error       text,
  last_sync_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tik_binyan_project_id ON public.tik_binyan(project_id);

ALTER TABLE public.tik_binyan ENABLE ROW LEVEL SECURITY;

-- Allow admin and project_manager full access
CREATE POLICY "tik_binyan_admin_pm_all"
  ON public.tik_binyan FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'project_manager')
    )
  );

-- Allow other elevated roles to read
CREATE POLICY "tik_binyan_elevated_read"
  ON public.tik_binyan FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('residents_supervisor', 'residents_lawyer', 'developer')
    )
  );

CREATE TRIGGER set_tik_binyan_updated_at
  BEFORE UPDATE ON public.tik_binyan
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
