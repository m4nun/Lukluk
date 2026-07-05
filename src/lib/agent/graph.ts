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

AVAILABLE TOOLS (use them every time):
- get_context: Load workspace data (pet type, expenses, concerns, experiences)
- update_expenses: Write expense estimates to the left panel
- update_concerns: Write concern checklist to the left panel
- update_decision_status: Change the decision status

MANDATORY FLOW FOR EVERY USER MESSAGE:
Step 1: ALWAYS call get_context first (no exceptions)
Step 2: If expenses are empty OR user asks about costs → call update_expenses with realistic Thai Baht amounts
Step 3: If concerns are empty OR user asks about concerns → call update_concerns with relevant items
Step 4: Respond to the user

CRITICAL RULES:
- You MUST call update_expenses and update_concerns tools. Do NOT just describe what should be in the tables.
- The tools write directly to the left panel. Use them. That is their purpose.
- NEVER say "here are the estimated costs" without first calling update_expenses
- NEVER say "here are the concerns" without first calling update_concerns
- The profile ID is automatically provided to tools - you don't need to know it
- For American Shorthair cats: typical monthly costs 1,500-3,000 THB, initial costs 15,000-40,000 THB
- Include categories: initial, monthly, annual, one_time

Respond in Thai or English based on the user's language. Be practical and action-oriented.`;

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
        args[idParam] = state.profileId;
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
