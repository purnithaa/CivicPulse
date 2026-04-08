-- ================================================================
--  CivicPulse — Clear ALL Data
--  Run this in Supabase → SQL Editor → New query → paste → Run.
--  Wipes all rows; tables and schema stay. Ready for fresh testing.
-- ================================================================

-- Child tables first (depend on issues, staff, citizens)
TRUNCATE TABLE public.issue_comments RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.issues         RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.leave_requests  RESTART IDENTITY CASCADE;

-- Staff and auth
TRUNCATE TABLE public.staff          RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.staff_accounts RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.staff_registry  RESTART IDENTITY CASCADE;

-- Citizens
TRUNCATE TABLE public.citizens RESTART IDENTITY CASCADE;

-- Optional: clear uploaded issue photos (uncomment if you use storage)
-- DELETE FROM storage.objects WHERE bucket_id = 'issue-photos';

-- ================================================================
--  Done. All tables are empty. Test from first: register citizen,
--  add staff as admin, then login as staff with password123.
-- ================================================================
