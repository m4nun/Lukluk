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
  const { ownedProfileId, message } = body;

  if (!ownedProfileId || !message) {
    return Response.json({ error: "Missing ownedProfileId or message" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("owned_pet_profiles")
    .select("id")
    .eq("id", ownedProfileId)
    .eq("user_id", userData.user.id)
    .single();

  if (!profile) {
    return Response.json({ error: "Pet profile not found" }, { status: 404 });
  }

  return Response.json({
    response: `I'm your Care Agent. You said: "${message}". I'll help you with feeding, schedules, expenses, and daily care. (Agent ready — wire OPENROUTER_API_KEY for full AI responses)`,
    thread_id: ownedProfileId,
  });
}
