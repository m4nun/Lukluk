import { createAgent, CARE_SYSTEM_PROMPT } from "@/lib/agent/graph";
import { createCareTools } from "@/lib/agent/care-tools";
import { SupabasePlanningRepository } from "@/lib/agent/supabase-repo";
import { createClient } from "@/lib/supabase/server";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

export async function POST(request: Request) {
  const body = await request.json();
  const { ownedProfileId, message } = body;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: owned } = await supabase
    .from("owned_pet_profiles")
    .select("id, user_id")
    .eq("id", ownedProfileId)
    .single();

  if (!owned || owned.user_id !== userData.user.id) {
    return Response.json({ error: "Not authorized" }, { status: 403 });
  }

  let { data: thread } = await supabase
    .from("agent_threads")
    .select("thread_id")
    .eq("owned_pet_profile_id", ownedProfileId)
    .eq("agent_type", "care")
    .single();

  if (!thread) {
    const threadId = crypto.randomUUID();
    const { data: newThread } = await supabase
      .from("agent_threads")
      .insert({
        planning_pet_profile_id: null as unknown as string,
        owned_pet_profile_id: ownedProfileId,
        thread_id: threadId,
        agent_type: "care",
      })
      .select("thread_id")
      .single();
    thread = newThread;
  }

  const repo = new SupabasePlanningRepository();
  const tools = createCareTools(repo);
  const agent = createAgent({
    profileId: ownedProfileId,
    repo,
    tools,
    systemPrompt: CARE_SYSTEM_PROMPT,
    idParam: "owned_profile_id",
  });

  const result = await agent.invoke({
    messages: [new HumanMessage(message)],
    profileId: ownedProfileId,
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
