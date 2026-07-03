import { getPendingDrafts, confirmDraft, rejectDraft } from "@/lib/agent/draft-repo";
import { SupabaseDraftStore } from "@/lib/agent/supabase-draft-store";
import { createClient } from "@/lib/supabase/server";

// GET: list pending drafts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const planningProfileId = searchParams.get("planningProfileId");
  if (!planningProfileId) {
    return Response.json({ error: "planningProfileId required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const drafts = new SupabaseDraftStore();
  const items = await getPendingDrafts(planningProfileId, drafts);
  return Response.json(items);
}

// POST: confirm or reject
export async function POST(request: Request) {
  const body = await request.json();
  const { draftId, action } = body;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const drafts = new SupabaseDraftStore();

  try {
    if (action === "confirm") {
      await confirmDraft(draftId, drafts);
    } else if (action === "reject") {
      await rejectDraft(draftId, drafts);
    }
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Error" }, { status: 400 });
  }
}
