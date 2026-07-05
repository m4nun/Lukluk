import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { concern_id, status } = body;

  if (!concern_id || !status) {
    return Response.json({ error: "Missing concern_id or status" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("planning_pet_profiles")
    .select("id, user_id, concern_checklist")
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .single();

  if (!profile) {
    return Response.json({ error: "Workspace not found" }, { status: 404 });
  }

  const checklist = (profile.concern_checklist as Array<{
    concern_id: string;
    title: string;
    status: string;
    note?: string;
    resolved_at?: string;
  }>) || [];

  const updated = checklist.map((c) =>
    c.concern_id === concern_id
      ? {
          ...c,
          status,
          resolved_at: status === "resolved" ? new Date().toISOString() : c.resolved_at,
        }
      : c
  );

  const { error } = await supabase
    .from("planning_pet_profiles")
    .update({ concern_checklist: updated })
    .eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, concerns: updated });
}
