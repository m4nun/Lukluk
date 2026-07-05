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
    .select("*, pet_type_profiles(id, name, species, mbti_label, description)")
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .single();

  if (error || !profile) {
    return Response.json({ error: "Owned profile not found" }, { status: 404 });
  }

  return Response.json(profile);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.pet_name !== undefined) updates.pet_name = body.pet_name;
  if (body.age_life_stage !== undefined) updates.age_life_stage = body.age_life_stage;

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("owned_pet_profiles")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userData.user.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { error } = await supabase
    .from("owned_pet_profiles")
    .delete()
    .eq("id", id)
    .eq("user_id", userData.user.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
