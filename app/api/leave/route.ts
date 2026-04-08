import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

// GET - fetch all leave requests (or by staff_id query param)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const staffId = searchParams.get("staff_id")

    let query = supabaseAdmin
      .from("leave_requests")
      .select("*")
      .order("created_at", { ascending: false })

    if (staffId) {
      query = query.eq("staff_id", staffId)
    }

    const { data, error } = await query

    if (error) {
      if (error.code === "42P01") {
        // Table doesn't exist yet
        return NextResponse.json([])
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

// POST - submit a new leave request
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { staffId, staffName, employeeId, startDate, endDate, reason } = body

    if (!staffId || !staffName || !startDate || !endDate || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("leave_requests")
      .insert({
        staff_id: staffId,
        staff_name: staffName,
        employee_id: employeeId ?? "",
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ error: "dbNotReady" }, { status: 503 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

// PATCH - update leave request status (approve/reject)
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, status, reviewedAt } = body

    if (!id || !status) {
      return NextResponse.json({ error: "id and status required" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("leave_requests")
      .update({
        status,
        reviewed_at: reviewedAt ?? new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
