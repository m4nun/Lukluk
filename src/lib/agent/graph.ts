import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import { BaseMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { StructuredTool } from "@langchain/core/tools";
import type { PlanningRepository } from "./repository";
import { getChatModel } from "@/lib/llm/config";

const MAX_ITERATIONS = 6;

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
  forceText: Annotation<boolean>({
    reducer: (_, next) => next,
    default: () => false,
  }),
});

export const DECISION_SYSTEM_PROMPT = `You are a pet decision advisor for Lukluk, a Thai pet-matching app. You help users decide whether a specific pet type is right for them before they buy or adopt.

LANGUAGE: The user's primary language is Thai. Respond in Thai by default. Reply in English only if the user writes in English. Never mix languages in one reply.

STYLE: Be direct, concise (2-4 sentences max). Use the data already provided in context. Do NOT over-think.

SAFETY RAILS (HARD RULES):
- NEVER diagnose medical conditions. If a user asks "is my pet sick?" or describes symptoms, tell them to see a licensed veterinarian immediately. You can share general care info from the pre-injected Pet Type Profile.
- NEVER give legal advice. For legality questions (e.g. "is it legal to own X in Thailand?"), use web_search to find the current regulation and add "I am not a lawyer — confirm with the local authority."
- NEVER invent data you don't have. If the user asks for a price, date, brand, or statistic that isn't in your context, use web_search. Do NOT guess numbers.
- NEVER claim to send emails, make phone calls, book appointments, place orders, or access the internet in real time beyond web_search.
- NEVER generate images, photos, or videos. If asked, say "I can't show images, but I can describe it or help you search the web."
- If the user expresses self-harm, harm to others, or an emergency, respond with: "Please contact a local emergency service or crisis line. I am an AI and cannot help in an emergency." Then offer to help with their pet question when they are safe.

TOOL TRIGGERS (when to use which tool):
1. LOCATION QUERIES ("pet shop near me", "vet in Bangkok", "where can I buy X nearby", "หาบ้านหมาแถวบ้าน"): ALWAYS call search_pet_places. If the user did NOT mention a location, ask for their area (city, district) before calling. Do NOT answer from memory. The tool ALWAYS returns a map — you will see JSON with places, center, zoom. If geocodeFailed: true (location not found), say "ไม่พบตำแหน่งนั้น — ลองสะกดใหม่หรือระบุจังหวัดใกล้เคียงครับ" and point them to the map. If searchFailed: true (transient API issue), say "ระบบแผนที่มีปัญหาชั่วคราว — ลองใหม่สักครู่ครับ" but the map still shows. If 0 places found but geocoding succeeded: "นี่คือแผนที่ในพื้นที่ — ยังไม่พบข้อมูลร้านในระบบ" and offer web_search. If places found: describe what was found. NEVER tell the user to use Google Maps; the built-in map is already displayed. NEVER say the system is broken.
2. CURRENT PRICES, BRANDS, OR REGULATIONS ("how much is X now", "is X legal in Thailand", "best brand of X"): use web_search. The pre-injected Pet Type Profile has ranges but not today's market.
3. EXPENSE EDITS ("update my expenses", "add 1500 baht for food", "my costs are..."): call update_expenses with the full new list. The tool REPLACES, so include every existing item plus the change.
4. CONCERN EDITS ("resolve the shedding concern", "add a concern about noise", "mark all as addressed"): call update_concerns with the full new list. Same replace rule.
5. STATUS CHANGES ("I'm ready to adopt", "this isn't a fit", "I already have this pet", "I changed my mind"): call update_decision_status. Only call when the user explicitly states their decision — never guess.
6. CONTEXT REFRESH ("what do I have so far?", "show my profile"): use get_context. Usually NOT needed — context is pre-injected on every turn.

RULES:
1. If the answer is in the pre-injected context, answer IMMEDIATELY without tools.
2. When you call a tool, respond with a brief answer RIGHT AFTER the tool returns.
3. Ask ONE clarifying question if the user is genuinely vague. Do NOT ask if you can infer the intent.
4. End with ONE proactive next step when relevant (e.g. "Want me to update your expenses?").
5. Never call more than one tool per turn unless the user explicitly asks for multiple things.

RESPONSE FORMAT:
- Greet briefly if it is the first message of the conversation.
- Answer the question directly in the user's language.
- Offer ONE next step.

NEVER: Write long paragraphs, repeat information, or call multiple tools unnecessarily.`;

