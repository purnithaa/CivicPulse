import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { hashStaffPassword, DEFAULT_STAFF_PASSWORD } from "@/lib/staff-password"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, name, employeeId, phone, password, currentPassword, newPassword, confirmPassword } = body

    if (!action || !employeeId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const normalizedId = employeeId.trim().toLowerCase()

    if (action === "changePassword") {
      if (!currentPassword || !newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 })
      }
      if (newPassword !== confirmPassword) {
        return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
      }

      const { data: staff, error: fetchErr } = await supabaseAdmin
        .from("staff_accounts")
        .select("id, password_hash")
        .ilike("employee_id", normalizedId)
        .single()

      if (fetchErr || !staff) {
        return NextResponse.json({ error: "invalidCredentials" }, { status: 401 })
      }

      const currentHash = await hashStaffPassword(currentPassword)
      if (staff.password_hash !== currentHash) {
        return NextResponse.json({ error: "Current password is wrong" }, { status: 401 })
      }

      const hashedPw = await hashStaffPassword(newPassword)
      const { error: updateErr } = await supabaseAdmin
        .from("staff_accounts")
        .update({ password_hash: hashedPw })
        .eq("id", staff.id)
      if (updateErr) {
        return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    if (action === "signup") {
      if (!password) return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
      const { data: registry } = await supabaseAdmin
        .from("staff_registry")
        .select("*")
        .ilike("employee_id", normalizedId)
        .single()

      if (!registry) {
        return NextResponse.json({ error: "employeeIdNotRecognized" }, { status: 403 })
      }

      const { data: existing } = await supabaseAdmin
        .from("staff_accounts")
        .select("id")
        .ilike("employee_id", normalizedId)
        .single()

      if (existing) {
        return NextResponse.json({ error: "accountExists" }, { status: 409 })
      }

      const hashedPw = await hashStaffPassword(password)
      const { data: newStaff, error } = await supabaseAdmin
        .from("staff_accounts")
        .insert({
          name: registry.name ?? name?.trim(),
          employee_id: registry.employee_id,
          phone: registry.phone ?? phone?.trim(),
          department: registry.department ?? "General",
          password_hash: hashedPw,
        })
        .select()
        .single()

      if (error) {
        if (error.code === "42P01") return NextResponse.json({ error: "dbNotReady" }, { status: 503 })
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, staff: newStaff }, { status: 201 })
    }

    if (action === "login") {
      if (!password) {
        return NextResponse.json({ error: "passwordRequired" }, { status: 400 })
      }

      const { data: staff, error } = await supabaseAdmin
        .from("staff_accounts")
        .select("id, name, employee_id, phone, department, password_hash")
        .ilike("employee_id", normalizedId)
        .single()

      if (error || !staff) {
        return NextResponse.json({ error: "invalidCredentials" }, { status: 401 })
      }

      const hashedPw = await hashStaffPassword(password)
      if (staff.password_hash !== hashedPw) {
        return NextResponse.json({ error: "invalidCredentials" }, { status: 401 })
      }

      const defaultHash = await hashStaffPassword(DEFAULT_STAFF_PASSWORD)
      const mustChangePassword = staff.password_hash === defaultHash

      const { password_hash: _, ...staffSafe } = staff
      return NextResponse.json({ success: true, staff: staffSafe, mustChangePassword })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Auth error" }, { status: 500 })
  }
}
