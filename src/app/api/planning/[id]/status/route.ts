import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { status } = body;

  const validStatuses = ["exploring", "considering", "ready_to_buy", "not_a_fit", "already_have"];
  if (!status || !validStatuses.includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const { error } = await supabase
    .from("planning_pet_profiles")
    .update({ decision_status: status })
    .eq("id", id)
    .eq("user_id", userData.user.id);

  if (error) {
    return Response.json({ error: "Failed to update status" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
