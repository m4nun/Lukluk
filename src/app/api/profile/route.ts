import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("user_id", userData.user.id)
    .single();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status, stripe_subscription_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  const { count: workspaceCount } = await supabase
    .from("planning_pet_profiles")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userData.user.id);

  const { count: ownedCount } = await supabase
    .from("owned_pet_profiles")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userData.user.id);

  return Response.json({
    email: userData.user.email,
    displayName: profile?.display_name ?? null,
    avatarUrl: profile?.avatar_url ?? userData.user.user_metadata?.avatar_url ?? null,
    subscription: sub
      ? { status: sub.status, stripeSubscriptionId: sub.stripe_subscription_id }
      : null,
    workspaceCount: workspaceCount ?? 0,
    ownedCount: ownedCount ?? 0,
  });
}
