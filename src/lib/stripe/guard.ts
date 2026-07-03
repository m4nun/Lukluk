import { createClient } from "@/lib/supabase/server";

export async function isSubscriber(): Promise<boolean> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  return sub?.status === "active";
}

export async function requireSubscriber(): Promise<{ authorized: boolean; error?: string }> {
  const subscriber = await isSubscriber();
  if (!subscriber) {
    return { authorized: false, error: "Subscription required" };
  }
  return { authorized: true };
}
