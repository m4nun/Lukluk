import { createClient } from "@/lib/supabase/server";
import { isSubscriber } from "@/lib/stripe/guard";

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
    .select("id")
    .eq("id", planningProfileId)
    .eq("user_id", userData.user.id)
    .single();

  if (!profile) {
    return Response.json({ error: "Workspace not found" }, { status: 404 });
  }

  // Stub response — full agent will be wired when OpenRouter key is set
  return Response.json({
    response: `I'm your Decision Agent. You said: "${message}". I'll help you evaluate costs, concerns, and compatibility for this pet type. (Agent ready — wire OPENROUTER_API_KEY for full AI responses)`,
    thread_id: planningProfileId,
  });
}
