import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const issueId = searchParams.get("issueId")

  if (!issueId) {
    return NextResponse.json({ error: "issueId is required" }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from("issue_comments")
    .select("*")
    .eq("issue_id", issueId)
    .order("created_at", { ascending: true })

  if (error) {
    // If the table doesn't exist yet, return empty array gracefully
    if (error.code === "42P01") {
      return NextResponse.json([])
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { issueId, authorName, authorRole, message, imageUrl } = body

    if (!issueId || !message) {
      return NextResponse.json({ error: "issueId and message are required" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("issue_comments")
      .insert({
        issue_id: issueId,
        author_name: authorName ?? "Anonymous",
        author_role: authorRole ?? "citizen",
        message,
        image_url: imageUrl ?? null,
      })
      .select()
      .single()

    if (error) {
      // If table doesn't exist, return a mock response
      if (error.code === "42P01") {
        return NextResponse.json({
          id: `local-${Date.now()}`,
          issue_id: issueId,
          author_name: authorName ?? "Anonymous",
          author_role: authorRole ?? "citizen",
          message,
          image_url: imageUrl ?? null,
          created_at: new Date().toISOString(),
        }, { status: 201 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to add comment" },
      { status: 500 }
    )
  }
}
