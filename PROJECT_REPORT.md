# Project Report — CivicPulse

**HACKAPPSTERS 2026 — Round 1**  
**Submission Date:** 08 March 2026

---

## 1. Project Title

**CivicPulse — Urban Issue Reporting and Management Platform**

---

## 2. Team / Author

**Name:** [Your full name or team member names]  
**College / Organization:** [Your college or organization name]  
**Email:** [your.email@example.com]

---

## 3. Problem Statement

Citizens often face urban issues such as potholes, broken streetlights, garbage dumping, and water leaks, but have no simple way to report them and track resolution. Municipalities and field staff lack a single platform to receive reports, assign work, and show progress. This leads to:

- Low reporting due to friction (calls, emails, or unclear channels)
- No visibility for citizens on whether their report was received or fixed
- Inefficient coordination between citizens, staff, and admins
- Poor data for analytics and planning

---

## 4. Solution Overview

**CivicPulse** is a full-stack web and mobile application that:

- Lets **citizens** sign up, report issues with a photo and location, and view the status of their reports.
- Gives **field staff** a dedicated login to view assigned issues, update status, and add comments.
- Provides **admins** with a dashboard to manage staff, view all issues, analytics, and settings.
- Uses a **single codebase** (Next.js) deployed on the web and packaged as an **Android APK** via Capacitor, both connected to the same cloud database (Supabase).

---

## 5. Technology Stack

| Layer        | Technology |
|-------------|------------|
| Frontend    | Next.js 16 (React 19), TypeScript, Tailwind CSS, Radix UI |
| Backend     | Next.js API Routes (serverless) |
| Database    | Supabase (PostgreSQL) |
| Storage     | Supabase Storage (issue photos) |
| Auth        | Custom citizen/staff/admin auth with Supabase as data store |
| Mobile      | Capacitor (Android), same web app in WebView |
| Deployment  | Vercel (web), APK loads web app from Vercel |
| Other       | Geolocation & Camera (Capacitor), multi-language support (i18n) |

---

## 6. Features Implemented

### For Citizens
- Sign up / login (email or phone)
- Report issue: category, title, description, photo, GPS location
- View “My Reports” with status (submitted, in-review, dispatched, resolved)
- Browse issues on a map with filters
- Multi-language support (e.g. English / regional)
- Responsive UI and mobile-friendly layout

### For Staff
- Login with Employee ID and password
- View list of issues (filter by status/category)
- Update issue status and add comments
- Leave request submission
- Profile and password change

### For Admin
- Dashboard with overview and analytics (charts, counts)
- Manage staff (add, sync logins)
- View and manage all issues
- Settings and system configuration

### Technical
- Rate limiting on report submission
- Photo upload with validation
- Safe-area and viewport handling for APK display on phones
- Database schema with RLS and indexes (see `scripts/setup_db.sql`)

---

## 7. How to Configure and Run

A **step-by-step guide** is provided in the **README.md** file in the project root. Summary:

1. Clone or extract the source code.
2. Run `npm install`.
3. Create a Supabase project and run `scripts/setup_db.sql` in the SQL Editor.
4. Create `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and optionally `SUPABASE_SERVICE_ROLE_KEY`.
5. Run `npm run dev` and open http://localhost:3000.
6. (Optional) Build Android APK: `npm run build` → `npx cap sync android` → build from `android/` with Gradle.

No Word/PDF is used for source code; all code is in standard formats (e.g. `.ts`, `.tsx`, `.css`, `.sql`, `.json`, `.mjs`).

---

## 8. Dataset / Database

- The application uses a **relational database** on Supabase (PostgreSQL).
- **Schema and setup:** Provided as SQL scripts in the `scripts/` folder:
  - `scripts/setup_db.sql` — complete schema (tables, policies, storage bucket).
  - `scripts/reset_db_and_run_from_first.sql` — reset script for fresh testing.
- **Dataset:** Data is generated through app usage (user signups, reports, staff actions). For evaluation, reviewers can run the app and create sample data using the steps in **TESTING_STEPS.md**.

---

## 9. Screenshots / Demo

[Insert 3–5 screenshots here, for example:]
- Welcome / Login screen
- Citizen: Report issue (form with photo and map)
- Citizen: My Reports list
- Staff: Issues list with status update
- Admin: Dashboard or Analytics

*Optional: Add a short demo video link (e.g. Loom, YouTube) showing the flow.*

---

## 10. Future Enhancements

- Push notifications when an issue status changes (e.g. “Your report was resolved”).
- Before/after photos when staff mark an issue resolved.
- Points or badges for citizens (“Top Reporter”).
- Export of issues/analytics to CSV or PDF for municipal reporting.
- More languages and accessibility improvements.

---

## 11. Conclusion

CivicPulse provides a single platform for citizens to report urban issues and for staff and admins to manage and resolve them. The solution is built with modern web and mobile technologies, uses a clear database schema, and is documented for configuration and run in the README. It is submitted as a complete, runnable project for HACKAPPSTERS 2026 Round 1.

---

## 12. References

- Next.js: https://nextjs.org/
- Supabase: https://supabase.com/
- Capacitor: https://capacitorjs.com/
- Vercel: https://vercel.com/

---

**End of Project Report.**

*You can convert this Markdown file to PDF using any Markdown-to-PDF tool (e.g. Pandoc, VS Code “Markdown PDF” extension, or online converters) for submission if the form requires a PDF project report.*
