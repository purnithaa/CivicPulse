import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

// Simple password hashing using SHA-256 via WebCrypto
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "civicpulse_salt")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, name, emailOrPhone, password } = body

    if (!action || !emailOrPhone || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const identifier = emailOrPhone.trim().toLowerCase()
    const isEmail = identifier.includes("@")

    if (action === "signup") {
      if (!name?.trim()) {
        return NextResponse.json({ error: "nameRequired" }, { status: 400 })
      }

      // Check if user exists
      const { data: existing } = await supabaseAdmin
        .from("citizens")
        .select("id")
        .or(`email.eq.${isEmail ? identifier : ""},phone.eq.${!isEmail ? identifier : ""}`)
        .single()

      if (existing) {
        return NextResponse.json({ error: "accountExists" }, { status: 409 })
      }

      const hashedPw = await hashPassword(password)

      const { data: newUser, error } = await supabaseAdmin
        .from("citizens")
        .insert({
          name: name.trim(),
          email: isEmail ? identifier : null,
          phone: !isEmail ? identifier : null,
          password_hash: hashedPw,
        })
        .select("id, name, email, phone")
        .single()

      if (error) {
        // If table doesn't exist, fall back gracefully
        if (error.code === "42P01") {
          return NextResponse.json({ error: "dbNotReady" }, { status: 503 })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, user: newUser }, { status: 201 })
    }

    if (action === "login") {
      const hashedPw = await hashPassword(password)

      const { data: user, error } = await supabaseAdmin
        .from("citizens")
        .select("id, name, email, phone")
        .or(`email.eq.${isEmail ? identifier : "none@none.com"},phone.eq.${!isEmail ? identifier : "0000000000"}`)
        .eq("password_hash", hashedPw)
        .single()

      if (error || !user) {
        return NextResponse.json({ error: "invalidCredentials" }, { status: 401 })
      }

      return NextResponse.json({ success: true, user })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Auth error" }, { status: 500 })
  }
}
