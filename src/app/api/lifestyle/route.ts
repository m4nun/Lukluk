import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: lifestyle, error } = await supabase
    .from("lifestyle_profiles")
    .select("*")
    .eq("user_id", userData.user.id)
    .eq("is_latest", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !lifestyle) {
    return Response.json({ hasLifestyle: false });
  }

  return Response.json({
    hasLifestyle: true,
    lifestyle: {
      id: lifestyle.id,
      quiz_answers: lifestyle.quiz_answers,
      follow_ups: lifestyle.follow_ups,
      completed_at: lifestyle.completed_at,
    },
  });
}
