import { createClient } from "@/lib/supabase/server";
import { isSubscriber } from "@/lib/stripe/guard";
import { runAgent } from "@/lib/agent/invoke";
import { SupabasePlanningRepository } from "@/lib/agent/supabase-repo";
import { createAgentTools } from "@/lib/agent/tools";
import { DECISION_SYSTEM_PROMPT } from "@/lib/agent/graph";
import { extractToolResults } from "@/lib/agent/tool-results";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const subscriber = await isSubscriber();
  if (!subscriber && process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "Subscription required" }, { status: 402 });
  }

  const body = await request.json();
  const { planningProfileId, message } = body;

  if (!planningProfileId || !message) {
    return Response.json({ error: "Missing planningProfileId or message" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("planning_pet_profiles")
    .select("id, user_id")
    .eq("id", planningProfileId)
    .eq("user_id", userData.user.id)
    .single();

  if (!profile) {
    return Response.json({ error: "Workspace not found" }, { status: 404 });
  }

  const repo = new SupabasePlanningRepository();
  const tools = createAgentTools(repo);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const result = await runAgent({
          profileTable: "planning_pet_profiles",
          threadField: "planning_pet_profile_id",
          profileId: planningProfileId,
          agentType: "decision",
          systemPrompt: DECISION_SYSTEM_PROMPT,
          tools,
          repo,
          idParam: "planning_profile_id",
          message,
          onProgress: (event) => send("progress", event),
        });

        if ("error" in result) {
          send("error", { error: result.error });
        } else {
          const toolResults = extractToolResults(result.steps);
          send("done", { response: result.response, thread_id: result.thread_id, toolResults });
        }
      } catch (e) {
        send("error", { error: e instanceof Error ? e.message : "Unknown error" });
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
}
