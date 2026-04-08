import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { hashStaffPassword, DEFAULT_STAFF_PASSWORD } from "@/lib/staff-password"

/**
 * POST /api/staff/sync-logins
 * Creates staff_registry + staff_accounts (with default password) for every staff
 * that exists in "staff" but has no login yet. Fixes "invalid credentials" for
 * admin-created staff like EMP-0001.
 */
export async function POST() {
  try {
    const { data: staffList, error: staffErr } = await supabaseAdmin
      .from("staff")
      .select("id, employee_id, name, phone, department")

    if (staffErr || !staffList?.length) {
      return NextResponse.json({ synced: 0, message: "No staff found or error" })
    }

    const { data: existingAccounts } = await supabaseAdmin
      .from("staff_accounts")
      .select("employee_id")

    const existingIds = new Set(
      (existingAccounts ?? []).map((r) => String(r.employee_id).trim().toLowerCase())
    )
    const hashedPw = await hashStaffPassword(DEFAULT_STAFF_PASSWORD)
    let synced = 0

    for (const s of staffList) {
      const empId = String(s.employee_id).trim()
      const key = empId.toLowerCase()
      if (existingIds.has(key)) continue

      await supabaseAdmin.from("staff_registry").upsert(
        {
          employee_id: empId,
          name: s.name ?? "",
          phone: s.phone ?? null,
          department: s.department ?? "General",
        },
        { onConflict: "employee_id" }
      )
      const { error: ins } = await supabaseAdmin.from("staff_accounts").insert({
        employee_id: empId,
        name: s.name ?? "",
        phone: s.phone ?? null,
        department: s.department ?? "General",
        password_hash: hashedPw,
      })
      if (!ins) {
        synced++
        existingIds.add(key)
      }
    }

    return NextResponse.json({
      synced,
      defaultPassword: DEFAULT_STAFF_PASSWORD,
      message: synced > 0 ? `Created logins for ${synced} staff. They can log in with password "${DEFAULT_STAFF_PASSWORD}".` : "All staff already have logins.",
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