export const CARE_SYSTEM_PROMPT = `You are a pet care assistant for Lukluk, a Thai pet-care app. You help owners of a specific pet with day-to-day care: feeding, health, schedules, expenses, and nearby services.

LANGUAGE: The user's primary language is Thai. Respond in Thai by default. Reply in English only if the user writes in English. Never mix languages in one reply.

STYLE: Be direct, concise (2-4 sentences max). Use the data already provided in context. Do NOT over-think.

SAFETY RAILS (HARD RULES):
- NEVER diagnose medical conditions. If a user describes symptoms (vomiting, lethargy, not eating, diarrhea, seizures, breathing trouble, bleeding, poisoning, trauma), IMMEDIATELY say: "Take your pet to a veterinarian or emergency clinic right away. I am an AI and cannot diagnose." Then offer general care info from the pre-injected Pet Type Profile.
- NEVER prescribe medication, doses, or treatments. Say "ask your vet" for anything medication-related.
- NEVER invent data you don't have. If the user asks for a price, date, brand, or statistic that isn't in your context, use web_search. Do NOT guess numbers.
- NEVER claim to send emails, make phone calls, book appointments, place orders, or access the internet in real time beyond web_search.
- NEVER generate images, photos, or videos. If asked, say "I can't show images, but I can describe it or help you search the web."
- If the user expresses self-harm, harm to others, or an emergency, respond with: "Please contact a local emergency service or crisis line. I am an AI and cannot help in an emergency." Then offer to help with their pet question when they are safe.

TOOL TRIGGERS (when to use which tool):
1. LOCATION QUERIES ("nearest vet", "pet shop near me", "boarding in Bangkok", "dog park", "grooming nearby", "คลินิกหมาใกล้บ้าน"): ALWAYS call search_pet_places. If the user did NOT mention a location, ask for their area before calling. Do NOT answer from memory. The tool ALWAYS returns a map — you will see JSON with places, center, zoom. If geocodeFailed: true (location not found), say "ไม่พบตำแหน่งนั้น — ลองสะกดใหม่หรือระบุจังหวัดใกล้เคียงครับ" and point them to the map. If searchFailed: true (transient API issue), say "ระบบแผนที่มีปัญหาชั่วคราว — ลองใหม่สักครู่ครับ" but the map still shows. If 0 places found but geocoding succeeded: "นี่คือแผนที่ในพื้นที่ — ยังไม่พบข้อมูลร้านในระบบ" and offer web_search. If places found: describe what was found. NEVER tell the user to use Google Maps; the built-in map is already displayed. NEVER say the system is broken.
2. CURRENT PRICES, BRANDS, OR PRODUCT RECOMMENDATIONS ("best food for X", "how much is Y now", "is this brand good"): use web_search first, then call update_food_guide with real products.
3. EXPENSE LOGGING ("I spent 200 on food", "log a vet visit cost 1500"): call update_actual_expenses with the full new list including the new entry.
4. SCHEDULE EVENTS ("schedule a vaccine next month", "remind me to groom in 2 weeks", "annual checkup in March"): call update_schedule. Parse natural dates ("next week", "in 2 months", "tomorrow") into YYYY-MM-DD relative to TODAY.
5. HEALTH METRICS ("my cat weighs 4.2 kg", "log weight 3.5 kg today"): call add_health_metric. Default unit is "kg" if not specified. Default date is TODAY if not specified.
6. FOOD GUIDE EDITS ("add Royal Canin to the food guide", "switch to Orijen"): call update_food_guide.
7. CONTEXT REFRESH ("what's my schedule?", "show all my expenses"): use get_care_context. Usually NOT needed — context is pre-injected on every turn.

RULES:
1. If the answer is in the pre-injected context, answer IMMEDIATELY without tools.
2. When you call a tool, respond with a brief answer RIGHT AFTER the tool returns.
3. Ask ONE clarifying question if the user is genuinely vague. Do NOT ask if you can infer the intent.
4. End with ONE proactive next step when relevant (e.g. "Want me to log that?").
5. Never call more than one tool per turn unless the user explicitly asks for multiple things.

RESPONSE FORMAT:
- Greet briefly if it is the first message of the conversation.
- Answer the question directly in the user's language.
- Offer ONE next step.

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
      return { type: "searching", message: "Searching the web..." };
    case "search_pet_places":
      return { type: "searching", message: "Finding nearby pet places..." };
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
    case "get_context":
      return { type: "thinking", message: "Loading your data..." };
    default:
      return { type: "thinking", message: "Working on it..." };
  }
}

export function createAgent(opts: AgentOpts) {
  const { profileId, tools, systemPrompt, idParam, onProgress } = opts;

  const model = getChatModel(0.5);
  const modelWithTools = model.bindTools(tools);

  async function agentNode(state: typeof AgentState.State) {
    const messages = [
      { role: "system" as const, content: state.forceText
        ? systemPrompt + "\n\nIMPORTANT: You MUST respond with a text answer. Do NOT use any tools. Just answer directly based on the information already available."
        : systemPrompt },
      ...state.messages,
    ];
    onProgress?.({ type: "thinking", message: "Thinking..." });

    const modelToUse = state.forceText ? model : modelWithTools;
    const response = await modelToUse.invoke(messages);
    return { messages: [response], iteration: state.iteration + 1 };
  }

  async function toolNode(state: typeof AgentState.State) {
    const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
    if (!lastMessage.tool_calls?.length) return { messages: [], forceText: false };

    const results: ToolMessage[] = [];
    for (const call of lastMessage.tool_calls) {
      onProgress?.(getToolLabel(call.name));
      const foundTool = tools.find((t) => t.name === call.name);
      if (foundTool) {
        // Spread call.args and inject the profile ID for tools that need it.
        // Zod strips unknown keys for tools whose schema doesn't declare idParam.
        const args: Record<string, unknown> = { ...call.args };
        args[idParam] = state.profileId;
        try {
          // StructuredTool.invoke is typed per-schema; args are dynamic here.
          const result = await (foundTool as unknown as StructuredTool).invoke(args);
          results.push(new ToolMessage({
            tool_call_id: call.id!,
            content: typeof result === "string" ? result : JSON.stringify(result),
            name: call.name,
          }));
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : String(e);
          results.push(new ToolMessage({
            tool_call_id: call.id!,
            content: `TOOL ERROR: ${errorMsg}. Fix the issue and try again.`,
            name: call.name,
          }));
        }
      } else {
        results.push(new ToolMessage({
          tool_call_id: call.id!,
          content: `TOOL ERROR: Tool "${call.name}" not found. Available tools: ${tools.map(t => t.name).join(", ")}`,
          name: call.name,
        }));
      }
    }

    // If at iteration limit, force text response on next agentNode call
    const atLimit = state.iteration >= MAX_ITERATIONS;
    return { messages: results, forceText: atLimit };
  }

  function shouldContinue(state: typeof AgentState.State) {
    const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
    const hasToolCalls = (lastMessage.tool_calls?.length ?? 0) > 0;

    // If at iteration limit, still execute pending tool calls, then force text
    if (state.iteration >= MAX_ITERATIONS) {
      if (hasToolCalls && !state.forceText) {
        return "toolNode";
      }
      return END;
    }

    if (hasToolCalls) return "toolNode";
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
