import { createClient } from "@/lib/supabase/server";
import { isSubscriber } from "@/lib/stripe/guard";
import { runAgent } from "@/lib/agent/invoke";
import { SupabasePlanningRepository } from "@/lib/agent/supabase-repo";
import { extractToolResults } from "@/lib/agent/tool-results";
import type { StructuredTool } from "@langchain/core/tools";
import type { PlanningRepository } from "@/lib/agent/repository";

export interface AgentRouteConfig {
  profileTable: "planning_pet_profiles" | "owned_pet_profiles";
  threadField: "planning_pet_profile_id" | "owned_pet_profile_id";
  /** Agent discriminator for system-prompt and thread selection */
  agentType: "decision" | "care";
  /** System prompt injected as first message */
  systemPrompt: string;
  /** Tool factory called with a repository at request-time */
  createTools: (repo: PlanningRepository) => StructuredTool[];
  /** Parameter name passed to each tool so it knows which profile it operates on */
  idParam: string;
  /** JSON body key carrying the profile ID */
  bodyKey: string;
}

/**
 * One SSE-streaming POST handler for all agent types.
 * chat/route.ts and care/route.ts collapse to ~12-line config wrappers.
 */
export function createAgentRoute(config: AgentRouteConfig) {
  return async function POST(request: Request) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const subscriber = await isSubscriber();
    if (!subscriber && process.env.STRIPE_SECRET_KEY) {
      return Response.json({ error: "Subscription required" }, { status: 402 });
    }

    const body = await request.json() as Record<string, string>;
    const profileId: string = body[config.bodyKey];
    const { message } = body;

    if (!profileId || !message) {
      return Response.json(
        { error: `Missing ${config.bodyKey} or message` },
        { status: 400 },
      );
    }

    const { data: profile } = await supabase
      .from(config.profileTable)
      .select("id, user_id")
      .eq("id", profileId)
      .eq("user_id", userData.user.id)
      .single();

    if (!profile) {
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }

    const repo = new SupabasePlanningRepository();
    const tools = config.createTools(repo);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        };

        try {
          const result = await runAgent({
            profileTable: config.profileTable,
            threadField: config.threadField,
            profileId,
            agentType: config.agentType,
            systemPrompt: config.systemPrompt,
            tools,
            repo,
            idParam: config.idParam,
            message,
            onProgress: (event) => send("progress", event),
          });

          if ("error" in result) {
            send("error", { error: result.error });
          } else {
            const toolResults = extractToolResults(result.steps);
            send("done", {
              response: result.response,
              thread_id: result.thread_id,
              toolResults,
            });
          }
        } catch (e) {
          send("error", {
            error: e instanceof Error ? e.message : "Unknown error",
          });
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  };
}
