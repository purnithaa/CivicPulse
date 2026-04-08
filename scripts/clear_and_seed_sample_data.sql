-- ================================================================
--  CivicPulse — CLEAR DB + SEED SAMPLE DATA FOR EVALUATORS
--  Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
--  https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
-- ================================================================
-- This clears all data, then inserts sample users and issues so
-- evaluators can immediately test the app without manual setup.
-- ================================================================

-- ── 1. CLEAR ALL DATA ────────────────────────────────────────────
TRUNCATE TABLE public.issue_comments RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.issues         RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.leave_requests RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.staff          RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.staff_accounts RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.staff_registry RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.citizens       RESTART IDENTITY CASCADE;
DELETE FROM storage.objects WHERE bucket_id = 'issue-photos';

-- ── 2. SAMPLE STAFF (login: EMP-0001 / Staff@123) ─────────────────
INSERT INTO public.staff_registry (employee_id, name, phone, department)
VALUES
  ('EMP-0001', 'John Doe', '+1234567890', 'Infrastructure'),
  ('EMP-0002', 'Jane Smith', '+1987654321', 'Sanitation');

INSERT INTO public.staff_accounts (employee_id, name, phone, department, password_hash)
VALUES
  ('EMP-0001', 'John Doe', '+1234567890', 'Infrastructure', 'fbb7e165388f503a63dfa64bf34abefc7bfa4bfebaf7b1438a7903e5a309fe0b'),
  ('EMP-0002', 'Jane Smith', '+1987654321', 'Sanitation', 'fbb7e165388f503a63dfa64bf34abefc7bfa4bfebaf7b1438a7903e5a309fe0b');

INSERT INTO public.staff (employee_id, name, phone, department, status, active_issues, resolved_count, avatar_initials)
VALUES
  ('EMP-0001', 'John Doe', '+1234567890', 'Infrastructure', 'available', 2, 3, 'JD'),
  ('EMP-0002', 'Jane Smith', '+1987654321', 'Sanitation', 'available', 1, 1, 'JS');

-- ── 3. SAMPLE CITIZENS (login: citizen@test.com / Test123) ───────
INSERT INTO public.citizens (name, email, phone, password_hash)
VALUES
  ('Alex Citizen', 'citizen@test.com', NULL, '756582edb557fa812207b98ec1048725a9e5c76a49a3f941663a7bc9e58e22da'),
  ('Maria Public', NULL, '+1122334455', '756582edb557fa812207b98ec1048725a9e5c76a49a3f941663a7bc9e58e22da');

-- ── 4. SAMPLE ISSUES (various statuses for evaluators) ────────────
INSERT INTO public.issues (title, description, category, status, priority, location, lat, lng, department, reporter_name, reporter_contact, assigned_staff_id, assigned_staff_name, assigned_staff_phone)
VALUES
  ('Pothole on Main St', 'Large pothole near the intersection, causing damage to vehicles', 'pothole', 'resolved', 'high', '123 Main Street', 40.7128, -74.0060, 'Infrastructure', 'Alex Citizen', 'citizen@test.com', 'EMP-0001', 'John Doe', '+1234567890'),
  ('Streetlight out on Oak Ave', 'Light has been out for 3 days, dark at night', 'streetlight', 'dispatched', 'medium', '456 Oak Avenue', 40.7180, -74.0080, 'Infrastructure', 'Maria Public', '+1122334455', 'EMP-0001', 'John Doe', '+1234567890'),
  ('Garbage overflowing', 'Bins have not been collected for a week', 'sanitation', 'in-review', 'high', '789 Park Lane', 40.7150, -74.0050, 'Sanitation', 'Alex Citizen', 'citizen@test.com', NULL, NULL, NULL),
  ('Broken sidewalk tile', 'Tile cracked, trip hazard for pedestrians', 'other', 'submitted', 'low', '321 Elm Street', 40.7100, -74.0120, NULL, 'Maria Public', '+1122334455', NULL, NULL, NULL),
  ('Water leak near hydrant', 'Steady leak from hydrant base', 'water', 'resolved', 'critical', '555 Water Road', 40.7200, -74.0030, 'Infrastructure', 'Alex Citizen', 'citizen@test.com', 'EMP-0002', 'Jane Smith', '+1987654321');

-- ── 5. SAMPLE COMMENTS ───────────────────────────────────────────
-- Get issue IDs for comments (they were just inserted)
DO $$
DECLARE
  issue1 UUID;
  issue2 UUID;
BEGIN
  SELECT id INTO issue1 FROM public.issues WHERE title = 'Pothole on Main St' LIMIT 1;
  SELECT id INTO issue2 FROM public.issues WHERE title = 'Streetlight out on Oak Ave' LIMIT 1;
  IF issue1 IS NOT NULL THEN
    INSERT INTO public.issue_comments (issue_id, author_name, author_role, message)
    VALUES
      (issue1, 'John Doe', 'staff', 'Repair crew dispatched. Pothole filled.'),
      (issue1, 'Alex Citizen', 'citizen', 'Thanks for the quick response!');
  END IF;
  IF issue2 IS NOT NULL THEN
    INSERT INTO public.issue_comments (issue_id, author_name, author_role, message)
    VALUES (issue2, 'John Doe', 'staff', 'Assigned to maintenance. Expected fix within 2 days.');
  END IF;
END $$;

-- ── 6. SAMPLE LEAVE REQUEST (optional) ───────────────────────────
INSERT INTO public.leave_requests (staff_id, staff_name, employee_id, start_date, end_date, reason, status)
SELECT id::text, name, employee_id, CURRENT_DATE + 7, CURRENT_DATE + 10, 'Family vacation', 'pending'
FROM public.staff WHERE employee_id = 'EMP-0002' LIMIT 1;

-- ================================================================
--  DONE. Database cleared and seeded with sample data for evaluators.
--
--  SAMPLE CREDENTIALS:
--  - Staff:  EMP-0001 / Staff@123  or  EMP-0002 / Staff@123
--  - Citizen: citizen@test.com / Test123  or  phone +1122334455 / Test123
--
--  Admin login uses Supabase Auth (admin@civicpulse.com / Admin@123)
--  — ensure admin exists in your Supabase Auth users.
-- ================================================================
