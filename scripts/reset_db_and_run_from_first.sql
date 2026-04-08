-- ================================================================
--  CivicPulse — FULL RESET: Clear DB + Storage, Run from First
--  Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
--  https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
-- ================================================================

-- 1. Clear child tables first (depend on issues, staff)
TRUNCATE TABLE public.issue_comments RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.issues         RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.leave_requests RESTART IDENTITY CASCADE;

-- 2. Clear staff tables
TRUNCATE TABLE public.staff          RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.staff_accounts RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.staff_registry RESTART IDENTITY CASCADE;

-- 3. Clear citizens
TRUNCATE TABLE public.citizens RESTART IDENTITY CASCADE;

-- 4. Clear uploaded issue photos from storage
DELETE FROM storage.objects WHERE bucket_id = 'issue-photos';

-- ================================================================
--  DONE. All data cleared. Ready for fresh testing:
--  1. Open app → Admin login → Add Staff (EMP-0001) → Sync logins
--  2. Citizen signup → Report issue
--  3. Staff login (EMP-0001 / Staff@123)
-- ================================================================
