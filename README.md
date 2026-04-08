# CivicPulse — Urban Issue Reporting App

**HACKAPPSTERS 2026 — Round 1 Submission**

CivicPulse is a web and mobile app that lets citizens report urban issues (potholes, streetlights, sanitation, etc.), and allows staff and admins to track and resolve them.

---

### For evaluators (database)

- **Live app & APK** use the same Supabase backend. The database may contain **sample data** (a few issues in different statuses, test users) so you can immediately see the app in action and assess resolution flow, data integrity, and reporting.
- For a **clean slate**, run `scripts/reset_db_and_run_from_first.sql` in the Supabase SQL Editor; then follow **TESTING_STEPS.md** to add staff, sign up as citizen, and submit reports from scratch.

---

### Full source code (for evaluators)

The full source code (entire project including dataset, README, and project report) is available here:

**Full project (zip):** [PASTE YOUR GOOGLE DRIVE LINK HERE]

- Download the zip from the link above to get all source files (`.ts`, `.tsx`, `.css`, `.sql`, etc.), this README, `PROJECT_REPORT.md`, and the `scripts/` folder.
- **APK** is submitted separately via the Round 1 form (install and test the app on device).

---

### What we submitted (Round 1 form)

| Form requirement | What we submitted |
|------------------|-------------------|
| **APK / app** | Uploaded to the form (CivicPulse Android APK) |
| **Source code** | Google Drive link (full project zip) — link pasted above and in the form |
| **README** | This file (included in the Drive zip) — step-by-step guide below |
| **Project report** | `PROJECT_REPORT.md` (in the Drive zip; PDF uploaded to form if required) |
| **Dataset** | Inside the Drive zip: `scripts/setup_db.sql`, `scripts/reset_db_and_run_from_first.sql` |

---

## Step-by-Step Guide to Configure and Run the Code

### Prerequisites

- **Node.js** 18.x or 20.x — [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** — to clone the repository
- **Supabase account** (free) — [supabase.com](https://supabase.com/) for database and storage
- **(Optional) Android Studio / JDK 17+** — only if you want to build the Android APK

---

### Step 1: Clone or Download the Source Code

```bash
# If you have the repo URL:
git clone <repository-url>
cd b_lSMIPFLYRRp-1772793559099

# Or extract the submitted source code zip and open the folder in terminal.
```

---

### Step 2: Install Dependencies

Open a terminal in the project root and run:

```bash
npm install
```

Wait until all packages are installed.

---

### Step 3: Set Up Supabase (Database & Storage)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) and create a new project (or use an existing one).
2. In the project, go to **SQL Editor** → **New query**.
3. Run the database setup script:
   - Open the file `scripts/setup_db.sql` from this project.
   - Copy its entire content and paste it into the Supabase SQL Editor.
   - Click **Run**. This creates all required tables (citizens, staff, issues, comments, leave requests, etc.) and storage bucket for issue photos.
4. Get your project credentials:
   - Go to **Project Settings** → **API**.
   - Note: **Project URL** and **anon (public) key**.
   - For server-side APIs (optional), note **service_role key** (keep it secret).

---

### Step 4: Configure Environment Variables

1. In the project root, create a file named `.env.local`.
2. Add the following (replace with your Supabase values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

3. Save the file. Do not commit `.env.local` to version control.

---

### Step 5: Run the Web Application (Development)

In the project root, run:

```bash
npm run dev
```

- Open a browser and go to: **http://localhost:3000**
- You should see the CivicPulse welcome page. You can sign up as a citizen, report issues, and (after adding staff in admin) log in as staff or admin.

---

### Step 6: Create Admin and Test the Flow (Optional)

1. **Create admin user in database (one-time):**  
   In Supabase SQL Editor, run (use your own email and a password hash if you have one, or use the default for testing):

   - Typically the app uses a fixed admin email. Check the codebase for `admin@civicpulse.com` and set the password in your auth mechanism, or use the credentials from `TESTING_STEPS.md`:  
     - **Admin:** `admin@civicpulse.com` / `Admin@123` (ensure this user exists in your auth/staff tables as per your app logic).

2. **Add staff:**  
   - Log in as Admin → go to **Staff** tab → **Add Staff** (e.g. Employee ID `EMP-0001`, set name, phone, department).
3. **Sync logins:**  
   - Click **Sync logins** so staff can log in with Employee ID and default password (e.g. `Staff@123`).
4. **Citizen:**  
   - Sign up as a citizen and submit a report with photo and location.
5. **Staff:**  
   - Log in with `EMP-0001` / `Staff@123` and view/update issues.

Detailed testing steps are in **TESTING_STEPS.md**.

---

### Step 7: Build for Production (Web)

```bash
npm run build
npm start
```

- The app will run on **http://localhost:3000** in production mode.
- To deploy to Vercel: connect your repo to Vercel and add the same environment variables in Project Settings → Environment Variables. Then deploy.

---

### Step 8: Build Android APK (Optional)

Only if you need the mobile APK:

1. Install **Node**, **Android Studio** (or JDK 17+ and Android SDK), and **Capacitor CLI** (already in the project).
2. Build the Next.js app and sync with Capacitor:

```bash
npm run build
npx cap sync android
```

3. Open the Android project and build:

```bash
cd android
.\gradlew.bat clean assembleDebug
```

4. APK output: `android/app/build/outputs/apk/debug/app-debug.apk`

- To use your own backend URL in the APK, set `NEXT_PUBLIC_API_BASE` (or the variable used in the app) before `npm run build`, or configure `capacitor.config.ts` `server.url` to your deployed web app URL.

---

## Dataset / Database Schema

- **Dataset:** The app uses a **PostgreSQL database** on Supabase. There is no separate CSV/dataset file; the schema and initial setup are in:
  - **scripts/setup_db.sql** — full database schema (tables, indexes, RLS, storage bucket).
  - **scripts/reset_db_and_run_from_first.sql** — script to clear all data for a fresh run.
- Tables include: `citizens`, `staff_registry`, `staff_accounts`, `staff`, `issues`, `issue_comments`, `leave_requests`, and Supabase Storage bucket `issue-photos` for uploads.

---

## Source Code Structure (Applicable Formats)

- **Frontend / UI:** `.tsx`, `.jsx`, `.css` (React/Next.js)
- **Backend / API:** `.ts`, `.js` (Next.js API routes in `app/api/`)
- **Config:** `next.config.mjs`, `capacitor.config.ts`, `package.json`, `tsconfig.json`, etc.
- **Scripts:** `.sql` (database), `.js` (optional scripts)

All of these are part of the submitted source code.

---

## Quick Reference

| Item        | Location / Command                    |
|------------|----------------------------------------|
| Web dev    | `npm run dev` → http://localhost:3000  |
| DB setup   | Run `scripts/setup_db.sql` in Supabase |
| Env file   | `.env.local` with Supabase URL and keys |
| Test flow  | See **TESTING_STEPS.md**               |
| APK build  | `npm run build` → `npx cap sync android` → `cd android` → `.\gradlew.bat assembleDebug` |

---

## Live Demo (If Deployed)

- **Web:** https://civicpulse-app.vercel.app  
- **APK:** Uses the same backend; can be built from this source as in Step 8.

---

**End of Step-by-Step Guide.**
