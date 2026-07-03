import { createAgent, DECISION_SYSTEM_PROMPT } from "@/lib/agent/graph";
import { createAgentTools } from "@/lib/agent/tools";
import { SupabasePlanningRepository } from "@/lib/agent/supabase-repo";
import { SupabaseDraftStore } from "@/lib/agent/supabase-draft-store";
import { DraftPlanningRepository } from "@/lib/agent/draft-repo";
import { createClient } from "@/lib/supabase/server";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

export async function POST(request: Request) {
  const body = await request.json();
  const { planningProfileId, message } = body;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: planning } = await supabase
    .from("planning_pet_profiles")
    .select("id, user_id")
    .eq("id", planningProfileId)
    .single();

  if (!planning || planning.user_id !== userData.user.id) {
    return Response.json({ error: "Not authorized" }, { status: 403 });
  }

  let { data: thread } = await supabase
    .from("agent_threads")
    .select("thread_id")
    .eq("planning_pet_profile_id", planningProfileId)
    .eq("agent_type", "decision")
    .single();

  if (!thread) {
    const threadId = crypto.randomUUID();
    const { data: newThread } = await supabase
      .from("agent_threads")
      .insert({
        planning_pet_profile_id: planningProfileId,
        thread_id: threadId,
        agent_type: "decision",
      })
      .select("thread_id")
      .single();
    thread = newThread;
  }

  const realRepo = new SupabasePlanningRepository();
  const draftStore = new SupabaseDraftStore();
  const repo = new DraftPlanningRepository(realRepo, draftStore, userData.user.id);
  const tools = createAgentTools(repo);
  const agent = createAgent({
    profileId: planningProfileId,
    repo,
    tools,
    systemPrompt: DECISION_SYSTEM_PROMPT,
    idParam: "planning_profile_id",
  });

  const result = await agent.invoke({
    messages: [new HumanMessage(message)],
    profileId: planningProfileId,
  });

  const aiMessages = result.messages.filter((m) => m.constructor.name === "AIMessage") as AIMessage[];
  const lastAiMessage = aiMessages[aiMessages.length - 1];
  const responseText = typeof lastAiMessage?.content === "string"
    ? lastAiMessage.content
    : JSON.stringify(lastAiMessage?.content);

  return Response.json({
    response: responseText,
    thread_id: thread!.thread_id,
  });
}
