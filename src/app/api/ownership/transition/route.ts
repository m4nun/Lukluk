import { createClient } from "@/lib/supabase/server";
import { requireSubscriber } from "@/lib/stripe/guard";

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
  const { planningProfileId, petName, ageLifeStage, gotDate } = body;

  // Verify ownership of planning profile
  const { data: planning } = await supabase
    .from("planning_pet_profiles")
    .select("id, user_id, pet_type_profile_id")
    .eq("id", planningProfileId)
    .single();

  if (!planning || planning.user_id !== userData.user.id) {
    return Response.json({ error: "Not authorized" }, { status: 403 });
  }

  // Validate required fields
  if (!petName || !ageLifeStage) {
    return Response.json({ error: "Pet name and age/life stage are required" }, { status: 400 });
  }

  // Create owned profile
  const { data: owned } = await supabase
    .from("owned_pet_profiles")
    .insert({
      user_id: userData.user.id,
      planning_pet_profile_id: planningProfileId,
      pet_type_profile_id: planning.pet_type_profile_id,
      pet_name: petName,
      age_life_stage: ageLifeStage,
      got_date: gotDate || null,
      got_date_unknown: !gotDate,
    })
    .select("id")
    .single();

  // Update planning profile
  await supabase
    .from("planning_pet_profiles")
    .update({
      has_ownership: true,
      owned_pet_profile_id: owned!.id,
      decision_status: "already_have",
    })
    .eq("id", planningProfileId);

  // Update agent thread to care agent
  await supabase
    .from("agent_threads")
    .update({
      owned_pet_profile_id: owned!.id,
      agent_type: "care",
    })
    .eq("planning_pet_profile_id", planningProfileId);

  return Response.json({ ownedProfileId: owned!.id });
}
