import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: pet, error } = await supabase
    .from("pet_type_profiles")
    .select("*")
    .eq("id", slug)
    .single();

  if (error || !pet) {
    return NextResponse.json({ error: "Pet not found" }, { status: 404 });
  }

  const { data: experiences } = await supabase
    .from("owner_experiences")
    .select("id, title, body, ownership_duration, created_at, has_owned")
    .eq("pet_type_profile_id", slug)
    .eq("is_flagged", false)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ ...pet, experiences: experiences || [] });
}
