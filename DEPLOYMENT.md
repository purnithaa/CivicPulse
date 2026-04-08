# CivicPulse — APK & Web Sync

## Same data everywhere

APK and web use the **same backend** (civicpulse-app.vercel.app) and **same Supabase DB**. Data added on APK = data on web = same DB.

**Staff login:** Admin adds staff (no password field) → Sync logins → Staff uses **EMP ID + password123**. Staff can change password from Profile.

### Production URL (single source of truth)

**Always use this URL for both web and APK:**

```
https://civicpulse-app.vercel.app
```

- **Web:** Use https://civicpulse-app.vercel.app (not preview URLs like civicpulse-xxxxx-maneeswar06-netizens-projects.vercel.app)
- **APK:** Already configured to load from civicpulse-app.vercel.app (capacitor.config.ts)

### Vercel env vars

Set these for **Production, Preview, and Development**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Vercel: Project → Settings → Environment Variables → enable all environments.
