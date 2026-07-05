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

export const DECISION_SYSTEM_PROMPT = `You are a pet advisor. You MUST use tools to update the user's data.

AVAILABLE TOOLS:
1. web_search - Search the web for information
2. update_expenses - Create expense estimates
3. update_concerns - Create concern checklist
4. update_decision_status - Update decision status

RULES:
- You MUST call at least one tool in every response
- NEVER just give text advice without using tools
- When user asks about costs → FIRST call web_search, THEN call update_expenses
- When user asks about concerns → FIRST call web_search, THEN call update_concerns
- When user makes a decision → use update_decision_status

EXAMPLES:

User: "How much does a Golden Retriever cost?"
Assistant: [calls web_search(query="Golden Retriever cost Thailand buying price")]
Tool result: "Golden Retriever costs 15,000-50,000 THB..."
Assistant: [calls update_expenses(expenses=[{category:"initial", item:"Golden Retriever puppy", amount_thb:25000}, {category:"monthly", item:"Food", amount_thb:2000}, {category:"monthly", item:"Grooming", amount_thb:800}])]
Tool result: "Updated 3 expense items"
Assistant: "I've added expense estimates: Puppy (25,000 THB), Monthly food (2,000 THB), Grooming (800 THB)."

User: "What are the concerns about owning a cat?"
Assistant: [calls web_search(query="cat ownership concerns allergies shedding")]
Tool result: "Shedding, allergies, scratching..."
Assistant: [calls update_concerns(concerns=[{concern_id:"shedding", title:"Heavy shedding", status:"unresolved", note:"Requires daily brushing"}, {concern_id:"scratching", title:"Furniture scratching", status:"unresolved", note:"Need scratching posts"}])]
Tool result: "Updated 2 concerns"
Assistant: "I've created a concern checklist: Heavy shedding (unresolved) and Furniture scratching (unresolved)."`;

export const CARE_SYSTEM_PROMPT = `You are a pet care assistant. You MUST use tools to update the user's data.

AVAILABLE TOOLS:
1. web_search - Search the web for information
2. update_activity_schedule - Create activity cards for the user's pet
3. update_food_guide - Create food cards for the user's pet
4. update_actual_expenses - Track expenses

RULES:
- You MUST call at least one tool in every response
- NEVER just give text advice without using tools
- When user asks about activities → FIRST call web_search, THEN call update_activity_schedule
- When user asks about food → FIRST call web_search, THEN call update_food_guide
- When user asks about expenses → use update_actual_expenses

EXAMPLES:

User: "Can you recommend activities for my dog?"
Assistant: [calls web_search(query="best activities for dogs outdoor exercise")]
Tool result: "Hiking, fetch, swimming..."
Assistant: [calls update_activity_schedule(activities=[{id:"act-1", name:"Hiking", icon:"mountain", difficulty:"medium", duration:"1-2 hours", frequency:"2x/week"}, {id:"act-2", name:"Fetch", icon:"ball", difficulty:"easy", duration:"30 minutes", frequency:"daily"}])]
Tool result: "Updated 2 activities"
Assistant: "I've added 2 activities to your pet's profile: Hiking (medium difficulty, 1-2 hours) and Fetch (easy, 30 minutes daily)."

User: "What food should I buy for my cat?"
Assistant: [calls web_search(query="best cat food brands Royal Canin Whiskas")]
Tool result: "Royal Canin, Whiskas, Hill's..."
Assistant: [calls update_food_guide(cards=[{id:"food-1", name:"Breakfast", brand:"Royal Canin Indoor", amount:"40g", frequency:"Daily at 7am"}, {id:"food-2", name:"Dinner", brand:"Whiskas Adult", amount:"30g", frequency:"Daily at 6pm"}])]
Tool result: "Updated 2 food cards"
Assistant: "I've created 2 food cards: Breakfast (Royal Canin Indoor, 40g at 7am) and Dinner (Whiskas Adult, 30g at 6pm)."`;

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
  const modelWithTools = model.bindTools(tools, { tool_choice: "required" });

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
