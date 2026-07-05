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

async function fetchDecisionContext(repo: PlanningRepository, profileId: string): Promise<string> {
  try {
    const profile = await repo.getProfile(profileId);
    if (!profile) return "";

    const [expenses, concerns, experiences] = await Promise.all([
      repo.getExpenses(profileId),
      repo.getConcerns(profileId),
      repo.getOwnerExperiences(profile.pet_type.id),
    ]);

    return `\n\n--- CURRENT STATE (auto-loaded, DO NOT ask user for IDs) ---\nPet: ${profile.pet_type.name} (${profile.pet_type.species})\nStatus: ${profile.decision_status}\nExpenses (${expenses.length} items): ${JSON.stringify(expenses)}\nConcerns (${concerns.length} items): ${JSON.stringify(concerns)}\nOwner experiences (${experiences.length}): ${JSON.stringify(experiences)}\n--- END STATE ---`;
  } catch {
    return "";
  }
}

async function fetchCareContext(repo: PlanningRepository, profileId: string): Promise<string> {
  try {
    const owned = await repo.getOwnedProfile(profileId);
    if (!owned) return "";

    const [expenses, schedule, foodGuide] = await Promise.all([
      repo.getActualExpenses(profileId),
      repo.getActivitySchedule(profileId),
      repo.getFoodGuide(profileId),
    ]);

    return `\n\n--- CURRENT STATE (auto-loaded, DO NOT ask user for IDs) ---\nPet: ${owned.pet_name} (${owned.pet_type.name}, ${owned.age_life_stage})\nExpenses (${expenses.length} items): ${JSON.stringify(expenses)}\nActivity schedule (${schedule.length} entries): ${JSON.stringify(schedule)}\nFood guide: ${JSON.stringify(foodGuide)}\n--- END STATE ---`;
  } catch {
    return "";
  }
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
    .eq("user_id", userData.user.id)
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

    const { data: newThread, error: insertError } = await supabase
      .from("agent_threads")
      .insert(insert)
      .select("thread_id")
      .single();

    if (insertError || !newThread) {
      return { error: `Failed to create agent thread: ${insertError?.message || "unknown"}`, status: 500 } as const;
    }
    thread = newThread;
  }

  const contextSnippet = config.agentType === "care"
    ? await fetchCareContext(config.repo, config.profileId)
    : await fetchDecisionContext(config.repo, config.profileId);

  const enrichedMessage = config.message + contextSnippet;

  const agent = createAgent({
    profileId: config.profileId,
    repo: config.repo,
    tools: config.tools,
    systemPrompt: config.systemPrompt,
    idParam: config.idParam,
  });

  let result = await agent.invoke({
    messages: [new HumanMessage(enrichedMessage)],
    profileId: config.profileId,
  });

  let aiMessages = result.messages.filter(
    (m) => m.constructor.name === "AIMessage",
  ) as AIMessage[];
  let lastAiMessage = aiMessages[aiMessages.length - 1];

  const calledTools = result.messages.some(
    (m) => m.constructor.name === "ToolMessage",
  );

  if (!calledTools) {
    const forcePrompt = config.agentType === "care"
      ? "If the user asked about expenses, activities, or food, you have tools available — use update_actual_expenses, update_activity_schedule, or update_food_guide as appropriate."
      : "If the user asked about costs or concerns, you have tools available — use update_expenses or update_concerns as appropriate.";

    result = await agent.invoke({
      messages: [
        new HumanMessage(enrichedMessage),
        lastAiMessage,
        new HumanMessage(forcePrompt),
      ],
      profileId: config.profileId,
    });

    aiMessages = result.messages.filter(
      (m) => m.constructor.name === "AIMessage",
    ) as AIMessage[];
    lastAiMessage = aiMessages[aiMessages.length - 1];
  }

  const responseText =
    typeof lastAiMessage?.content === "string"
      ? lastAiMessage.content
      : JSON.stringify(lastAiMessage?.content);

  return {
    response: responseText,
    thread_id: thread?.thread_id || "",
  };
}
