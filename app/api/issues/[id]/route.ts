import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.status !== undefined) updateData.status = body.status
    if (body.assigned_staff_id !== undefined) updateData.assigned_staff_id = body.assigned_staff_id
    if (body.assigned_staff_name !== undefined) updateData.assigned_staff_name = body.assigned_staff_name
    if (body.assigned_staff_phone !== undefined) updateData.assigned_staff_phone = body.assigned_staff_phone
    if (body.priority !== undefined) updateData.priority = body.priority

    const { data, error } = await supabaseAdmin
      .from("issues")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // When a staff member is assigned (dispatched), automatically set their status to "busy"
    if (body.assigned_staff_id && body.status === "dispatched") {
      await supabaseAdmin
        .from("staff")
        .update({ status: "busy" })
        .eq("id", body.assigned_staff_id)
      // Best-effort: ignore errors from staff update
    }

    // When an issue is resolved, set the assigned staff status back to "available"
    if (body.status === "resolved" && data?.assigned_staff_id) {
      await supabaseAdmin
        .from("staff")
        .update({ status: "available" })
        .eq("id", data.assigned_staff_id)
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Update failed" }, { status: 500 })
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabaseAdmin
      .from("issues")
      .select("*")
      .eq("id", id)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
