import { createClient } from "@/lib/supabase/server";
import { runMatch } from "@/lib/matching/engine";
import { transformAnswers, isLifestyleComplete } from "@/lib/quiz/questions";
import { callLLM } from "@/lib/llm/config";
import type { PetTypeProfile } from "@/lib/types";

const FOLLOW_UP_CAP = 20;
const MAX_FOLLOW_UPS_PER_ROUND = 3;

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { answers, followUps = [] } = body;

  const lifestyle = transformAnswers(answers);
  if (!isLifestyleComplete(lifestyle)) {
    return Response.json({ error: "Incomplete profile" }, { status: 400 });
  }

  const { data: profiles } = await supabase.from("pet_type_profiles").select("*");
  const allProfiles = (profiles || []) as PetTypeProfile[];

  if (followUps.length >= FOLLOW_UP_CAP) {
    const matches = runMatch(allProfiles, lifestyle);
    return Response.json({ finished: true, matches });
  }

  const matches = runMatch(allProfiles, lifestyle);

  if (matches.length === 0) {
    return Response.json({ finished: true, matches: [] });
  }

  const questions = await askFollowUpsLLM(lifestyle, matches, followUps);

  if (!questions || questions.length === 0) {
    return Response.json({ finished: true, matches });
  }

  return Response.json({ finished: false, matches, followUpQuestions: questions });
}

interface FollowUpQuestion {
  question: string;
  options: string[];
}

async function askFollowUpsLLM(
  lifestyle: unknown,
  matches: unknown[],
  existingFollowUps: unknown[]
): Promise<FollowUpQuestion[] | null> {
  const text = await callLLM({
    messages: [
      {
        role: "system",
        content: `You are a pet matching assistant. Analyze the user's lifestyle answers and current top matches. Generate up to ${MAX_FOLLOW_UPS_PER_ROUND} clarifying questions that:
- Target missing, ambiguous, or borderline answers that could significantly change their top 3 matches
- Focus only on: budget, time, space, allergies, noise tolerance, travel, existing pets, experience
- Are specific and actionable, not generic yes/no
- Do not repeat questions already asked

Each question MUST have 3-4 multiple choice options. Include realistic choices that cover different lifestyle aspects. Add an "Other" option when appropriate.

Return ONLY a JSON array of objects with "question" and "options" keys. Example:
[{"question": "...", "options": ["Option A", "Option B", "Option C", "Other"]}]`,
      },
      {
        role: "user",
        content: JSON.stringify({
          lifestyle,
          currentTopMatches: matches.slice(0, 5),
          existingFollowUps: existingFollowUps.slice(-10),
          remainingQuestionsAllowed: FOLLOW_UP_CAP - existingFollowUps.length,
        }),
      },
    ],
    max_tokens: 800,
  });

  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return null;
    
    const validQuestions = parsed.filter(
      (q): q is FollowUpQuestion =>
        typeof q === "object" &&
        q !== null &&
        typeof q.question === "string" &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        q.options.every((opt: unknown) => typeof opt === "string")
    );
    
    return validQuestions.slice(0, MAX_FOLLOW_UPS_PER_ROUND);
  } catch {
    return null;
  }
}
