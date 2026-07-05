import { createClient } from "@/lib/supabase/server";
import { isSubscriber } from "@/lib/stripe/guard";
import { runAgent } from "@/lib/agent/invoke";
import { SupabasePlanningRepository } from "@/lib/agent/supabase-repo";
import { createCareTools } from "@/lib/agent/tools";
import { CARE_SYSTEM_PROMPT } from "@/lib/agent/graph";

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
  const { ownedProfileId, message } = body;

  if (!ownedProfileId || !message) {
    return Response.json({ error: "Missing ownedProfileId or message" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("owned_pet_profiles")
    .select("id, user_id")
    .eq("id", ownedProfileId)
    .eq("user_id", userData.user.id)
    .single();

  if (!profile) {
    return Response.json({ error: "Pet profile not found" }, { status: 404 });
  }

  const repo = new SupabasePlanningRepository();
  const tools = createCareTools(repo);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const result = await runAgent({
          profileTable: "owned_pet_profiles",
          threadField: "owned_pet_profile_id",
          profileId: ownedProfileId,
          agentType: "care",
          systemPrompt: CARE_SYSTEM_PROMPT,
          tools,
          repo,
          idParam: "owned_profile_id",
          message,
          onProgress: (event) => send("progress", event),
        });

        if ("error" in result) {
          send("error", { error: result.error });
        } else {
          send("done", { response: result.response, thread_id: result.thread_id });
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
