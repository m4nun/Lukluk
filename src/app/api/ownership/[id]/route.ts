import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("owned_pet_profiles")
    .select("*, pet_type_profiles(name, species, mbti_label, description)")
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .single();

  if (error || !profile) {
    return Response.json({ error: "Owned profile not found" }, { status: 404 });
  }

  return Response.json(profile);
}
