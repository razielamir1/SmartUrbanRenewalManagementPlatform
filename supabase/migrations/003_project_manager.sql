-- ============================================================
-- 003_project_manager.sql
-- Add project_manager role and link projects to their manager
-- Run AFTER 001_initial_schema.sql and 002_add_roles.sql
-- ============================================================

-- Add new role value
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'project_manager';

-- Link each project to its dedicated manager (one manager per project)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS project_manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- ─── RLS policy: project_manager sees only their assigned project ─────────
CREATE POLICY "project_manager_select_own_project" ON public.projects
  FOR SELECT
  USING (
    public.get_my_role() = 'project_manager'
    AND project_manager_id = auth.uid()
  );

-- project_manager can update their own project (milestones, status updates)
CREATE POLICY "project_manager_update_own_project" ON public.projects
  FOR UPDATE
  USING (
    public.get_my_role() = 'project_manager'
    AND project_manager_id = auth.uid()
  );

-- ─── buildings: project_manager sees buildings of their project ───────────
CREATE POLICY "project_manager_select_buildings" ON public.buildings
  FOR SELECT
  USING (
    public.get_my_role() = 'project_manager'
    AND project_id IN (
      SELECT id FROM public.projects WHERE project_manager_id = auth.uid()
    )
  );

-- ─── apartments: project_manager sees apartments in their buildings ───────
CREATE POLICY "project_manager_select_apartments" ON public.apartments
  FOR SELECT
  USING (
    public.get_my_role() = 'project_manager'
    AND building_id IN (
      SELECT b.id FROM public.buildings b
      JOIN public.projects p ON p.id = b.project_id
      WHERE p.project_manager_id = auth.uid()
    )
  );
