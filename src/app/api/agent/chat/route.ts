/**
 * Lukluk Decision Agent API — AI SDK v7 ToolLoopAgent
 *
 * Migrated from LangGraph StateGraph to Vercel AI SDK v7 ToolLoopAgent.
 * Same system prompt, same tools, same context injection — simpler runtime.
 *
 * Key changes:
 * - LangGraph agent.invoke() → AI SDK agent.generate()
 * - Manual graph/iteration/forceText → stopWhen step count
 * - LangChain tools → AI SDK tool() functions
 * - Same SSE protocol (progress/done/error) for backward compatibility
 * - toolResults extraction unchanged
 */

import { createClient } from "@/lib/supabase/server";
import { isSubscriber } from "@/lib/stripe/guard";
import { SupabasePlanningRepository } from "@/lib/agent/supabase-repo";
import { runAiSdkAgent } from "@/lib/agent/ai-sdk-agent";
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
    return Response.json(
      { error: "Missing planningProfileId or message" },
      { status: 400 },
    );
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

  // Load previous messages from agent_threads (backward compat)
  const { data: thread } = await supabase
    .from("agent_threads")
    .select("messages")
    .eq("planning_pet_profile_id", planningProfileId)
    .eq("agent_type", "decision")
    .single();

  const previousMessages: Array<{
    role: "user" | "assistant";
    content: string;
  }> = [];
  if (thread?.messages) {
    for (const m of thread.messages as Array<{
      type: string;
      content: string;
    }>) {
      if (m.type === "human") {
        previousMessages.push({ role: "user", content: m.content });
      } else if (m.type === "ai" && m.content) {
        previousMessages.push({ role: "assistant", content: m.content });
      }
    }
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(
            `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
          ),
        );
      };

      try {
        const result = await runAiSdkAgent(
          repo,
          planningProfileId,
          message,
          previousMessages,
        );

        // Persist updated conversation to agent_threads
        const newMessages = [
          ...previousMessages.map((m) => ({
            type: m.role === "user" ? "human" : "ai",
            content: m.content,
          })),
          { type: "human", content: message },
          { type: "ai", content: result.text },
        ];

        await supabase
          .from("agent_threads")
          .update({ messages: newMessages.slice(-20) })
          .eq("planning_pet_profile_id", planningProfileId)
          .eq("agent_type", "decision");

        // Emit progress events for each tool step (backward compat with AgentChat)
        for (const step of result.steps) {
          if (step.type === "tool_call") {
            const label =
              step.toolName === "web_search" ||
              step.toolName === "search_pet_places"
                ? "searching"
                : "creating";

            send("progress", {
              type: label,
              message: `Calling ${step.toolName}...`,
            });
          }
        }

        const toolResults = extractToolResults(result.steps);
        send("done", {
          response: result.text,
          toolResults,
        });
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
}
