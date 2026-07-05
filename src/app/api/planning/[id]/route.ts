import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Verify ownership before deleting
  const { data: profile, error: fetchError } = await supabase
    .from("planning_pet_profiles")
    .select("id, user_id")
    .eq("id", id)
    .single();

  if (fetchError || !profile) {
    return Response.json({ error: "Profile not found" }, { status: 404 });
  }

  if (profile.user_id !== userData.user.id) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Soft delete — set is_active to false
  const { error: deleteError } = await supabase
    .from("planning_pet_profiles")
    .update({ is_active: false })
    .eq("id", id);

  if (deleteError) {
    return Response.json({ error: deleteError.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
