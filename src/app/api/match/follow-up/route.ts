import { createClient } from "@/lib/supabase/server";
import { runMatch } from "@/lib/matching/engine";
import { transformAnswers, isLifestyleComplete } from "@/lib/quiz/questions";
import { callLLM } from "@/lib/llm/config";
import type { PetTypeProfile, LifestyleProfileAnswers } from "@/lib/types";

const FOLLOW_UP_CAP = 20;

function ruleBasedFollowUps(
  lifestyle: LifestyleProfileAnswers,
  matches: Array<{ pet_type_profile_id: string; responsible_fit_score: number }>,
): string[] {
  const questions: string[] = [];

  if (lifestyle.allergy_level !== "none" && matches.length > 0) {
    questions.push("Would you consider limiting your search to hypoallergenic pets only?");
  }

  if (lifestyle.space_type === "apartment") {
    questions.push("Could you accommodate a larger or more active pet if it meant a great personality match, or should we strictly filter for apartment-friendly pets?");
  }

  if (lifestyle.time_available_hours <= 1) {
    questions.push("Your daily pet time is limited. Could you increase that to 1-2 hours if a pet required more attention, or should we filter strictly for low-maintenance pets?");
  }

  if (lifestyle.travel_frequency === "frequent") {
    questions.push("You travel often. How would you handle pet care while away — do you have a pet sitter, boarding option, or would you need a travel-friendly pet?");
  }

  if (lifestyle.has_existing_pets) {
    questions.push("What types of pets do you currently have at home? This helps us filter for compatibility.");
  }

  if (lifestyle.noise_tolerance === "low") {
    questions.push("Some pets are naturally more vocal than others. Would you rule out pets that bark or meow frequently?");
  }

  if (lifestyle.experience_level === "beginner") {
    questions.push("As a first-time owner, would you prefer a pet that's widely considered beginner-friendly, or are you open to a small learning curve?");
  }

  if (lifestyle.child_in_household) {
    questions.push("How young are the children in your household? Some pets are great with older kids but not toddlers.");
  }

  return questions.slice(0, 3);
}

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

  // Try LLM first, fall back to rule-based
  let questions = await askFollowUpsLLM(lifestyle, matches, followUps);

  if (!questions || questions.length === 0) {
    questions = ruleBasedFollowUps(lifestyle, matches);
  }

  if (questions.length === 0) {
    return Response.json({ finished: true, matches });
  }

  return Response.json({ finished: false, matches, followUpQuestions: questions });
}

async function askFollowUpsLLM(
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
