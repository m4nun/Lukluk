import { createClient } from "@/lib/supabase/server";
import { isSubscriber } from "@/lib/stripe/guard";
import { runAgent } from "@/lib/agent/invoke";
import { SupabasePlanningRepository } from "@/lib/agent/supabase-repo";
import { createAgentTools } from "@/lib/agent/tools";
import { DECISION_SYSTEM_PROMPT } from "@/lib/agent/graph";

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
  const { planningProfileId, message } = body;

  if (!planningProfileId || !message) {
    return Response.json({ error: "Missing planningProfileId or message" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("planning_pet_profiles")
    .select("id, user_id")
    .eq("id", planningProfileId)
    .eq("user_id", userData.user.id)
    .single();

  if (!profile) {
    return Response.json({ error: "Workspace not found" }, { status: 404 });
  }

  const repo = new SupabasePlanningRepository();
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

  return Response.json(result);
}
