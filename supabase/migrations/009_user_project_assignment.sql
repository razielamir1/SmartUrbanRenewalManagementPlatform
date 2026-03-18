-- ============================================================
-- 009_user_project_assignment.sql
-- Add project_id + building_id columns to users table
-- for direct project/building assignment of any user role
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS building_id uuid REFERENCES public.buildings(id) ON DELETE SET NULL;
