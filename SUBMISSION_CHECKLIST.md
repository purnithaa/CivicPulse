# HACKAPPSTERS 2026 — Round 1 Submission Checklist

**Last date for submission: 08/03/2026**

Use this list when filling the **Round 1 Task Submission Form**.

**Submission approach:** Upload the **APK** to the form. Put the **full source code** (zip) on **Google Drive** and paste the shareable link in the README and in the form’s source code field.

---

## 1. APK (upload to form)

| What to submit | Where it is |
|----------------|-------------|
| CivicPulse Android APK | Build from project: `android/app/build/outputs/apk/debug/app-debug.apk` (or your `CivicPulse-latest.apk` copy) |

Upload the APK file to the Round 1 form as required (e.g. “App / APK” or “Demo” field).

---

## 2. Full source code (Google Drive)

| Step | What to do |
|------|------------|
| 1 | **Zip the full project** (all source code, README.md, PROJECT_REPORT.md, SUBMISSION_CHECKLIST.md, scripts/ folder). Do not include `node_modules` or `.next` if the zip gets too large; evaluators can run `npm install` and `npm run build` as per README. |
| 2 | **Upload the zip to Google Drive** (e.g. create a folder “CivicPulse-HACKAPPSTERS2026”, upload the zip there). |
| 3 | **Get a shareable link:** Right‑click the zip (or folder) → Share → “Anyone with the link” can view (or download). Copy the link. |
| 4 | **Paste the link in README.md:** Open `README.md` and replace `[PASTE YOUR GOOGLE DRIVE LINK HERE]` with your actual link (see top of README). |
| 5 | **In the form:** Where it asks for source code / dataset, paste the same Google Drive link. You can write: *“Full source code (zip): [link]. README and step-by-step guide are inside the zip.”* |

**Dataset:** The zip includes the `scripts/` folder (`setup_db.sql`, `reset_db_and_run_from_first.sql`). No separate upload needed.

---

## 3. README (Step-by-Step Guide)

| What to submit | Where it is |
|----------------|-------------|
| Step-by-step guide | **`README.md`** (in project root) — included inside the Drive zip |

Evaluators will download the zip from your Drive link; README.md is inside. It contains the full step-by-step guide to configure and run the code. No need to upload README separately unless the form has a dedicated “README” upload field.

---

## 4. Project Report

| What to submit | Where it is |
|----------------|-------------|
| Project report | **`PROJECT_REPORT.md`** (in project root) — included inside the Drive zip |

**Before zipping:**
1. Open **PROJECT_REPORT.md** and fill in **Section 2** (Team / Author): your name(s), college/organization, email.

**If the form asks for a PDF report:** Convert `PROJECT_REPORT.md` to PDF and upload that PDF to the form. The same report is also inside the Drive zip as .md.

---

## Quick summary — your steps

1. **Fill PROJECT_REPORT.md** — Section 2: Name, College, Email.
2. **Paste your Google Drive link in README.md** — replace `[PASTE YOUR GOOGLE DRIVE LINK HERE]`.
3. **Zip the project** (include everything except huge folders like `node_modules`/`.next` if needed; README says `npm install`).
4. **Upload the zip to Google Drive** and set sharing to “Anyone with the link”.
5. **Copy the shareable link** and paste it in README (if you hadn’t before zipping, re-zip after editing README and re-upload).
6. **Submit via the form:** Upload APK; paste the Google Drive link for source code; upload Project Report PDF if required.

**End of checklist.**
