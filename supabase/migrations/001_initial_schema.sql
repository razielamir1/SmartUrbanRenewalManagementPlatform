-- ============================================================
-- 001_initial_schema.sql
-- Pinui-Binui Platform — Core Database Schema
-- ============================================================

-- ─── ENUM TYPES ──────────────────────────────────────────────
CREATE TYPE public.user_role AS ENUM (
  'admin',
  'resident',
  'lawyer',
  'supervisor',
  'developer'
);

CREATE TYPE public.doc_status AS ENUM (
  'missing',
  'pending_review',
  'approved'
);

CREATE TYPE public.project_status AS ENUM (
  'pre_planning',
  'planning',
  'permits',
  'construction',
  'finishing',
  'key_delivery'
);

CREATE TYPE public.document_type AS ENUM (
  'id_card',
  'tabu',
  'signed_contract',
  'permit',
  'municipal_approval',
  'construction_plan',
  'other'
);

CREATE TYPE public.document_source AS ENUM (
  'resident',
  'developer',
  'municipality'
);

-- ─── SECURITY DEFINER role helper ────────────────────────────
-- Must be created BEFORE any policies that reference it.
-- Avoids recursive RLS: policies call this function instead of
-- (SELECT role FROM public.users WHERE id = auth.uid())
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

-- ─── users ───────────────────────────────────────────────────
-- Extends auth.users with profile and role information.
CREATE TABLE public.users (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        public.user_role NOT NULL DEFAULT 'resident',
  full_name   text,
  phone       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own"
  ON public.users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_admins_read_all"
  ON public.users FOR SELECT
  TO authenticated
  USING (public.get_my_role() = 'admin');

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_admins_manage_all"
  ON public.users FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Auto-create a users row when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── projects ────────────────────────────────────────────────
CREATE TABLE public.projects (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text        NOT NULL,
  status               public.project_status NOT NULL DEFAULT 'pre_planning',
  global_whatsapp_link text,
  description          text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Elevated roles see all projects
CREATE POLICY "projects_elevated_read"
  ON public.projects FOR SELECT
  TO authenticated
  USING (public.get_my_role() IN ('admin', 'supervisor', 'developer'));

-- Lawyers see only their assigned projects
CREATE POLICY "projects_lawyer_read"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'lawyer'
    AND id IN (
      SELECT project_id FROM public.lawyer_project_assignments
      WHERE lawyer_id = auth.uid()
    )
  );

-- Residents see the project their apartment belongs to
CREATE POLICY "projects_resident_read"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'resident'
    AND id IN (
      SELECT b.project_id
      FROM public.buildings b
      JOIN public.apartments a ON a.building_id = b.id
      WHERE a.owner_id = auth.uid()
    )
  );

-- Only admins can write projects
CREATE POLICY "projects_admin_write"
  ON public.projects FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- ─── buildings ───────────────────────────────────────────────
CREATE TABLE public.buildings (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id             uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  address                text        NOT NULL,
  building_number        text,
  building_whatsapp_link text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_buildings_project_id ON public.buildings(project_id);

-- Elevated roles see all buildings
CREATE POLICY "buildings_elevated_read"
  ON public.buildings FOR SELECT
  TO authenticated
  USING (public.get_my_role() IN ('admin', 'supervisor', 'developer'));

-- Lawyers see buildings in their assigned projects
CREATE POLICY "buildings_lawyer_read"
  ON public.buildings FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'lawyer'
    AND project_id IN (
      SELECT project_id FROM public.lawyer_project_assignments
      WHERE lawyer_id = auth.uid()
    )
  );

-- Residents see only their own building
CREATE POLICY "buildings_resident_read"
  ON public.buildings FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'resident'
    AND id IN (
      SELECT building_id FROM public.apartments
      WHERE owner_id = auth.uid()
    )
  );

-- Only admins write
CREATE POLICY "buildings_admin_write"
  ON public.buildings FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- ─── apartments ──────────────────────────────────────────────
CREATE TABLE public.apartments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid        NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  unit_number text        NOT NULL,
  floor       integer,
  owner_id    uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.apartments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_apartments_building_id ON public.apartments(building_id);
CREATE INDEX idx_apartments_owner_id ON public.apartments(owner_id);

CREATE POLICY "apartments_resident_read_own"
  ON public.apartments FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "apartments_elevated_read"
  ON public.apartments FOR SELECT
  TO authenticated
  USING (public.get_my_role() IN ('admin', 'supervisor', 'developer', 'lawyer'));

CREATE POLICY "apartments_admin_write"
  ON public.apartments FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- ─── lawyer_project_assignments ──────────────────────────────
CREATE TABLE public.lawyer_project_assignments (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id  uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lawyer_id, project_id)
);

ALTER TABLE public.lawyer_project_assignments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_lpa_lawyer_id ON public.lawyer_project_assignments(lawyer_id);

CREATE POLICY "lpa_admin_manage"
  ON public.lawyer_project_assignments FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "lpa_lawyer_read_own"
  ON public.lawyer_project_assignments FOR SELECT
  TO authenticated
  USING (lawyer_id = auth.uid());

