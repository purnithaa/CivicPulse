-- ================================================================
--  CivicPulse — Complete Database Setup
--  Run this entire script in the Supabase SQL Editor.
--  Fully idempotent — safe to re-run even if tables already exist.
-- ================================================================


-- ── HELPER: auto-update updated_at on row changes ─────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ================================================================
--  TABLE 1: citizens
-- ================================================================
CREATE TABLE IF NOT EXISTS public.citizens (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  email         TEXT,
  phone         TEXT,
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add missing columns if table already existed without them
ALTER TABLE public.citizens
  ADD COLUMN IF NOT EXISTS name          TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS email         TEXT,
  ADD COLUMN IF NOT EXISTS phone         TEXT,
  ADD COLUMN IF NOT EXISTS password_hash TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS created_at    TIMESTAMPTZ NOT NULL DEFAULT now();

-- Ensure at least one of email/phone is present (add constraint only if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'citizens' AND constraint_name = 'citizens_email_or_phone'
  ) THEN
    ALTER TABLE public.citizens
      ADD CONSTRAINT citizens_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS citizens_email_unique
  ON public.citizens (email) WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS citizens_phone_unique
  ON public.citizens (phone) WHERE phone IS NOT NULL;

ALTER TABLE public.citizens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "citizens_service_all" ON public.citizens;
CREATE POLICY "citizens_service_all" ON public.citizens
  USING (true) WITH CHECK (true);


-- ================================================================
--  TABLE 2: staff_registry
-- ================================================================
CREATE TABLE IF NOT EXISTS public.staff_registry (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT        NOT NULL,
  name        TEXT        NOT NULL,
  phone       TEXT,
  department  TEXT        NOT NULL DEFAULT 'General',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_registry
  ADD COLUMN IF NOT EXISTS employee_id TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS name        TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone       TEXT,
  ADD COLUMN IF NOT EXISTS department  TEXT        NOT NULL DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS staff_registry_employee_id_unique
  ON public.staff_registry (employee_id);

ALTER TABLE public.staff_registry ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_registry_service_all" ON public.staff_registry;
CREATE POLICY "staff_registry_service_all" ON public.staff_registry
  USING (true) WITH CHECK (true);


-- ================================================================
--  TABLE 3: staff_accounts
-- ================================================================
CREATE TABLE IF NOT EXISTS public.staff_accounts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   TEXT        NOT NULL,
  name          TEXT        NOT NULL,
  phone         TEXT,
  department    TEXT        NOT NULL DEFAULT 'General',
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_accounts
  ADD COLUMN IF NOT EXISTS employee_id   TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS name          TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone         TEXT,
  ADD COLUMN IF NOT EXISTS department    TEXT        NOT NULL DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS password_hash TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS created_at    TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS staff_accounts_employee_id_unique
  ON public.staff_accounts (employee_id);

ALTER TABLE public.staff_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_accounts_service_all" ON public.staff_accounts;
CREATE POLICY "staff_accounts_service_all" ON public.staff_accounts
  USING (true) WITH CHECK (true);


-- ================================================================
--  TABLE 4: staff
-- ================================================================
CREATE TABLE IF NOT EXISTS public.staff (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     TEXT        NOT NULL,
  name            TEXT        NOT NULL,
  phone           TEXT,
  department      TEXT        NOT NULL DEFAULT 'General',
  status          TEXT        NOT NULL DEFAULT 'available',
  active_issues   INTEGER     NOT NULL DEFAULT 0,
  resolved_count  INTEGER     NOT NULL DEFAULT 0,
  avatar_initials TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS employee_id     TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS name            TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone           TEXT,
  ADD COLUMN IF NOT EXISTS department      TEXT        NOT NULL DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS status          TEXT        NOT NULL DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS active_issues   INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS resolved_count  INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avatar_initials TEXT,
  ADD COLUMN IF NOT EXISTS created_at      TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS staff_employee_id_unique
  ON public.staff (employee_id);

CREATE INDEX IF NOT EXISTS staff_status_idx ON public.staff (status);
CREATE INDEX IF NOT EXISTS staff_dept_idx   ON public.staff (department);

-- Add status check constraint only if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'staff' AND constraint_name = 'staff_status_check'
  ) THEN
    ALTER TABLE public.staff
      ADD CONSTRAINT staff_status_check
        CHECK (status IN ('available', 'busy', 'off-duty', 'on-leave'));
  END IF;
END $$;

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_service_all" ON public.staff;
CREATE POLICY "staff_service_all" ON public.staff
  USING (true) WITH CHECK (true);


-- ================================================================
--  TABLE 5: issues
-- ================================================================
CREATE TABLE IF NOT EXISTS public.issues (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT,
  category    TEXT        NOT NULL DEFAULT 'other',
  status      TEXT        NOT NULL DEFAULT 'submitted',
  priority    TEXT        NOT NULL DEFAULT 'medium',
  location    TEXT        NOT NULL DEFAULT 'Unknown',
  lat         FLOAT8,
  lng         FLOAT8,
  department  TEXT,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add every column the app uses — IF NOT EXISTS ensures old tables get patched
ALTER TABLE public.issues
  ADD COLUMN IF NOT EXISTS title               TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description         TEXT,
  ADD COLUMN IF NOT EXISTS category            TEXT        NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS status              TEXT        NOT NULL DEFAULT 'submitted',
  ADD COLUMN IF NOT EXISTS priority            TEXT        NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS location            TEXT        NOT NULL DEFAULT 'Unknown',
  ADD COLUMN IF NOT EXISTS lat                 FLOAT8,
  ADD COLUMN IF NOT EXISTS lng                 FLOAT8,
  ADD COLUMN IF NOT EXISTS department          TEXT,
  ADD COLUMN IF NOT EXISTS reporter_name       TEXT,
  ADD COLUMN IF NOT EXISTS reporter_contact    TEXT,
  ADD COLUMN IF NOT EXISTS image_url           TEXT,
  ADD COLUMN IF NOT EXISTS assigned_staff_id    TEXT,
  ADD COLUMN IF NOT EXISTS assigned_staff_name  TEXT,
  ADD COLUMN IF NOT EXISTS assigned_staff_phone TEXT,
  ADD COLUMN IF NOT EXISTS reported_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at           TIMESTAMPTZ NOT NULL DEFAULT now();

-- Plain indexes (always safe)
CREATE INDEX IF NOT EXISTS issues_status_idx      ON public.issues (status);
CREATE INDEX IF NOT EXISTS issues_category_idx    ON public.issues (category);
CREATE INDEX IF NOT EXISTS issues_priority_idx    ON public.issues (priority);
CREATE INDEX IF NOT EXISTS issues_reported_at_idx ON public.issues (reported_at DESC);

-- Partial index on assigned_staff_id — created separately, after column is guaranteed to exist
CREATE INDEX IF NOT EXISTS issues_assigned_idx
  ON public.issues (assigned_staff_id)
  WHERE assigned_staff_id IS NOT NULL;

-- CHECK constraints — only add if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'issues' AND constraint_name = 'issues_status_check'
  ) THEN
    ALTER TABLE public.issues ADD CONSTRAINT issues_status_check
      CHECK (status IN ('submitted', 'in-review', 'dispatched', 'resolved'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'issues' AND constraint_name = 'issues_priority_check'
  ) THEN
    ALTER TABLE public.issues ADD CONSTRAINT issues_priority_check
      CHECK (priority IN ('low', 'medium', 'high', 'critical'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'issues' AND constraint_name = 'issues_category_check'
  ) THEN
    ALTER TABLE public.issues ADD CONSTRAINT issues_category_check
      CHECK (category IN ('pothole','streetlight','sanitation','water','traffic','vandalism','other'));
  END IF;
END $$;

-- Auto-update updated_at trigger
DROP TRIGGER IF EXISTS issues_set_updated_at ON public.issues;
CREATE TRIGGER issues_set_updated_at
  BEFORE UPDATE ON public.issues
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "issues_service_all" ON public.issues;
CREATE POLICY "issues_service_all" ON public.issues
  USING (true) WITH CHECK (true);


-- ================================================================
--  TABLE 6: issue_comments
-- ================================================================
CREATE TABLE IF NOT EXISTS public.issue_comments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id    UUID        NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  author_name TEXT        NOT NULL DEFAULT 'Anonymous',
  author_role TEXT        NOT NULL DEFAULT 'citizen',
  message     TEXT        NOT NULL,
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.issue_comments
  ADD COLUMN IF NOT EXISTS issue_id    UUID        REFERENCES public.issues(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS author_name TEXT        NOT NULL DEFAULT 'Anonymous',
  ADD COLUMN IF NOT EXISTS author_role TEXT        NOT NULL DEFAULT 'citizen',
  ADD COLUMN IF NOT EXISTS message     TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS image_url   TEXT,
  ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS issue_comments_issue_id_idx
  ON public.issue_comments (issue_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'issue_comments' AND constraint_name = 'issue_comments_role_check'
  ) THEN
    ALTER TABLE public.issue_comments ADD CONSTRAINT issue_comments_role_check
      CHECK (author_role IN ('citizen', 'staff', 'admin'));
  END IF;
END $$;

ALTER TABLE public.issue_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "issue_comments_service_all" ON public.issue_comments;
CREATE POLICY "issue_comments_service_all" ON public.issue_comments
  USING (true) WITH CHECK (true);


-- ================================================================
--  TABLE 7: leave_requests
-- ================================================================
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id    TEXT        NOT NULL,
  staff_name  TEXT        NOT NULL,
  employee_id TEXT        NOT NULL DEFAULT '',
  start_date  DATE        NOT NULL,
  end_date    DATE        NOT NULL,
  reason      TEXT        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leave_requests
  ADD COLUMN IF NOT EXISTS staff_id    TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS staff_name  TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS employee_id TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS start_date  DATE,
  ADD COLUMN IF NOT EXISTS end_date    DATE,
  ADD COLUMN IF NOT EXISTS reason      TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS status      TEXT        NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS leave_requests_staff_id_idx ON public.leave_requests (staff_id);
CREATE INDEX IF NOT EXISTS leave_requests_status_idx   ON public.leave_requests (status);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'leave_requests' AND constraint_name = 'leave_requests_status_check'
  ) THEN
    ALTER TABLE public.leave_requests ADD CONSTRAINT leave_requests_status_check
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leave_requests_service_all" ON public.leave_requests;
CREATE POLICY "leave_requests_service_all" ON public.leave_requests
  USING (true) WITH CHECK (true);


-- ================================================================
--  STORAGE BUCKET: issue-photos
-- ================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'issue-photos',
  'issue-photos',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/heic']
)
ON CONFLICT (id) DO UPDATE SET
  public             = true,
  file_size_limit    = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif','image/heic'];

DROP POLICY IF EXISTS "issue_photos_public_read" ON storage.objects;
CREATE POLICY "issue_photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'issue-photos');

DROP POLICY IF EXISTS "issue_photos_insert" ON storage.objects;
CREATE POLICY "issue_photos_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'issue-photos');

DROP POLICY IF EXISTS "issue_photos_delete" ON storage.objects;
CREATE POLICY "issue_photos_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'issue-photos');


-- ================================================================
--  DONE — All tables, indexes, triggers, RLS, and storage ready.
-- ================================================================
