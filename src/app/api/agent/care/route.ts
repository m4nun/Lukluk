import { runAgent } from "@/lib/agent/invoke";
import { createCareTools } from "@/lib/agent/care-tools";
import { CARE_SYSTEM_PROMPT } from "@/lib/agent/graph";
import { SupabasePlanningRepository } from "@/lib/agent/supabase-repo";

export async function POST(request: Request) {
  const body = await request.json();
  const { ownedProfileId, message } = body;

  const repo = new SupabasePlanningRepository();
  const tools = createCareTools(repo);

  const result = await runAgent({
    profileTable: "owned_pet_profiles",
    threadField: "owned_pet_profile_id",
    profileId: ownedProfileId,
    agentType: "care",
    systemPrompt: CARE_SYSTEM_PROMPT,
    tools,
    repo,
    idParam: "owned_profile_id",
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
