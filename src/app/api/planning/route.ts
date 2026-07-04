import { createClient } from "@/lib/supabase/server";
import { isSubscriber } from "@/lib/stripe/guard";

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

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const subscriber = await isSubscriber();
  if (!subscriber && process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "Subscription required" }, { status: 402 });
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
