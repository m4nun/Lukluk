import { createClient } from "@/lib/supabase/server";
import { runMatch } from "@/lib/matching/engine";
import { transformAnswers, isLifestyleComplete } from "@/lib/quiz/questions";
import { callLLM } from "@/lib/llm/config";
import type { PetTypeProfile } from "@/lib/types";

const FOLLOW_UP_CAP = 20;

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { answers, followUps = [] } = body;

  const lifestyle = transformAnswers(answers);
  if (!isLifestyleComplete(lifestyle)) {
    return Response.json({ error: "Incomplete profile" }, { status: 400 });
  }

  // Fetch profiles once — engine is pure
  const { data: profiles } = await supabase.from("pet_type_profiles").select("*");
  const allProfiles = (profiles || []) as PetTypeProfile[];

  // Cap check
  if (followUps.length >= FOLLOW_UP_CAP) {
    const matches = runMatch(allProfiles, lifestyle);
    return Response.json({ finished: true, matches });
  }

  const matches = runMatch(allProfiles, lifestyle);

  // High confidence + small pool → done
  if (matches[0].responsible_fit_score >= 80 && matches.length < 3) {
    return Response.json({ finished: true, matches });
  }

  const questions = await askFollowUps(lifestyle, matches, followUps);
  if (!questions || questions.length === 0) {
    return Response.json({ finished: true, matches });
  }

  return Response.json({ finished: false, matches, followUpQuestions: questions });
}

async function askFollowUps(
  lifestyle: unknown,
  matches: unknown[],
  existingFollowUps: unknown[]
): Promise<string[] | null> {
  const text = await callLLM({
    messages: [
      {
        role: "system",
        content:
          "You are a pet matching assistant. Generate up to 3 clarifying questions that could significantly affect the user's top 3 pet matches. Only ask questions about budget, time, space, allergies, noise tolerance, travel, existing pets, or experience. Each question should target ambiguity in the user's answers. Return only a JSON array of question strings, nothing else.",
      },
      {
        role: "user",
        content: JSON.stringify({
          lifestyle,
          currentTopMatches: matches,
          existingFollowUps: existingFollowUps.slice(-10),
          remainingQuestionsAllowed: FOLLOW_UP_CAP - existingFollowUps.length,
        }),
      },
    ],
    max_tokens: 500,
  });

  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed.slice(0, 3) : null;
  } catch {
    return null;
  }
}
