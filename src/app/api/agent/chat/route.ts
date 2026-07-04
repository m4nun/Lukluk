import { runAgent } from "@/lib/agent/invoke";
import { createAgentTools } from "@/lib/agent/tools";
import { DECISION_SYSTEM_PROMPT } from "@/lib/agent/graph";
import { SupabasePlanningRepository } from "@/lib/agent/supabase-repo";
import { SupabaseDraftStore } from "@/lib/agent/supabase-draft-store";
import { DraftPlanningRepository } from "@/lib/agent/draft-repo";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { planningProfileId, message } = body;

  // Need user_id for draft repo — get it before runAgent
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const realRepo = new SupabasePlanningRepository();
  const draftStore = new SupabaseDraftStore();
  const repo = new DraftPlanningRepository(
    realRepo,
    draftStore,
    userData.user?.id ?? "",
  );
  const tools = createAgentTools(repo);

  const result = await runAgent({
    profileTable: "planning_pet_profiles",
    threadField: "planning_pet_profile_id",
    profileId: planningProfileId,
    agentType: "decision",
    systemPrompt: DECISION_SYSTEM_PROMPT,
    tools,
    repo,
    idParam: "planning_profile_id",
    message,
  });

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({
    response: result.response,
    thread_id: result.thread_id,
  });
}
