-- ================================================================
--  CivicPulse — Migration 002
--  Add assigned_staff_phone to issues + leave_requests table
--  Run in Supabase SQL Editor (fully idempotent, safe to re-run)
-- ================================================================

-- 1. Add assigned_staff_phone column to issues table
ALTER TABLE public.issues
  ADD COLUMN IF NOT EXISTS assigned_staff_phone TEXT;

-- 2. Create leave_requests table
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
--  DONE — Migration 002 complete.
-- ================================================================
