import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { hashStaffPassword, DEFAULT_STAFF_PASSWORD } from "@/lib/staff-password"

/**
 * POST /api/staff/reset-password
 * Admin-only: reset staff password to default (or specified). Use when staff can't login.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { employeeId, newPassword } = body
    const empId = typeof employeeId === "string" ? employeeId.trim() : ""

    if (!empId) {
      return NextResponse.json({ error: "employeeId required" }, { status: 400 })
    }

    const pw = typeof newPassword === "string" && newPassword.trim().length >= 6
      ? newPassword.trim()
      : DEFAULT_STAFF_PASSWORD

    const hashedPw = await hashStaffPassword(pw)

    const { data, error } = await supabaseAdmin
      .from("staff_accounts")
      .update({ password_hash: hashedPw })
      .eq("employee_id", empId)
      .select("employee_id")
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Staff account not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      employeeId: data.employee_id,
      message: pw === DEFAULT_STAFF_PASSWORD
        ? `Password reset to "${DEFAULT_STAFF_PASSWORD}". Staff can log in with that.`
        : "Password updated.",
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
