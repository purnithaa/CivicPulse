import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { base64, fileName, contentType } = body

    if (!base64) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 })
    }

    // Strip the data URL prefix (e.g., "data:image/jpeg;base64,")
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")

    const ext = (contentType || "image/jpeg").split("/")[1] ?? "jpg"
    const filePath = `issues/${Date.now()}-${fileName || `image.${ext}`}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from("issue-photos")
      .upload(filePath, buffer, {
        contentType: contentType || "image/jpeg",
        upsert: false,
      })

    if (uploadError) {
      // If storage bucket doesn't exist or fails, return base64 as fallback
      // The image will still be stored (as base64 in DB) - just not in Storage
      console.warn("Storage upload failed, using base64 fallback:", uploadError.message)
      return NextResponse.json({ url: base64, fallback: true })
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("issue-photos")
      .getPublicUrl(filePath)

    return NextResponse.json({ url: publicUrlData.publicUrl, fallback: false })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Upload failed" }, { status: 500 })
  }
}
