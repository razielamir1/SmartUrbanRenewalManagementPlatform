-- ============================================================
-- 006_fix_buildings_recursion.sql
-- Fix second circular RLS chain:
--
--   buildings policy "buildings_resident_read" → subqueries apartments
--   apartments policy "project_manager_*_apartments" → subqueries buildings
--   → infinite recursion in buildings
--
-- Fix: add a second SECURITY DEFINER helper that returns the
-- building IDs for the current project_manager, bypassing the
-- buildings RLS. Use it in all apartments policies that previously
-- subqueried buildings inline.
-- ============================================================

-- Returns all building IDs that belong to the current PM's project.
-- SECURITY DEFINER: queries buildings and projects without triggering RLS.
CREATE OR REPLACE FUNCTION public.get_pm_building_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT id FROM public.buildings
  WHERE project_id = public.get_pm_project_id()
$$;

-- ─── apartments: drop and recreate without inline buildings subquery ──
DROP POLICY IF EXISTS "project_manager_select_apartments" ON public.apartments;
DROP POLICY IF EXISTS "project_manager_write_apartments"  ON public.apartments;

CREATE POLICY "project_manager_select_apartments" ON public.apartments
  FOR SELECT TO authenticated
  USING (
    public.get_my_role() = 'project_manager'
    AND building_id IN (SELECT public.get_pm_building_ids())
  );

CREATE POLICY "project_manager_write_apartments" ON public.apartments
  FOR ALL TO authenticated
  USING (
    public.get_my_role() = 'project_manager'
    AND building_id IN (SELECT public.get_pm_building_ids())
  )
  WITH CHECK (
    public.get_my_role() = 'project_manager'
    AND building_id IN (SELECT public.get_pm_building_ids())
  );
