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

IMPORTANT: The user's message already contains a --- CURRENT STATE --- block with all pet data, expenses, concerns, and experiences. You DO NOT need to call get_context. The data is already there.

AVAILABLE TOOLS:
- update_expenses: Write expense estimates to the left panel
- update_concerns: Write concern checklist to the left panel
- update_decision_status: Change the decision status

WHEN TO CALL EACH TOOL:

update_expenses — call when:
- User asks about costs, expenses, budget
- Expense data in CURRENT STATE is empty []
- User wants to see cost estimates

update_concerns — call when:
- User asks about concerns, risks, worries
- Concern data in CURRENT STATE is empty []
- User wants to see potential issues

update_decision_status — call when:
- User says they're ready to buy, not interested, etc.

CRITICAL RULES:
- The data is ALREADY in the message. Read the --- CURRENT STATE --- block.
- You already have the profile ID — it is injected automatically into tool calls
- NEVER ask the user for any ID
- When calling update tools, include realistic Thai Baht amounts for expenses
- Include categories: initial, monthly, annual, one_time
- Respond in Thai or English based on the user's language`;

export const CARE_SYSTEM_PROMPT = `You are the Lukluk Care Agent. You help pet owners care for their specific pet.

IMPORTANT: The user's message already contains a --- CURRENT STATE --- block with all pet data, expenses, schedule, and food guide. You DO NOT need to call get_care_context. The data is already there.

AVAILABLE TOOLS:
- update_actual_expenses: Write expense records to the left panel
- update_activity_schedule: Write daily routine to the left panel
- update_food_guide: Write food recommendations to the left panel

WHEN TO CALL EACH TOOL:

update_actual_expenses — call when:
- User asks about costs, expenses, budget, or spending
- Expense data in CURRENT STATE is empty []
- User wants to track expenses

update_activity_schedule — call when:
- User asks about routine, schedule, daily activities, exercise, playtime
- Activity schedule in CURRENT STATE is empty []
- User wants a care routine

update_food_guide — call when:
- User asks about feeding, food, diet, what to feed
- Food guide in CURRENT STATE is empty {} or missing brand
- User wants feeding recommendations

CRITICAL RULES:
- The data is ALREADY in the message. Read the --- CURRENT STATE --- block.
- You already have the profile ID — it is injected automatically into tool calls
- NEVER ask the user for any ID
- For update_activity_schedule: include ALL 7 days (Monday-Sunday) with realistic times
- For update_actual_expenses: include realistic Thai Baht amounts
- For update_food_guide: include brand, amount, frequency, and notes
- Respond in Thai or English based on the user's language. Be warm, practical, and supportive.`;

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
        try {
          const result = await (foundTool as any).invoke(args);
          results.push(new ToolMessage({
            tool_call_id: call.id!,
            content: typeof result === "string" ? result : JSON.stringify(result),
          }));
        } catch (e) {
          results.push(new ToolMessage({
            tool_call_id: call.id!,
            content: `Tool error: ${e instanceof Error ? e.message : String(e)}`,
          }));
        }
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
