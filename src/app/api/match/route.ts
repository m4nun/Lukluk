import { runMatch } from "@/lib/matching/engine";
import { transformAnswers, isLifestyleComplete } from "@/lib/quiz/questions";
import { createClient } from "@/lib/supabase/server";
import type { PetTypeProfile } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json();
  const { answers, followUpAnswers } = body;

  const lifestyle = transformAnswers(answers);

  if (!isLifestyleComplete(lifestyle)) {
    return Response.json({ error: "Incomplete lifestyle profile" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Save lifestyle profile
  const { data: profile } = await supabase
    .from("lifestyle_profiles")
    .insert({
      user_id: userData.user.id,
      quiz_answers: answers,
      follow_ups: followUpAnswers || [],
    })
    .select("id")
    .single();

  // Fetch profiles then match (engine is pure)
  const { data: profiles } = await supabase.from("pet_type_profiles").select("*");
  const matches = runMatch((profiles || []) as PetTypeProfile[], lifestyle);

  // Save result
  const { data: result } = await supabase
    .from("match_results")
    .insert({
      user_id: userData.user.id,
      lifestyle_profile_id: profile!.id,
      top_matches: matches,
    })
    .select("id")
    .single();

  return Response.json({ matchResultId: result!.id, matches });
}
