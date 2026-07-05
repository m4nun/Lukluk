import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import { BaseMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { StructuredTool } from "@langchain/core/tools";
import type { PlanningRepository } from "./repository";
import { getChatModel } from "@/lib/llm/config";

const MAX_ITERATIONS = 3;

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

export const DECISION_SYSTEM_PROMPT = `You are a pet advisor for Lukluk.

STYLE: Be direct, concise (2-3 sentences max). Use the data already provided in context. Do NOT over-think.

RULES:
1. If the answer is in the pre-injected context, answer IMMEDIATELY without tools
2. Only use web_search when you genuinely need current market prices
3. When you use a tool, respond RIGHT AFTER with a brief answer
4. Ask ONE clarifying question if the user is vague — don't guess
5. End with a proactive suggestion when relevant (e.g., "Want me to update your expenses?")

RESPONSE FORMAT:
- Greet briefly if first message
- Answer the question directly
- Offer ONE next step (update data, check concerns, etc.)

NEVER: Write long paragraphs, repeat information, or call multiple tools unnecessarily.`;

export const CARE_SYSTEM_PROMPT = `You are a pet care assistant for Lukluk.

STYLE: Be direct, concise (2-3 sentences max). Use the data already provided in context. Do NOT over-think.

RULES:
1. If the answer is in the pre-injected context, answer IMMEDIATELY without tools
2. Only use web_search when user asks for specific products/brands/prices
3. When you use a tool, respond RIGHT AFTER with a brief answer
4. Ask ONE clarifying question if the user is vague — don't guess
5. End with a proactive suggestion when relevant (e.g., "Want me to log that?")

RESPONSE FORMAT:
- Greet briefly if first message
- Answer the question directly
- Offer ONE next step (log weight, schedule vet, update food, etc.)

NEVER: Write long paragraphs, repeat information, or call multiple tools unnecessarily.`;

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
      return { type: "searching", message: "Searching..." };
    case "update_food_guide":
      return { type: "creating", message: "Updating food guide..." };
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
      return { type: "creating", message: "Logging measurement..." };
    case "get_care_context":
      return { type: "thinking", message: "Loading data..." };
    default:
      return { type: "thinking", message: "Processing..." };
  }
}

export function createAgent(opts: AgentOpts) {
  const { profileId, tools, systemPrompt, idParam, onProgress } = opts;

  const model = getChatModel(0.5);
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
