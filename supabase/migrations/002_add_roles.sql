-- ============================================================
-- 002_add_roles.sql
-- Expand user_role enum from 5 → 8 granular roles
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- Add new role values to the existing enum.
-- Postgres requires ALTER TYPE … ADD VALUE for each new value.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'residents_representative';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'residents_lawyer';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'residents_supervisor';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'developer_lawyer';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'developer_supervisor';

-- NOTE: The old generic 'lawyer' and 'supervisor' values remain in the enum
-- for backwards compatibility. They are no longer used in application code.
-- To clean them up completely, you would need to:
--   1. Migrate any existing rows away from those values
--   2. Recreate the enum without the old values (requires table recreation)
-- Skipping that for now as no production data exists yet.
