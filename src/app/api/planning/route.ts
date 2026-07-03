import { createClient } from "@/lib/supabase/server";
import { requireSubscriber } from "@/lib/stripe/guard";

// POST: Create a new Planning Pet Profile
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const auth = await requireSubscriber();
  if (!auth.authorized) {
    return Response.json({ error: auth.error }, { status: 402 });
  }

  const body = await request.json();
  const { petTypeProfileId, planningName } = body;

  const { data: profile } = await supabase
    .from("planning_pet_profiles")
    .insert({
      user_id: userData.user.id,
      pet_type_profile_id: petTypeProfileId,
      planning_name: planningName || null,
    })
    .select("id")
    .single();

  return Response.json({ id: profile!.id });
}

// GET: List user's Planning Pet Profiles
export async function GET() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profiles } = await supabase
    .from("planning_pet_profiles")
    .select("*, pet_type_profiles(name, species, mbti_label)")
    .eq("user_id", userData.user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return Response.json(profiles || []);
}
