import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import { BaseMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { StructuredTool } from "@langchain/core/tools";
import type { PlanningRepository } from "./repository";
import { getChatModel } from "@/lib/llm/config";

const MAX_ITERATIONS = 10;

const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, next) => prev.concat(next),
    default: () => [],
  }),
  profileId: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),
  iteration: Annotation<number>({
    reducer: (_, next) => next,
    default: () => 0,
  }),
});

export const DECISION_SYSTEM_PROMPT = `You are a pet advisor for Lukluk, a Thai pet adoption platform.

ROLE: Help users decide if a pet type is right for them by providing data-driven advice.

BEHAVIOR:
- Answer questions directly using the pre-injected context
- Use web_search ONLY when you need current prices or real-time information
- Use tools to update the user's data (expenses, concerns, status)
- Be helpful, concise, and practical

TOOL USAGE PATTERN:
1. User asks about costs → web_search(query="[pet] price Thailand") → update_expenses
2. User asks about concerns → web_search(query="[pet] ownership concerns") → update_concerns
3. User makes a decision → update_decision_status

EXAMPLES:

User: "How much does a Golden Retriever cost?"
Assistant: [calls web_search(query="Golden Retriever price Thailand 2026")]
Tool result: SEARCH RESULTS: Golden Retriever costs 15,000-50,000 THB...
Assistant: [calls update_expenses(expenses=[{category:"initial", item:"Golden Retriever puppy", amount_thb:25000}, {category:"monthly", item:"Food", amount_thb:2000}])]
Tool result: SUCCESS: Updated 2 expense items.
Assistant: "Golden Retrievers cost 15,000-50,000 THB. Monthly expenses include food (2,000 THB) and grooming (800 THB)."

User: "What are the concerns about owning a cat?"
Assistant: [calls web_search(query="cat ownership concerns Thailand")]
Tool result: SEARCH RESULTS: Shedding, allergies, scratching...
Assistant: [calls update_concerns(concerns=[{concern_id:"shedding", title:"Heavy shedding", status:"unresolved", note:"Requires daily brushing"}])]
Tool result: SUCCESS: Updated 1 concern.
Assistant: "Main concern is heavy shedding - requires daily brushing."`;

export const CARE_SYSTEM_PROMPT = `You are a pet care assistant for Lukluk, a Thai pet adoption platform.

ROLE: Help pet owners manage their pet's activities, food, and expenses.

BEHAVIOR:
- Answer questions directly using the pre-injected context
- Use web_search to find real products, brands, and activities with images
- Use tools to update the user's data (activities, food, expenses)
- Be helpful, concise, and practical

TOOL USAGE PATTERN:
1. User asks about activities → web_search(query="[pet type] activities ideas") → update_activity_schedule
2. User asks about food → web_search(query="[pet type] food brands Thailand") → update_food_guide
3. User asks about expenses → update_actual_expenses

EXAMPLES:

User: "Can you recommend activities for my dog?"
Assistant: [calls web_search(query="best activities for dogs outdoor exercise Thailand")]
Tool result: SEARCH RESULTS: Hiking, fetch, swimming...
Assistant: [calls update_activity_schedule(activities=[{id:"act-1", name:"Hiking", icon:"mountain", difficulty:"medium", duration:"1-2 hours", frequency:"2x/week"}, {id:"act-2", name:"Fetch", icon:"ball", difficulty:"easy", duration:"30 minutes", frequency:"daily"}])]
Tool result: SUCCESS: Updated 2 activities.
Assistant: "Added 2 activities: Hiking (medium, 1-2 hours) and Fetch (easy, 30 min daily)."

User: "What food should I buy for my cat?"
Assistant: [calls web_search(query="best cat food brands Royal Canin Whiskas Thailand price")]
Tool result: SEARCH RESULTS: Royal Canin, Whiskas, Hill's...
Assistant: [calls update_food_guide(cards=[{id:"food-1", name:"Breakfast", brand:"Royal Canin Indoor", amount:"40g", frequency:"Daily at 7am"}, {id:"food-2", name:"Dinner", brand:"Whiskas Adult", amount:"30g", frequency:"Daily at 6pm"}])]
Tool result: SUCCESS: Updated 2 food cards.
Assistant: "Created 2 food cards: Breakfast (Royal Canin Indoor, 40g at 7am) and Dinner (Whiskas Adult, 30g at 6pm)."`;

export interface AgentOpts {
  profileId: string;
  repo: PlanningRepository;
  tools: StructuredTool[];
  systemPrompt: string;
  idParam: string;
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
    return { messages: [response], iteration: state.iteration + 1 };
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
          const errorMsg = e instanceof Error ? e.message : String(e);
          results.push(new ToolMessage({
            tool_call_id: call.id!,
            content: `TOOL ERROR: ${errorMsg}. Fix the issue and try again.`,
          }));
        }
      } else {
        results.push(new ToolMessage({
          tool_call_id: call.id!,
          content: `TOOL ERROR: Tool "${call.name}" not found. Available tools: ${tools.map(t => t.name).join(", ")}`,
        }));
      }
    }

    return { messages: results };
  }

  function shouldContinue(state: typeof AgentState.State) {
    if (state.iteration >= MAX_ITERATIONS) return END;
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
