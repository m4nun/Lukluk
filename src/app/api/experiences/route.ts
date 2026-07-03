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
  const { petTypeProfileId, title, body: text, hasOwned, ownershipDuration, petNameOrNumber } = body;

  const { data: experience, error } = await supabase
    .from("owner_experiences")
    .insert({
      user_id: userData.user.id,
      pet_type_profile_id: petTypeProfileId,
      title,
      body: text,
      has_owned: hasOwned ?? true,
      ownership_duration: ownershipDuration || null,
      pet_name_or_number: petNameOrNumber || null,
    })
    .select("id")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ id: experience!.id });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const petTypeProfileId = searchParams.get("petTypeProfileId");

  const supabase = await createClient();

  let query = supabase
    .from("owner_experiences")
    .select("*, profiles(display_name)")
    .order("created_at", { ascending: false });

  if (petTypeProfileId) {
    query = query.eq("pet_type_profile_id", petTypeProfileId);
  }

  const { data: experiences, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json(experiences);
}
