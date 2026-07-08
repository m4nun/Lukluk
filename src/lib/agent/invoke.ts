import { createAgent, type ProgressEvent } from "./graph";
import { createClient } from "@/lib/supabase/server";
import { HumanMessage, AIMessage, ToolMessage, BaseMessage } from "@langchain/core/messages";
import type { StructuredTool } from "@langchain/core/tools";
import type { PlanningRepository } from "./repository";
import { createSupabaseThreadStore, type ThreadStore } from "./thread-store";

export type { ThreadStore } from "./thread-store";

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
  /** Override for testing; defaults to Supabase-backed store. */
  threadStore?: ThreadStore;
}

export interface AgentStep {
  type: "thinking" | "tool_call" | "tool_result" | "response";
  content: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
}

// ── Context builders ──

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

// ── Message serialisation ──

export function serializeMessages(messages: BaseMessage[]): unknown[] {
  return messages.map((msg) => {
    if (msg.constructor.name === "HumanMessage") {
      return { type: "human", content: msg.content };
    }
    if (msg.constructor.name === "AIMessage") {
      const aiMsg = msg as AIMessage;
      return {
        type: "ai",
        content: aiMsg.content,
        tool_calls: aiMsg.tool_calls?.map((tc) => ({
          id: tc.id,
          name: tc.name,
          args: tc.args,
        })) || [],
      };
    }
    if (msg.constructor.name === "ToolMessage") {
      const toolMsg = msg as ToolMessage;
      return {
        type: "tool",
        content: toolMsg.content,
        tool_call_id: toolMsg.tool_call_id,
        name: toolMsg.name,
      };
    }
    return { type: "unknown", content: String(msg.content) };
  });
}

export function deserializeMessages(data: unknown[]): BaseMessage[] {
  if (!Array.isArray(data)) return [];
  return data.map((msg: any) => {
    switch (msg.type) {
      case "human": return new HumanMessage(msg.content);
      case "ai": return new AIMessage({ content: msg.content, tool_calls: msg.tool_calls || [] });
      case "tool": return new ToolMessage({ content: msg.content, tool_call_id: msg.tool_call_id, name: msg.name });
      default: return new HumanMessage(String(msg.content));
    }
  });
}

// ── Step extraction ──

function extractSteps(messages: (AIMessage | ToolMessage)[]): AgentStep[] {
  const steps: AgentStep[] = [];
  for (const msg of messages) {
    const isAi = msg.constructor.name === "AIMessage";
    const isTool = msg.constructor.name === "ToolMessage";
    if (isAi && "tool_calls" in msg && (msg as AIMessage).tool_calls?.length) {
      for (const call of (msg as AIMessage).tool_calls!) {
        steps.push({ type: "tool_call", content: `Calling ${call.name}`, toolName: call.name, toolArgs: call.args as Record<string, unknown> });
      }
    }
    if (isTool) {
      const toolMsg = msg as unknown as ToolMessage;
      steps.push({ type: "tool_result", content: typeof toolMsg.content === "string" ? toolMsg.content : JSON.stringify(toolMsg.content), toolName: toolMsg.name });
    }
    if (msg.content && !(isAi && "tool_calls" in msg && (msg as AIMessage).tool_calls?.length) && !isTool) {
      const text = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
      if (text.trim()) steps.push({ type: "response", content: text });
    }
  }
  return steps;
}

// ── Response resolution (pure function, testable in isolation) ──

export function resolveResponseText(messages: BaseMessage[]): string {
  const allAiMessages = messages.filter(m => m.constructor.name === "AIMessage") as AIMessage[];

  // Strategy 1: last AI message with text (no tool calls)
  for (let i = allAiMessages.length - 1; i >= 0; i--) {
    const msg = allAiMessages[i];
    if (msg.tool_calls?.length) continue;
    if (typeof msg.content === "string" && msg.content.trim()) return msg.content;
    if (Array.isArray(msg.content)) {
      const parts = msg.content.filter((p: any) => p.type === "text" && p.text?.trim()).map((p: any) => p.text);
      if (parts.length) return parts.join("\n");
    }
  }

  // Strategy 2: any non-tool message with text
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.constructor.name === "ToolMessage" || !msg.content) continue;
    const text = typeof msg.content === "string" ? msg.content : Array.isArray(msg.content) ? msg.content.filter((p: any) => p.type === "text").map((p: any) => p.text).join("\n") : "";
    if (text.trim() && !text.includes("TOOL ERROR")) return text;
  }

  // Strategy 3: last non-error tool result
  const toolMessages = messages.filter(m => m.constructor.name === "ToolMessage") as ToolMessage[];
  const toolResults = toolMessages.map(m => typeof m.content === "string" ? m.content : JSON.stringify(m.content)).filter(c => c.trim() && !c.includes("TOOL ERROR"));
  if (toolResults.length) return toolResults[toolResults.length - 1];

  // Strategy 4: ultimate fallback
  return "I've processed your request. Let me know if you need anything else!";
}

// ── Main entry point ──

export async function runAgent(config: RunAgentConfig) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Not authenticated", status: 401 } as const;

  const { data: profile } = await supabase
    .from(config.profileTable)
    .select("id, user_id")
    .eq("id", config.profileId)
    .eq("user_id", userData.user.id)
    .single();

  if (!profile || profile.user_id !== userData.user.id) {
    return { error: "Not authorized", status: 403 } as const;
  }

  const store = config.threadStore ?? createSupabaseThreadStore();
  const thread = await store.findOrCreate({
    profileId: config.profileId,
    threadField: config.threadField,
    agentType: config.agentType,
  });

  const contextSnippet = config.agentType === "care"
    ? await fetchCareContext(config.repo, config.profileId)
    : await fetchDecisionContext(config.repo, config.profileId);

  const previousMessages = deserializeMessages(thread.messages || []);
  const newHumanMessage = new HumanMessage(config.message + contextSnippet);

  const agent = createAgent({
    profileId: config.profileId,
    repo: config.repo,
    tools: config.tools,
    systemPrompt: config.systemPrompt,
    idParam: config.idParam,
    onProgress: config.onProgress,
  });

  const result = await agent.invoke({
    messages: [...previousMessages, newHumanMessage],
    profileId: config.profileId,
    iteration: 0,
  });

  await store.save(thread.thread_id, result.messages);

  return {
    response: resolveResponseText(result.messages),
    steps: extractSteps(result.messages.filter(
      (m) => m.constructor.name === "AIMessage" || m.constructor.name === "ToolMessage",
    ) as (AIMessage | ToolMessage)[]),
    thread_id: thread.thread_id,
  };
}
