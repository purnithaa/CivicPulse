import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("issues")
    .select("*")
    .order("reported_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { data, error } = await supabaseAdmin
      .from("issues")
      .insert({
        title: body.title,
        description: body.description,
        category: body.category,
        priority: body.priority ?? "medium",
        location: body.location,
        lat: body.lat ?? null,
        lng: body.lng ?? null,
        department: body.department ?? null,
        reporter_name: body.reporterName ?? null,
        reporter_contact: body.reporterContact ?? null,
        image_url: body.imageUrl ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create issue" },
      { status: 500 }
    );
  }
}

