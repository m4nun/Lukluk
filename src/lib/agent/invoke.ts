import { createAgent, type ProgressEvent } from "./graph";
import { createClient } from "@/lib/supabase/server";
import { HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
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
  onProgress?: (event: ProgressEvent) => void;
}

export interface AgentStep {
  type: "thinking" | "tool_call" | "tool_result" | "response";
  content: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
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

    const [expenses, foodGuide, schedule, healthMetrics] = await Promise.all([
      repo.getActualExpenses(profileId),
      repo.getFoodGuide(profileId),
      repo.getSchedule(profileId),
      repo.getHealthMetrics(profileId),
    ]);

    return `\n\n--- CURRENT STATE (auto-loaded, DO NOT ask user for IDs) ---\nPet: ${owned.pet_name} (${owned.pet_type.name}, ${owned.age_life_stage})\nExpenses (${expenses.length} items): ${JSON.stringify(expenses)}\nFood guide: ${JSON.stringify(foodGuide)}\nSchedule (${schedule.length} events): ${JSON.stringify(schedule)}\nHealth metrics (${healthMetrics.length} records): ${JSON.stringify(healthMetrics)}\n--- END STATE ---`;
  } catch {
    return "";
  }
}

function extractSteps(messages: (AIMessage | ToolMessage)[]): AgentStep[] {
  const steps: AgentStep[] = [];

  for (const msg of messages) {
    const isAi = msg.constructor.name === "AIMessage";
    const isTool = msg.constructor.name === "ToolMessage";

    if (isAi && "tool_calls" in msg && (msg as AIMessage).tool_calls?.length) {
      const aiMsg = msg as AIMessage;
      for (const call of aiMsg.tool_calls ?? []) {
        steps.push({
          type: "tool_call",
          content: `Calling ${call.name}`,
          toolName: call.name,
          toolArgs: call.args as Record<string, unknown>,
        });
      }
    }

    if (isTool) {
      const toolMsg = msg as unknown as ToolMessage;
      steps.push({
        type: "tool_result",
        content: typeof toolMsg.content === "string" ? toolMsg.content : JSON.stringify(toolMsg.content),
        toolName: toolMsg.name,
      });
    }

    if (msg.content && !(isAi && "tool_calls" in msg && (msg as AIMessage).tool_calls?.length) && !isTool) {
      const text = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
      if (text.trim()) {
        steps.push({
          type: "response",
          content: text,
        });
      }
    }
  }

  return steps;
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
    onProgress: config.onProgress,
  });

  let result = await agent.invoke({
    messages: [new HumanMessage(enrichedMessage)],
    profileId: config.profileId,
    iteration: 0,
  });

  const calledTools = result.messages.some(
    (m) => m.constructor.name === "ToolMessage",
  );

  if (!calledTools) {
    const forcePrompt = config.agentType === "care"
      ? `The user asked: "${config.message}"

You MUST use tools. Do NOT just give text advice.

STEP 1: Call web_search to find information about what the user asked.
STEP 2: Call update_food_guide, update_schedule, update_actual_expenses, or add_health_metric to create/update cards with the results.

Call web_search NOW with a relevant query.`
      : `The user asked: "${config.message}"

You MUST use tools. Do NOT just give text advice.

STEP 1: Call web_search to find information about what the user asked.
STEP 2: Call update_expenses or update_concerns to update their data.

Call web_search NOW with a relevant query.`;

    result = await agent.invoke({
      messages: [
        new HumanMessage(enrichedMessage),
        result.messages[result.messages.length - 1],
        new HumanMessage(forcePrompt),
      ],
      profileId: config.profileId,
      iteration: result.iteration || 1,
    });
  }

  // Extract the final text response from the last AI message
  let responseText = "";
  const allAiMessages = result.messages.filter(
    (m) => m.constructor.name === "AIMessage",
  ) as AIMessage[];

  // Get the last AI message that has actual text content (not just tool calls)
  for (let i = allAiMessages.length - 1; i >= 0; i--) {
    const msg = allAiMessages[i];
    const hasToolCalls = msg.tool_calls?.length;

    if (!hasToolCalls && msg.content) {
      if (typeof msg.content === "string") {
        responseText = msg.content;
      } else if (Array.isArray(msg.content)) {
        // Handle array content format from some models
        const textParts = msg.content
          .filter((p: any) => p.type === "text")
          .map((p: any) => p.text);
        responseText = textParts.join("\n");
      } else {
        responseText = JSON.stringify(msg.content);
      }
      break;
    }
  }

  // Fallback: if no text response found, use the last AI message content
  if (!responseText && allAiMessages.length > 0) {
    const lastMsg = allAiMessages[allAiMessages.length - 1];
    if (typeof lastMsg.content === "string") {
      responseText = lastMsg.content;
    } else if (Array.isArray(lastMsg.content)) {
      const textParts = lastMsg.content
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text);
      responseText = textParts.join("\n");
    }
  }

  const steps = extractSteps(result.messages.filter(
    (m) => m.constructor.name === "AIMessage" || m.constructor.name === "ToolMessage",
  ) as (AIMessage | ToolMessage)[]);

  return {
    response: responseText,
    steps,
    thread_id: thread?.thread_id || "",
  };
}
