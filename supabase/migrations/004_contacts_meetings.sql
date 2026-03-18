-- ============================================================
-- 004_contacts_meetings.sql
-- Contacts (import) and Meetings tables for project manager
-- Run AFTER 003_project_manager.sql in Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── contacts ────────────────────────────────────────────────
CREATE TABLE public.contacts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid        NOT NULL REFERENCES public.projects(id)  ON DELETE CASCADE,
  building_id uuid                 REFERENCES public.buildings(id) ON DELETE SET NULL,
  full_name   text        NOT NULL,
  phone_raw   text        NOT NULL,        -- original extracted value
  phone_wa    text        NOT NULL,        -- 972XXXXXXXXX  (wa.me format)
  notes       text,
  created_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contacts_project_id  ON public.contacts(project_id);
CREATE INDEX idx_contacts_building_id ON public.contacts(building_id);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_pm_manage"
  ON public.contacts FOR ALL TO authenticated
  USING (
    public.get_my_role() = 'project_manager'
    AND project_id IN (
      SELECT id FROM public.projects WHERE project_manager_id = auth.uid()
    )
  )
  WITH CHECK (
    public.get_my_role() = 'project_manager'
    AND project_id IN (
      SELECT id FROM public.projects WHERE project_manager_id = auth.uid()
    )
  );

CREATE POLICY "contacts_admin_all"
  ON public.contacts FOR ALL TO authenticated
  USING  (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

CREATE TRIGGER set_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── meetings ─────────────────────────────────────────────────
CREATE TABLE public.meetings (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  description text,
  start_time  timestamptz NOT NULL,
  end_time    timestamptz NOT NULL,
  location    text,
  created_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT meetings_end_after_start CHECK (end_time > start_time)
);

CREATE INDEX idx_meetings_project_id ON public.meetings(project_id);
CREATE INDEX idx_meetings_start_time ON public.meetings(start_time);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meetings_pm_manage"
  ON public.meetings FOR ALL TO authenticated
  USING (
    public.get_my_role() = 'project_manager'
    AND project_id IN (
      SELECT id FROM public.projects WHERE project_manager_id = auth.uid()
    )
  )
  WITH CHECK (
    public.get_my_role() = 'project_manager'
    AND project_id IN (
      SELECT id FROM public.projects WHERE project_manager_id = auth.uid()
    )
  );

CREATE POLICY "meetings_read_all"
  ON public.meetings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "meetings_admin_all"
  ON public.meetings FOR ALL TO authenticated
  USING  (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

CREATE TRIGGER set_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
