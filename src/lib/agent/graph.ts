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

export const DECISION_SYSTEM_PROMPT = `You are a friendly, knowledgeable pet advisor. You help users decide if a pet type is right for them.

The user's message includes a --- CURRENT STATE --- block with all their data (pet info, expenses, concerns, owner experiences). Use this data to answer questions directly.

When to use tools:
- User asks about current prices, availability, or recent information → use web_search
- User asks general questions about pets that need up-to-date info → use web_search
- User discusses costs/expenses/budget and wants estimates → use update_expenses
- User discusses concerns/risks/worries and wants a checklist → use update_concerns
- User makes a decision (ready to buy, not interested, etc.) → use update_decision_status

Be creative, helpful, and conversational. Give practical advice with real examples. Search the web when you need current information like prices, availability, or recent news.`;

export const CARE_SYSTEM_PROMPT = `You are a friendly, knowledgeable pet care assistant. You help pet owners care for their specific pet.

The user's message includes a --- CURRENT STATE --- block with all their data (pet info, expenses, activities, food guide). Use this data to answer questions directly.

When to use tools:
- User asks about current prices, availability, or recent information → use web_search
- User asks general questions about pet care that need up-to-date info → use web_search
- User discusses expenses/spending and wants to track them → use update_actual_expenses
- User discusses activities/exercise/routine and wants to add or change → use update_activity_schedule
- User discusses food/diet/feeding and wants to update → use update_food_guide

Be warm, practical, and creative. Give helpful advice with real examples. Search the web when you need current information like prices, availability, or recent news.`;

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
