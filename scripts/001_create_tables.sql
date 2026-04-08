CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'citizen',
  full_name TEXT NOT NULL DEFAULT 'User',
  phone TEXT,
  emp_id TEXT UNIQUE,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_all" ON public.profiles;
CREATE POLICY "profiles_insert_all" ON public.profiles FOR INSERT WITH CHECK (true);
