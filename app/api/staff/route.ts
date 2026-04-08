import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { hashStaffPassword, DEFAULT_STAFF_PASSWORD } from "@/lib/staff-password"

// GET - fetch all staff
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("staff")
      .select("*")
      .order("created_at", { ascending: true })

    if (error) {
      // If table doesn't exist, return empty array (fallback to mock data on client)
      if (error.code === "42P01") {
        return NextResponse.json([])
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

// POST - add new staff member
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, employeeId, phone, department, password } = body

    if (!name || !employeeId || !phone || !department) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check for duplicate employee ID
    const { data: existing } = await supabaseAdmin
      .from("staff")
      .select("id")
      .eq("employee_id", employeeId.trim())
      .single()

    if (existing) {
      return NextResponse.json({ error: "Employee ID already exists" }, { status: 409 })
    }

    const parts = name.trim().split(" ")
    const initials =
      parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase()

    const { data, error } = await supabaseAdmin
      .from("staff")
      .insert({
        name: name.trim(),
        employee_id: employeeId.trim(),
        phone: phone.trim(),
        department: department,
        status: "available",
        active_issues: 0,
        resolved_count: 0,
        avatar_initials: initials,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ error: "dbNotReady" }, { status: 503 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Staff account: admin sets password (or default)
    const empId = employeeId.trim()
    const pw = (typeof password === "string" && password.trim().length >= 6)
      ? password.trim()
      : DEFAULT_STAFF_PASSWORD
    const hashedPw = await hashStaffPassword(pw)
    await supabaseAdmin.from("staff_registry").upsert(
      { employee_id: empId, name: name.trim(), phone: phone.trim(), department: department },
      { onConflict: "employee_id" }
    )
    const { error: accountErr } = await supabaseAdmin.from("staff_accounts").upsert(
      {
        employee_id: empId,
        name: name.trim(),
        phone: phone.trim(),
        department: department,
        password_hash: hashedPw,
      },
      { onConflict: "employee_id" }
    )
    if (accountErr) {
      const { error: insErr } = await supabaseAdmin.from("staff_accounts").insert({
        employee_id: empId,
        name: name.trim(),
        phone: phone.trim(),
        department: department,
        password_hash: hashedPw,
      })
      if (insErr) {
        console.error("staff_accounts upsert/insert failed:", accountErr, insErr)
        return NextResponse.json({ error: "Could not create login. Try Sync logins." }, { status: 500 })
      }
    }

    return NextResponse.json({ ...data, defaultPassword: pw }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

// PATCH - update staff member (by id or by employeeId for status updates from staff app)
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, name, employeeId, phone, department, status } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) {
      updateData.name = name.trim()
      const parts = name.trim().split(" ")
      updateData.avatar_initials =
        parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : name.slice(0, 2).toUpperCase()
    }
    if (employeeId !== undefined) updateData.employee_id = employeeId.trim()
    if (phone !== undefined) updateData.phone = phone.trim()
    if (department !== undefined) updateData.department = department
    if (status !== undefined) updateData.status = status

    let query = supabaseAdmin.from("staff").update(updateData)

    if (id) {
      query = query.eq("id", id)
    } else if (employeeId) {
      query = query.eq("employee_id", employeeId.trim())
    } else {
      return NextResponse.json({ error: "Staff ID or Employee ID required" }, { status: 400 })
    }

    const { data, error } = await query.select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

// DELETE - remove staff member
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Staff ID required" }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from("staff")
      .delete()
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
