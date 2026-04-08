# CivicPulse — Testing

## Sync: APK + Web + DB
- **Web:** https://civicpulse-app.vercel.app
- **APK:** Same backend, same Supabase
- Use civicpulse-app.vercel.app (not preview URLs)

---

## Step 1: Clear DB and Run from First
1. Go to **Supabase SQL Editor:**  
   https://supabase.com/dashboard/project/mmjsnytfdmzxydhlbrsp/sql/new
2. Copy the contents of `scripts/reset_db_and_run_from_first.sql`
3. Paste in the editor and click **Run**
4. This clears all data (issues, citizens, staff, leave requests, issue photos) — ready for fresh testing

---

## Step 2: Admin — Add Staff
1. https://civicpulse-app.vercel.app → **I'm Admin** → Login: `admin@civicpulse.com` / `Admin@123`
2. **Staff** tab → **Add Staff**
3. Fill: Name, Employee ID `EMP-0001`, Phone, Department
4. Click **Add Staff**
5. Click **Sync logins** (creates login if needed)
6. Share with staff: **Login = EMP-0001 / Staff@123** — they can change it in Profile

---

## Step 3: Citizen — Sign Up & Report
1. **I'm a Citizen** → Sign up → Report Issue

---

## Step 4: Staff — Login
1. **Staff** → Login: **EMP-0001** / **Staff@123**
2. Change password in **Profile** if needed

---

## Credentials
| Role   | Login                  | Password   |
|--------|------------------------|------------|
| Admin  | admin@civicpulse.com   | Admin@123  |
| Staff  | EMP-0001               | **Staff@123** |
