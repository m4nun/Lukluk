import { createAgent } from "./graph";
import { createClient } from "@/lib/supabase/server";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import type { StructuredTool } from "@langchain/core/tools";
import type { PlanningRepository } from "./repository";

interface RunAgentConfig {
  profileTable: "planning_pet_profiles" | "owned_pet_profiles";
  threadField: "planning_pet_profile_id" | "owned_pet_profile_id";
  profileId: string;
  agentType: "decision" | "care";
  systemPrompt: string;
  tools: StructuredTool[];
  repo: PlanningRepository;
  idParam: string;
  message: string;
}

export async function runAgent(config: RunAgentConfig) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { error: "Not authenticated", status: 401 } as const;
  }

  const { data: profile } = await supabase
    .from(config.profileTable)
    .select("id, user_id")
    .eq("id", config.profileId)
    .single();

  if (!profile || profile.user_id !== userData.user.id) {
    return { error: "Not authorized", status: 403 } as const;
  }

  let { data: thread } = await supabase
    .from("agent_threads")
    .select("thread_id")
    .eq(config.threadField, config.profileId)
    .eq("agent_type", config.agentType)
    .single();

  if (!thread) {
    const threadId = crypto.randomUUID();
    const insert: Record<string, unknown> = {
      thread_id: threadId,
      agent_type: config.agentType,
    };
    insert[config.threadField] = config.profileId;
    if (config.threadField === "planning_pet_profile_id") {
      insert.owned_pet_profile_id = null;
    } else {
      insert.planning_pet_profile_id = null;
    }

    const { data: newThread } = await supabase
      .from("agent_threads")
      .insert(insert)
      .select("thread_id")
      .single();
    thread = newThread;
  }

  const agent = createAgent({
    profileId: config.profileId,
    repo: config.repo,
    tools: config.tools,
    systemPrompt: config.systemPrompt,
    idParam: config.idParam,
  });

  const result = await agent.invoke({
    messages: [new HumanMessage(config.message)],
    profileId: config.profileId,
  });

  const aiMessages = result.messages.filter(
    (m) => m.constructor.name === "AIMessage",
  ) as AIMessage[];
  const lastAiMessage = aiMessages[aiMessages.length - 1];
  const responseText =
    typeof lastAiMessage?.content === "string"
      ? lastAiMessage.content
      : JSON.stringify(lastAiMessage?.content);

  return {
    response: responseText,
    thread_id: thread!.thread_id,
  };
}
