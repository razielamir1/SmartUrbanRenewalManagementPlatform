-- ============================================================
-- 005_fix_rls_recursion.sql
-- Fix infinite recursion in RLS policies caused by circular
-- references between projects ↔ buildings ↔ contacts/meetings.
--
-- Root cause:
--   projects policy "projects_resident_read"  → subqueries buildings
--   buildings policy "project_manager_select_buildings" → subqueries projects
--   → infinite recursion
--
-- Fix: introduce a SECURITY DEFINER helper function that queries
-- projects WITHOUT triggering its RLS policies, then use it in
-- all policies that previously did the subquery inline.
-- ============================================================

-- ─── Helper function ──────────────────────────────────────────
-- Returns the project_id assigned to the current project_manager.
-- SECURITY DEFINER bypasses RLS so the projects subquery doesn't
-- re-enter the policies that called it.
CREATE OR REPLACE FUNCTION public.get_pm_project_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT id FROM public.projects WHERE project_manager_id = auth.uid() LIMIT 1
$$;

-- ─── buildings: drop and recreate the problematic policy ──────
DROP POLICY IF EXISTS "project_manager_select_buildings" ON public.buildings;

CREATE POLICY "project_manager_select_buildings" ON public.buildings
  FOR SELECT TO authenticated
  USING (
    public.get_my_role() = 'project_manager'
    AND project_id = public.get_pm_project_id()
  );

-- Also allow project_manager to write/manage buildings of their project
DROP POLICY IF EXISTS "project_manager_write_buildings" ON public.buildings;
CREATE POLICY "project_manager_write_buildings" ON public.buildings
  FOR ALL TO authenticated
  USING (
    public.get_my_role() = 'project_manager'
    AND project_id = public.get_pm_project_id()
  )
  WITH CHECK (
    public.get_my_role() = 'project_manager'
    AND project_id = public.get_pm_project_id()
  );

-- ─── apartments: drop and recreate the problematic policy ─────
DROP POLICY IF EXISTS "project_manager_select_apartments" ON public.apartments;

CREATE POLICY "project_manager_select_apartments" ON public.apartments
  FOR SELECT TO authenticated
  USING (
    public.get_my_role() = 'project_manager'
    AND building_id IN (
      SELECT id FROM public.buildings WHERE project_id = public.get_pm_project_id()
    )
  );

-- Also allow project_manager to manage apartments
DROP POLICY IF EXISTS "project_manager_write_apartments" ON public.apartments;
CREATE POLICY "project_manager_write_apartments" ON public.apartments
  FOR ALL TO authenticated
  USING (
    public.get_my_role() = 'project_manager'
    AND building_id IN (
      SELECT id FROM public.buildings WHERE project_id = public.get_pm_project_id()
    )
  )
  WITH CHECK (
    public.get_my_role() = 'project_manager'
    AND building_id IN (
      SELECT id FROM public.buildings WHERE project_id = public.get_pm_project_id()
    )
  );

-- ─── contacts: drop and recreate using helper ─────────────────
DROP POLICY IF EXISTS "contacts_pm_manage" ON public.contacts;

CREATE POLICY "contacts_pm_manage" ON public.contacts
  FOR ALL TO authenticated
  USING (
    public.get_my_role() = 'project_manager'
    AND project_id = public.get_pm_project_id()
  )
  WITH CHECK (
    public.get_my_role() = 'project_manager'
    AND project_id = public.get_pm_project_id()
  );

-- ─── meetings: drop and recreate using helper ─────────────────
DROP POLICY IF EXISTS "meetings_pm_manage" ON public.meetings;

CREATE POLICY "meetings_pm_manage" ON public.meetings
  FOR ALL TO authenticated
  USING (
    public.get_my_role() = 'project_manager'
    AND project_id = public.get_pm_project_id()
  )
  WITH CHECK (
    public.get_my_role() = 'project_manager'
    AND project_id = public.get_pm_project_id()
  );