-- ─── documents ───────────────────────────────────────────────
-- Covers three document flows:
--   resident  → personal docs (id_card, tabu, signed_contract) scoped to owner_id
--   developer → project-level docs (permits, plans) scoped to project_id
--   municipality → official docs (approvals) scoped to project_id, uploaded by admin
CREATE TABLE public.documents (
  id          uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid                  REFERENCES public.users(id) ON DELETE CASCADE,
  project_id  uuid                  REFERENCES public.projects(id) ON DELETE CASCADE,
  type        public.document_type  NOT NULL,
  source      public.document_source NOT NULL DEFAULT 'resident',
  url         text,
  storage_path text,
  status      public.doc_status     NOT NULL DEFAULT 'missing',
  notes       text,
  reviewed_by uuid                  REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at  timestamptz           NOT NULL DEFAULT now(),
  updated_at  timestamptz           NOT NULL DEFAULT now(),
  -- resident docs: unique per owner+type
  CONSTRAINT documents_resident_unique UNIQUE NULLS NOT DISTINCT (owner_id, type)
    DEFERRABLE INITIALLY DEFERRED
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_documents_owner_id ON public.documents(owner_id);
CREATE INDEX idx_documents_project_id ON public.documents(project_id);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_documents_source ON public.documents(source);

-- Residents read + upload their own documents
CREATE POLICY "documents_resident_read_own"
  ON public.documents FOR SELECT
  TO authenticated
  USING (source = 'resident' AND owner_id = auth.uid());

CREATE POLICY "documents_resident_insert_own"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (source = 'resident' AND owner_id = auth.uid());

CREATE POLICY "documents_resident_update_own"
  ON public.documents FOR UPDATE
  TO authenticated
  USING (source = 'resident' AND owner_id = auth.uid() AND status = 'missing');

-- Residents also see project-level docs (developer/municipality) for their project
CREATE POLICY "documents_resident_read_project"
  ON public.documents FOR SELECT
  TO authenticated
  USING (
    source IN ('developer', 'municipality')
    AND project_id IN (
      SELECT b.project_id
      FROM public.buildings b
      JOIN public.apartments a ON a.building_id = b.id
      WHERE a.owner_id = auth.uid()
    )
  );

-- Developer can upload project-level documents
CREATE POLICY "documents_developer_manage"
  ON public.documents FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'developer' AND source = 'developer')
  WITH CHECK (public.get_my_role() = 'developer' AND source = 'developer');

-- Elevated roles read all documents
CREATE POLICY "documents_elevated_read"
  ON public.documents FOR SELECT
  TO authenticated
  USING (public.get_my_role() IN ('admin', 'supervisor', 'lawyer'));

-- Supervisors + admins can approve/reject documents (update status + notes)
CREATE POLICY "documents_supervisor_update"
  ON public.documents FOR UPDATE
  TO authenticated
  USING (public.get_my_role() IN ('admin', 'supervisor'));

-- Admin full control
CREATE POLICY "documents_admin_all"
  ON public.documents FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Lawyers read documents for their assigned projects only
CREATE POLICY "documents_lawyer_read"
  ON public.documents FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'lawyer'
    AND (
      project_id IN (
        SELECT project_id FROM public.lawyer_project_assignments
        WHERE lawyer_id = auth.uid()
      )
      OR owner_id IN (
        SELECT a.owner_id
        FROM public.apartments a
        JOIN public.buildings b ON b.id = a.building_id
        JOIN public.lawyer_project_assignments lpa ON lpa.project_id = b.project_id
        WHERE lpa.lawyer_id = auth.uid()
      )
    )
  );

-- ─── project_milestones ──────────────────────────────────────
CREATE TABLE public.project_milestones (
  id           uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid                  NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage        public.project_status NOT NULL,
  label        text                  NOT NULL,
  label_en     text,
  description  text,
  target_date  date,
  completed_at timestamptz,
  sort_order   integer               NOT NULL DEFAULT 0,
  created_at   timestamptz           NOT NULL DEFAULT now(),
  updated_at   timestamptz           NOT NULL DEFAULT now()
);

ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_milestones_project_id ON public.project_milestones(project_id);

-- All authenticated users can read milestones for projects they can see
CREATE POLICY "milestones_authenticated_read"
  ON public.project_milestones FOR SELECT
  TO authenticated
  USING (true); -- RLS on projects filters access upstream

-- Developers and admins can write milestones
CREATE POLICY "milestones_developer_admin_write"
  ON public.project_milestones FOR ALL
  TO authenticated
  USING (public.get_my_role() IN ('admin', 'developer'))
  WITH CHECK (public.get_my_role() IN ('admin', 'developer'));

-- ─── updated_at triggers ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_buildings_updated_at
  BEFORE UPDATE ON public.buildings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_apartments_updated_at
  BEFORE UPDATE ON public.apartments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_milestones_updated_at
  BEFORE UPDATE ON public.project_milestones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Storage bucket ──────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760, -- 10 MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
);

-- Residents upload to their own folder: documents/{uid}/...
CREATE POLICY "storage_resident_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Residents read their own files
CREATE POLICY "storage_resident_read_own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Elevated roles read all files in the documents bucket
CREATE POLICY "storage_elevated_read_all"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.get_my_role() IN ('admin', 'supervisor', 'lawyer', 'developer')
  );

-- Admins can delete files
CREATE POLICY "storage_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.get_my_role() = 'admin'
  );

-- ─── Seed: default milestone labels ──────────────────────────
-- These labels are inserted as a function so each new project
-- can call it to get pre-populated milestones.
CREATE OR REPLACE FUNCTION public.seed_project_milestones(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.project_milestones (project_id, stage, label, label_en, sort_order) VALUES
    (p_project_id, 'pre_planning',  'טרום תכנון',             'Pre-Planning',             1),
    (p_project_id, 'planning',      'תכנון',                   'Planning',                 2),
    (p_project_id, 'permits',       'קבלת היתרים',             'Permits',                  3),
    (p_project_id, 'construction',  'בנייה',                   'Construction',             4),
    (p_project_id, 'finishing',     'גמר',                     'Finishing',                5),
    (p_project_id, 'key_delivery',  'מסירת מפתחות',            'Key Delivery',             6);
END;
$$;
