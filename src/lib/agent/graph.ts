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

User: "How much does a Golden Gentleman cost?"
Assistant: [calls web_search(query="Golden Gentleman price Thailand 2026")]
Tool result: SEARCH RESULTS: Golden Gentleman costs 15,000-50,000 THB...
Assistant: [calls update_expenses(expenses=[{category:"initial", item:"Golden Gentleman puppy", amount_thb:25000}, {category:"monthly", item:"Food", amount_thb:2000}])]
Tool result: SUCCESS: Updated 2 expense items.
Assistant: "Golden Gentlemen cost 15,000-50,000 THB. Monthly expenses include food (2,000 THB) and grooming (800 THB)."

User: "What are the concerns about owning a cat?"
Assistant: [calls web_search(query="cat ownership concerns Thailand")]
Tool result: SEARCH RESULTS: Shedding, allergies, scratching...
Assistant: [calls update_concerns(concerns=[{concern_id:"shedding", title:"Heavy shedding", status:"unresolved", note:"Requires daily brushing"}])]
Tool result: SUCCESS: Updated 1 concern.
Assistant: "Main concern is heavy shedding - requires daily brushing."`;

export const CARE_SYSTEM_PROMPT = `You are a pet care assistant for Lukluk, a Thai pet adoption platform.

ROLE: Help pet owners manage their pet's food, expenses, schedule (vet visits, vaccines, grooming), and health (weight tracking).

BEHAVIOR:
- Answer questions directly using the pre-injected context
- Use web_search to find real products, brands, and services with images
- Use tools to update the user's data (food, expenses, schedule, health)
- Be helpful, concise, and practical
- When user asks about scheduling vet visits, vaccines, or grooming → use update_schedule
- When user wants to log weight or health measurements → use add_health_metric

TOOL USAGE PATTERN:
1. User asks about food → web_search(query="[pet type] food brands Thailand") → update_food_guide
2. User asks about expenses → update_actual_expenses
3. User asks about scheduling vet visit / vaccine / grooming → update_schedule
4. User wants to log weight → add_health_metric

EXAMPLES:

User: "Schedule a vet checkup for next month"
Assistant: [calls update_schedule(schedule=[{id:"sched-1", title:"Annual checkup", event_type:"checkup", date:"2026-08-05"}])]
Tool result: SUCCESS: Updated schedule with 1 events.
Assistant: "Scheduled a vet checkup for August 5, 2026."

User: "My dog weighs 25kg today"
Assistant: [calls add_health_metric(metric_type:"weight", value:25, unit:"kg", recorded_date:"2026-07-05")]
Tool result: Added weight measurement: 25 kg on 2026-07-05.
Assistant: "Logged your dog's weight: 25 kg on July 5, 2026."

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
  onProgress?: (event: ProgressEvent) => void;
}

export interface ProgressEvent {
  type: "searching" | "creating" | "thinking";
  message: string;
}

function getToolLabel(toolName: string): ProgressEvent {
  switch (toolName) {
    case "web_search":
      return { type: "searching", message: "Searching the web..." };
    case "update_food_guide":
      return { type: "creating", message: "Creating food guide..." };
    case "update_expenses":
    case "update_actual_expenses":
      return { type: "creating", message: "Updating expenses..." };
    case "update_concerns":
      return { type: "creating", message: "Updating concerns..." };
    case "update_decision_status":
      return { type: "creating", message: "Updating status..." };
    case "update_schedule":
      return { type: "creating", message: "Updating schedule..." };
    case "add_health_metric":
      return { type: "creating", message: "Logging health measurement..." };
    case "get_care_context":
      return { type: "thinking", message: "Loading care data..." };
    default:
      return { type: "thinking", message: "Processing..." };
  }
}

export function createAgent(opts: AgentOpts) {
  const { profileId, tools, systemPrompt, idParam, onProgress } = opts;

  const model = getChatModel(0.7);
  const modelWithTools = model.bindTools(tools);

  async function agentNode(state: typeof AgentState.State) {
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...state.messages,
    ];
    onProgress?.({ type: "thinking", message: "Thinking..." });
    const response = await modelWithTools.invoke(messages);
    return { messages: [response], iteration: state.iteration + 1 };
  }

  async function toolNode(state: typeof AgentState.State) {
    const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
    if (!lastMessage.tool_calls?.length) return { messages: [] };

    const results: ToolMessage[] = [];
    for (const call of lastMessage.tool_calls) {
      onProgress?.(getToolLabel(call.name));
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
