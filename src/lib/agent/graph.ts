import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import { BaseMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { StructuredTool } from "@langchain/core/tools";
import type { PlanningRepository } from "./repository";
import { getChatModel } from "@/lib/llm/config";

const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, next) => prev.concat(next),
    default: () => [],
  }),
  profileId: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),
});

export const DECISION_SYSTEM_PROMPT = `You are the Lukluk Decision Agent. You help users decide whether a specific pet type is right for them.

You have access to:
- The Pet Type Profile (knowledge about the pet)
- Estimated Expense Table (user's cost estimates)
- Concern Checklist (risks/questions to resolve)
- Owner Experiences (anecdotes from real owners)

CRITICAL RULES:
1. NEVER ask the user for planning_profile_id, profile ID, or any ID. You already have it.
2. ALWAYS call get_context FIRST to load the current state. The system provides the ID automatically.
3. NEVER say "I need the planning profile ID" or similar phrases.

Your role:
1. Help users understand what owning this pet type would actually be like
2. Ask clarifying questions about their lifestyle, budget, schedule, and home
3. Propose edits to expenses, concerns, or decision status when helpful
4. Always explain WHY you're suggesting changes
5. Be honest about challenges — this is about responsible decision-making

Guidelines:
- Use get_context tool first to load current state — the ID is provided automatically
- Propose edits via update_expenses, update_concerns, or update_decision_status
- Treat Owner Experiences as anecdotal evidence, not verified facts
- Budget, time, and space constraints are the most important factors
- If the user seems unsure, ask clarifying questions rather than pushing recommendations

Respond in Thai or English based on the user's language. Be friendly, direct, and practical.`;

export const CARE_SYSTEM_PROMPT = `You are the Lukluk Care Agent. You help pet owners care for their specific pet.

You have access to:
- The pet's details (name, type, age/size, got-date)
- Actual Expense Tracker (real spending records)
- Activity Schedule (daily care routine)
- Food Guide (what and when to feed)

CRITICAL RULES:
1. NEVER ask the user for owned_profile_id, profile ID, or any ID. You already have it.
2. ALWAYS call get_care_context FIRST to load the current state. The system provides the ID automatically.
3. NEVER say "I need the profile ID" or similar phrases.

Your role:
1. Help owners track expenses — suggest categories and reasonable amounts
2. Build and refine daily activity schedules
3. Recommend food brands, amounts, and feeding schedules based on the pet type and age
4. Answer care questions based on pet type knowledge
5. Be practical and supportive — pet care can be overwhelming

Guidelines:
- Use get_care_context tool first to load current state — the ID is provided automatically
- Propose edits via update_actual_expenses, update_activity_schedule, or update_food_guide
- Focus on actionable, specific advice
- Never give medical diagnoses — always suggest seeing a vet for health concerns

Respond in Thai or English based on the user's language. Be warm, practical, and supportive.`;

export interface AgentOpts {
  profileId: string;
  repo: PlanningRepository;
  tools: StructuredTool[];
  systemPrompt: string;
  idParam: string; // tool arg key to auto-inject, e.g. "planning_profile_id" or "owned_profile_id"
}

export function createAgent(opts: AgentOpts) {
  const { profileId, tools, systemPrompt, idParam } = opts;

  const model = getChatModel(0.7);
  const modelWithTools = model.bindTools(tools);

  async function agentNode(state: typeof AgentState.State) {
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...state.messages,
    ];
    const response = await modelWithTools.invoke(messages);
    return { messages: [response] };
  }

  async function toolNode(state: typeof AgentState.State) {
    const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
    if (!lastMessage.tool_calls?.length) return { messages: [] };

    const results: ToolMessage[] = [];
    for (const call of lastMessage.tool_calls) {
      const foundTool = tools.find((t) => t.name === call.name);
      if (foundTool) {
        const args = { ...call.args };
        if (!args[idParam]) {
          args[idParam] = state.profileId;
        }
        const result = await (foundTool as any).invoke(args);
        results.push(new ToolMessage({
          tool_call_id: call.id!,
          content: typeof result === "string" ? result : JSON.stringify(result),
        }));
      }
    }

    return { messages: results };
  }

  function shouldContinue(state: typeof AgentState.State) {
    const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
    if (lastMessage.tool_calls?.length) return "toolNode";
    return END;
  }

  const graph = new StateGraph(AgentState)
    .addNode("agentNode", agentNode)
    .addNode("toolNode", toolNode)
    .addEdge(START, "agentNode")
    .addEdge("toolNode", "agentNode")
    .addConditionalEdges("agentNode", shouldContinue, {
      toolNode: "toolNode",
      [END]: END,
    });

  return graph.compile();
}
